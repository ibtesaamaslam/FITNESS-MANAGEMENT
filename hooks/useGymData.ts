
import { useState, useEffect, useCallback } from 'react';
import { Member, Payment, Gym, Visitor } from '../types';

export const useGymData = (gymId: string | undefined) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [gymName, setGymName] = useState<string>('');

    // Load data event listener
    const loadData = useCallback(() => {
        if (!gymId) {
            setMembers([]);
            setPayments([]);
            setVisitors([]);
            return;
        }
        
        // 1. Load Gym Metadata (for name)
        const gyms = JSON.parse(localStorage.getItem('saas_gyms') || '[]');
        const currentGym = gyms.find((g: Gym) => g.id === gymId);
        if (currentGym) setGymName(currentGym.name);

        // 2. Load Gym Data
        const mems = JSON.parse(localStorage.getItem(`gym_${gymId}_members`) || '[]');
        const pays = JSON.parse(localStorage.getItem(`gym_${gymId}_payments`) || '[]');
        const visits = JSON.parse(localStorage.getItem(`gym_${gymId}_visitors`) || '[]');

        setMembers(mems);
        setPayments(pays);
        setVisitors(visits);
    }, [gymId]);

    useEffect(() => {
        loadData();
        // Listen for custom storage events to trigger re-renders across components
        const handleStorageChange = () => loadData();
        window.addEventListener('saas_storage_update', handleStorageChange);
        return () => window.removeEventListener('saas_storage_update', handleStorageChange);
    }, [loadData]);

    const notifyUpdate = () => {
        window.dispatchEvent(new Event('saas_storage_update'));
    };

    const addMember = (member: Omit<Member, 'id' | 'gymId'>) => {
        if (!gymId) return;
        const newMember: Member = {
            ...member,
            id: `m_${Date.now()}`,
            gymId: gymId,
            remindersEnabled: true,
            attendance: {}
        };
        const updatedMembers = [...members, newMember];
        localStorage.setItem(`gym_${gymId}_members`, JSON.stringify(updatedMembers));
        
        // Initial fee record if paid
        if (member.feePaid) {
            recordPayment({
                amount: member.fee,
                method: 'Cash', // default
                memberId: newMember.id,
                memberName: newMember.name,
                date: new Date().toISOString().split('T')[0]
            });
        } else {
            notifyUpdate();
        }
    };

    const updateMember = (updated: Member) => {
        if (!gymId) return;
        const updatedList = members.map(m => m.id === updated.id ? updated : m);
        localStorage.setItem(`gym_${gymId}_members`, JSON.stringify(updatedList));
        notifyUpdate();
    };

    const deleteMember = (id: string) => {
        if (!gymId) return;
        const updatedList = members.filter(m => m.id !== id);
        localStorage.setItem(`gym_${gymId}_members`, JSON.stringify(updatedList));
        notifyUpdate();
    };

    const recordPayment = (payment: Omit<Payment, 'id' | 'gymId'>) => {
        if (!gymId) return;
        const newPayment: Payment = {
            ...payment,
            id: `p_${Date.now()}`,
            gymId: gymId
        };
        const updatedPayments = [...payments, newPayment];
        localStorage.setItem(`gym_${gymId}_payments`, JSON.stringify(updatedPayments));
        notifyUpdate();
    };

    const updatePayment = (updated: Payment) => {
        if (!gymId) return;
        const updatedList = payments.map(p => p.id === updated.id ? updated : p);
        localStorage.setItem(`gym_${gymId}_payments`, JSON.stringify(updatedList));
        notifyUpdate();
    };

    const deletePayment = (id: string) => {
        if (!gymId) return;
        const updatedList = payments.filter(p => p.id !== id);
        localStorage.setItem(`gym_${gymId}_payments`, JSON.stringify(updatedList));
        notifyUpdate();
    };

    const markAttendance = (memberIds: string[], date: string, present: boolean) => {
        if (!gymId) return;
        const updatedMembers = members.map(m => {
            if (memberIds.includes(m.id)) {
                return { ...m, attendance: { ...m.attendance, [date]: present } };
            }
            return m;
        });
        localStorage.setItem(`gym_${gymId}_members`, JSON.stringify(updatedMembers));
        notifyUpdate();
    };

    const updateGymSettings = (settings: Partial<Gym>) => {
        if (!gymId) return;
        const gyms = JSON.parse(localStorage.getItem('saas_gyms') || '[]');
        const updatedGyms = gyms.map((g: Gym) => g.id === gymId ? { ...g, ...settings } : g);
        localStorage.setItem('saas_gyms', JSON.stringify(updatedGyms));
        notifyUpdate();
    };

    const addVisitor = (visitor: Omit<Visitor, 'id' | 'gymId'>) => {
        if (!gymId) return;
        const newVisitor: Visitor = {
            ...visitor,
            id: `v_${Date.now()}`,
            gymId: gymId
        };
        const updatedVisitors = [...visitors, newVisitor];
        localStorage.setItem(`gym_${gymId}_visitors`, JSON.stringify(updatedVisitors));
        notifyUpdate();
    };

    const deleteVisitor = (id: string) => {
        if (!gymId) return;
        const updatedVisitors = visitors.filter(v => v.id !== id);
        localStorage.setItem(`gym_${gymId}_visitors`, JSON.stringify(updatedVisitors));
        notifyUpdate();
    };

    return {
        gymName,
        members,
        payments,
        visitors,
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
