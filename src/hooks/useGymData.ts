import { useState, useEffect, useCallback } from 'react';
import { Member, Payment, Expense, AccessoryItem, AccessorySale, StaffMember } from '../types';
import { getLocalDateString } from '../lib/dateUtils';

const sortMembersByRegNo = (list: Member[]): Member[] => {
    return [...list].sort((a, b) => {
        const regA = a.registrationNo || '';
        const regB = b.registrationNo || '';
        return regA.localeCompare(regB, undefined, { numeric: true, sensitivity: 'base' });
    });
};

const DEFAULT_STAFF: StaffMember[] = [
    {
        id: 'st-1',
        name: 'Coach Bilal',
        role: 'Trainer',
        category: 'Trainers',
        phone: '03001234567',
        email: 'bilal@gymvault.com',
        cnic: '35202-1234567-1',
        avatar: '',
        joinDate: '2023-01-15',
        status: 'Active',
        payrollType: 'Monthly',
        baseSalary: 45000,
        shiftHoursPerDay: 8,
        workingDaysPerMonth: 26,
        assignedMemberIds: [],
        emergencyContact: {
            name: 'Bushra Bilal',
            relation: 'Wife',
            phone: '0300-9876543'
        },
        notes: 'Lead Strength & Fitness Coach.',
        shifts: [
            { day: 'Monday', startTime: '06:00', endTime: '12:00' },
            { day: 'Wednesday', startTime: '06:00', endTime: '12:00' },
            { day: 'Friday', startTime: '06:00', endTime: '12:00' }
        ]
    },
    {
        id: 'st-2',
        name: 'Sana Khan',
        role: 'Trainer',
        category: 'Trainers',
        phone: '03217654321',
        email: 'sana@gymvault.com',
        cnic: '35201-9876543-3',
        avatar: '',
        joinDate: '2026-01-03',
        status: 'Active',
        payrollType: 'Hourly',
        baseSalary: 1500,
        shiftHoursPerDay: 5,
        workingDaysPerMonth: 26,
        assignedMemberIds: [],
        emergencyContact: {
            name: 'Tariq Khan',
            relation: 'Brother',
            phone: '0321-9988776'
        },
        notes: 'Senior Female PT Coach & Pilates Specialist.',
        shifts: [
            { day: 'Tuesday', startTime: '16:00', endTime: '21:00' },
            { day: 'Thursday', startTime: '16:00', endTime: '21:00' },
            { day: 'Saturday', startTime: '16:00', endTime: '21:00' }
        ]
    },
    {
        id: 'st-3',
        name: 'Zainab Ahmed',
        role: 'Receptionist',
        category: 'Administrative',
        phone: '03339876543',
        email: 'zainab@gymvault.com',
        cnic: '35202-7654321-5',
        avatar: '',
        joinDate: '2024-02-01',
        status: 'Active',
        payrollType: 'Monthly',
        baseSalary: 25000,
        shiftHoursPerDay: 8,
        workingDaysPerMonth: 26,
        assignedMemberIds: [],
        emergencyContact: {
            name: 'Farhan Ahmed',
            relation: 'Father',
            phone: '0333-4455667'
        },
        notes: 'Front Desk Representative & Member Support.',
        shifts: [
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' }
        ]
    },
    {
        id: 'st-4',
        name: 'Captain Ali Raza',
        role: 'Senior Trainer',
        category: 'Trainers',
        phone: '0300-1122334',
        email: 'ali.raza@gymvault.com',
        cnic: '35200-5544332-9',
        avatar: '',
        joinDate: '2022-08-15',
        status: 'Active',
        payrollType: 'Monthly',
        baseSalary: 65000,
        shiftHoursPerDay: 9,
        workingDaysPerMonth: 26,
        assignedMemberIds: [],
        emergencyContact: {
            name: 'Amina Raza',
            relation: 'Wife',
            phone: '0301-3322110'
        },
        notes: 'CrossFit Lead & Bodybuilding Specialist.'
    }
];

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

    const [accessories, setAccessories] = useState<AccessoryItem[]>(() => {
        try {
            const stored = localStorage.getItem('gymAccessories');
            if (!stored) return [];
            const parsed: AccessoryItem[] = JSON.parse(stored);
            // Filter out default mock items if present
            const mockIds = new Set(['acc-1', 'acc-2', 'acc-3', 'acc-4', 'acc-5', 'acc-6']);
            return parsed.filter(a => !mockIds.has(a.id));
        } catch (error) {
            console.error("Failed to parse accessories from localStorage", error);
            return [];
        }
    });

    const [accessorySales, setAccessorySales] = useState<AccessorySale[]>(() => {
        try {
            const stored = localStorage.getItem('gymAccessorySales');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to parse accessory sales from localStorage", error);
            return [];
        }
    });

    const [staff, setStaff] = useState<StaffMember[]>(() => {
        try {
            const stored = localStorage.getItem('gymStaff');
            if (!stored) return DEFAULT_STAFF;
            const parsed: StaffMember[] = JSON.parse(stored);
            return parsed && parsed.length > 0 ? parsed : DEFAULT_STAFF;
        } catch (error) {
            console.error("Failed to parse staff from localStorage", error);
            return DEFAULT_STAFF;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('gymStaff', JSON.stringify(staff));
        } catch (error) {
            console.error("Failed to save staff to localStorage", error);
        }
    }, [staff]);

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

    useEffect(() => {
        try {
            localStorage.setItem('gymAccessories', JSON.stringify(accessories));
        } catch (error) {
            console.error("Failed to save accessories to localStorage", error);
        }
    }, [accessories]);

    useEffect(() => {
        try {
            localStorage.setItem('gymAccessorySales', JSON.stringify(accessorySales));
        } catch (error) {
            console.error("Failed to save accessory sales to localStorage", error);
        }
    }, [accessorySales]);

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
                type: 'Fee',
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
                type: 'Fee',
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

    const addAccessoryItem = useCallback((itemData: Omit<AccessoryItem, 'id'>) => {
        const newItem: AccessoryItem = {
            id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            ...itemData,
        };
        setAccessories(prev => [newItem, ...prev]);
    }, []);

    const updateAccessoryItem = useCallback((updatedItem: AccessoryItem) => {
        setAccessories(prev => prev.map(a => a.id === updatedItem.id ? updatedItem : a));
    }, []);

    const deleteAccessoryItem = useCallback((id: string) => {
        setAccessories(prev => prev.filter(a => a.id !== id));
    }, []);

    const sellAccessoryItem = useCallback((
        accessoryId: string,
        quantity: number,
        buyerName: string,
        method: Payment['method'],
        dateStr?: string,
        memberId?: string
    ) => {
        const item = accessories.find(a => a.id === accessoryId);
        if (!item) return { success: false, message: 'Item not found in inventory' };
        if (item.stock < quantity) return { success: false, message: `Insufficient stock! Only ${item.stock} unit(s) available.` };
        if (quantity <= 0) return { success: false, message: 'Please enter a valid quantity' };

        const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const saleDate = dateStr || getLocalDateString();
        const unitCostPrice = item.costPrice || 0;
        const unitSellingPrice = item.sellingPrice || 0;
        const totalAmount = unitSellingPrice * quantity;
        const totalCost = unitCostPrice * quantity;
        const totalProfit = totalAmount - totalCost;

        const newSale: AccessorySale = {
            id: saleId,
            accessoryId: item.id,
            accessoryName: item.name,
            quantity,
            unitCostPrice,
            unitSellingPrice,
            totalAmount,
            totalProfit,
            paymentMethod: method,
            buyerName: buyerName.trim() || 'Walk-in Customer',
            date: saleDate,
        };

        // Decrement stock
        setAccessories(prev => prev.map(a => a.id === accessoryId ? { ...a, stock: a.stock - quantity } : a));

        // Add sale record
        setAccessorySales(prev => [newSale, ...prev]);

        // Add corresponding payment to payments array so Daily Ledger & Fees reflect this transaction!
        const newPayment: Payment = {
            id: `p-${saleId}`,
            memberId: memberId || `acc-${saleId}`,
            memberRegNo: 'ACC',
            memberName: `[Accessory] ${item.name} (${buyerName.trim() || 'Walk-in'})`,
            date: saleDate,
            amount: totalAmount,
            method: method,
            type: 'Accessory',
            notes: `Qty: ${quantity} @ Rs ${unitSellingPrice.toLocaleString()}`,
        };

        setPayments(prev => [newPayment, ...prev]);

        return { success: true, message: `Successfully sold ${quantity}x ${item.name} for Rs ${totalAmount.toLocaleString()} via ${method}!` };
    }, [accessories]);

    const deleteAccessorySale = useCallback((saleId: string) => {
        const sale = accessorySales.find(s => s.id === saleId);
        if (sale) {
            // Restore inventory stock
            setAccessories(prev => prev.map(a => a.id === sale.accessoryId ? { ...a, stock: a.stock + sale.quantity } : a));
            // Remove sale record
            setAccessorySales(prev => prev.filter(s => s.id !== saleId));
            // Remove payment record
            setPayments(prev => prev.filter(p => p.id !== `p-${saleId}`));
        }
    }, [accessorySales]);

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

    const addStaffMember = useCallback((staffData: Omit<StaffMember, 'id'>) => {
        const newStaff: StaffMember = {
            id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            ...staffData,
            assignedMemberIds: staffData.assignedMemberIds || []
        };
        setStaff(prev => [newStaff, ...prev]);
    }, []);

    const updateStaffMember = useCallback((updatedStaff: StaffMember) => {
        setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    }, []);

    const deleteStaffMember = useCallback((id: string) => {
        setStaff(prev => prev.filter(s => s.id !== id));
        setMembers(prev => prev.map(m => m.assignedTrainerId === id ? { ...m, assignedTrainerId: undefined } : m));
    }, []);

    const assignMemberToTrainer = useCallback((staffId: string, memberId: string) => {
        setStaff(prev => prev.map(s => {
            if (s.id === staffId) {
                const currentIds = s.assignedMemberIds || [];
                if (!currentIds.includes(memberId)) {
                    return { ...s, assignedMemberIds: [...currentIds, memberId] };
                }
            }
            return s;
        }));
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, assignedTrainerId: staffId } : m));
    }, []);

    const unassignMemberFromTrainer = useCallback((staffId: string, memberId: string) => {
        setStaff(prev => prev.map(s => {
            if (s.id === staffId) {
                return { ...s, assignedMemberIds: (s.assignedMemberIds || []).filter(id => id !== memberId) };
            }
            return s;
        }));
        setMembers(prev => prev.map(m => m.id === memberId && m.assignedTrainerId === staffId ? { ...m, assignedTrainerId: undefined } : m));
    }, []);

    return {
        members,
        payments,
        expenses,
        accessories,
        accessorySales,
        staff,
        addMember,
        updateMember,
        deleteMember,
        deletePayment,
        addExpense,
        deleteExpense,
        addAccessoryItem,
        updateAccessoryItem,
        deleteAccessoryItem,
        sellAccessoryItem,
        deleteAccessorySale,
        updateAttendance,
        toggleReminder,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        assignMemberToTrainer,
        unassignMemberFromTrainer
    };
};