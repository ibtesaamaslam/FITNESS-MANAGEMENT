import React, { useState, useMemo } from 'react';
import { Member, Payment } from '../types';
import { WarningIcon, EditIcon, TrashIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon, EyeIcon, UserIcon, CheckCircleIcon } from './icons';

interface Props {
    members: Member[];
    payments: Payment[];
    onAddMember: (m: Omit<Member, 'id'>, method: Payment['method'], paidAmount?: number) => void;
    onUpdateMember: (m: Member, method: Payment['method']) => void;
    onDeleteMember: (id: string) => void;
}

type SortKey = 'name' | 'registrationNo' | 'joinDate' | 'expiryDate';
type PaymentMode = 'full' | 'partial' | 'later';

const Members: React.FC<Props> = ({ members, payments, onAddMember, onUpdateMember, onDeleteMember }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    
    // Core member fields
    const [editing, setEditing] = useState<Partial<Member>>({});
    
    // Extra fields for "Add Member" logic
    const [registrationFee, setRegistrationFee] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
    const [partialAmount, setPartialAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Cash');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'registrationNo', direction: 'asc' });

    // Calculate Financials for "Add Member"
    const planFee = editing.fee || 0;
    const totalBill = planFee + registrationFee;
    
    const amountPayingNow = paymentMode === 'full' 
        ? totalBill 
        : paymentMode === 'partial' 
            ? partialAmount 
            : 0;
            
    const remainingBalance = totalBill - amountPayingNow;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!editing.name || !editing.registrationNo || !editing.expiryDate) {
            alert('Please fill in required fields');
            return;
        }

        const isNew = !editing.id;

        if (isNew) {
            const memberData = {
                registrationNo: editing.registrationNo!,
                name: editing.name!,
                age: editing.age || 0,
                phone: editing.phone || '',
                plan: editing.plan || 'Monthly',
                fee: planFee, // Use plan fee as the recurring fee
                // If they pay full or partial covering the fee, we can say feePaid is true for now
                // Logic: If remaining balance is 0, they are fully paid up for this cycle.
                feePaid: remainingBalance <= 0, 
                joinDate: editing.joinDate || new Date().toISOString().split('T')[0],
                expiryDate: editing.expiryDate!,
                photo: editing.photo || '',
                attendance: {},
                remindersEnabled: true,
            };
            
            // Pass the actual amount paid now (Reg Fee + Plan Fee or Partial)
            onAddMember(memberData, paymentMethod, amountPayingNow);
        } else {
            // Update logic
            onUpdateMember(editing as Member, paymentMethod);
        }
        
        setModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setEditing({});
        setRegistrationFee(0);
        setPaymentMode('full');
        setPartialAmount(0);
        setPaymentMethod('Cash');
    };

    const handleEdit = (member: Member) => {
        setEditing({ ...member });
        // Reset extra fields for edit mode
        setRegistrationFee(0); 
        setPaymentMode('full');
        setModalOpen(true);
    };

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedMembers = useMemo(() => {
        let sortable = [...members];
        if (sortConfig) {
            sortable.sort((a, b) => {
                // Handle potentially undefined values safely
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable.filter(m => 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, sortConfig, searchTerm]);


    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Members</h1>
                <div className="flex w-full md:w-auto space-x-2">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="bg-surface text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap flex items-center gap-2">
                        <UserIcon className="h-5 w-5" /> Add Member
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl my-8 border border-gray-700">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50 rounded-t-lg">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                {editing.id ? <EditIcon className="h-6 w-6 text-primary"/> : <UserIcon className="h-6 w-6 text-primary"/>}
                                {editing.id ? 'Edit Member' : 'Add New Member'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-text-secondary hover:text-white transition-colors">
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Personal Info Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-primary border-b border-gray-700 pb-2">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Reg No *</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.registrationNo || ''}
                                            onChange={e => setEditing({...editing, registrationNo: e.target.value})}
                                            placeholder="e.g. 101"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Full Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.name || ''}
                                            onChange={e => setEditing({...editing, name: e.target.value})}
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Age</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.age || ''}
                                            onChange={e => setEditing({...editing, age: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                                        <input 
                                            type="tel" 
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.phone || ''}
                                            onChange={e => setEditing({...editing, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Photo URL</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.photo || ''}
                                            onChange={e => setEditing({...editing, photo: e.target.value})}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Plan Info Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-primary border-b border-gray-700 pb-2">Membership Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Join Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.joinDate || new Date().toISOString().split('T')[0]}
                                            onChange={e => setEditing({...editing, joinDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Expiry Date *</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.expiryDate || ''}
                                            onChange={e => setEditing({...editing, expiryDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Plan Type</label>
                                        <select 
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.plan || 'Monthly'}
                                            onChange={e => setEditing({...editing, plan: e.target.value as any})}
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Monthly/Plan Fee (Rs)</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                            value={editing.fee || ''}
                                            onChange={e => setEditing({...editing, fee: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Financial Section (Only for New Members) */}
                            {!editing.id && (
                                <div className="space-y-4 bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                                    <h3 className="text-lg font-semibold text-primary border-b border-gray-700 pb-2">Financials & Payment</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Registration Fee (One Time)</label>
                                            <input 
                                                type="number" 
                                                className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                                value={registrationFee}
                                                onChange={e => setRegistrationFee(parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end">
                                             <div className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                                <span className="text-gray-300 font-medium">Total Bill</span>
                                                <span className="text-2xl font-bold text-white">Rs {totalBill.toLocaleString()}</span>
                                             </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-text-secondary">Payment Mode</label>
                                        <div className="flex flex-wrap gap-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="payMode" 
                                                    checked={paymentMode === 'full'} 
                                                    onChange={() => setPaymentMode('full')}
                                                    className="accent-primary"
                                                />
                                                <span>Full Payment</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="payMode" 
                                                    checked={paymentMode === 'partial'} 
                                                    onChange={() => setPaymentMode('partial')}
                                                    className="accent-primary"
                                                />
                                                <span>Partial Payment</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="payMode" 
                                                    checked={paymentMode === 'later'} 
                                                    onChange={() => setPaymentMode('later')}
                                                    className="accent-primary"
                                                />
                                                <span>Pay Later</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Amount Paying Now logic */}
                                    {paymentMode !== 'later' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">Amount Paying Now</label>
                                                <input 
                                                    type="number" 
                                                    disabled={paymentMode === 'full'}
                                                    className={`w-full p-2.5 rounded-lg outline-none border border-transparent focus:border-primary/50 ${paymentMode === 'full' ? 'bg-gray-700 text-gray-400' : 'bg-secondary text-white'}`}
                                                    value={paymentMode === 'full' ? totalBill : partialAmount}
                                                    onChange={e => setPartialAmount(parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">Payment Method</label>
                                                <select 
                                                    className="w-full bg-secondary p-2.5 rounded-lg focus:ring-1 focus:ring-primary outline-none border border-transparent focus:border-primary/50"
                                                    value={paymentMethod}
                                                    onChange={e => setPaymentMethod(e.target.value as any)}
                                                >
                                                    <option>Cash</option>
                                                    <option>Easypaisa</option>
                                                    <option>Jazz Cash</option>
                                                    <option>Bank Transfer</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Balance Display */}
                                    {remainingBalance > 0 && paymentMode !== 'full' && (
                                        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex items-center justify-between animate-pulse-slow">
                                            <div className="flex items-center space-x-2 text-red-400">
                                                <WarningIcon className="h-5 w-5" />
                                                <span className="font-medium">Remaining Balance</span>
                                            </div>
                                            <span className="text-xl font-bold text-red-400">Rs {remainingBalance.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg transition-colors font-bold text-white shadow-lg shadow-primary/20">
                                    {editing.id ? 'Save Changes' : 'Register Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary text-text-secondary uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('registrationNo')}>
                                    <div className="flex items-center space-x-1">
                                        <span>Reg No</span>
                                        {sortConfig?.key === 'registrationNo' && (sortConfig.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />)}
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                     <div className="flex items-center space-x-1">
                                        <span>Name</span>
                                        {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />)}
                                    </div>
                                </th>
                                <th className="p-4">Plan</th>
                                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('expiryDate')}>
                                    <div className="flex items-center space-x-1">
                                        <span>Expiry</span>
                                        {sortConfig?.key === 'expiryDate' && (sortConfig.direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />)}
                                    </div>
                                </th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {sortedMembers.map(member => {
                                const isExpired = new Date(member.expiryDate) < new Date();
                                return (
                                    <tr key={member.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-mono text-sm">{member.registrationNo}</td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold overflow-hidden border border-gray-500">
                                                    {member.photo ? <img src={member.photo} alt="P" className="h-full w-full object-cover"/> : member.name[0]}
                                                </div>
                                                <div className="font-medium text-text-primary">{member.name}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">{member.plan}</td>
                                        <td className="p-4 text-sm">
                                            <div className={`flex items-center space-x-1 ${isExpired ? 'text-red-400 font-bold' : 'text-text-secondary'}`}>
                                                <span>{member.expiryDate}</span>
                                                {isExpired && <WarningIcon className="h-4 w-4" />}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${member.feePaid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {member.feePaid ? 'PAID' : 'UNPAID'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => handleEdit(member)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Edit">
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => onDeleteMember(member.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Delete">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {sortedMembers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                                        No members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Members;