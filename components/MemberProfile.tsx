
import React from 'react';
import { Member, Payment, Gym } from '../types';
import { ArrowLeftIcon, LockIcon, PhoneIcon, UserIcon, CalendarIcon, WarningIcon, CheckCircleIcon } from './icons';

interface Props {
    gym: Gym;
    memberId: string;
    members: Member[];
    payments: Payment[];
    onBack: () => void;
}

const MemberProfile: React.FC<Props> = ({ gym, memberId, members, payments, onBack }) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === '-') return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
    };

    // Pro Plan Guard
    if (gym.planName !== 'Pro') {
        return (
            <div className="h-full flex flex-col p-6">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 w-fit">
                    <ArrowLeftIcon className="h-5 w-5" /> Back to Members
                </button>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="bg-gray-700 p-6 rounded-full mb-6 relative group">
                        <LockIcon className="h-16 w-16 text-gray-400" />
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Professional Profiles</h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Upgrade to the <span className="text-primary font-bold">Pro Plan</span> to unlock detailed member profiles, including attendance logs, payment history, and personalized stats.
                    </p>
                    <div className="bg-surface border border-gray-700 p-6 rounded-lg w-full max-w-md opacity-50 blur-[1px] select-none pointer-events-none">
                         <div className="flex gap-4 mb-6">
                             <div className="h-20 w-20 bg-gray-600 rounded-full"></div>
                             <div className="space-y-2 flex-1">
                                 <div className="h-6 bg-gray-600 rounded w-3/4"></div>
                                 <div className="h-4 bg-gray-600/50 rounded w-1/2"></div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    const member = members.find(m => m.id === memberId);

    if (!member) {
        return (
            <div className="p-8 text-center text-gray-400">
                <p>Member not found.</p>
                <button onClick={onBack} className="mt-4 text-primary hover:underline">Go Back</button>
            </div>
        );
    }

    const memberPayments = payments.filter(p => p.memberId === memberId).sort((a,b) => b.date.localeCompare(a.date));
    const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Attendance Stats
    const totalDays = Object.keys(member.attendance).length;
    const presentDays = Object.values(member.attendance).filter(v => v).length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    const isExpired = new Date(member.expiryDate) < new Date();
    const isExpiringSoon = !isExpired && (new Date(member.expiryDate).getTime() - Date.now()) < (5 * 86400000);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h2 className="text-2xl font-bold text-white">Member Profile</h2>
            </div>

            {/* Main Info Card */}
            <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <UserIcon className="h-48 w-48 text-primary" />
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                        {member.photoBase64 ? (
                            <img src={member.photoBase64} alt={member.name} className="w-32 h-32 rounded-full object-cover border-4 border-gray-600 shadow-xl" />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-3xl font-bold text-gray-400 border-4 border-gray-600 shadow-xl">
                                {member.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-white">{member.name}</h1>
                                {isExpired ? (
                                    <span className="px-2 py-1 bg-red-900/50 text-red-200 text-xs rounded border border-red-900 font-bold">Expired</span>
                                ) : isExpiringSoon ? (
                                    <span className="px-2 py-1 bg-yellow-900/50 text-yellow-200 text-xs rounded border border-yellow-900 font-bold flex items-center gap-1">
                                        <WarningIcon className="h-3 w-3" /> Due Soon
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-green-900/50 text-green-200 text-xs rounded border border-green-900 font-bold">Active</span>
                                )}
                            </div>
                            <p className="text-gray-400 font-mono text-sm mt-1">ID: {member.registrationNo}</p>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <PhoneIcon className="h-4 w-4 text-primary" />
                                {member.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-primary" />
                                {member.age} Years Old
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-primary" />
                                Joined {formatDate(member.joinDate)}
                            </div>
                        </div>
                    </div>
                    
                    {/* Plan Info Box */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 min-w-[200px] flex flex-col justify-center">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Plan</p>
                        <p className="text-xl font-bold text-white">{member.plan}</p>
                        <p className="text-sm text-primary font-medium mt-1">PKR {member.fee} / cycle</p>
                        <div className="w-full h-px bg-gray-700 my-3"></div>
                        <p className="text-xs text-gray-500">Expires On</p>
                        <p className="text-white font-mono">{formatDate(member.expiryDate)}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface p-6 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs font-bold uppercase">Lifetime Value</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">PKR {totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs font-bold uppercase">Attendance Rate</p>
                    <p className="text-3xl font-bold text-blue-400 mt-1">{attendanceRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">{presentDays} days present</p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs font-bold uppercase">Last Payment</p>
                    {memberPayments.length > 0 ? (
                         <>
                            <p className="text-xl font-bold text-white mt-1">PKR {memberPayments[0].amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{formatDate(memberPayments[0].date)}</p>
                         </>
                    ) : (
                        <p className="text-xl font-bold text-gray-500 mt-1">No Payments</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment History */}
                <div className="bg-surface rounded-lg border border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-800/50 border-b border-gray-700">
                        <h3 className="font-bold text-white">Payment History</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-900 text-gray-400 sticky top-0">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Method</th>
                                    <th className="p-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberPayments.map(p => (
                                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3 text-gray-300">{formatDate(p.date)}</td>
                                        <td className="p-3 text-gray-400">{p.method}</td>
                                        <td className="p-3 text-right text-green-400 font-medium">{p.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {memberPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-gray-500">No payment history available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Attendance Log (Last 14 records) */}
                <div className="bg-surface rounded-lg border border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-800/50 border-b border-gray-700">
                        <h3 className="font-bold text-white">Recent Attendance</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                        {Object.entries(member.attendance)
                            .sort((a,b) => b[0].localeCompare(a[0]))
                            .slice(0, 14)
                            .map(([date, present]) => (
                                <div key={date} className={`flex items-center justify-between p-3 rounded border ${
                                    present ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'
                                }`}>
                                    <span className="text-gray-300 font-mono text-sm">{formatDate(date)}</span>
                                    <div className={`flex items-center gap-2 text-sm font-bold ${present ? 'text-green-400' : 'text-red-400'}`}>
                                        {present ? (
                                            <><CheckCircleIcon className="h-4 w-4" /> Present</>
                                        ) : (
                                            <><span className="w-4 h-4 rounded-full border border-red-400 flex items-center justify-center text-[10px]">✕</span> Absent</>
                                        )}
                                    </div>
                                </div>
                            ))
                        }
                        {Object.keys(member.attendance).length === 0 && (
                            <div className="p-4 text-center text-gray-500">No attendance records found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberProfile;
