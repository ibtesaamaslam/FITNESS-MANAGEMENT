

import React, { useState, useMemo } from 'react';
import { Member, Role } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getLocalDateString, isMemberArchived } from '../lib/dateUtils';

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
  const [lastWarnedMemberId, setLastWarnedMemberId] = useState<string | null>(null);
  
  const todayStr = getLocalDateString();
  const isFutureDate = selectedDate > todayStr;

  // Audio Warning removed as per request
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const attendanceForDate = useMemo(() => {
    return members
      .filter(member => !isMemberArchived(member))
      .map(member => ({
        ...member,
        present: member.attendance[selectedDate] || false,
      }));
  }, [members, selectedDate]);

  const filteredMembers = useMemo(() => {
    const results = attendanceForDate.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return results;
  }, [attendanceForDate, searchTerm]);

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
  
  // For member view
  const loggedInMember = members[0]; // Simulating logged in member
  const memberAttendanceData = useMemo(() => {
    if (!loggedInMember) return [];
    return Object.entries(loggedInMember.attendance)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .slice(-30) // Last 30 days
      .map(([date, present]) => ({
        date: new Date(date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric'}),
        status: present ? 1 : 0,
      }));
  }, [loggedInMember]);

  if (role === 'Member') {
    if (!loggedInMember) {
        return (
             <div className="p-4 md:p-8">
                <h1 className="text-3xl font-bold mb-6">My Attendance</h1>
                <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
                    <p className="text-text-secondary">No member data available.</p>
                </div>
            </div>
        );
    }
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">My Attendance</h1>
        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis tickFormatter={(value) => value === 1 ? 'Present' : 'Absent'} ticks={[0, 1]} stroke="#9CA3AF" />
              <Tooltip formatter={(value) => value === 1 ? 'Present' : 'Absent'} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} />
              <Bar dataKey="status" fill="#10B981" name="Attendance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Attendance Register</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-surface p-6 rounded-lg shadow-lg flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="attendance-date" className="font-semibold text-sm">Date:</label>
            <input 
              type="date"
              id="attendance-date"
              value={selectedDate}
              onChange={handleDateChange}
              max={getLocalDateString()} // Can't select future dates
              className="p-2 bg-secondary rounded-lg"
            />
          </div>
          <div className="flex-grow">
            <input
                type="text"
                placeholder="Search member by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 bg-secondary rounded-lg w-full"
            />
          </div>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h3 className="font-bold text-lg mb-2">Summary for {selectedDate}</h3>
          <div className="space-y-4">
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{totalPresent}</p>
                <p className="text-text-secondary text-xs uppercase font-semibold">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{totalAbsent}</p>
                <p className="text-text-secondary text-xs uppercase font-semibold">Absent</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
               <div className="flex justify-between items-center text-xs mb-1">
                 <span className="text-text-secondary uppercase">Fee Payment Status</span>
                 <span className="font-mono text-primary font-bold">
                   {filteredMembers.filter(m => m.feePaid).length}/{filteredMembers.length}
                 </span>
               </div>
               <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                 <div 
                   className="bg-primary h-full transition-all duration-500" 
                   style={{ width: `${(filteredMembers.filter(m => m.feePaid).length / filteredMembers.length) * 100}%` }}
                 />
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Fee Status</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {isFutureDate ? (
                <tr>
                    <td colSpan={4} className="text-center p-8 text-text-secondary">Cannot mark attendance for a future date.</td>
                </tr>
              ) : filteredMembers.map(member => {
                const todayStr = getLocalDateString();
                const isExpired = new Date(member.expiryDate) < new Date(todayStr);
                return (
                <tr key={member.id} className={`border-b border-secondary hover:bg-gray-700/50 ${isExpired ? 'bg-red-900/40 border-l-4 border-l-red-500' : ''}`}>
                  <td className="p-4 font-medium flex items-center space-x-3">
                    <img src={member.photo} alt={member.name} className="h-10 w-10 rounded-full object-cover"/>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={isExpired ? 'text-red-400' : ''}>{member.name}</span>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${member.feePaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {member.feePaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${member.present ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
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