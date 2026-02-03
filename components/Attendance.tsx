
import React, { useState } from 'react';
import { Member } from '../types';

interface Props {
    members: Member[];
    onMark: (ids: string[], date: string, present: boolean) => void;
}

const Attendance: React.FC<Props> = ({ members, onMark }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState('');

    const filtered = members.filter(m => 
        m.name.toLowerCase().includes(filter.toLowerCase()) || 
        m.registrationNo.toLowerCase().includes(filter.toLowerCase())
    );

    // Calculate Stats for the selected date (based on ALL members, not just filtered)
    const totalMembers = members.length;
    const presentCount = members.filter(m => m.attendance[date]).length;
    const absentCount = totalMembers - presentCount;
    const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

    const getStatusBadge = (expiryDateStr: string) => {
        const expiryDate = new Date(expiryDateStr);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (86400000));
        
        if (diffDays < 0) {
            return <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-900/30 text-red-400 rounded border border-red-800">Expired</span>;
        }
        if (diffDays <= 5) {
            return <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-yellow-900/30 text-yellow-500 rounded border border-yellow-800">Expiring</span>;
        }
        return null; // Active doesn't need a badge usually to reduce clutter, or we can add green dot
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Attendance</h2>
            
            {/* Attendance Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface p-4 rounded-lg border-l-4 border-green-500 shadow-lg">
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Present</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-white">{presentCount}</p>
                        <p className="text-sm text-green-400 mb-1">Members</p>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-lg border-l-4 border-red-500 shadow-lg">
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Absent</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-white">{absentCount}</p>
                        <p className="text-sm text-red-400 mb-1">Members</p>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-lg border-l-4 border-blue-500 shadow-lg">
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Daily Rate</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-white">{attendanceRate}%</p>
                        <p className="text-sm text-blue-400 mb-1">Turnout</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-surface p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center border border-gray-700 shadow-lg">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm font-bold">Date:</span>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="bg-background p-2 rounded text-white border border-gray-600 outline-none focus:border-primary text-sm" 
                    />
                </div>
                <div className="flex-grow">
                    <input 
                        placeholder="Search by name or reg no..." 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)} 
                        className="w-full bg-background p-2 rounded text-white border border-gray-600 outline-none focus:border-primary text-sm" 
                    />
                </div>
            </div>

            {/* List View */}
            <div className="bg-surface rounded-xl shadow-xl border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 p-5 bg-gray-800/80 border-b border-gray-700 text-sm font-bold text-gray-300 uppercase tracking-wider items-center">
                    <div className="col-span-6 md:col-span-5">Member</div>
                    <div className="col-span-3 md:col-span-3 text-center">Status</div>
                    <div className="col-span-3 md:col-span-4 text-right pr-2">Mark Attendance</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-700/50">
                    {filtered.map(m => {
                        const isPresent = m.attendance[date];
                        return (
                            <div key={m.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-800/40 transition-colors group">
                                {/* Member Column */}
                                <div className="col-span-6 md:col-span-5 flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        {m.photoBase64 ? (
                                            <img src={m.photoBase64} alt={m.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 group-hover:border-gray-500 transition-colors" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold text-lg border-2 border-gray-600 group-hover:border-gray-500 transition-colors">
                                                {m.name.charAt(0)}
                                            </div>
                                        )}
                                        {/* Online/Offline indicator dot (optional, relying on status badge instead) */}
                                    </div>
                                    
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-bold text-base truncate">{m.name}</h4>
                                            {getStatusBadge(m.expiryDate)}
                                        </div>
                                        <p className="text-gray-500 text-xs font-mono mt-0.5">{m.registrationNo}</p>
                                    </div>
                                </div>

                                {/* Status Column */}
                                <div className="col-span-3 md:col-span-3 flex justify-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                                        isPresent 
                                        ? 'bg-green-900/30 text-green-400 border border-green-800 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                        : 'bg-gray-700/30 text-gray-500 border border-gray-600'
                                    }`}>
                                        {isPresent ? 'Present' : 'Absent'}
                                    </span>
                                </div>

                                {/* Toggle Column */}
                                <div className="col-span-3 md:col-span-4 flex justify-end pr-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={!!isPresent}
                                            onChange={() => onMark([m.id], date, !isPresent)}
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No members found matching "{filter}".
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
