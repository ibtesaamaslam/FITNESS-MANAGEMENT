
import React, { useState } from 'react';
import { Visitor } from '../types';
import { TrashIcon, CloseIcon, PhoneIcon, CalendarIcon } from './icons';

interface Props {
    visitors: Visitor[];
    onAdd: (v: Omit<Visitor, 'id' | 'gymId'>) => void;
    onDelete: (id: string) => void;
}

const Visitors: React.FC<Props> = ({ visitors, onAdd, onDelete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [newVisitor, setNewVisitor] = useState({
        name: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        purpose: 'Inquiry',
        note: ''
    });

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === '-') return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(newVisitor);
        setModalOpen(false);
        setNewVisitor({
            name: '',
            phone: '',
            date: new Date().toISOString().split('T')[0],
            purpose: 'Inquiry',
            note: ''
        });
    };

    const confirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const filteredVisitors = visitors.filter(v => 
        v.name.toLowerCase().includes(search.toLowerCase()) || 
        v.phone.includes(search)
    ).reverse();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Visitors Log</h2>
                    <p className="text-sm text-gray-400">Track inquiries, day passes, and guests.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded font-bold shadow-lg shadow-primary/20">
                    + Add Visitor
                </button>
            </div>

            <div className="bg-surface rounded-lg p-4 mb-6 border border-gray-700">
                <input 
                    placeholder="Search visitors..." 
                    className="w-full bg-background p-2 rounded text-white border border-gray-600 outline-none focus:border-primary"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-lg border border-gray-700">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900 text-gray-400">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Purpose</th>
                            <th className="p-4">Note</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVisitors.map(v => (
                            <tr key={v.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-4 text-gray-400 whitespace-nowrap">{formatDate(v.date)}</td>
                                <td className="p-4 text-white font-bold">{v.name}</td>
                                <td className="p-4 text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <PhoneIcon className="h-4 w-4 text-gray-500" />
                                        {v.phone}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold border ${
                                        v.purpose === 'Inquiry' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                        v.purpose === 'Day Pass' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                        'bg-gray-700 text-gray-400 border-gray-600'
                                    }`}>
                                        {v.purpose}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 text-xs max-w-xs truncate">{v.note || '-'}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => setDeleteId(v.id)} className="text-red-400 hover:text-red-300 p-1">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredVisitors.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">No visitors recorded yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md shadow-2xl border border-gray-700 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Log Visitor</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5"/></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                    value={newVisitor.date}
                                    onChange={e => setNewVisitor({...newVisitor, date: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Visitor Name</label>
                                <input 
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                    value={newVisitor.name}
                                    onChange={e => setNewVisitor({...newVisitor, name: e.target.value})}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                                <input 
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                    value={newVisitor.phone}
                                    onChange={e => setNewVisitor({...newVisitor, phone: e.target.value})}
                                    placeholder="0300-1234567"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Purpose</label>
                                <select 
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                    value={newVisitor.purpose}
                                    onChange={e => setNewVisitor({...newVisitor, purpose: e.target.value})}
                                >
                                    <option value="Inquiry">Inquiry</option>
                                    <option value="Day Pass">Day Pass</option>
                                    <option value="Guest">Guest</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Note (Optional)</label>
                                <textarea 
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none h-24 resize-none"
                                    value={newVisitor.note}
                                    onChange={e => setNewVisitor({...newVisitor, note: e.target.value})}
                                    placeholder="Any additional details..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded shadow-lg shadow-primary/20">
                                    Save Record
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
                            <h3 className="text-xl font-bold text-white mb-2">Delete Record?</h3>
                            <p className="text-gray-400 text-sm">
                                Are you sure you want to delete this visitor log?
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                            <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded shadow-lg shadow-red-600/20">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Visitors;
