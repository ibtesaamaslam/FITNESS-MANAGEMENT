import { useState, useEffect, useCallback } from 'react';
import { Member, Payment, Expense, AccessoryItem, AccessorySale, StaffMember, StaffPayrollRecord, StaffAttendanceLog, GymBackupData } from '../types';
import { getLocalDateString } from '../lib/dateUtils';

const sortMembersByRegNo = (list: Member[]): Member[] => {
    return [...list].sort((a, b) => {
        const regA = a.registrationNo || '';
        const regB = b.registrationNo || '';
        return regA.localeCompare(regB, undefined, { numeric: true, sensitivity: 'base' });
    });
};

const DEFAULT_STAFF: StaffMember[] = [];

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
            return Array.isArray(parsed) ? parsed : [];
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
            if (!stored) return [];
            const parsed: StaffMember[] = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Failed to parse staff from localStorage", error);
            return [];
        }
    });

    const [staffPayrolls, setStaffPayrolls] = useState<StaffPayrollRecord[]>(() => {
        try {
            const stored = localStorage.getItem('gymStaffPayrolls');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to parse staff payrolls from localStorage", error);
            return [];
        }
    });

    const [staffAttendanceLogs, setStaffAttendanceLogs] = useState<StaffAttendanceLog[]>(() => {
        try {
            const stored = localStorage.getItem('gymStaffAttendanceLogs');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to parse staff attendance logs from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('gymStaffAttendanceLogs', JSON.stringify(staffAttendanceLogs));
        } catch (error) {
            console.error("Failed to save staff attendance logs to localStorage", error);
        }
    }, [staffAttendanceLogs]);

    useEffect(() => {
        try {
            localStorage.setItem('gymStaffPayrolls', JSON.stringify(staffPayrolls));
        } catch (error) {
            console.error("Failed to save staff payrolls to localStorage", error);
        }
    }, [staffPayrolls]);

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

    const recordStaffPayroll = useCallback((recordData: Omit<StaffPayrollRecord, 'id'>) => {
        const existingIndex = staffPayrolls.findIndex(p => p.staffId === recordData.staffId && p.month === recordData.month);
        let recordId = `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        if (existingIndex >= 0) {
            recordId = staffPayrolls[existingIndex].id;
            setStaffPayrolls(prev => prev.map(p => p.id === recordId ? { ...recordData, id: recordId } : p));
        } else {
            const newRecord: StaffPayrollRecord = { id: recordId, ...recordData };
            setStaffPayrolls(prev => [newRecord, ...prev]);
        }

        // Automatically record/update expense if salary is paid
        if (recordData.paidAmount > 0 && (recordData.status === 'Paid' || recordData.status === 'Partial')) {
            const expenseTitle = `Staff Salary: ${recordData.staffName} (${recordData.month})`;
            setExpenses(prev => {
                const existingExpIndex = prev.findIndex(e => e.title === expenseTitle);
                const expenseItem: Expense = {
                    id: existingExpIndex >= 0 ? prev[existingExpIndex].id : `ex-${recordId}`,
                    title: expenseTitle,
                    amount: recordData.paidAmount,
                    date: recordData.paymentDate || getLocalDateString(),
                    category: 'Staff Salary'
                };
                if (existingExpIndex >= 0) {
                    return prev.map((e, idx) => idx === existingExpIndex ? expenseItem : e);
                } else {
                    return [expenseItem, ...prev];
                }
            });
        }
    }, [staffPayrolls]);

    const deleteStaffPayroll = useCallback((id: string) => {
        const record = staffPayrolls.find(p => p.id === id);
        if (record) {
            setStaffPayrolls(prev => prev.filter(p => p.id !== id));
            const expenseTitle = `Staff Salary: ${record.staffName} (${record.month})`;
            setExpenses(prev => prev.filter(e => e.title !== expenseTitle));
        }
    }, [staffPayrolls]);

    const recordStaffAttendance = useCallback((logData: Omit<StaffAttendanceLog, 'id'>) => {
        setStaffAttendanceLogs(prev => {
            const existingIdx = prev.findIndex(l => l.staffId === logData.staffId && l.date === logData.date);
            const logId = existingIdx >= 0 ? prev[existingIdx].id : `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const updatedEntry: StaffAttendanceLog = {
                id: logId,
                ...logData,
                loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            if (existingIdx >= 0) {
                return prev.map((l, idx) => idx === existingIdx ? updatedEntry : l);
            } else {
                return [updatedEntry, ...prev];
            }
        });
    }, []);

    const deleteStaffAttendanceLog = useCallback((id: string) => {
        setStaffAttendanceLogs(prev => prev.filter(l => l.id !== id));
    }, []);

    const restoreAllData = useCallback((backup: GymBackupData, mode: 'replace' | 'merge' = 'replace') => {
        try {
            const incoming = backup.data || (backup as any);
            const incomingMembers: Member[] = Array.isArray(incoming.members) ? incoming.members : [];
            const incomingPayments: Payment[] = Array.isArray(incoming.payments) ? incoming.payments : [];
            const incomingExpenses: Expense[] = Array.isArray(incoming.expenses) ? incoming.expenses : [];
            const incomingAccessories: AccessoryItem[] = Array.isArray(incoming.accessories) ? incoming.accessories : [];
            const incomingSales: AccessorySale[] = Array.isArray(incoming.accessorySales) ? incoming.accessorySales : [];
            const incomingStaff: StaffMember[] = Array.isArray(incoming.staff) ? incoming.staff : [];
            const incomingPayrolls: StaffPayrollRecord[] = Array.isArray(incoming.staffPayrolls) ? incoming.staffPayrolls : [];
            const incomingAttLogs: StaffAttendanceLog[] = Array.isArray(incoming.staffAttendanceLogs) ? incoming.staffAttendanceLogs : [];

            let finalMembers: Member[] = [];
            let finalPayments: Payment[] = [];
            let finalExpenses: Expense[] = [];
            let finalAccessories: AccessoryItem[] = [];
            let finalSales: AccessorySale[] = [];
            let finalStaff: StaffMember[] = [];
            let finalPayrolls: StaffPayrollRecord[] = [];
            let finalAttLogs: StaffAttendanceLog[] = [];

            if (mode === 'replace') {
                finalMembers = sortMembersByRegNo(incomingMembers);
                finalPayments = incomingPayments;
                finalExpenses = incomingExpenses;
                finalAccessories = incomingAccessories;
                finalSales = incomingSales;
                finalStaff = incomingStaff;
                finalPayrolls = incomingPayrolls;
                finalAttLogs = incomingAttLogs;
            } else {
                // Merge mode: combine and deduplicate
                const memberMap = new Map<string, Member>();
                members.forEach(m => memberMap.set(m.id, m));
                incomingMembers.forEach(m => memberMap.set(m.id, m));
                finalMembers = sortMembersByRegNo(Array.from(memberMap.values()));

                const payMap = new Map<string, Payment>();
                payments.forEach(p => payMap.set(p.id, p));
                incomingPayments.forEach(p => payMap.set(p.id, p));
                finalPayments = Array.from(payMap.values());

                const expMap = new Map<string, Expense>();
                expenses.forEach(e => expMap.set(e.id, e));
                incomingExpenses.forEach(e => expMap.set(e.id, e));
                finalExpenses = Array.from(expMap.values());

                const accMap = new Map<string, AccessoryItem>();
                accessories.forEach(a => accMap.set(a.id, a));
                incomingAccessories.forEach(a => accMap.set(a.id, a));
                finalAccessories = Array.from(accMap.values());

                const saleMap = new Map<string, AccessorySale>();
                accessorySales.forEach(s => saleMap.set(s.id, s));
                incomingSales.forEach(s => saleMap.set(s.id, s));
                finalSales = Array.from(saleMap.values());

                const staffMap = new Map<string, StaffMember>();
                staff.forEach(s => staffMap.set(s.id, s));
                incomingStaff.forEach(s => staffMap.set(s.id, s));
                finalStaff = Array.from(staffMap.values());

                const payrollMap = new Map<string, StaffPayrollRecord>();
                staffPayrolls.forEach(p => payrollMap.set(p.id, p));
                incomingPayrolls.forEach(p => payrollMap.set(p.id, p));
                finalPayrolls = Array.from(payrollMap.values());

                const attLogMap = new Map<string, StaffAttendanceLog>();
                staffAttendanceLogs.forEach(l => attLogMap.set(l.id, l));
                incomingAttLogs.forEach(l => attLogMap.set(l.id, l));
                finalAttLogs = Array.from(attLogMap.values());
            }

            // Update States
            setMembers(finalMembers);
            setPayments(finalPayments);
            setExpenses(finalExpenses);
            setAccessories(finalAccessories);
            setAccessorySales(finalSales);
            setStaff(finalStaff);
            setStaffPayrolls(finalPayrolls);
            setStaffAttendanceLogs(finalAttLogs);

            // Immediate storage persist
            localStorage.setItem('gymMembers', JSON.stringify(finalMembers));
            localStorage.setItem('gymPayments', JSON.stringify(finalPayments));
            localStorage.setItem('gymExpenses', JSON.stringify(finalExpenses));
            localStorage.setItem('gymAccessories', JSON.stringify(finalAccessories));
            localStorage.setItem('gymAccessorySales', JSON.stringify(finalSales));
            localStorage.setItem('gymStaff', JSON.stringify(finalStaff));
            localStorage.setItem('gymStaffPayrolls', JSON.stringify(finalPayrolls));
            localStorage.setItem('gymStaffAttendanceLogs', JSON.stringify(finalAttLogs));

            // Restore gymName if provided
            if (incoming.gymName) {
                localStorage.setItem('gym_name', incoming.gymName);
            }
            if (incoming.theme) {
                localStorage.setItem('theme', incoming.theme);
            }
            if (incoming.financialPassword) {
                localStorage.setItem('gym_financial_password', incoming.financialPassword);
            }
            if (incoming.authAdmin) {
                localStorage.setItem('gym_auth_admin', incoming.authAdmin);
            }
            if (incoming.authAdminWord) {
                localStorage.setItem('gym_auth_admin_word', incoming.authAdminWord);
            }
            if (incoming.authManager) {
                localStorage.setItem('gym_auth_manager', incoming.authManager);
            }
            if (incoming.authManagerWord) {
                localStorage.setItem('gym_auth_manager_word', incoming.authManagerWord);
            }

            // Restore any additional rawLocalStorage keys if present
            if (backup.rawLocalStorage && typeof backup.rawLocalStorage === 'object') {
                Object.entries(backup.rawLocalStorage).forEach(([key, val]) => {
                    if (val && typeof val === 'string') {
                        localStorage.setItem(key, val);
                    }
                });
            }

            return {
                success: true,
                stats: {
                    members: finalMembers.length,
                    payments: finalPayments.length,
                    expenses: finalExpenses.length,
                    staff: finalStaff.length,
                    accessories: finalAccessories.length,
                    sales: finalSales.length,
                    payrolls: finalPayrolls.length,
                    attendanceLogs: finalAttLogs.length
                }
            };
        } catch (err) {
            console.error("Failed to restore gym data", err);
            return { success: false, error: String(err) };
        }
    }, [members, payments, expenses, accessories, accessorySales, staff, staffPayrolls, staffAttendanceLogs]);

    return {
        members,
        payments,
        expenses,
        accessories,
        accessorySales,
        staff,
        staffPayrolls,
        staffAttendanceLogs,
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
        unassignMemberFromTrainer,
        recordStaffPayroll,
        deleteStaffPayroll,
        recordStaffAttendance,
        deleteStaffAttendanceLog,
        restoreAllData
    };

};