
import React, { useState } from 'react';
import { Member, Gym } from '../types';
import { WarningIcon, EditIcon, TrashIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon, EyeIcon } from './icons';

interface Props {
    gym: Gym;
    members: Member[];
    onAdd: (m: any) => void;
    onUpdate: (m: Member) => void;
    onDelete: (id: string) => void;
}

type SortKey = 'name' | 'registrationNo' | 'joinDate' | 'expiryDate';

const Members: React.FC<Props> = ({ gym, members, onAdd, onUpdate, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<Member>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    // Default sort is Registration No Ascending (Stored as requested)
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'registrationNo', direction: 'asc' });

    const isReadOnly = gym.subscriptionStatus === 'past_due';

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === '-') return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
    };

    // Helper to calculate expiry based on start date and plan
    const calculateExpiry = (startDateStr: string, plan: string) => {
        const date = new Date(startDateStr);
        if (isNaN(date.getTime())) return ''; 

        if (plan === 'Monthly') date.setMonth(date.getMonth() + 1);
        else if (plan === 'Quarterly') date.setMonth(date.getMonth() + 3);
        else if (plan === 'Yearly') date.setFullYear(date.getFullYear() + 1);
        
        return date.toISOString().split('T')[0];
    };

    const getMemberStatusElement = (expiryDateStr: string) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const expiry = new Date(expiryDateStr);
        expiry.setHours(0,0,0,0);
        
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return <span className="px-2 py-1 bg-red-900/50 text-red-200 text-xs rounded border border-red-900 font-bold">Expired</span>;
        }
        if (diffDays <= 2) {
            return (
                <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded border border-orange-600/50 flex items-center justify-center gap-1 font-bold animate-pulse" title="Expires in 2 days or less">
                    <WarningIcon className="h-3 w-3" /> Expiring
                </span>
            );
        }
        if (diffDays <= 5) {
            return (
                <span className="px-2 py-1 bg-yellow-900/50 text-yellow-200 text-xs rounded border border-yellow-900 flex items-center justify-center gap-1 font-bold">
                    <WarningIcon className="h-3 w-3" /> Due Soon
                </span>
            );
        }
        return <span className="px-2 py-1 bg-green-900/50 text-green-200 text-xs rounded border border-green-900">Active</span>;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing.name || !editing.registrationNo) return;
        
        const memberData = {
            ...editing,
            feePaid: editing.feePaid || false,
            joinDate: editing.joinDate || new Date().toISOString().split('T')[0],
            expiryDate: editing.expiryDate || new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
            fee: Number(editing.fee) || 0,
            plan: editing.plan || 'Monthly',
            age: Number(editing.age) || 18,
            phone: editing.phone || '',
        };

        if (editing.id) {
            onUpdate(memberData as Member);
        } else {
            onAdd(memberData);
        }
        setModalOpen(false);
        setEditing({});
    };

    const openAddModal = () => {
        const today = new Date().toISOString().split('T')[0];
        // Default to Monthly logic
        const defaultExpiry = calculateExpiry(today, 'Monthly');
        
        // Auto-increment logic for Registration No
        let nextReg = '001';
        if (members.length > 0) {
            // Find max numeric value in existing reg numbers
            const maxReg = members.reduce((max, m) => {
                const match = m.registrationNo.match(/\d+$/); // Extract trailing numbers
                if (match) {
                    const num = parseInt(match[0], 10);
                    return num > max ? num : max;
                }
                return max;
            }, 0);
            nextReg = (maxReg + 1).toString().padStart(3, '0');
        }

        setEditing({
            joinDate: today,
            plan: 'Monthly',
            expiryDate: defaultExpiry,
            feePaid: false,
            registrationNo: nextReg
        });
        setModalOpen(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedMembers = React.useMemo(() => {
        if (!sortConfig) return members;
        return [...members].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            
            // Special handling for Registration No to sort naturally (e.g. 001, 002, 010)
            if (sortConfig.key === 'registrationNo') {
                 // Try to parse number for cleaner sort if mixed format
                 const aNum = parseInt(aVal.match(/\d+$/)?.[0] || '0', 10);
                 const bNum = parseInt(bVal.match(/\d+$/)?.[0] || '0', 10);
                 if (aNum !== bNum) {
                     return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                 }
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [members, sortConfig]);

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortConfig?.key !== colKey) return <div className="h-4 w-4 inline-block ml-1 opacity-0 group-hover:opacity-30"></div>;
        return sortConfig.direction === 'asc' 
            ? <ChevronUpIcon className="inline-block ml-1 text-primary" />
            : <ChevronDownIcon className="inline-block ml-1 text-primary" />;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Members</h2>
                {!isReadOnly && (
                    <button onClick={openAddModal} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded font-bold">
                        + Add Member
                    </button>
                )}
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 select-none">
                            <tr>
                                <th className="p-4 cursor-pointer hover:text-white group" onClick={() => handleSort('registrationNo')}>
                                    <div className="flex items-center">
                                        Reg No
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">
                                        Member <SortIcon colKey="name" />
                                    </div>
                                </th>
                                <th className="p-4">Plan</th>
                                <th className="p-4 cursor-pointer hover:text-white group" onClick={() => handleSort('joinDate')}>
                                    <div className="flex items-center">
                                        Join Date <SortIcon colKey="joinDate" />
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white group" onClick={() => handleSort('expiryDate')}>
                                    <div className="flex items-center">
                                        Expiry <SortIcon colKey="expiryDate" />
                                    </div>
                                </th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMembers.map(m => {
                                return (
                                <tr key={m.id} className="border-b border-gray-700 hover:bg-gray-700/50 group">
                                    <td className="p-4 font-mono text-gray-400">{m.registrationNo}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {m.photoBase64 ? (
                                                <img src={m.photoBase64} className="w-8 h-8 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-300">
                                                    {m.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white">{m.name}</div>
                                                <div className="text-xs text-gray-500">{m.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300">
                                        {m.plan}
                                        <span className="text-xs block text-gray-500">PKR {m.fee}</span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-xs">{formatDate(m.joinDate)}</td>
                                    <td className="p-4 text-gray-400 text-xs">{formatDate(m.expiryDate)}</td>
                                    <td className="p-4 text-center">
                                        {getMemberStatusElement(m.expiryDate)}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => window.location.hash = `#/g/${gym.slug}/members/${m.id}`}
                                            className="text-gray-400 hover:text-white p-1"
                                            title="View Profile"
                                        >
                                            <EyeIcon />
                                        </button>
                                        {!isReadOnly && (
                                            <>
                                                <button onClick={() => { setEditing(m); setModalOpen(true); }} className="text-blue-400 hover:text-blue-300 p-1">
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => setDeleteId(m.id)} className="text-red-400 hover:text-red-300 p-1">
                                                    <TrashIcon />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )})}
                            {sortedMembers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        No members found. Add a member to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-lg shadow-2xl border border-gray-700 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{editing.id ? 'Edit Member' : 'New Member'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5"/></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Registration No</label>
                                    <input 
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                        value={editing.registrationNo}
                                        onChange={e => setEditing({...editing, registrationNo: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                    <input 
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                        value={editing.name || ''}
                                        onChange={e => setEditing({...editing, name: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Phone</label>
                                    <input 
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                        value={editing.phone || ''}
                                        onChange={e => setEditing({...editing, phone: e.target.value})}
                                        placeholder="0300-1234567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Age</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                        value={editing.age || ''}
                                        onChange={e => setEditing({...editing, age: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Plan</label>
                                    <select 
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                        value={editing.plan}
                                        onChange={e => {
                                            const newPlan = e.target.value as any;
                                            // Recalculate expiry if date exists
                                            const newExpiry = editing.joinDate ? calculateExpiry(editing.joinDate, newPlan) : editing.expiryDate;
                                            setEditing({...editing, plan: newPlan, expiryDate: newExpiry});
                                        }}
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Fee (PKR)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                        value={editing.fee || ''}
                                        onChange={e => setEditing({...editing, fee: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Join Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                        value={editing.joinDate || ''}
                                        onChange={e => {
                                            const d = e.target.value;
                                            const exp = calculateExpiry(d, editing.plan || 'Monthly');
                                            setEditing({...editing, joinDate: d, expiryDate: exp});
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Expiry Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                        value={editing.expiryDate || ''}
                                        onChange={e => setEditing({...editing, expiryDate: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            
                            {!editing.id && (
                                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded border border-gray-700">
                                    <input 
                                        type="checkbox"
                                        id="feePaid"
                                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                                        checked={editing.feePaid || false}
                                        onChange={e => setEditing({...editing, feePaid: e.target.checked})}
                                    />
                                    <label htmlFor="feePaid" className="text-sm text-gray-300">Mark initial fee as paid (add to ledger)</label>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded">
                                    {editing.id ? 'Save Changes' : 'Create Member'}
                                </button>
                            </div>
                        </form>
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
                            <h3 className="text-xl font-bold text-white mb-2">Delete Member?</h3>
                            <p className="text-gray-400 text-sm">
                                Are you sure you want to delete this member? This will remove all their attendance and payment history.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                            <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded shadow-lg shadow-red-600/20">
                                Delete Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;
