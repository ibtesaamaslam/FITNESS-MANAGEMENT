

import React, { useState, useMemo } from 'react';
import { Member, Role } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLocalDateString, isMemberArchived } from '../lib/dateUtils';
import { GenderBadge } from './Members';

interface AttendanceProps {
  members: Member[];
  role: Role;
  onUpdateAttendance: (memberId: string, date: string, present: boolean) => void;
  onWarning?: (message: string) => void;
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

const Attendance: React.FC<AttendanceProps> = ({ members, role, onUpdateAttendance, onWarning }) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [lastWarnedMemberId, setLastWarnedMemberId] = useState<string | null>(null);
  
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
    return attendanceForDate
      .filter(member => {
        if (genderFilter !== 'All' && member.gender !== genderFilter) return false;
        return (
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())
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

          {/* Fee Payment Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/80 border border-gray-700/80 rounded-xl">
            <span className="text-xs text-text-secondary uppercase font-semibold">Fees:</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {filteredMembers.filter(m => m.feePaid).length}/{filteredMembers.length} Paid
            </span>
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
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {isFutureDate ? (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-text-secondary">Cannot mark attendance for a future date.</td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-text-secondary italic">No members found matching the selected filters.</td>
                </tr>
              ) : filteredMembers.map(member => {
                const todayStr = getLocalDateString();
                const isExpired = new Date(member.expiryDate) < new Date(todayStr);
                return (
                <tr key={member.id} className={`border-b border-secondary hover:bg-gray-700/50 transition-colors ${isExpired ? 'bg-red-900/30 border-l-4 border-l-red-500' : ''}`}>
                  <td className="p-4 font-medium flex items-center space-x-3">
                    <img src={member.photo} alt={member.name} className="h-10 w-10 rounded-full object-cover bg-secondary"/>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${member.feePaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {member.feePaid ? 'Paid' : 'Unpaid'}
                    </span>
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
    </div>
  );
};

export default Attendance;