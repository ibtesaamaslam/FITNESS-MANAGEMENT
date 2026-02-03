import React, { useState, useMemo } from 'react';
import { Member, Payment } from '../types';

const MemberReportDetails: React.FC<{ member: Member; payments: Payment[] }> = ({ member, payments }) => {
    const memberPayments = payments
        .filter(p => p.memberId === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const monthlyAttendanceSummary = useMemo(() => {
        return Object.entries(member.attendance).reduce((acc, [date, present]) => {
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
        <div className="bg-surface rounded-lg shadow-xl p-8 w-full max-w-4xl mx-auto mt-6 flex flex-col">
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-700">
                <img src={member.photo || `https://ui-avatars.com/api/?name=${member.name || '?'}&background=374151&color=F9FAFB`} alt="Profile" className="h-24 w-24 rounded-full object-cover bg-secondary" />
                <div>
                    <h2 className="text-3xl font-bold text-text-primary">{member.name}</h2>
                    <p className="text-text-secondary font-mono text-lg">{member.registrationNo}</p>
                </div>
            </div>
            <div className="mt-6 space-y-8">
                {/* Basic Info */}
                <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">Member Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-secondary p-4 rounded-lg">
                        <div><span className="font-semibold text-text-secondary">Age:</span> {member.age}</div>
                        <div><span className="font-semibold text-text-secondary">Phone:</span> {member.phone}</div>
                        <div><span className="font-semibold text-text-secondary">Plan:</span> {member.plan}</div>
                        <div><span className="font-semibold text-text-secondary">Fee:</span> Rs {member.fee.toLocaleString()}</div>
                        <div><span className="font-semibold text-text-secondary">Join Date:</span> {member.joinDate}</div>
                        <div><span className="font-semibold text-text-secondary">Expiry Date:</span> {member.expiryDate}</div>
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
                            .map(([month, stats]) => (
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
                                    <div>
                                        <p className="font-semibold">{member.name}</p>
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
