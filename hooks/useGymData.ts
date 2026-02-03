
import { useState, useEffect, useCallback } from 'react';
import { Member, Payment, Gym, Visitor } from '../types';
import { supabase } from '../lib/supabase';

export const useGymData = (gymId: string | undefined) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [gymName, setGymName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!gymId) return;
        setLoading(true);

        try {
            // 1. Fetch Gym Details
            const { data: gymData } = await supabase
                .from('gyms')
                .select('name')
                .eq('id', gymId)
                .single();
            
            if (gymData) setGymName(gymData.name);

            // 2. Fetch Members
            const { data: memData } = await supabase
                .from('members')
                .select('*')
                .eq('gymId', gymId);
            if (memData) setMembers(memData);

            // 3. Fetch Payments
            const { data: payData } = await supabase
                .from('payments')
                .select('*')
                .eq('gymId', gymId);
            if (payData) setPayments(payData);

            // 4. Fetch Visitors
            const { data: visData } = await supabase
                .from('visitors')
                .select('*')
                .eq('gymId', gymId);
            if (visData) setVisitors(visData);

        } catch (error) {
            console.error("Error loading gym data:", error);
        } finally {
            setLoading(false);
        }
    }, [gymId]);

    // Initial Load & Realtime Subscription
    useEffect(() => {
        loadData();

        if (!gymId) return;

        // Subscribe to changes for this Gym
        const channel = supabase.channel(`gym_${gymId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'members', filter: `gymId=eq.${gymId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') setMembers(prev => [...prev, payload.new as Member]);
                    if (payload.eventType === 'UPDATE') setMembers(prev => prev.map(m => m.id === payload.new.id ? payload.new as Member : m));
                    if (payload.eventType === 'DELETE') setMembers(prev => prev.filter(m => m.id !== payload.old.id));
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments', filter: `gymId=eq.${gymId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') setPayments(prev => [...prev, payload.new as Payment]);
                    if (payload.eventType === 'UPDATE') setPayments(prev => prev.map(p => p.id === payload.new.id ? payload.new as Payment : p));
                    if (payload.eventType === 'DELETE') setPayments(prev => prev.filter(p => p.id !== payload.old.id));
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'visitors', filter: `gymId=eq.${gymId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') setVisitors(prev => [...prev, payload.new as Visitor]);
                    if (payload.eventType === 'DELETE') setVisitors(prev => prev.filter(v => v.id !== payload.old.id));
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'gyms', filter: `id=eq.${gymId}` },
                (payload) => {
                   if(payload.new.name) setGymName(payload.new.name);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [gymId, loadData]);

    // --- ACTIONS ---

    const addMember = async (member: Omit<Member, 'id' | 'gymId'>) => {
        if (!gymId) return;
        const newId = crypto.randomUUID();
        const newMember: Member = { ...member, id: newId, gymId, attendance: {} };

        // Optimistic Update
        setMembers(prev => [...prev, newMember]);

        const { error } = await supabase.from('members').insert([newMember]);
        if (error) console.error("Error adding member:", error);

        // Record initial payment if needed
        if (member.feePaid) {
            recordPayment({
                amount: member.fee,
                method: 'Cash',
                memberId: newId,
                memberName: newMember.name,
                date: new Date().toISOString().split('T')[0]
            });
        }
    };

    const updateMember = async (updated: Member) => {
        // Optimistic
        setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
        await supabase.from('members').update(updated).eq('id', updated.id);
    };

    const deleteMember = async (id: string) => {
        // Optimistic
        setMembers(prev => prev.filter(m => m.id !== id));
        await supabase.from('members').delete().eq('id', id);
    };

    const recordPayment = async (payment: Omit<Payment, 'id' | 'gymId'>) => {
        if (!gymId) return;
        const newPayment = { ...payment, id: crypto.randomUUID(), gymId };
        
        // Optimistic
        setPayments(prev => [...prev, newPayment]);
        await supabase.from('payments').insert([newPayment]);
    };

    const updatePayment = async (updated: Payment) => {
        setPayments(prev => prev.map(p => p.id === updated.id ? updated : p));
        await supabase.from('payments').update(updated).eq('id', updated.id);
    };

    const deletePayment = async (id: string) => {
        setPayments(prev => prev.filter(p => p.id !== id));
        await supabase.from('payments').delete().eq('id', id);
    };

    const markAttendance = async (memberIds: string[], date: string, present: boolean) => {
        const membersToUpdate = members.filter(m => memberIds.includes(m.id));
        
        // Optimistic
        setMembers(prev => prev.map(m => {
            if (memberIds.includes(m.id)) {
                return { ...m, attendance: { ...m.attendance, [date]: present } };
            }
            return m;
        }));

        // DB Update (Looping primarily because jsonb partial updates are tricky in bulk without an RPC, 
        // simple loop is fine for small batches)
        for (const m of membersToUpdate) {
            const updatedAttendance = { ...m.attendance, [date]: present };
            await supabase.from('members').update({ attendance: updatedAttendance }).eq('id', m.id);
        }
    };

    const updateGymSettings = async (settings: Partial<Gym>) => {
        if (!gymId) return;
        if (settings.name) setGymName(settings.name);
        await supabase.from('gyms').update(settings).eq('id', gymId);
    };

    const addVisitor = async (visitor: Omit<Visitor, 'id' | 'gymId'>) => {
        if (!gymId) return;
        const newVisitor = { ...visitor, id: crypto.randomUUID(), gymId };
        setVisitors(prev => [...prev, newVisitor]);
        await supabase.from('visitors').insert([newVisitor]);
    };

    const deleteVisitor = async (id: string) => {
        setVisitors(prev => prev.filter(v => v.id !== id));
        await supabase.from('visitors').delete().eq('id', id);
    };

    return {
        gymName,
        members,
        payments,
        visitors,
        loading,
        addMember,
        updateMember,
        deleteMember,
        recordPayment,
        updatePayment,
        deletePayment,
        markAttendance,
        updateGymSettings,
        addVisitor,
        deleteVisitor
    };
};
