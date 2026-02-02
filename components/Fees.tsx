
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Payment, Member } from '../types';
import { DownloadIcon, EditIcon, TrashIcon, CloseIcon, CreditCardIcon, CalendarIcon, UserIcon, WarningIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface Props {
    gymName: string;
    payments: Payment[];
    members: Member[];
    onAdd: (payment: Omit<Payment, 'id' | 'gymId'>) => void;
    onUpdateMember: (member: Member) => void;
    onUpdate: (payment: Payment) => void;
    onDelete: (id: string) => void;
}

const Fees: React.FC<Props> = ({ gymName, payments, members, onAdd, onUpdateMember, onUpdate, onDelete }) => {
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    // Warning Modal State for Active Members
    const [activeMemberWarning, setActiveMemberWarning] = useState<Member | null>(null);

    // Renew Modal State
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [renewData, setRenewData] = useState({
        memberId: '',
        amount: 0,
        method: 'Cash' as 'Cash' | 'Easypaisa' | 'Jazz Cash' | 'Bank Transfer',
        date: new Date().toISOString().split('T')[0]
    });

    // Monthly Revenue Navigation
    // Initialize with local date to avoid timezone issues
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    });

    // Search/Autocomplete State
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate Monthly Revenue based on selectedMonth
    const monthlyRevenue = useMemo(() => {
        return payments
            .filter(p => p.date.startsWith(selectedMonth))
            .reduce((sum, p) => sum + p.amount, 0);
    }, [payments, selectedMonth]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        const date = new Date(selectedMonth + '-01');
        date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${year}-${month}`);
    };

    const formattedMonth = useMemo(() => {
        const [year, month] = selectedMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === '-') return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
    };

    const getMemberStatusDetail = (expiryDateStr: string) => {
        if (!expiryDateStr) return { label: 'Unknown', color: 'bg-gray-700 text-gray-400 border-gray-600' };
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const expiry = new Date(expiryDateStr);
        expiry.setHours(0,0,0,0);
        
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: 'Expired', color: 'bg-red-900/50 text-red-200 border-red-900' };
        }
        if (diffDays <= 5) {
            return { label: 'Expiring Soon', color: 'bg-yellow-900/50 text-yellow-200 border-yellow-900' };
        }
        return { label: 'Active', color: 'bg-green-900/50 text-green-200 border-green-900' };
    };

    const handleExport = () => {
        const headers = ['Gym Name', 'Date of Payment', 'Member Name', 'Member Expiry', 'Membership Status', 'Amount', 'Method'];
        
        const rows = payments.map(p => {
            const member = members.find(m => m.id === p.memberId);
            const status = member ? getMemberStatusDetail(member.expiryDate).label : 'Unknown';
            return [
                `"${gymName}"`,
                p.date,
                `"${p.memberName}"`,
                member ? member.expiryDate : 'N/A',
                status,
                p.amount,
                p.method
            ].join(',');
        });
        
        // Calculate Total Revenue of the exported set
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Add Summary Row at the bottom
        // Aligning "Total Revenue" label with Membership Status column (index 4) and Amount (index 5)
        const footerRow = `,,,,"TOTAL REVENUE",${totalAmount},`;

        const csv = [headers.join(','), ...rows, footerRow].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fees_ledger_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleUpdateSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPayment) {
            onUpdate(editingPayment);
            setEditingPayment(null);
        }
    };

    // Calculate new expiry based on current expiry (or today if expired) + Plan Duration
    const calculateNewExpiry = (currentExpiry: string, plan: string) => {
        const now = new Date();
        const expiry = new Date(currentExpiry);
        
        // If already expired, start from today. If active, add to existing expiry.
        // Since we block active renewals now, this effectively resets expired members to today.
        const baseDate = expiry < now ? now : expiry;
        
        const newDate = new Date(baseDate);
        if (plan === 'Monthly') newDate.setMonth(newDate.getMonth() + 1);
        else if (plan === 'Quarterly') newDate.setMonth(newDate.getMonth() + 3);
        else if (plan === 'Yearly') newDate.setFullYear(newDate.getFullYear() + 1);

        return newDate.toISOString().split('T')[0];
    };

    const handleRenewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!renewData.memberId) {
            alert("Please select a valid member from the list.");
            return;
        }

        const member = members.find(m => m.id === renewData.memberId);
        if (!member) return;

        // Get today's date in local YYYY-MM-DD format for comparison
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localToday = `${year}-${month}-${day}`;
        
        // Check if expiry date is today or in the future
        if (member.expiryDate >= localToday) {
            // Trigger Custom Modal instead of native alert
            setActiveMemberWarning(member);
            return;
        }

        // 1. Record Payment
        onAdd({
            memberId: member.id,
            memberName: member.name,
            amount: renewData.amount,
            method: renewData.method,
            date: renewData.date
        });

        // 2. Update Member Expiry
        const newExpiry = calculateNewExpiry(member.expiryDate, member.plan);
        onUpdateMember({
            ...member,
            expiryDate: newExpiry,
            feePaid: true // ensure flag is true if it was false
        });

        // 3. Close & Reset
        setIsRenewModalOpen(false);
        resetRenewForm();
        alert(`Membership renewed successfully! New expiry date: ${formatDate(newExpiry)}`);
    };

    const resetRenewForm = () => {
        setRenewData({
            memberId: '',
            amount: 0,
            method: 'Cash',
            date: new Date().toISOString().split('T')[0]
        });
        setSearchTerm('');
    };

    const confirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const memberSuggestions = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.registrationNo.includes(searchTerm)
    ).slice(0, 5); // Limit to 5 suggestions

    const filteredPayments = payments.filter(p => 
        p.memberName.toLowerCase().includes(searchTerm.toLowerCase())
    ).reverse(); // Show newest first

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Fees Ledger</h2>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors border border-gray-600">
                        <DownloadIcon className="h-4 w-4" /> Export CSV
                    </button>
                    <button 
                        onClick={() => setIsRenewModalOpen(true)} 
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <CreditCardIcon className="h-4 w-4" /> Record Payment
                    </button>
                </div>
            </div>

            {/* Monthly Revenue Widget */}
            <div className="bg-surface p-6 rounded-lg shadow-lg border-l-4 border-green-500 mb-8 max-w-sm">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Revenue</p>
                    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                        <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-bold text-gray-300 min-w-[90px] text-center select-none">
                            {formattedMonth}
                        </span>
                        <button onClick={() => navigateMonth('next')} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-green-400">PKR {monthlyRevenue.toLocaleString()}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-surface rounded-lg p-4 mb-6 border border-gray-700">
                <input 
                    placeholder="Search payments by member name..." 
                    className="w-full bg-background p-2 rounded text-white border border-gray-600 outline-none focus:border-primary"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-lg border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Member</th>
                                <th className="p-4">Membership Status</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Method</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(p => {
                                const member = members.find(m => m.id === p.memberId);
                                const status = member ? getMemberStatusDetail(member.expiryDate) : null;

                                return (
                                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-4 font-mono text-gray-400">{formatDate(p.date)}</td>
                                    <td className="p-4 font-bold text-white">{p.memberName}</td>
                                    <td className="p-4">
                                        {status && (
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        )}
                                        {!status && <span className="text-gray-600 text-xs">Member Deleted</span>}
                                    </td>
                                    <td className="p-4 text-green-400 font-bold">PKR {p.amount.toLocaleString()}</td>
                                    <td className="p-4 text-gray-400">{p.method}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => setEditingPayment(p)} className="text-blue-400 hover:text-blue-300 p-1" title="Edit Payment">
                                            <EditIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setDeleteId(p.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete Entry">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No payment records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Renew / Add Payment Modal */}
            {isRenewModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-lg shadow-2xl border border-gray-700 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Record Payment / Renew</h3>
                            <button onClick={() => { setIsRenewModalOpen(false); resetRenewForm(); }} className="text-gray-400 hover:text-white">
                                <CloseIcon className="h-5 w-5"/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleRenewSubmit} className="space-y-4">
                            {/* Member Search / Select */}
                            <div className="relative" ref={searchRef}>
                                <label className="block text-sm text-gray-400 mb-1">Select Member</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <input 
                                        className="w-full bg-secondary text-white p-2 pl-10 rounded border border-gray-600 focus:border-primary outline-none"
                                        placeholder="Search by name or reg no..."
                                        value={searchTerm}
                                        onChange={e => {
                                            setSearchTerm(e.target.value);
                                            setShowSuggestions(true);
                                            // If clearing, reset selected ID
                                            if (!e.target.value) setRenewData(prev => ({...prev, memberId: '', amount: 0}));
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                    />
                                </div>
                                
                                {showSuggestions && searchTerm && (
                                    <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded mt-1 max-h-48 overflow-y-auto shadow-xl">
                                        {memberSuggestions.map(m => (
                                            <div 
                                                key={m.id}
                                                className="p-3 hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b border-gray-700/50 last:border-0"
                                                onClick={() => {
                                                    setRenewData({...renewData, memberId: m.id, amount: m.fee});
                                                    setSearchTerm(m.name);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <div>
                                                    <div className="font-bold text-white text-sm">{m.name}</div>
                                                    <div className="text-xs text-gray-400">{m.registrationNo}</div>
                                                </div>
                                                <div className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-300">
                                                    Plan: {m.plan}
                                                </div>
                                            </div>
                                        ))}
                                        {memberSuggestions.length === 0 && (
                                            <div className="p-3 text-gray-500 text-xs text-center">No members found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                        value={renewData.date}
                                        onChange={e => setRenewData({...renewData, date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Payment Method</label>
                                    <select 
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                        value={renewData.method}
                                        onChange={e => setRenewData({...renewData, method: e.target.value as any})}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Easypaisa">Easypaisa</option>
                                        <option value="Jazz Cash">Jazz Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount (PKR)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold">PKR</span>
                                    <input 
                                        type="number"
                                        className="w-full bg-secondary text-white p-2 pl-12 rounded border border-gray-600 focus:border-primary outline-none font-bold text-lg"
                                        value={renewData.amount}
                                        onChange={e => setRenewData({...renewData, amount: Number(e.target.value)})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-xs text-gray-400 flex gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-primary shrink-0" />
                                <p>This will record the payment in the ledger AND automatically extend the member's expiry date based on their plan.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => { setIsRenewModalOpen(false); resetRenewForm(); }} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded shadow-lg shadow-primary/20">
                                    Process Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Payment Modal */}
            {editingPayment && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-sm shadow-2xl border border-gray-700 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Edit Payment</h3>
                            <button onClick={() => setEditingPayment(null)} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5"/></button>
                        </div>
                        
                        <form onSubmit={handleUpdateSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Member Name</label>
                                <input 
                                    className="w-full bg-gray-800 text-gray-500 p-2 rounded border border-gray-700 outline-none cursor-not-allowed"
                                    value={editingPayment.memberName}
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none focus:border-primary"
                                    value={editingPayment.date}
                                    onChange={e => setEditingPayment({...editingPayment, date: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount (PKR)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none focus:border-primary"
                                    value={editingPayment.amount}
                                    onChange={e => setEditingPayment({...editingPayment, amount: Number(e.target.value)})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Method</label>
                                <select 
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none focus:border-primary"
                                    value={editingPayment.method}
                                    onChange={e => setEditingPayment({...editingPayment, method: e.target.value as any})}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Easypaisa">Easypaisa</option>
                                    <option value="Jazz Cash">Jazz Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setEditingPayment(null)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded shadow-lg shadow-primary/20">
                                    Update Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Active Member Warning Modal */}
            {activeMemberWarning && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-sm shadow-2xl border border-yellow-500/30 animate-fade-in-up">
                        <div className="text-center mb-4">
                            <div className="mx-auto w-12 h-12 bg-yellow-900/50 rounded-full flex items-center justify-center mb-4">
                                <WarningIcon className="h-6 w-6 text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Membership Active</h3>
                            <p className="text-gray-300 text-sm mb-2">
                                <b>{activeMemberWarning.name}</b>'s membership is still active until <b>{formatDate(activeMemberWarning.expiryDate)}</b>.
                            </p>
                            <p className="text-gray-400 text-xs">
                                To prevent double-charging or data errors, please wait until the membership has expired before renewing.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <button onClick={() => setActiveMemberWarning(null)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded">
                                OK, I'll wait
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-sm shadow-2xl border border-red-500/30">
                        <div className="text-center mb-4">
                            <div className="mx-auto w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                                <TrashIcon className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Delete Payment?</h3>
                            <p className="text-gray-400 text-sm">
                                Are you sure you want to delete this payment record? This will NOT revert the member's expiry date.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                            <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded shadow-lg shadow-red-600/20">
                                Delete Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fees;
