import { useState, useEffect, useCallback } from 'react';
import { Member, Payment } from '../types';

export const useGymData = () => {
    const [members, setMembers] = useState<Member[]>(() => {
        try {
            const storedMembers = localStorage.getItem('gymMembers');
            return storedMembers ? JSON.parse(storedMembers) : [];
        } catch (error) {
            console.error("Failed to parse members from localStorage", error);
            return [];
        }
    });

    const [payments, setPayments] = useState<Payment[]>(() => {
        try {
            const storedPayments = localStorage.getItem('gymPayments');
            return storedPayments ? JSON.parse(storedPayments) : [];
        } catch (error) {
            console.error("Failed to parse payments from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('gymMembers', JSON.stringify(members));
        } catch (error) {
            console.error("Failed to save members to localStorage", error);
        }
    }, [members]);
    
    useEffect(() => {
        try {
            localStorage.setItem('gymPayments', JSON.stringify(payments));
        } catch (error) {
            console.error("Failed to save payments to localStorage", error);
        }
    }, [payments]);

    const addMember = useCallback((memberData: Omit<Member, 'id'>, paymentMethod: Payment['method'], initialPaymentAmount?: number) => {
        const newMember: Member = {
            id: `m${Date.now()}`,
            ...memberData,
            remindersEnabled: memberData.remindersEnabled ?? true,
        };
        
        let newPayment: Payment | null = null;
        
        // If an explicit payment amount is passed (e.g. partial or including reg fee)
        if (initialPaymentAmount && initialPaymentAmount > 0) {
             newPayment = {
                id: `p${Date.now()}`,
                memberId: newMember.id,
                memberName: newMember.name,
                date: new Date().toISOString().split('T')[0],
                amount: initialPaymentAmount,
                method: paymentMethod,
            };
        } 
        // Fallback for legacy calls or pure boolean checks (though UI now handles amounts)
        else if (newMember.feePaid) {
            newPayment = {
                id: `p${Date.now()}`,
                memberId: newMember.id,
                memberName: newMember.name,
                date: new Date().toISOString().split('T')[0],
                amount: newMember.fee,
                method: paymentMethod,
            };
        }

        setMembers(prev => [...prev, newMember]);
        if (newPayment) {
            setPayments(prev => [...prev, newPayment!]);
        }
    }, []);

    const updateMember = useCallback((updatedMember: Member, paymentMethod: Payment['method']) => {
        setMembers(prev => {
            const oldMember = prev.find(m => m.id === updatedMember.id);
            if (oldMember && !oldMember.feePaid && updatedMember.feePaid) {
                // Member just paid, record payment
                 const newPayment: Payment = {
                    id: `p${Date.now()}`,
                    memberId: updatedMember.id,
                    memberName: updatedMember.name,
                    date: new Date().toISOString().split('T')[0],
                    amount: updatedMember.fee,
                    method: paymentMethod,
                };
                setPayments(p => [...p, newPayment]);
            }
            return prev.map(m => m.id === updatedMember.id ? { ...m, ...updatedMember } : m);
        });
    }, []);

    const deleteMember = useCallback((id: string) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    const deletePayment = useCallback((id: string) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    }, []);

    const updateAttendance = useCallback((memberId: string, date: string, present: boolean) => {
        setMembers(prev => prev.map(m =>
            m.id === memberId
                ? { ...m, attendance: { ...m.attendance, [date]: present } }
                : m
        ));
    }, []);
    
    const toggleReminder = useCallback((memberId: string, enabled: boolean) => {
        setMembers(prev => prev.map(m => 
            m.id === memberId 
                ? { ...m, remindersEnabled: enabled }
                : m
        ));
    }, []);

    return {
        members,
        payments,
        addMember,
        updateMember,
        deleteMember,
        deletePayment,
        updateAttendance,
        toggleReminder
    };
};