import { useState, useEffect, useCallback } from 'react';
import { Member, Payment, Expense } from '../types';
import { getLocalDateString } from '../lib/dateUtils';

const sortMembersByRegNo = (list: Member[]): Member[] => {
    return [...list].sort((a, b) => {
        const regA = a.registrationNo || '';
        const regB = b.registrationNo || '';
        return regA.localeCompare(regB, undefined, { numeric: true, sensitivity: 'base' });
    });
};

export const useGymData = () => {
    const [members, setMembers] = useState<Member[]>(() => {
        try {
            const storedMembers = localStorage.getItem('gymMembers');
            const parsed = storedMembers ? JSON.parse(storedMembers) : [];
            return sortMembersByRegNo(parsed);
        } catch (error) {
            console.error("Failed to parse members from localStorage", error);
            return [];
        }
    });

    const [payments, setPayments] = useState<Payment[]>(() => {
        try {
            const storedPayments = localStorage.getItem('gymPayments');
            if (!storedPayments) return [];
            const parsedPayments: Payment[] = JSON.parse(storedPayments);
            // Deduplicate by ID
            const uniquePayments: Payment[] = [];
            const seenIds = new Set<string>();
            parsedPayments.forEach(p => {
                if (!seenIds.has(p.id)) {
                    uniquePayments.push(p);
                    seenIds.add(p.id);
                }
            });
            return uniquePayments;
        } catch (error) {
            console.error("Failed to parse payments from localStorage", error);
            return [];
        }
    });

    const [expenses, setExpenses] = useState<Expense[]>(() => {
        try {
            const storedExpenses = localStorage.getItem('gymExpenses');
            return storedExpenses ? JSON.parse(storedExpenses) : [];
        } catch (error) {
            console.error("Failed to parse expenses from localStorage", error);
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

    useEffect(() => {
        try {
            localStorage.setItem('gymExpenses', JSON.stringify(expenses));
        } catch (error) {
            console.error("Failed to save expenses to localStorage", error);
        }
    }, [expenses]);

    const addMember = useCallback((memberData: Omit<Member, 'id'>, paymentMethod: Payment['method']) => {
        const newMember: Member = {
            id: `m${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...memberData,
            remindersEnabled: memberData.remindersEnabled ?? true,
        };
        
        let newPayment: Payment | null = null;
        if (newMember.feePaid) {
            newPayment = {
                id: `p${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                memberId: newMember.id,
                memberRegNo: newMember.registrationNo,
                memberName: newMember.name,
                date: getLocalDateString(),
                amount: newMember.fee,
                method: paymentMethod,
            };
        }

        setMembers(prev => sortMembersByRegNo([...prev, newMember]));
        if (newPayment) {
            setPayments(prev => [...prev, newPayment!]);
        }
    }, []);

    const updateMember = useCallback((updatedMember: Member, paymentMethod: Payment['method']) => {
        const oldMember = members.find(m => m.id === updatedMember.id);
        
        const isFeeStatusUpdate = oldMember && !oldMember.feePaid && updatedMember.feePaid;
        const isRenewalUpdate = oldMember && updatedMember.feePaid && oldMember.feePaid && updatedMember.expiryDate !== oldMember.expiryDate;
        const isAmountUpdate = oldMember && updatedMember.feePaid && oldMember.feePaid && updatedMember.fee !== oldMember.fee;

        let addedPayment: Payment | null = null;
        if (oldMember && (isFeeStatusUpdate || isRenewalUpdate || isAmountUpdate)) {
            // Member just paid, renewed, or adjusted payment, record payment
             addedPayment = {
                id: `p${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                memberId: updatedMember.id,
                memberRegNo: updatedMember.registrationNo,
                memberName: updatedMember.name,
                date: getLocalDateString(),
                amount: updatedMember.fee,
                method: paymentMethod,
            };
        }

        setPayments(prev => {
            const updatedPayments = prev.map(p => {
                if (p.memberId === updatedMember.id) {
                    return {
                        ...p,
                        memberName: updatedMember.name,
                        memberRegNo: updatedMember.registrationNo,
                    };
                }
                return p;
            });
            return addedPayment ? [...updatedPayments, addedPayment] : updatedPayments;
        });

        setMembers(prev => sortMembersByRegNo(prev.map(m => m.id === updatedMember.id ? { ...m, ...updatedMember } : m)));
    }, [members]);

    const deleteMember = useCallback((id: string) => {
        setMembers(prev => sortMembersByRegNo(prev.filter(m => m.id !== id)));
    }, []);

    const deletePayment = useCallback((id: string) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    }, []);

    const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            id: `ex${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...expenseData
        };
        setExpenses(prev => [...prev, newExpense]);
    }, []);

    const deleteExpense = useCallback((id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }, []);

    const updateAttendance = useCallback((memberId: string, date: string, present: boolean) => {
        setMembers(prev => sortMembersByRegNo(prev.map(m =>
            m.id === memberId
                ? { ...m, attendance: { ...m.attendance, [date]: present } }
                : m
        )));
    }, []);
    
    const toggleReminder = useCallback((memberId: string, enabled: boolean) => {
        setMembers(prev => sortMembersByRegNo(prev.map(m => 
            m.id === memberId 
                ? { ...m, remindersEnabled: enabled }
                : m
        )));
    }, []);

    return {
        members,
        payments,
        expenses,
        addMember,
        updateMember,
        deleteMember,
        deletePayment,
        addExpense,
        deleteExpense,
        updateAttendance,
        toggleReminder
    };
};