import React, { useState, useMemo } from 'react';
import { Member, Payment } from '../types';
import { isMemberArchived } from '../lib/dateUtils';

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const MemberReportDetails: React.FC<{ member: Member; payments: Payment[] }> = ({ member, payments }) => {
    const memberPayments = payments
        .filter(p => p.memberId === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPaid = useMemo(() => {
        return memberPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [memberPayments]);

    const totalPresent = useMemo(() => {
        return Object.values(member.attendance || {}).filter(Boolean).length;
    }, [member.attendance]);

    const totalAbsent = useMemo(() => {
        return Object.values(member.attendance || {}).filter(val => !val).length;
    }, [member.attendance]);

    const attendanceRate = useMemo(() => {
        const totalSessions = totalPresent + totalAbsent;
        if (totalSessions === 0) return 100;
        return Math.round((totalPresent / totalSessions) * 100);
    }, [totalPresent, totalAbsent]);

    const isArchived = useMemo(() => {
        return isMemberArchived(member);
    }, [member]);

    const monthlyAttendanceSummary = useMemo(() => {
        return Object.entries(member.attendance).reduce((acc: Record<string, { present: number, absent: number }>, [date, present]) => {
            const month = date.substring(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = { present: 0, absent: 0 };
            }
            if (present) {
                acc[month].present++;
            } else {
                acc[month].absent++;
            }
            return acc;
        }, {} as Record<string, { present: number, absent: number }>);
    }, [member.attendance]);

    return (
        <div className="bg-surface rounded-lg shadow-xl p-6 md:p-8 w-full mt-6 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    <img src={member.photo || `https://ui-avatars.com/api/?name=${member.name || '?'}&background=374151&color=F9FAFB`} alt="Profile" className="h-24 w-24 rounded-full object-cover bg-secondary" />
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-3xl font-bold text-text-primary">{member.name}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[member.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                                {member.category || 'Strength'}
                            </span>
                        </div>
                        <p className="text-text-secondary font-mono text-lg mt-0.5">{member.registrationNo}</p>
                    </div>
                </div>
                <div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${
                        isArchived 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                            : 'bg-green-500/10 text-green-400 border-green-500/30'
                    }`}>
                        ● {isArchived ? 'Archived (Consistently Absent)' : 'Active Member'}
                    </span>
                </div>
            </div>
            <div className="mt-6 space-y-8">
                {/* Stats Summary Panel */}
                <div>
                     <h3 className="text-xl font-semibold text-text-primary mb-3">Key Performance Indicators</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-secondary p-4 rounded-xl border border-gray-800 text-center">
                             <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Total Paid</p>
                             <p className="text-2xl font-black text-green-400">Rs {totalPaid.toLocaleString()}</p>
                         </div>
                         <div className="bg-secondary p-4 rounded-xl border border-gray-800 text-center">
                             <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Attendance Rate</p>
                             <p className="text-2xl font-black text-blue-400">{attendanceRate}%</p>
                         </div>
                         <div className="bg-secondary p-4 rounded-xl border border-gray-800 text-center">
                             <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Days Attended</p>
                             <p className="text-2xl font-black text-emerald-400">{totalPresent} Days</p>
                         </div>
                         <div className="bg-secondary p-4 rounded-xl border border-gray-800 text-center">
                             <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Days Absent</p>
                             <p className="text-2xl font-black text-red-400">{totalAbsent} Days</p>
                         </div>
                     </div>
                </div>

                {/* Basic Info */}
                <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Member Details Profile</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-secondary p-4 rounded-lg">
                        <div><span className="font-semibold text-text-secondary block text-xs">Program/Category</span> <span className="text-primary font-bold text-base">{member.category || 'Strength'}</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Age</span> <span className="text-text-primary font-medium">{member.age} yrs</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Phone</span> <span className="text-text-primary font-medium">{member.phone}</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Plan Duration</span> <span className="text-text-primary font-medium">{member.plan}</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Fee Amount</span> <span className="text-text-primary font-mono font-bold">Rs {member.fee.toLocaleString()}</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Fee Status</span> <span className={`font-bold ${member.feePaid ? 'text-green-400' : 'text-red-400'}`}>{member.feePaid ? 'Paid' : 'Unpaid'}</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Join Date</span> <span className="text-text-primary font-medium">{member.joinDate}</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Expiry Date</span> <span className="text-text-primary font-medium">{member.expiryDate}</span></div>
                        <div><span className="font-semibold text-text-secondary block text-xs">Reminders Status</span> <span className="text-text-primary font-medium">{member.remindersEnabled ?? true ? 'Enabled' : 'Disabled'}</span></div>
                    </div>
                </div>
                {/* Payment History */}
                <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Payment History</h3>
                    <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-left">
                            <thead className="bg-secondary sticky top-0">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberPayments.length > 0 ? memberPayments.map(p => (
                                    <tr key={p.id} className="border-b border-secondary">
                                        <td className="p-3">{p.date}</td>
                                        <td className="p-3">Rs {p.amount.toLocaleString()}</td>
                                        <td className="p-3">{p.method}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center p-8 text-text-secondary">No payment history.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Monthly Attendance */}
                <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Monthly Attendance Summary</h3>
                    <div className="overflow-x-auto max-h-64 space-y-2">
                         {Object.keys(monthlyAttendanceSummary).length > 0 ? Object.entries(monthlyAttendanceSummary)
                            .sort(([monthA], [monthB]) => new Date(monthB).getTime() - new Date(monthA).getTime())
                            .map(([month, stats]: [string, any]) => (
                            <div key={month} className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                                <span className="font-semibold text-text-primary">{new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                <div className="flex space-x-4 text-sm">
                                    <span className="text-green-400">Present: {stats.present}</span>
                                    <span className="text-red-400">Absent: {stats.absent}</span>
                                </div>
                            </div>
                         )) : (
                            <p className="text-center p-8 text-text-secondary">No attendance data to summarize.</p>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ReportProps {
  members: Member[];
  payments: Payment[];
}

const Report: React.FC<ReportProps> = ({ members, payments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSearched(true);
        if (!searchTerm.trim()) {
            setFilteredMembers([]);
            setSelectedMember(null);
            return;
        }
        const results = members.filter(m => 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredMembers(results);
        setSelectedMember(results.length === 1 ? results[0] : null);
    };

    const handleSelectMember = (member: Member) => {
        setSelectedMember(member);
        setFilteredMembers([]);
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Member Reports</h1>

            <div className="bg-surface p-6 rounded-lg shadow-lg mb-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
                    <label htmlFor="member-search" className="font-semibold text-lg text-text-secondary">Find Member:</label>
                    <input
                        id="member-search"
                        type="text"
                        placeholder="Enter Name or Registration No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow p-3 bg-secondary rounded-lg w-full md:w-auto"
                    />
                    <button type="submit" className="w-full md:w-auto bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors">
                        Search
                    </button>
                </form>
            </div>
            
            {hasSearched && filteredMembers.length > 1 && !selectedMember && (
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Multiple Members Found</h2>
                    <p className="text-text-secondary mb-4">Please select a member to view their report.</p>
                    <ul className="space-y-2">
                        {filteredMembers.map(member => (
                            <li key={member.id}>
                                <button 
                                    onClick={() => handleSelectMember(member)}
                                    className="w-full text-left p-3 bg-secondary rounded-lg hover:bg-gray-700 flex items-center space-x-4"
                                >
                                    <img src={member.photo} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                                    <div className="flex-grow">
                                        <div className="flex items-center space-x-2">
                                            <p className="font-semibold">{member.name}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[member.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                                                {member.category || 'Strength'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary font-mono">{member.registrationNo}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {hasSearched && filteredMembers.length === 0 && (
                 <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
                    <p className="text-text-secondary">No member found matching "{searchTerm}".</p>
                </div>
            )}

            {!hasSearched && !selectedMember && (
                 <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
                    <p className="text-text-secondary">Search for a member to view their report.</p>
                </div>
            )}

            {selectedMember && <MemberReportDetails member={selectedMember} payments={payments} />}
        </div>
    );
};

export default Report;