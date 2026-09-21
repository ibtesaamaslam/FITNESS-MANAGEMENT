

import React, { useState, useMemo } from 'react';
import { Member, Role, Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLocalDateString, isMemberArchived } from '../lib/dateUtils';
import { getMemberFeeDetails } from '../lib/feeUtils';
import { GenderBadge } from './Members';
import { CloseIcon, LockIcon } from './icons';
import { MaskedAmount } from './MaskedAmount';
import { Pencil } from 'lucide-react';

interface AttendanceProps {
  members: Member[];
  role: Role;
  onUpdateAttendance: (memberId: string, date: string, present: boolean) => void;
  onWarning?: (message: string) => void;
  onUpdateMember?: (updatedMember: Member, paymentMethod?: Payment['method']) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

const isExpiringSoon = (expiryDate: string, days: number = 7): boolean => {
    const todayStr = getLocalDateString();
    const today = new Date(todayStr);
    const expiry = new Date(expiryDate);
    const threshold = new Date(todayStr);
    threshold.setDate(today.getDate() + days);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    threshold.setHours(0, 0, 0, 0);

    return expiry <= threshold && expiry >= today;
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const Attendance: React.FC<AttendanceProps> = ({ 
  members, 
  role, 
  onUpdateAttendance, 
  onWarning, 
  onUpdateMember,
  isUnlocked = false,
  onUnlockRequest
}) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [lastWarnedMemberId, setLastWarnedMemberId] = useState<string | null>(null);
  const [selectedMemberForDues, setSelectedMemberForDues] = useState<Member | null>(null);
  
  const todayStr = getLocalDateString();
  const isFutureDate = selectedDate > todayStr;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const nonArchivedMembers = useMemo(() => {
    return members.filter(member => !isMemberArchived(member));
  }, [members]);

  const attendanceForDate = useMemo(() => {
    return nonArchivedMembers.map(member => ({
      ...member,
      gender: member.gender || 'Male',
      present: member.attendance[selectedDate] || false,
    }));
  }, [nonArchivedMembers, selectedDate]);

  // Calculations for overall gender stats on selected date
  const maleAttendance = useMemo(() => attendanceForDate.filter(m => m.gender === 'Male'), [attendanceForDate]);
  const femaleAttendance = useMemo(() => attendanceForDate.filter(m => m.gender === 'Female'), [attendanceForDate]);

  const malePresentCount = maleAttendance.filter(m => m.present).length;
  const maleAbsentCount = maleAttendance.length - malePresentCount;

  const femalePresentCount = femaleAttendance.filter(m => m.present).length;
  const femaleAbsentCount = femaleAttendance.length - femalePresentCount;

  const filteredMembers = useMemo(() => {
    const rawTrimmed = searchTerm.trim();
    if (!rawTrimmed) {
      return attendanceForDate.filter(member => {
        return genderFilter === 'All' || member.gender === genderFilter;
      });
    }

    const query = rawTrimmed.toLowerCase();
    const isPureNumeric = /^#?\d+$/.test(query);
    const queryDigits = query.replace(/\D/g, '');
    const queryNum = queryDigits !== '' ? parseInt(queryDigits, 10) : NaN;

    const meetsGender = (member: { gender?: string }) => {
      return genderFilter === 'All' || member.gender === genderFilter;
    };

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
      const exactMatches = attendanceForDate.filter(m => matchesExactReg(m.registrationNo));
      if (exactMatches.length > 0) {
        return exactMatches.filter(meetsGender);
      }

      if (queryDigits.length >= 10) {
        const phoneMatches = attendanceForDate.filter(m => {
          const cleanPhone = (m.phone || '').replace(/\D/g, '');
          return cleanPhone === queryDigits;
        });
        return phoneMatches.filter(meetsGender);
      }

      return [];
    }

    return attendanceForDate.filter(member => {
      if (!meetsGender(member)) return false;
      return (
        member.name.toLowerCase().includes(query) ||
        member.registrationNo.toLowerCase().includes(query)
      );
    });
  }, [attendanceForDate, genderFilter, searchTerm]);

  // Check for expired members in search results to show warning
  React.useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length >= 1) {
      const expiredMatch = filteredMembers.find(m => {
        const lowerName = m.name.toLowerCase();
        const lowerReg = m.registrationNo.toLowerCase();

        // 1. Numeric RegNo Match (e.g., "1", "01", "001" all match "SF-001")
        const termNum = term.replace(/\D/g, '');
        const regNum = lowerReg.replace(/\D/g, '');
        const isNumericMatch = termNum !== '' && regNum !== '' && parseInt(termNum) === parseInt(regNum);

        // 2. Exact RegNo Match
        const isExactRegMatch = lowerReg === term;

        // 3. Significant Name Match (Exact match or full word match)
        const isSignificantNameMatch = lowerName === term || lowerName.split(' ').some(word => word === term);

        const isMatch = isNumericMatch || isExactRegMatch || isSignificantNameMatch;
        const isExpired = new Date(m.expiryDate) < new Date();
        
        return isMatch && isExpired;
      });

      if (expiredMatch && expiredMatch.id !== lastWarnedMemberId) {
         onWarning?.(`WARNING: Member ${expiredMatch.name} (${expiredMatch.registrationNo}) has an EXPIRED membership!`);
         setLastWarnedMemberId(expiredMatch.id);
      }
    } else {
      setLastWarnedMemberId(null);
    }
  }, [searchTerm, filteredMembers, onWarning, lastWarnedMemberId]);
  
  const totalPresent = filteredMembers.filter(m => m.present).length;
  const totalAbsent = filteredMembers.length - totalPresent;

  const handleMarkAllFiltered = (presentState: boolean) => {
    filteredMembers.forEach(member => {
      if (member.present !== presentState) {
        onUpdateAttendance(member.id, selectedDate, presentState);
      }
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Attendance Register</h1>
          <p className="text-sm text-text-secondary mt-1">Track daily check-ins with Male & Female segregated metrics</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-surface border border-gray-800 px-4 py-2 rounded-xl shadow">
          <label htmlFor="attendance-date" className="text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
            Selected Date:
          </label>
          <input 
            type="date"
            id="attendance-date"
            value={selectedDate}
            onChange={handleDateChange}
            max={getLocalDateString()}
            className="bg-transparent text-sm font-bold text-text-primary outline-none cursor-pointer"
          />
        </div>
      </div>
      
      {/* Gender Segregated Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Attendance Stat Card */}
        <div 
          onClick={() => setGenderFilter('All')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            genderFilter === 'All'
              ? 'bg-teal-500/15 border-teal-500/50 shadow-md ring-2 ring-teal-500/30'
              : 'bg-surface border-gray-800 hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Overall Attendance</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-text-secondary font-mono">
              {attendanceForDate.length} Total
            </span>
          </div>
          <div className="flex items-baseline space-x-3 mt-2">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {attendanceForDate.filter(m => m.present).length} <span className="text-xs font-semibold text-emerald-300">Present</span>
            </div>
            <span className="text-gray-600">/</span>
            <div className="text-xl font-bold text-red-400 font-mono">
              {attendanceForDate.filter(m => !m.present).length} <span className="text-xs font-semibold text-red-300">Absent</span>
            </div>
          </div>
        </div>

        {/* Male Attendance Stat Card */}
        <div 
          onClick={() => setGenderFilter('Male')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            genderFilter === 'Male'
              ? 'bg-blue-500/20 border-blue-500 shadow-md ring-2 ring-blue-500/40'
              : 'bg-surface border-gray-800 hover:border-blue-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>♂</span> Male Shift / Attendance
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              {maleAttendance.length} Total
            </span>
          </div>
          <div className="flex items-baseline space-x-3 mt-2">
            <div className="text-2xl font-black text-blue-400 font-mono">
              {malePresentCount} <span className="text-xs font-semibold text-blue-300">Present</span>
            </div>
            <span className="text-gray-600">/</span>
            <div className="text-xl font-bold text-red-400/80 font-mono">
              {maleAbsentCount} <span className="text-xs font-semibold text-red-300/80">Absent</span>
            </div>
          </div>
        </div>

        {/* Female Attendance Stat Card */}
        <div 
          onClick={() => setGenderFilter('Female')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            genderFilter === 'Female'
              ? 'bg-pink-500/20 border-pink-500 shadow-md ring-2 ring-pink-500/40'
              : 'bg-surface border-gray-800 hover:border-pink-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
              <span>♀</span> Female Shift / Attendance
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
              {femaleAttendance.length} Total
            </span>
          </div>
          <div className="flex items-baseline space-x-3 mt-2">
            <div className="text-2xl font-black text-pink-400 font-mono">
              {femalePresentCount} <span className="text-xs font-semibold text-pink-300">Present</span>
            </div>
            <span className="text-gray-600">/</span>
            <div className="text-xl font-bold text-red-400/80 font-mono">
              {femaleAbsentCount} <span className="text-xs font-semibold text-red-300/80">Absent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Gender Tabs & Quick Batch Actions */}
      <div className="bg-surface border border-gray-800 rounded-2xl p-3.5 shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Search & Gender Tabs */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <input
              type="text"
              placeholder="Search member by name or Reg No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-secondary border border-gray-700/80 rounded-xl text-sm font-medium text-text-primary placeholder-gray-500 outline-none focus:border-emerald-500 transition-all"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-gray-700/80 shrink-0">
            <button
              onClick={() => setGenderFilter('All')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                genderFilter === 'All'
                  ? 'bg-primary text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All ({attendanceForDate.length})
            </button>
            <button
              onClick={() => setGenderFilter('Male')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                genderFilter === 'Male'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-text-secondary hover:text-blue-400'
              }`}
            >
              <span>♂</span> Male ({maleAttendance.length})
            </button>
            <button
              onClick={() => setGenderFilter('Female')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                genderFilter === 'Female'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-text-secondary hover:text-pink-400'
              }`}
            >
              <span>♀</span> Female ({femaleAttendance.length})
            </button>
          </div>
        </div>

        {/* Batch Actions & Summary */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!isFutureDate && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleMarkAllFiltered(true)}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title={`Mark all ${genderFilter === 'All' ? '' : genderFilter} visible members as present`}
              >
                ✓ Mark All Present
              </button>
              <button
                onClick={() => handleMarkAllFiltered(false)}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title={`Mark all ${genderFilter === 'All' ? '' : genderFilter} visible members as absent`}
              >
                ✕ Clear All
              </button>
            </div>
          )}

          {/* Fee & Dues Payment Status */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/80 border border-gray-700/80 rounded-xl">
              <span className="text-xs text-text-secondary uppercase font-semibold">Fees:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {filteredMembers.filter(m => getMemberFeeDetails(m).isFullyPaid).length}/{filteredMembers.length} Paid
              </span>
            </div>

            {(() => {
              const totalDues = filteredMembers.reduce((acc, m) => acc + getMemberFeeDetails(m).dueAmount, 0);
              const membersWithDues = filteredMembers.filter(m => getMemberFeeDetails(m).dueAmount > 0).length;
              if (totalDues <= 0) return null;
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl" title={`${membersWithDues} members have pending balance`}>
                  <span className="text-xs text-amber-300 uppercase font-semibold">Total Dues:</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    Rs {totalDues.toLocaleString()}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* Attendance Register Table */}
      <div className="bg-surface rounded-xl shadow-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary text-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Member Info</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Fee Status</th>
                <th className="p-4">Balance / Dues</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {isFutureDate ? (
                <tr>
                    <td colSpan={6} className="text-center p-8 text-text-secondary">Cannot mark attendance for a future date.</td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                    <td colSpan={6} className="text-center p-8 text-text-secondary italic">No members found matching the selected filters.</td>
                </tr>
              ) : filteredMembers.map(member => {
                const todayStr = getLocalDateString();
                const isExpired = new Date(member.expiryDate) < new Date(todayStr);
                const feeDetails = getMemberFeeDetails(member);
                return (
                <tr key={member.id} className={`border-b border-secondary hover:bg-gray-700/50 transition-colors ${isExpired ? 'bg-red-900/30 border-l-4 border-l-red-500' : ''}`}>
                  <td className="p-4 font-medium">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-semibold ${isExpired ? 'text-red-400 font-bold' : 'text-text-primary'}`}>{member.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[member.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                                {member.category || 'Strength'}
                            </span>
                            {isExpiringSoon(member.expiryDate, 1) && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isExpired ? 'bg-red-500 text-white' : 'bg-yellow-500/20 text-yellow-400'}`} title="Membership is expiring soon!">
                                    {isExpired ? 'Expired' : 'Expiring'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-secondary font-mono">{member.registrationNo}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <GenderBadge gender={member.gender || 'Male'} size="sm" />
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      feeDetails.isFullyPaid 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : feeDetails.isPartial 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {feeDetails.isFullyPaid ? 'Paid' : feeDetails.isPartial ? 'Partial' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="p-4">
                    {feeDetails.dueAmount === 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Rs 0</span>
                        </span>
                        {onUpdateMember && (
                          <button
                            onClick={() => setSelectedMemberForDues(member)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800/80 transition-all cursor-pointer"
                            title="Adjust fee or payment details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div 
                          onClick={() => onUpdateMember && setSelectedMemberForDues(member)}
                          className={`cursor-pointer inline-flex flex-col items-start px-2.5 py-1 rounded-xl text-xs font-mono border transition-all hover:scale-[1.02] ${
                            feeDetails.isPartial 
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-sm' 
                              : 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40 shadow-sm'
                          }`}
                          title="Click to update payment or clear balance"
                        >
                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-[11px] font-sans text-text-secondary uppercase">Due:</span>
                            <span className="text-sm font-black text-white font-mono">
                              Rs {feeDetails.dueAmount.toLocaleString()}
                            </span>
                          </div>
                          {feeDetails.isPartial && (
                            <span className="text-[10px] text-amber-400/90 font-sans flex items-center gap-1 font-mono">
                              Paid: Rs {feeDetails.paidAmount.toLocaleString()} / Rs {feeDetails.fee.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {onUpdateMember && (
                          <button
                            onClick={() => setSelectedMemberForDues(member)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                            title="Collect dues or record payment"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${member.present ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {member.present ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={member.present} 
                        onChange={(e) => onUpdateAttendance(member.id, selectedDate, e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-hover/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Dues Settlement Modal */}
      {selectedMemberForDues && onUpdateMember && (
        <QuickDuesModal
          member={selectedMemberForDues}
          onClose={() => setSelectedMemberForDues(null)}
          onSave={(updatedMember, paymentMethod) => {
            onUpdateMember(updatedMember, paymentMethod);
            setSelectedMemberForDues(null);
          }}
        />
      )}
    </div>
  );
};

interface QuickDuesModalProps {
  member: Member;
  onClose: () => void;
  onSave: (updatedMember: Member, paymentMethod: Payment['method']) => void;
}

const QuickDuesModal: React.FC<QuickDuesModalProps> = ({ member, onClose, onSave }) => {
  const feeDetails = getMemberFeeDetails(member);
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial' | 'unpaid'>(
    feeDetails.isFullyPaid ? 'full' : feeDetails.isPartial ? 'partial' : 'partial'
  );
  const [paidAmountInput, setPaidAmountInput] = useState<string>(
    feeDetails.isFullyPaid 
      ? String(feeDetails.fee) 
      : feeDetails.isPartial 
        ? String(feeDetails.paidAmount) 
        : String(Math.round(feeDetails.fee / 2))
  );
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Cash');

  const parsedPaid = paymentMode === 'full' 
    ? feeDetails.fee 
    : paymentMode === 'unpaid' 
      ? 0 
      : Math.min(feeDetails.fee, Math.max(0, parseFloat(paidAmountInput) || 0));

  const remainingDue = Math.max(0, feeDetails.fee - parsedPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isFull = parsedPaid >= feeDetails.fee && feeDetails.fee > 0;
    const updatedMember: Member = {
      ...member,
      feePaid: isFull,
      paidAmount: parsedPaid,
      pendingDue: remainingDue,
    };
    onSave(updatedMember, paymentMethod);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-700/80 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-secondary transition-colors"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span>{member.name}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-text-secondary">
                #{member.registrationNo}
              </span>
            </h3>
            <p className="text-xs text-text-secondary font-medium mt-1">
              Plan Fee: <strong className="text-white font-mono">Rs {feeDetails.fee.toLocaleString()}</strong> ({member.plan})
            </p>
          </div>
        </div>

        {/* Current State Summary */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-secondary/70 rounded-xl border border-gray-800 mb-5 text-center">
          <div>
            <span className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold block">Amount Paid</span>
            <span className="text-lg font-mono font-bold text-emerald-400">Rs {parsedPaid.toLocaleString()}</span>
          </div>
          <div className="border-l border-gray-700 pl-3">
            <span className="text-[11px] text-text-secondary uppercase tracking-wider font-semibold block">Remaining Balance</span>
            <span className={`text-lg font-mono font-bold ${remainingDue === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Rs {remainingDue.toLocaleString()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Payment Mode Buttons */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Payment Option
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('full');
                  setPaidAmountInput(String(feeDetails.fee));
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  paymentMode === 'full'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-secondary text-text-secondary border-gray-700 hover:text-white'
                }`}
              >
                ✓ Full (Rs 0 Due)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('partial')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  paymentMode === 'partial'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-secondary text-text-secondary border-gray-700 hover:text-white'
                }`}
              >
                ⏳ Partial Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('unpaid');
                  setPaidAmountInput('0');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  paymentMode === 'unpaid'
                    ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-500/30'
                    : 'bg-secondary text-text-secondary border-gray-700 hover:text-white'
                }`}
              >
                ✕ Unpaid
              </button>
            </div>
          </div>

          {/* Amount Paid Input (When Partial) */}
          {paymentMode === 'partial' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                Amount Received So Far (PKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={feeDetails.fee}
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-secondary border border-gray-700 rounded-lg text-white font-mono font-bold text-base focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. 1000"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">
                  Rs
                </span>
              </div>
              <p className="text-xs text-text-secondary flex justify-between">
                <span>Total Fee: Rs {feeDetails.fee.toLocaleString()}</span>
                <span className="text-amber-400 font-semibold font-mono">
                  Pending Due: Rs {remainingDue.toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {/* Payment Method */}
          {parsedPaid > 0 && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as Payment['method'])}
                className="w-full p-2.5 bg-secondary border border-gray-700 rounded-xl text-sm font-medium text-text-primary focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="Jazz Cash">Jazz Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Save & Update Dues</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Attendance;