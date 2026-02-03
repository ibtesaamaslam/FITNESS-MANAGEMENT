

import React, { useState, useMemo } from 'react';
import { Member, Role } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceProps {
  members: Member[];
  role: Role;
  onUpdateAttendance: (memberId: string, date: string, present: boolean) => void;
}

const isExpiringSoon = (expiryDate: string, days: number = 7): boolean => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const threshold = new Date();
    threshold.setDate(today.getDate() + days);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    threshold.setHours(0, 0, 0, 0);

    return expiry <= threshold && expiry >= today;
};

const Attendance: React.FC<AttendanceProps> = ({ members, role, onUpdateAttendance }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const today = new Date();
  const isFutureDate = new Date(selectedDate) > today;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const attendanceForDate = useMemo(() => {
    return members.map(member => ({
      ...member,
      present: member.attendance[selectedDate] || false,
    }));
  }, [members, selectedDate]);

  const filteredMembers = useMemo(() => {
    return attendanceForDate.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attendanceForDate, searchTerm]);
  
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
              max={today.toISOString().split('T')[0]} // Can't select future dates
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
          <div className="flex justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{totalPresent}</p>
              <p className="text-text-secondary">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{totalAbsent}</p>
              <p className="text-text-secondary">Absent</p>
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
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {isFutureDate ? (
                <tr>
                    <td colSpan={3} className="text-center p-8 text-text-secondary">Cannot mark attendance for a future date.</td>
                </tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id} className="border-b border-secondary hover:bg-gray-700/50">
                  <td className="p-4 font-medium flex items-center space-x-3">
                    <img src={member.photo} alt={member.name} className="h-10 w-10 rounded-full object-cover"/>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span>{member.name}</span>
                            {isExpiringSoon(member.expiryDate) && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400" title="Membership is expiring soon!">
                                    Expiring
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-secondary font-mono">{member.registrationNo}</p>
                    </div>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;