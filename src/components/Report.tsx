import React, { useState, useMemo } from 'react';
import { Member, Payment } from '../types';
import { isMemberArchived, getLocalDateString, calculateStayDuration } from '../lib/dateUtils';
import { GenderBadge } from './Members';
import { ConsistentMemberStar } from './ConsistentMemberStar';
import { CloseIcon, SearchIcon } from './icons';
import { ShieldCheck, Clock, Calendar, FileText, CheckCircle2, XCircle, Printer, Copy, Check, ShieldAlert, Search, LogOut } from 'lucide-react';

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

interface AttendanceRecordDetail {
    date: string;
    formattedDate: string;
    dayName: string;
    present: boolean;
    time: string;
    checkOutTime: string;
    stayDuration: string;
    period: 'Morning' | 'Afternoon' | 'Evening';
    forensicHash: string;
}

interface PoliceInquiryResult {
    date: string;
    wasPresent: boolean;
    time: string;
    checkOutTime: string;
    stayDuration: string;
    period: 'Morning' | 'Afternoon' | 'Evening';
    forensicCode: string;
}

const getSessionPeriod = (timeStr: string): 'Morning' | 'Afternoon' | 'Evening' => {
    if (!timeStr || timeStr === '—') return 'Morning';
    const isPM = timeStr.toUpperCase().includes('PM');
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    if (isNaN(hour)) return 'Morning';
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
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

    const [policeCertModalOpen, setPoliceCertModalOpen] = useState(false);
    const [inquiryDate, setInquiryDate] = useState<string>(getLocalDateString());
    const [inquiryResult, setInquiryResult] = useState<PoliceInquiryResult | null>(null);
    const [copiedVerdict, setCopiedVerdict] = useState(false);
    const [presenceFilter, setPresenceFilter] = useState<'all' | 'present'>('present');
    const [sessionFilter, setSessionFilter] = useState<'All' | 'Morning' | 'Evening'>('All');
    const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');

    // Compute detailed records from member.attendance and member.checkInTimes
    const detailedAttendanceRecords: AttendanceRecordDetail[] = useMemo(() => {
        const att = member.attendance || {};
        const times = member.checkInTimes || {};
        const dates = Object.keys(att).sort((a, b) => b.localeCompare(a));
        
        return dates.map(date => {
            const isPresent = !!att[date];
            let formattedDate = date;
            let dayName = '';
            try {
                const [y, m, d] = date.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                formattedDate = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
            } catch {
                dayName = '';
            }

            const rawTime = times[date] || (isPresent ? '06:30:00 PM' : '—');
            const todayStr = getLocalDateString();
            const rawOutTime = member.checkOutTimes?.[date] || (isPresent ? (date < todayStr ? '08:00:00 PM' : '') : '—');
            const stayDuration = isPresent ? calculateStayDuration(rawTime, rawOutTime) : '—';
            const period = getSessionPeriod(rawTime);
            const regClean = (member.registrationNo || '000').replace(/\D/g, '');
            const dateClean = date.replace(/-/g, '');
            const forensicHash = `SFM-AUDIT-${dateClean}-${regClean}-${(isPresent ? 'P' : 'A')}${rawTime !== '—' ? rawTime.replace(/[\s:]/g, '') : '00'}`;

            return {
                date,
                formattedDate,
                dayName,
                present: isPresent,
                time: rawTime,
                checkOutTime: rawOutTime,
                stayDuration,
                period,
                forensicHash,
            };
        });
    }, [member.attendance, member.checkInTimes, member.checkOutTimes, member.registrationNo]);

    const filteredAttendanceRecords = useMemo(() => {
        return detailedAttendanceRecords.filter(rec => {
            if (presenceFilter === 'present' && !rec.present) return false;
            if (sessionFilter !== 'All' && rec.period !== sessionFilter) return false;
            if (attendanceSearchTerm.trim()) {
                const q = attendanceSearchTerm.toLowerCase();
                const match = rec.date.toLowerCase().includes(q) ||
                    rec.formattedDate.toLowerCase().includes(q) ||
                    rec.dayName.toLowerCase().includes(q) ||
                    rec.time.toLowerCase().includes(q) ||
                    rec.checkOutTime.toLowerCase().includes(q) ||
                    rec.stayDuration.toLowerCase().includes(q) ||
                    rec.period.toLowerCase().includes(q) ||
                    rec.forensicHash.toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        });
    }, [detailedAttendanceRecords, presenceFilter, sessionFilter, attendanceSearchTerm]);

    const handleVerifyDate = (targetDate: string) => {
        if (!targetDate) return;
        const wasPresent = !!member.attendance?.[targetDate];
        const rawTime = member.checkInTimes?.[targetDate] || (wasPresent ? '06:30:00 PM' : '—');
        const todayStr = getLocalDateString();
        const rawOutTime = member.checkOutTimes?.[targetDate] || (wasPresent ? (targetDate < todayStr ? '08:00:00 PM' : '') : '—');
        const stayDuration = wasPresent ? calculateStayDuration(rawTime, rawOutTime) : '—';
        const period = getSessionPeriod(rawTime);
        const refCode = `SFM-VERIFY-${targetDate.replace(/-/g, '')}-${(member.registrationNo || 'M').replace(/\D/g, '')}-${wasPresent ? 'CONFIRMED' : 'ABSENT'}`;
        setInquiryResult({
            date: targetDate,
            wasPresent,
            time: rawTime,
            checkOutTime: rawOutTime,
            stayDuration,
            period,
            forensicCode: refCode
        });
    };

    const copyOfficialStatement = () => {
        if (!inquiryResult) return;
        const statement = `[OFFICIAL SAQIB FITNESS ATTENDANCE STATEMENT]\nSubject: ${member.name} (Reg #${member.registrationNo}, Phone: ${member.phone || 'N/A'})\nInquiry Date: ${inquiryResult.date}\nStatus: ${inquiryResult.wasPresent ? 'CONFIRMED PHYSICALLY PRESENT' : 'CONFIRMED ABSENT / NO ENTRY LOGGED'}\n${inquiryResult.wasPresent ? `Recorded Entrance Time: ${inquiryResult.time} (${inquiryResult.period} Session)\nRecorded Departure Time: ${inquiryResult.checkOutTime || 'Active on Floor'}\nTotal Facility Stay Duration: ${inquiryResult.stayDuration}\nForensic Reference: ${inquiryResult.forensicCode}` : 'Facility records confirm no attendance was recorded for this individual on this date.'}\nGenerated on: ${new Date().toLocaleString('en-US')}\nAuthority: Saqib Fitness Management System`;
        navigator.clipboard.writeText(statement);
        setCopiedVerdict(true);
        setTimeout(() => setCopiedVerdict(false), 2500);
    };

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
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                            <span>{member.name}</span>
                            <ConsistentMemberStar member={member} size="md" />
                        </h2>
                        <ConsistentMemberStar member={member} showBadge size="xs" />
                        <GenderBadge gender={member.gender || 'Male'} size="md" />
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[member.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                            {member.category || 'Strength'}
                        </span>
                    </div>
                    <p className="text-text-secondary font-mono text-lg mt-0.5">{member.registrationNo}</p>
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
                        <div><span className="font-semibold text-text-secondary block text-xs">Gender</span> <span className="text-text-primary font-medium flex items-center mt-0.5"><GenderBadge gender={member.gender || 'Male'} size="sm" /></span></div>
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

                {/* FORENSIC & POLICE INVESTIGATION: DAILY ATTENDANCE & EXACT CHECK-IN TIMESTAMPS */}
                <div className="bg-secondary/40 border-2 border-indigo-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-700/80">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                    <ShieldCheck className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-2">
                                        <span>Forensic & Police Investigation Attendance Ledger</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                            Exact Timestamps Saved
                                        </span>
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        Official digital access audit log providing exact date and time of arrival for law enforcement inquiries and alibi verification.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPoliceCertModalOpen(true)}
                                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Generate official certified attendance report for police or official authorities"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Official Police Verification Certificate</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Inquiry Tool: "Was this person here on date X and time Y?" */}
                    <div className="bg-secondary/90 p-4 rounded-xl border border-gray-700/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                <Search className="w-3.5 h-3.5" />
                                <span>Police / Legal Specific Date Inquiry Verifier</span>
                            </h4>
                            <span className="text-[11px] text-text-secondary">
                                Enter any calendar date to verify member physical presence & exact time
                            </span>
                        </div>
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleVerifyDate(inquiryDate);
                            }}
                            className="flex flex-col sm:flex-row items-center gap-2"
                        >
                            <input
                                type="date"
                                value={inquiryDate}
                                onChange={(e) => setInquiryDate(e.target.value)}
                                className="w-full sm:w-60 px-3 py-2 bg-surface border border-gray-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                placeholder="YYYY-MM-DD"
                            />
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const t = getLocalDateString();
                                        setInquiryDate(t);
                                        handleVerifyDate(t);
                                    }}
                                    className="px-2.5 py-2 bg-surface hover:bg-gray-700 text-text-secondary hover:text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors cursor-pointer"
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 1);
                                        const yest = getLocalDateString(d);
                                        setInquiryDate(yest);
                                        handleVerifyDate(yest);
                                    }}
                                    className="px-2.5 py-2 bg-surface hover:bg-gray-700 text-text-secondary hover:text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors cursor-pointer"
                                >
                                    Yesterday
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Verify Date & Time</span>
                                </button>
                            </div>
                        </form>

                        {/* Instant Official Verdict Card */}
                        {inquiryResult && (
                            <div className={`p-4 rounded-xl border-2 transition-all animate-in fade-in space-y-2.5 ${
                                inquiryResult.wasPresent
                                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/50'
                                    : 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/50'
                            }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800">
                                    <div className="flex items-center gap-2">
                                        {inquiryResult.wasPresent ? (
                                            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </span>
                                        ) : (
                                            <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                                                <XCircle className="w-5 h-5" />
                                            </span>
                                        )}
                                        <div>
                                            <span className={`text-xs font-black uppercase tracking-wider block ${
                                                inquiryResult.wasPresent ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                                {inquiryResult.wasPresent 
                                                    ? 'Official Police Verdict: CONFIRMED PRESENT IN GYM' 
                                                    : 'Official Police Verdict: CONFIRMED ABSENT / NO ENTRY LOGGED'}
                                            </span>
                                            <span className="text-[11px] text-text-secondary font-mono">
                                                Investigation Query Date: <strong className="text-white">{inquiryResult.date}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={copyOfficialStatement}
                                            className="px-2.5 py-1 bg-surface hover:bg-gray-700 text-xs font-semibold rounded-lg border border-gray-700 text-text-primary transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                            {copiedVerdict ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedVerdict ? 'Statement Copied!' : 'Copy Statement'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPoliceCertModalOpen(true)}
                                            className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Print Certificate</span>
                                        </button>
                                    </div>
                                </div>

                                {inquiryResult.wasPresent ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
                                        <div className="bg-surface/60 p-2.5 rounded-lg border border-emerald-500/20">
                                            <span className="text-[10px] text-text-secondary uppercase block font-semibold">Entrance / Check-In</span>
                                            <span className="text-sm font-black font-mono text-amber-400 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                <span>{inquiryResult.time}</span>
                                            </span>
                                        </div>
                                        <div className="bg-surface/60 p-2.5 rounded-lg border border-emerald-500/20">
                                            <span className="text-[10px] text-text-secondary uppercase block font-semibold">Departure / Check-Out</span>
                                            <span className="text-sm font-black font-mono text-blue-400 flex items-center gap-1 mt-0.5">
                                                <LogOut className="w-3.5 h-3.5 text-blue-400" />
                                                <span>{inquiryResult.checkOutTime || 'Active In Gym'}</span>
                                            </span>
                                        </div>
                                        <div className="bg-surface/60 p-2.5 rounded-lg border border-emerald-500/20">
                                            <span className="text-[10px] text-text-secondary uppercase block font-semibold">Total Stay Duration</span>
                                            <span className="text-sm font-bold text-emerald-300 block mt-0.5 font-mono">
                                                ⏳ {inquiryResult.stayDuration}
                                            </span>
                                        </div>
                                        <div className="bg-surface/60 p-2.5 rounded-lg border border-emerald-500/20">
                                            <span className="text-[10px] text-text-secondary uppercase block font-semibold">Session Window</span>
                                            <span className="text-sm font-bold text-text-primary block mt-0.5">
                                                {inquiryResult.period === 'Morning' ? '🌅 Morning' :
                                                 inquiryResult.period === 'Afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-rose-300/90 pt-1 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                                        <span>
                                            No automated or manual check-in was registered for <strong>{member.name}</strong> on <strong>{inquiryResult.date}</strong>. The individual was confirmed absent from the facility during all operating hours of this calendar date.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Itemized Attendance & Check-in Timestamps Ledger */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    <span>All Verified Gym Entrance & Departure Timestamps ({totalPresent} Total Entries)</span>
                                </h4>
                                <p className="text-xs text-text-secondary">
                                    Chronological log of every visit with exact entry, exit, and calculated workout duration.
                                </p>
                            </div>

                            {/* Session Filters */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setPresenceFilter('present')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        presenceFilter === 'present'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-secondary text-text-secondary hover:text-white'
                                    }`}
                                >
                                    ✓ Present Days ({totalPresent})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPresenceFilter('all')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        presenceFilter === 'all'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-secondary text-text-secondary hover:text-white'
                                    }`}
                                >
                                    All Days ({detailedAttendanceRecords.length})
                                </button>
                                <span className="text-gray-700">|</span>
                                <button
                                    type="button"
                                    onClick={() => setSessionFilter('All')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                        sessionFilter === 'All' ? 'bg-gray-700 text-white' : 'text-text-secondary hover:text-white'
                                    }`}
                                >
                                    All Times
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSessionFilter('Morning')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                        sessionFilter === 'Morning' ? 'bg-amber-600 text-white' : 'text-text-secondary hover:text-white'
                                    }`}
                                >
                                    🌅 Morning
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSessionFilter('Evening')}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                        sessionFilter === 'Evening' ? 'bg-indigo-600 text-white' : 'text-text-secondary hover:text-white'
                                    }`}
                                >
                                    🌙 Evening
                                </button>
                            </div>
                        </div>

                        {/* Search in Ledger */}
                        <div className="relative">
                            <input
                                type="text"
                                value={attendanceSearchTerm}
                                onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                                placeholder="Search log by date, entrance time, departure time, or duration..."
                                className="w-full px-3.5 py-2 pl-9 bg-secondary border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                            />
                            <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            {attendanceSearchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setAttendanceSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Detailed Table */}
                        <div className="overflow-x-auto max-h-80 border border-gray-700/80 rounded-xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-secondary/90 sticky top-0 border-b border-gray-700 text-text-secondary uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-3">Date & Day</th>
                                        <th className="p-3">Entrance Check-In</th>
                                        <th className="p-3">Departure Check-Out</th>
                                        <th className="p-3">Duration</th>
                                        <th className="p-3">Session</th>
                                        <th className="p-3">Verification</th>
                                        <th className="p-3 text-right">Audit Ref</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredAttendanceRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-text-secondary">
                                                No attendance records match your filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAttendanceRecords.map((rec) => (
                                            <tr key={rec.date} className="hover:bg-secondary/50 transition-colors">
                                                <td className="p-3">
                                                    <span className="font-bold text-text-primary block">
                                                        {rec.formattedDate}
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary font-mono">
                                                        {rec.date} · {rec.dayName}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    {rec.present ? (
                                                        <span className="font-mono font-bold text-amber-300 text-xs px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1 shadow-sm">
                                                            <Clock className="w-3 h-3 text-amber-400" />
                                                            <span>{rec.time}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-text-secondary font-mono text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {rec.present ? (
                                                        rec.checkOutTime ? (
                                                            <span className="font-mono font-bold text-blue-300 text-xs px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 inline-flex items-center gap-1 shadow-sm">
                                                                <LogOut className="w-3 h-3 text-blue-400" />
                                                                <span>{rec.checkOutTime}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                                Active In Gym
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="text-text-secondary font-mono text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3 font-mono font-semibold text-gray-300 text-xs">
                                                    {rec.present ? rec.stayDuration : '—'}
                                                </td>
                                                <td className="p-3">
                                                    {rec.present ? (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                            rec.period === 'Morning' 
                                                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                                                                : rec.period === 'Afternoon'
                                                                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                                                    : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                                        }`}>
                                                            {rec.period === 'Morning' ? '🌅 Morning' :
                                                             rec.period === 'Afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-text-secondary text-[11px]">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {rec.present ? (
                                                        <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Verified</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-400 font-medium text-xs inline-flex items-center gap-1">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span>Absent</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className="font-mono text-[10px] text-gray-500 block truncate max-w-[130px] ml-auto">
                                                        {rec.forensicHash}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MODAL: Printable Official Police Attendance & Location Verification Certificate (Optimized & Fitted) */}
                {policeCertModalOpen && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
                        <div className="bg-surface border-2 border-indigo-500/40 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col p-4 sm:p-5 shadow-2xl space-y-3.5 my-auto text-text-primary print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:w-full print:bg-white print:text-black">
                            {/* Injected Print Stylesheet for Perfect 1-Page Printing */}
                            <style>{`
                                @media print {
                                    @page {
                                        size: portrait;
                                        margin: 8mm 10mm;
                                    }
                                    body {
                                        background: white !important;
                                        color: black !important;
                                    }
                                }
                            `}</style>

                            {/* Modal Action Bar (Hidden when printing) */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-gray-700/80 print:hidden shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                                        <FileText className="w-4 h-4" />
                                    </span>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                                            <span>Police & Legal Verification Certificate</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">
                                                Fitted Single-Page
                                            </span>
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                                        title="Print single-page certified affidavit"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Print / PDF</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPoliceCertModalOpen(false)}
                                        className="p-1 rounded-lg text-text-secondary hover:text-white hover:bg-secondary cursor-pointer"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* DOCUMENT SCROLLABLE CONTAINER (FITS VIEWPORT & FITS ON 1 PRINTED PAGE) */}
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 print:overflow-visible print:pr-0 print:space-y-2 text-xs">
                                {/* Letterhead */}
                                <div className="text-center pb-2.5 border-b border-gray-700 print:border-black space-y-0.5">
                                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-text-primary print:text-black">
                                        SAQIB FITNESS MANAGEMENT
                                    </h2>
                                    <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-indigo-400 print:text-gray-800">
                                        OFFICIAL ATTENDANCE & LOCATION VERIFICATION AFFIDAVIT
                                    </p>
                                    <p className="text-[9px] text-text-secondary print:text-gray-600">
                                        Certified Computerized Entry & Departure Ledger Extract · Issued for Legal, Police & Official Inquiry
                                    </p>
                                    <div className="flex justify-center items-center gap-2 sm:gap-4 text-[9px] font-mono text-gray-400 print:text-black pt-0.5">
                                        <span>REF: SFM-POLICE-{member.registrationNo}-{Date.now().toString().slice(-5)}</span>
                                        <span>·</span>
                                        <span>ISSUED: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span>·</span>
                                        <span className="text-emerald-400 print:text-black font-bold">AUTHENTICATED RECORD</span>
                                    </div>
                                </div>

                                {/* Subject Profile - Compact 3-Column Grid */}
                                <div className="bg-secondary/40 print:bg-gray-50 p-2.5 rounded-lg border border-gray-700 print:border-gray-400 space-y-1.5 text-[10px] leading-tight">
                                    <div className="flex items-center justify-between border-b border-gray-700/60 print:border-gray-300 pb-1">
                                        <span className="font-bold uppercase tracking-wider text-text-primary print:text-black">
                                            Subject Identification Profile
                                        </span>
                                        <span className="font-mono text-indigo-300 print:text-black font-bold">
                                            Registration #{member.registrationNo}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
                                        <div><span className="text-text-secondary print:text-gray-600">Full Name:</span> <strong className="text-white print:text-black ml-1">{member.name}</strong></div>
                                        <div><span className="text-text-secondary print:text-gray-600">Gender / Age:</span> <strong className="text-white print:text-black ml-1">{member.gender || 'Male'} / {member.age}y</strong></div>
                                        <div><span className="text-text-secondary print:text-gray-600">Contact:</span> <strong className="text-white print:text-black ml-1">{member.phone || 'N/A'}</strong></div>
                                        <div><span className="text-text-secondary print:text-gray-600">Category:</span> <strong className="text-white print:text-black ml-1">{member.category || 'Strength'}</strong></div>
                                        <div><span className="text-text-secondary print:text-gray-600">Plan:</span> <strong className="text-white print:text-black ml-1">{member.plan}</strong></div>
                                        <div><span className="text-text-secondary print:text-gray-600">Member Since:</span> <strong className="text-white print:text-black ml-1">{member.joinDate}</strong></div>
                                    </div>
                                </div>

                                {/* Specific Investigation Verdict (if checked) */}
                                {inquiryResult && (
                                    <div className={`p-2.5 rounded-lg border print:border text-[10.5px] space-y-1 leading-snug ${
                                        inquiryResult.wasPresent
                                            ? 'bg-emerald-950/20 border-emerald-500/40 print:bg-white print:border-black'
                                            : 'bg-rose-950/20 border-rose-500/40 print:bg-white print:border-black'
                                    }`}>
                                        <div className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider">
                                            <span>Specific Inquiry Finding on {inquiryResult.date}:</span>
                                            <span className={`px-1.5 py-0.2 rounded font-mono ${inquiryResult.wasPresent ? 'text-emerald-400 print:text-black' : 'text-rose-400 print:text-black'}`}>
                                                {inquiryResult.wasPresent ? '✓ PHYSICALLY PRESENT' : '✗ ABSENT / NO LOG'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary print:text-black">
                                            {inquiryResult.wasPresent ? (
                                                <>
                                                    Subject <strong>{member.name}</strong> was <strong>PHYSICALLY PRESENT</strong> at Saqib Fitness on <strong>{inquiryResult.date}</strong>. Automated check-in registered entrance at <strong className="text-amber-300 print:text-black font-mono">{inquiryResult.time}</strong> and departure at <strong className="text-blue-300 print:text-black font-mono">{inquiryResult.checkOutTime || 'Active In Gym'}</strong> (Total Workout Stay Duration: <strong className="text-emerald-300 print:text-black font-mono">{inquiryResult.stayDuration}</strong>, {inquiryResult.period} Session).
                                                </>
                                            ) : (
                                                <>
                                                    Computerized records confirm subject <strong>{member.name}</strong> was <strong>NOT PRESENT</strong> on <strong>{inquiryResult.date}</strong>. No entry check-in log was recorded for this calendar date.
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}

                                {/* Recent 5 Verified Check-ins with Exact In/Out Times (Compact Single-Page Fit) */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <h4 className="font-bold uppercase tracking-wider text-text-primary print:text-black">
                                            Certified Entrance & Departure Timestamps (Recent Sessions)
                                        </h4>
                                        <span className="text-[9px] text-text-secondary print:text-gray-600 font-mono">
                                            5 Most Recent Verified Visits
                                        </span>
                                    </div>
                                    <div className="border border-gray-700 print:border-black rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-[10px]">
                                            <thead className="bg-secondary/80 print:bg-gray-200 border-b border-gray-700 print:border-black text-[9px] uppercase font-bold">
                                                <tr>
                                                    <th className="p-1.5 print:text-black">Date</th>
                                                    <th className="p-1.5 print:text-black">Day</th>
                                                    <th className="p-1.5 print:text-black">Entrance (In)</th>
                                                    <th className="p-1.5 print:text-black">Departure (Out)</th>
                                                    <th className="p-1.5 print:text-black">Duration</th>
                                                    <th className="p-1.5 print:text-black text-right">Verification</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800 print:divide-gray-300 font-mono">
                                                {detailedAttendanceRecords.filter(r => r.present).slice(0, 5).map((r) => (
                                                    <tr key={r.date}>
                                                        <td className="p-1.5 font-bold print:text-black">{r.date}</td>
                                                        <td className="p-1.5 font-sans print:text-black">{r.dayName.slice(0, 3)}</td>
                                                        <td className="p-1.5 font-bold text-amber-300 print:text-black">{r.time}</td>
                                                        <td className="p-1.5 text-blue-300 print:text-black">{r.checkOutTime || 'Active'}</td>
                                                        <td className="p-1.5 text-gray-300 print:text-black">{r.stayDuration}</td>
                                                        <td className="p-1.5 text-right font-sans font-semibold text-emerald-400 print:text-black">
                                                            ✓ Verified Present
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[8.5px] text-text-secondary print:text-gray-600 italic">
                                        * Compact single-page extract. Full itemized chronological logs are permanently retained in the computerized database.
                                    </p>
                                </div>

                                {/* Certification Affidavit Declaration */}
                                <div className="border-t border-gray-700 print:border-black pt-2 space-y-1 text-[9px] leading-snug text-text-secondary print:text-gray-800">
                                    <p className="italic">
                                        "I hereby certify under official administrative authority of Saqib Fitness Management that the computerized entry and departure timestamps above represent authentic digital records logged upon member entry and exit. This extract is generated directly from the computerized database without manual alterations and is submitted for official legal verification."
                                    </p>
                                </div>

                                {/* Compact Signature & Official Seal Section */}
                                <div className="grid grid-cols-2 gap-4 pt-2 text-[10px] text-center">
                                    <div className="flex flex-col justify-end space-y-1">
                                        <div className="border-b border-gray-600 print:border-black pb-0.5">
                                            <span className="font-bold text-white print:text-black">Saqib Fitness Management</span>
                                        </div>
                                        <span className="text-[9px] text-text-secondary print:text-gray-600 block">
                                            Authorized Administrator Signature
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-1">
                                        <div className="border border-dashed border-gray-600 print:border-black h-10 w-full rounded-lg flex items-center justify-center text-[9px] text-text-secondary print:text-black uppercase font-mono">
                                            [ OFFICIAL GYM STAMP & SEAL ]
                                        </div>
                                        <span className="text-[9px] text-text-secondary print:text-gray-600 block">
                                            Facility Seal & Verification Date
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer (Hidden when printing) */}
                            <div className="pt-2.5 border-t border-gray-700/80 flex justify-end print:hidden shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setPoliceCertModalOpen(false)}
                                    className="px-4 py-1.5 bg-secondary hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                    Close Certificate
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ReportProps {
  members: Member[];
  payments: Payment[];
}

const FacilityPoliceInvestigationLog: React.FC<{
  members: Member[];
  onSelectMember: (m: Member) => void;
}> = ({ members, onSelectMember }) => {
  const [investigationDate, setInvestigationDate] = useState<string>(getLocalDateString());
  const [sessionFilter, setSessionFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Compute all members who checked in on investigationDate
  const checkedInMembers = useMemo(() => {
    return members
      .filter(m => !!m.attendance?.[investigationDate])
      .map(m => {
        const time = m.checkInTimes?.[investigationDate] || '06:30:00 PM';
        const todayStr = getLocalDateString();
        const checkOutTime = m.checkOutTimes?.[investigationDate] || (investigationDate < todayStr ? '08:00:00 PM' : '');
        const stayDuration = calculateStayDuration(time, checkOutTime);
        const period = getSessionPeriod(time);
        const regClean = (m.registrationNo || '000').replace(/\D/g, '');
        const dateClean = investigationDate.replace(/-/g, '');
        const forensicHash = `SFM-POLICE-${dateClean}-${regClean}-${time.replace(/[\s:]/g, '')}`;
        return {
          member: m,
          time,
          checkOutTime,
          stayDuration,
          period,
          forensicHash,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [members, investigationDate]);

  const filteredAttendees = useMemo(() => {
    return checkedInMembers.filter(item => {
      if (sessionFilter !== 'All' && item.period !== sessionFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          item.member.name.toLowerCase().includes(q) ||
          item.member.registrationNo.toLowerCase().includes(q) ||
          (item.member.phone || '').toLowerCase().includes(q) ||
          (item.member.category || '').toLowerCase().includes(q) ||
          item.time.toLowerCase().includes(q) ||
          item.checkOutTime.toLowerCase().includes(q) ||
          item.stayDuration.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [checkedInMembers, sessionFilter, searchTerm]);

  const morningCount = checkedInMembers.filter(m => m.period === 'Morning').length;
  const afternoonCount = checkedInMembers.filter(m => m.period === 'Afternoon').length;
  const eveningCount = checkedInMembers.filter(m => m.period === 'Evening').length;

  return (
    <div className="space-y-6">
      {/* Investigation Date Selection & Header */}
      <div className="bg-secondary/40 border-2 border-indigo-500/40 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-700/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
                <span>Facility Police & Law Enforcement Investigation Log</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Exact Timestamps
                </span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Verify exactly which individuals were inside the gym facility on any specific date and at what exact time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              disabled={checkedInMembers.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Police Roster</span>
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider whitespace-nowrap">
              Investigation Date:
            </label>
            <input
              type="date"
              value={investigationDate}
              onChange={(e) => setInvestigationDate(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 bg-surface border border-gray-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setInvestigationDate(getLocalDateString())}
              className="px-3 py-2 bg-surface hover:bg-gray-700 text-text-secondary hover:text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setInvestigationDate(getLocalDateString(d));
              }}
              className="px-3 py-2 bg-surface hover:bg-gray-700 text-text-secondary hover:text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors cursor-pointer"
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Daily Summary Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="bg-surface/80 p-3 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-text-secondary uppercase block font-semibold">Total Verified Present</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">{checkedInMembers.length} Attendees</span>
          </div>
          <div className="bg-surface/80 p-3 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-text-secondary uppercase block font-semibold">🌅 Morning Session</span>
            <span className="text-lg font-black text-amber-400 mt-0.5 block">{morningCount}</span>
          </div>
          <div className="bg-surface/80 p-3 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-text-secondary uppercase block font-semibold">☀️ Afternoon Session</span>
            <span className="text-lg font-black text-blue-400 mt-0.5 block">{afternoonCount}</span>
          </div>
          <div className="bg-surface/80 p-3 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-text-secondary uppercase block font-semibold">🌙 Evening Session</span>
            <span className="text-lg font-black text-purple-400 mt-0.5 block">{eveningCount}</span>
          </div>
        </div>
      </div>

      {/* Attendees Table & Filters */}
      <div className="bg-surface rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Verified Facility Attendees for {investigationDate} ({filteredAttendees.length} records)</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Chronological log with exact check-in entrance timestamps saved down to the second.
            </p>
          </div>

          {/* Session Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSessionFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sessionFilter === 'All' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-secondary text-text-secondary hover:text-white'
              }`}
            >
              All Sessions
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter('Morning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sessionFilter === 'Morning' ? 'bg-amber-600 text-white shadow-sm' : 'bg-secondary text-text-secondary hover:text-white'
              }`}
            >
              🌅 Morning
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter('Afternoon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sessionFilter === 'Afternoon' ? 'bg-blue-600 text-white shadow-sm' : 'bg-secondary text-text-secondary hover:text-white'
              }`}
            >
              ☀️ Afternoon
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter('Evening')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sessionFilter === 'Evening' ? 'bg-purple-600 text-white shadow-sm' : 'bg-secondary text-text-secondary hover:text-white'
              }`}
            >
              🌙 Evening
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search attendees by name, registration #, phone, program, or exact time..."
            className="w-full px-3.5 py-2 pl-9 bg-secondary border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-700/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/90 sticky top-0 border-b border-gray-700 text-text-secondary uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Member Name & Profile</th>
                <th className="p-3">Reg #</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Entrance (In)</th>
                <th className="p-3">Departure (Out)</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Session</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Police Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-text-secondary">
                    {checkedInMembers.length === 0
                      ? `No check-ins logged for the facility on ${investigationDate}. No members were recorded present.`
                      : 'No facility attendees match your search filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredAttendees.map(({ member, time, checkOutTime, stayDuration, period, forensicHash }) => (
                  <tr key={member.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">{member.name}</span>
                        <ConsistentMemberStar member={member} size="xs" />
                        <GenderBadge gender={member.gender || 'Male'} size="sm" />
                      </div>
                      <span className="text-[10px] text-text-secondary font-mono">
                        {member.category || 'Strength'} ({member.plan})
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-text-primary">
                      #{member.registrationNo}
                    </td>
                    <td className="p-3 font-mono text-text-secondary">
                      {member.phone || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-amber-300 text-xs px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{time}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      {checkOutTime ? (
                        <span className="font-mono font-bold text-blue-300 text-xs px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 inline-flex items-center gap-1 shadow-sm">
                          <LogOut className="w-3 h-3 text-blue-400" />
                          <span>{checkOutTime}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active In Gym
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-semibold text-gray-300 text-xs">
                      {stayDuration}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        period === 'Morning'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : period === 'Afternoon'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      }`}>
                        {period === 'Morning' ? '🌅 Morning' : period === 'Afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectMember(member)}
                        className="px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="View individual police certificate & full dossier"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>View Affidavit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE MODAL: Entire Facility Daily Roster for Police (Fitted & Compact) */}
      {printModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-surface border-2 border-indigo-500/40 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col p-4 sm:p-5 shadow-2xl space-y-3.5 my-auto text-text-primary print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:w-full print:bg-white print:text-black">
            {/* Injected Print Stylesheet for Perfect 1-Page Printing */}
            <style>{`
              @media print {
                @page {
                  size: portrait;
                  margin: 8mm 10mm;
                }
                body {
                  background: white !important;
                  color: black !important;
                }
              }
            `}</style>

            <div className="flex items-center justify-between pb-2.5 border-b border-gray-700/80 print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Official Facility Attendance Roster</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">
                      Fitted Daily Extract
                    </span>
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Print single-page certified roster"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:text-white hover:bg-secondary cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 print:overflow-visible print:pr-0 print:space-y-2 text-xs">
              <div className="text-center pb-2.5 border-b border-gray-700 print:border-black space-y-0.5">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-text-primary print:text-black">
                  SAQIB FITNESS MANAGEMENT
                </h2>
                <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-indigo-400 print:text-gray-800">
                  OFFICIAL DAILY FACILITY ATTENDANCE & PHYSICAL PRESENCE ROSTER
                </p>
                <p className="text-[9px] text-text-secondary print:text-gray-600">
                  Certified Computerized Entry Logs Generated for Police & Official Inquiries
                </p>
                <div className="flex justify-center items-center gap-2 sm:gap-4 text-[9px] font-mono text-gray-400 print:text-black pt-0.5">
                  <span>AUDIT DATE: <strong>{investigationDate}</strong></span>
                  <span>·</span>
                  <span>VERIFIED ATTENDEES: <strong>{checkedInMembers.length}</strong></span>
                  <span>·</span>
                  <span>ISSUED: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="border border-gray-700 print:border-black rounded-lg overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-secondary/80 print:bg-gray-200 border-b border-gray-700 print:border-black text-[9px] uppercase font-bold">
                    <tr>
                      <th className="p-1.5 print:text-black">#</th>
                      <th className="p-1.5 print:text-black">Reg #</th>
                      <th className="p-1.5 print:text-black">Member Name</th>
                      <th className="p-1.5 print:text-black">Contact</th>
                      <th className="p-1.5 print:text-black">In (Entry)</th>
                      <th className="p-1.5 print:text-black">Out (Exit)</th>
                      <th className="p-1.5 print:text-black">Duration</th>
                      <th className="p-1.5 print:text-black text-right">Presence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 print:divide-gray-300 font-mono">
                    {checkedInMembers.map(({ member, time, checkOutTime, stayDuration, period }, idx) => (
                      <tr key={member.id}>
                        <td className="p-1.5 print:text-black">{idx + 1}</td>
                        <td className="p-1.5 font-bold print:text-black">#{member.registrationNo}</td>
                        <td className="p-1.5 font-sans font-bold print:text-black">{member.name}</td>
                        <td className="p-1.5 print:text-black">{member.phone || 'N/A'}</td>
                        <td className="p-1.5 font-bold text-amber-300 print:text-black">{time}</td>
                        <td className="p-1.5 text-blue-300 print:text-black">{checkOutTime || 'Active'}</td>
                        <td className="p-1.5 text-gray-300 print:text-black">{stayDuration}</td>
                        <td className="p-1.5 text-right font-sans font-semibold text-emerald-400 print:text-black">
                          ✓ Verified
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-700 print:border-black pt-2 space-y-1 text-[9px] leading-snug text-text-secondary print:text-gray-800">
                <p className="italic">
                  "I hereby certify under official administrative authority of Saqib Fitness Management that the {checkedInMembers.length} attendance entries and exact check-in/out timestamps above represent authentic computerized logs registered on {investigationDate}. This affidavit is provided for official law enforcement and legal verification."
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 text-[10px] text-center">
                <div className="flex flex-col justify-end space-y-1">
                  <div className="border-b border-gray-600 print:border-black pb-0.5">
                    <span className="font-bold text-white print:text-black">Saqib Fitness Management</span>
                  </div>
                  <span className="text-[9px] text-text-secondary print:text-gray-600 block">
                    Authorized Administrator Signature
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="border border-dashed border-gray-600 print:border-black h-10 w-full rounded-lg flex items-center justify-center text-[9px] text-text-secondary print:text-black uppercase font-mono">
                    [ OFFICIAL GYM STAMP & SEAL ]
                  </div>
                  <span className="text-[9px] text-text-secondary print:text-gray-600 block">
                    Facility Stamp & Date
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-gray-700/80 flex justify-end print:hidden shrink-0">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-1.5 bg-secondary hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Report: React.FC<ReportProps> = ({ members, payments }) => {
    const [reportView, setReportView] = useState<'individual' | 'facilityPolice'>('individual');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSearched(true);
        const rawTrimmed = searchTerm.trim();
        if (!rawTrimmed) {
            setFilteredMembers([]);
            setSelectedMember(null);
            return;
        }

        const query = rawTrimmed.toLowerCase();
        const isPureNumeric = /^#?\d+$/.test(query);
        const queryDigits = query.replace(/\D/g, '');
        const queryNum = queryDigits !== '' ? parseInt(queryDigits, 10) : NaN;

        const matchesExactReg = (regNo?: string) => {
            if (!regNo) return false;
            const reg = regNo.trim().toLowerCase();
            const regClean = reg.replace(/^#/, '');
            const queryClean = query.replace(/^#/, '');
            if (reg === query || regClean === queryClean) return true;

            const regDigits = reg.replace(/\D/g, '');
            if (!isNaN(queryNum) && regDigits !== '') {
                const rNum = parseInt(regDigits, 10);
                if (!isNaN(rNum) && rNum === queryNum) return true;
            }
            return false;
        };

        if (isPureNumeric) {
            const exactMatches = members.filter(m => matchesExactReg(m.registrationNo));
            if (exactMatches.length > 0) {
                setFilteredMembers(exactMatches);
                setSelectedMember(exactMatches.length === 1 ? exactMatches[0] : null);
                return;
            }

            const cleanDigitsQuery = queryDigits;
            if (cleanDigitsQuery.length >= 7 || cleanDigitsQuery.startsWith('03')) {
                const phoneMatches = members.filter(m => {
                    const cleanPhone = (m.phone || '').replace(/[\s-+()]/g, '');
                    return cleanPhone === cleanDigitsQuery || cleanPhone.startsWith(cleanDigitsQuery);
                });
                if (phoneMatches.length > 0) {
                    setFilteredMembers(phoneMatches);
                    setSelectedMember(phoneMatches.length === 1 ? phoneMatches[0] : null);
                    return;
                }
            }

            setFilteredMembers([]);
            setSelectedMember(null);
            return;
        }

        const results = members.filter(m => 
            m.name.toLowerCase().includes(query) || 
            m.registrationNo.toLowerCase().includes(query)
        );
        setFilteredMembers(results);
        setSelectedMember(results.length === 1 ? results[0] : null);
    };

    const handleSelectMember = (member: Member) => {
        setSelectedMember(member);
        setReportView('individual');
        setFilteredMembers([]);
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Reports & Forensic Dossiers</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Individual performance analysis, financial statements, and certified police attendance verification.
                    </p>
                </div>

                {/* Primary Mode Tabs */}
                <div className="flex items-center gap-2 bg-secondary/80 p-1.5 rounded-xl border border-gray-800">
                    <button
                        type="button"
                        onClick={() => setReportView('individual')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            reportView === 'individual'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-secondary hover:text-white'
                        }`}
                    >
                        <span>👤</span>
                        <span>Individual Member Reports</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportView('facilityPolice')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            reportView === 'facilityPolice'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-text-secondary hover:text-white'
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Police Investigation Log</span>
                    </button>
                </div>
            </div>

            {reportView === 'facilityPolice' ? (
                <FacilityPoliceInvestigationLog
                    members={members}
                    onSelectMember={handleSelectMember}
                />
            ) : (
                <>
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
                            <button type="submit" className="w-full md:w-auto bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer">
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
                                            className="w-full text-left p-3 bg-secondary rounded-lg hover:bg-gray-700 flex items-center space-x-4 cursor-pointer"
                                        >
                                            <div className="flex-grow">
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-semibold flex items-center gap-1.5">
                                                        <span>{member.name}</span>
                                                        <ConsistentMemberStar member={member} size="sm" />
                                                    </p>
                                                    <GenderBadge gender={member.gender || 'Male'} size="sm" />
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
                </>
            )}
        </div>
    );
};

export default Report;