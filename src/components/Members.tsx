import React, { useState, useEffect, useMemo } from 'react';
import { Member, Payment } from '../types';
import { CloseIcon, ReportIcon } from './icons';
import { getLocalDateString, isMemberArchived, parseLocalDate } from '../lib/dateUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MaskedAmount } from './MaskedAmount';

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ConfirmDeleteModal: React.FC<{
    member: Member | null;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ member, onClose, onConfirm }) => {
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <WarningIcon />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-bold text-text-primary" id="modal-title">
                            Delete Member
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-text-secondary">
                                Are you sure you want to delete <span className="font-bold text-text-primary">{member.name}</span>? This action is permanent and cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-secondary text-base font-medium text-text-primary hover:bg-gray-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemberReportModal: React.FC<{
    member: Member | null;
    payments: Payment[];
    onClose: () => void;
    onUpdateMember: (member: Member, paymentMethod: Payment['method']) => void;
    isUnlocked?: boolean;
    onUnlockRequest?: () => void;
}> = ({ member, payments, onClose, onUpdateMember, isUnlocked = false, onUnlockRequest }) => {
    if (!member) return null;

    const [activeTab, setActiveTab] = useState<'info' | 'measurements'>('info');

    const memberPayments = payments
        .filter(p => p.memberId === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const attendanceHistory = Object.entries(member.attendance)
        .map(([date, present]) => ({ date, present }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);
        
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

    // Logging form states
    const [mDate, setMDate] = useState(getLocalDateString());
    const [mWeight, setMWeight] = useState('');
    const [mWaist, setMWaist] = useState('');
    const [mChest, setMChest] = useState('');
    const [mArms, setMArms] = useState('');
    const [mThighs, setMThighs] = useState('');
    const [mBodyFat, setMBodyFat] = useState('');

    const handleAddMeasurement = (e: React.FormEvent) => {
        e.preventDefault();
        const weightNum = parseFloat(mWeight);
        if (isNaN(weightNum) || weightNum <= 0) {
            alert('Please enter a valid weight.');
            return;
        }

        const newEntry = {
            id: `meas_${Date.now()}`,
            date: mDate,
            weight: weightNum,
            waist: mWaist ? parseFloat(mWaist) : undefined,
            chest: mChest ? parseFloat(mChest) : undefined,
            arms: mArms ? parseFloat(mArms) : undefined,
            thighs: mThighs ? parseFloat(mThighs) : undefined,
            bodyFat: mBodyFat ? parseFloat(mBodyFat) : undefined
        };

        const currentMeasurements = member.measurements || [];
        const updatedMeasurements = [...currentMeasurements, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const updatedMember: Member = {
            ...member,
            measurements: updatedMeasurements
        };

        onUpdateMember(updatedMember, 'Cash');

        // Reset
        setMWeight('');
        setMWaist('');
        setMChest('');
        setMArms('');
        setMThighs('');
        setMBodyFat('');
    };

    const handleDeleteMeasurement = (entryId: string) => {
        if (!window.confirm("Are you sure you want to delete this body measurement entry?")) {
            return;
        }
        const currentMeasurements = member.measurements || [];
        const updatedMeasurements = currentMeasurements.filter(m => m.id !== entryId);

        const updatedMember: Member = {
            ...member,
            measurements: updatedMeasurements
        };

        onUpdateMember(updatedMember, 'Cash');
    };

    // Prepare measurement chart data
    const chartData = useMemo(() => {
        return (member.measurements || []).map(m => ({
            date: m.date,
            Weight: m.weight,
            Waist: m.waist,
            'Body Fat': m.bodyFat,
            label: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
    }, [member.measurements]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl shadow-2xl border border-gray-800 p-8 w-full max-w-4xl relative max-h-[95vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-2 bg-secondary rounded-lg hover:bg-gray-700 transition-colors">
                    <CloseIcon />
                </button>
                
                {/* Profile Header */}
                <div className="flex items-center space-x-4 pb-4 border-b border-gray-850">
                    <img src={member.photo || `https://ui-avatars.com/api/?name=${member.name || '?'}&background=374151&color=F9FAFB`} alt="Profile" className="h-16 w-16 rounded-full object-cover bg-secondary border border-gray-700" />
                    <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-text-primary">{member.name}</h2>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${member.plan === 'Monthly' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'}`}>
                            {member.plan} Plan
                          </span>
                        </div>
                        <p className="text-text-secondary font-mono text-sm">{member.registrationNo}</p>
                    </div>
                </div>

                {/* Sub-tabs within Modal */}
                <div className="flex bg-secondary p-1 rounded-lg mt-6 gap-2 shrink-0 max-w-md">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-1.5 text-center text-sm font-semibold rounded-md transition-all ${activeTab === 'info' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        History & Summaries
                    </button>
                    <button 
                        onClick={() => setActiveTab('measurements')}
                        className={`flex-1 py-1.5 text-center text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${activeTab === 'measurements' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Body Gym Metrics
                    </button>
                </div>

                {activeTab === 'info' ? (
                    <div className="flex-grow overflow-y-auto mt-6 space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary mb-3">Payment History</h3>
                            <div className="overflow-x-auto max-h-48 border border-gray-850 rounded-lg">
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
                                            <tr key={p.id} className="border-b border-secondary hover:bg-gray-700/35">
                                                <td className="p-3 text-text-secondary font-mono text-sm">{p.date}</td>
                                                <td className="p-3 text-green-400 font-bold text-sm">
                                                    <MaskedAmount amount={p.amount} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                                                </td>
                                                <td className="p-3 text-text-primary text-sm">{p.method}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={3} className="text-center p-8 text-text-secondary">No payment history.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary mb-3">Attendance History (Last 30 Records)</h3>
                                <div className="overflow-x-auto max-h-48 border border-gray-850 rounded-lg">
                                    <table className="w-full text-left">
                                        <thead className="bg-secondary sticky top-0">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceHistory.length > 0 ? attendanceHistory.map(att => (
                                                <tr key={att.date} className="border-b border-secondary">
                                                    <td className="p-3 text-text-secondary font-mono text-sm">{att.date}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${att.present ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {att.present ? 'Present' : 'Absent'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={2} className="text-center p-8 text-text-secondary">No attendance history.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-text-primary mb-3">Monthly Attendance Summary</h3>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                     {Object.keys(monthlyAttendanceSummary).length > 0 ? Object.entries(monthlyAttendanceSummary)
                                        .sort(([monthA], [monthB]) => new Date(monthB).getTime() - new Date(monthA).getTime())
                                        .map(([month, stats]: [string, any]) => (
                                        <div key={month} className="bg-secondary p-3 rounded-xl flex items-center justify-between border border-gray-700">
                                            <span className="font-semibold text-text-primary text-sm">{new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                            <div className="flex space-x-3 text-xs">
                                                <span className="text-green-400 font-semibold">Present: {stats.present}</span>
                                                <span className="text-red-400 font-semibold">Absent: {stats.absent}</span>
                                            </div>
                                        </div>
                                     )) : (
                                        <p className="text-center py-12 text-text-secondary text-sm">No attendance data to summarize.</p>
                                     )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto mt-6 space-y-6 flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                            {/* Form Column - Take up 1/3 of the width */}
                            <form onSubmit={handleAddMeasurement} className="bg-secondary/40 border border-gray-800 p-5 rounded-xl space-y-4 md:col-span-1 h-full flex flex-col justify-between">
                                <h4 className="font-bold text-text-primary text-base border-b border-gray-800 pb-2">Log Body Metrics</h4>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="meas-date" className="block text-xs font-medium text-text-secondary mb-1">Log Date</label>
                                        <input 
                                            id="meas-date"
                                            type="date" 
                                            value={mDate} 
                                            onChange={(e) => setMDate(e.target.value)} 
                                            className="w-full p-2 bg-secondary border border-gray-800 rounded-lg text-sm text-text-primary focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="meas-weight" className="block text-xs font-medium text-text-secondary mb-1">Weight (kg) *</label>
                                            <input 
                                                id="meas-weight"
                                                type="number" 
                                                step="0.1"
                                                placeholder="e.g. 74"
                                                value={mWeight} 
                                                onChange={(e) => setMWeight(e.target.value)} 
                                                className="w-full p-2 bg-secondary border border-gray-800 rounded-lg text-sm text-text-primary focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="meas-bf" className="block text-xs font-medium text-text-secondary mb-1">Body Fat %</label>
                                            <input 
                                                id="meas-bf"
                                                type="number" 
                                                step="0.1"
                                                placeholder="e.g. 15.5"
                                                value={mBodyFat} 
                                                onChange={(e) => setMBodyFat(e.target.value)} 
                                                className="w-full p-2 bg-secondary border border-gray-800 rounded-lg text-sm text-text-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="meas-waist" className="block text-xs font-medium text-text-secondary mb-1">Waist (in)</label>
                                            <input 
                                                id="meas-waist"
                                                type="number" 
                                                step="0.1"
                                                placeholder="e.g. 32"
                                                value={mWaist} 
                                                onChange={(e) => setMWaist(e.target.value)} 
                                                className="w-full p-2 bg-secondary border border-gray-800 rounded-lg text-sm text-text-primary focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="meas-chest" className="block text-xs font-medium text-text-secondary mb-1">Chest (in)</label>
                                            <input 
                                                id="meas-chest"
                                                type="number" 
                                                step="0.1"
                                                placeholder="e.g. 40"
                                                value={mChest} 
                                                onChange={(e) => setMChest(e.target.value)} 
                                                className="w-full p-2 bg-secondary border border-gray-800 rounded-lg text-sm text-text-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="meas-arms" className="block text-xs font-medium text-text-secondary mb-1">Arms (in)</label>
                                            <input 
                                                id="meas-arms"
                                                type="number" 
                                                step="0.1"
                                                placeholder="e.g. 14.5"
                                                value={mArms} 
                                                onChange={(e) => setMArms(e.target.value)} 
                                                className="w-full p-2 bg-secondary border border-gray-800 rounded-lg text-sm text-text-primary focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="meas-thighs" className="block text-xs font-medium text-text-secondary mb-1">Thighs (in)</label>
                                            <input 
                                                id="meas-thighs"
                                                type="number" 
                                                step="0.1"
                                                placeholder="e.g. 21"
                                                value={mThighs} 
                                                onChange={(e) => setMThighs(e.target.value)} 
                                                className="w-full p-2 bg-secondary border border-gray-800 rounded-lg text-sm text-text-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-sm mt-3 transition-colors cursor-pointer"
                                >
                                    Log Measurement
                                </button>
                            </form>

                            {/* History Column - Take up 2/3 of the width */}
                            <div className="md:col-span-2 flex flex-col gap-4">
                                <div className="bg-secondary/20 border border-gray-850 p-4 rounded-xl flex-1 max-h-80 overflow-y-auto">
                                    <h4 className="font-bold text-text-primary text-base mb-2 select-none">Metric Logs ({member.measurements?.length || 0})</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-secondary text-text-secondary border-b border-gray-800">
                                                    <th className="p-2">Date</th>
                                                    <th className="p-2">Weight</th>
                                                    <th className="p-2">Waist</th>
                                                    <th className="p-2">Body Fat</th>
                                                    <th className="p-2">Chest</th>
                                                    <th className="p-2">Arms</th>
                                                    <th className="p-2">Thighs</th>
                                                    <th className="p-2 text-right">Delete</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {member.measurements && member.measurements.length > 0 ? (
                                                    [...member.measurements].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => (
                                                        <tr key={m.id} className="border-b border-gray-850 hover:bg-secondary/40">
                                                            <td className="p-2 font-mono text-text-secondary">{m.date}</td>
                                                            <td className="p-2 font-bold text-text-primary">{m.weight} kg</td>
                                                            <td className="p-2 font-medium text-text-primary">{m.waist ? `${m.waist}"` : '-'}</td>
                                                            <td className="p-2 text-text-primary">{m.bodyFat ? `${m.bodyFat}%` : '-'}</td>
                                                            <td className="p-2 text-text-primary">{m.chest ? `${m.chest}"` : '-'}</td>
                                                            <td className="p-2 text-text-primary">{m.arms ? `${m.arms}"` : '-'}</td>
                                                            <td className="p-2 text-text-primary">{m.thighs ? `${m.thighs}"` : '-'}</td>
                                                            <td className="p-2 text-right">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleDeleteMeasurement(m.id)}
                                                                    className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                                                                    title="Delete measurement log"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="p-6 text-center text-text-secondary italic">No body measurements recorded yet. Log the first one on the left!</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Spark Progressive Line Graph */}
                        <div className="bg-surface border border-gray-850 p-5 rounded-xl">
                            <h4 className="font-bold text-text-primary text-base mb-1">Aesthetic Fitness Progress curves</h4>
                            <p className="text-sm text-text-secondary mb-3">Line chart plotting body parameters, showing muscular physical development trends</p>
                            
                            <div className="h-44">
                                {chartData.length > 1 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                                            <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} />
                                            <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} tickLine={false} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6', fontSize: 10 } }} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#eab308" fontSize={10} tickLine={false} label={{ value: 'Metrics (in/%)', angle: 90, position: 'insideRight', style: { fill: '#eab308', fontSize: 10 } }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: 11 }} />
                                            <Legend wrapperStyle={{ fontSize: 10 }} />
                                            <Line yAxisId="left" type="monotone" dataKey="Weight" stroke="#3b82f6" strokeWidth={2} name="Weight (kg)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                            <Line yAxisId="right" type="monotone" dataKey="Waist" stroke="#eab308" strokeWidth={1.5} name="Waist (in)" connectNulls strokeDasharray="5 5" dot={{ r: 2 }} />
                                            <Line yAxisId="right" type="monotone" dataKey="Body Fat" stroke="#10b981" strokeWidth={1.5} name="Body Fat (%)" connectNulls dot={{ r: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-text-secondary text-sm italic">
                                        Note: Please log at least two distinct measurement dates to calculate and view progress progression charts.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


interface MembersProps {
  members: Member[];
  payments: Payment[];
  onAddMember: (member: Omit<Member, 'id'>, paymentMethod: Payment['method']) => void;
  onUpdateMember: (member: Member, paymentMethod: Payment['method']) => void;
  onDeleteMember: (id: string) => void;
  onWarning?: (message: string) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

const getNextRegistrationNo = (membersList: Member[]): string => {
    if (!membersList || membersList.length === 0) {
        return '1';
    }

    let maxNumber = 0;
    let samplePrefix = '';
    let samplePadLength = 0;

    membersList.forEach(m => {
        const reg = (m.registrationNo || '').trim();
        if (!reg) return;

        const match = reg.match(/^(.*?)[^\d]*(\d+)$/);
        if (match) {
            const prefix = match[1] || '';
            const numStr = match[2];
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
                samplePrefix = prefix;
                samplePadLength = numStr.length;
            }
        } else {
            const num = parseInt(reg, 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
                samplePrefix = '';
                samplePadLength = reg.length;
            }
        }
    });

    if (maxNumber === 0) {
        return (membersList.length + 1).toString();
    }

    const nextNum = maxNumber + 1;
    if (samplePadLength > 1 && nextNum.toString().length <= samplePadLength) {
        return `${samplePrefix}${nextNum.toString().padStart(samplePadLength, '0')}`;
    }

    return `${samplePrefix}${nextNum}`;
};

const MemberModal: React.FC<{
    member: Partial<Member> | null;
    existingMembers?: Member[];
    onClose: () => void;
    onSave: (member: Partial<Member>, paymentMethod: Payment['method']) => void;
}> = ({ member, existingMembers = [], onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Member> & { paymentMethod?: Payment['method'] }>({});

    useEffect(() => {
        const autoRegNo = getNextRegistrationNo(existingMembers);
        const initialData: Partial<Member> & { paymentMethod?: Payment['method'] } = (member && member.id)
            ? { ...member, remindersEnabled: member.remindersEnabled ?? true, category: member.category || 'Strength' }
            : {
                name: '',
                registrationNo: autoRegNo,
                age: 0,
                phone: '',
                plan: 'Monthly',
                fee: 2000,
                feePaid: false,
                joinDate: getLocalDateString(),
                photo: '',
                expiryDate: '',
                paymentMethod: 'Cash',
                remindersEnabled: true,
                category: 'Strength',
              };
        setFormData(initialData);
    }, [member, existingMembers]);

    useEffect(() => {
        if (formData.joinDate && formData.plan) {
            const expiryDate = parseLocalDate(formData.joinDate);
            if (formData.plan === 'Monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
            else if (formData.plan === 'Quarterly') expiryDate.setMonth(expiryDate.getMonth() + 3);
            else if (formData.plan === 'Yearly') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            
            const newExpiryDate = getLocalDateString(expiryDate);
            if (formData.expiryDate !== newExpiryDate) {
              setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
            }
        }
    }, [formData.joinDate, formData.plan, formData.expiryDate]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | boolean = value;

        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        } else if (name === 'feePaid') {
            processedValue = (e.target as HTMLSelectElement).value === 'true';
        } else if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => {
            const nextData = { ...prev, [name]: processedValue };
            if (name === 'category') {
                if (processedValue === 'Strength') {
                    nextData.fee = 2000;
                } else if (processedValue === 'Cardio') {
                    nextData.fee = 4000;
                } else if (processedValue === 'Personal Training') {
                    nextData.fee = 15000;
                }
            }
            return nextData;
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setFormData(prev => ({ ...prev, photo: loadEvent.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, formData.paymentMethod || 'Cash');
    };
    
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-8 w-full max-w-lg relative max-h-full overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
                    <CloseIcon />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-text-primary">{member.id ? 'Edit Member' : 'Add New Member'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Full Name" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center justify-between">
                            <span>Registration No.</span>
                            {!member?.id && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                    Auto Next: #{formData.registrationNo}
                                </span>
                            )}
                        </label>
                        <input type="text" name="registrationNo" value={formData.registrationNo || ''} onChange={handleChange} placeholder="e.g., SF-001" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Age</label>
                        <input type="number" name="age" value={formData.age || ''} onChange={handleChange} placeholder="Age" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone Number" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Plan</label>
                        <select name="plan" value={formData.plan || 'Monthly'} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg">
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Fee</label>
                        <input type="number" name="fee" value={formData.fee || ''} onChange={handleChange} placeholder="Fee Amount" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Fee Status</label>
                        <select name="feePaid" value={formData.feePaid ? 'true' : 'false'} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg">
                            <option value="true">Paid</option>
                            <option value="false">Unpaid</option>
                        </select>
                    </div>

                    {formData.feePaid && (
                         <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Payment Method</label>
                            <select name="paymentMethod" value={formData.paymentMethod || 'Cash'} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg">
                                <option value="Cash">Cash</option>
                                <option value="Easypaisa">Easypaisa</option>
                                <option value="Jazz Cash">Jazz Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                        <select name="category" value={formData.category || 'Strength'} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg">
                            <option value="Strength">Strength</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Personal Training">Personal Training</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Join Date</label>
                        <input type="date" name="joinDate" value={formData.joinDate || ''} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Expiry Date</label>
                        <input type="date" name="expiryDate" value={formData.expiryDate || ''} className="w-full p-3 bg-gray-700 rounded-lg cursor-not-allowed text-gray-400" readOnly />
                    </div>

                    <div className="col-span-2 mt-2">
                        <label className="block text-sm font-medium text-text-secondary mb-2">Profile Photo</label>
                        <div className="flex items-center space-x-4">
                            <img src={formData.photo || `https://ui-avatars.com/api/?name=${formData.name || '?'}&background=374151&color=F9FAFB`} alt="Profile" className="h-20 w-20 rounded-full object-cover bg-secondary" />
                            <div>
                                <label htmlFor="photo-upload" className="cursor-pointer bg-secondary px-4 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-gray-600 transition-colors">
                                    Upload Image
                                </label>
                                <input
                                    id="photo-upload"
                                    name="photo"
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-2 mt-2">
                        <div className="flex items-center space-x-3">
                            <input 
                                type="checkbox" 
                                id="remindersEnabled" 
                                name="remindersEnabled"
                                checked={formData.remindersEnabled ?? true} 
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-500 bg-secondary text-primary focus:ring-primary"
                            />
                            <label htmlFor="remindersEnabled" className="text-sm font-medium text-text-secondary">
                                Enable Fee/Expiry Reminders
                            </label>
                        </div>
                    </div>

                    <div className="col-span-2 flex justify-end space-x-4 pt-4 mt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 rounded-lg hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-primary rounded-lg hover:bg-primary-hover">Save Member</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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


const Members: React.FC<MembersProps> = ({ members, payments, onAddMember, onUpdateMember, onDeleteMember, onWarning, isUnlocked = false, onUnlockRequest }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Partial<Member> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastWarnedMemberId, setLastWarnedMemberId] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [memberForReport, setMemberForReport] = useState<Member | null>(null);

    const handleAddNew = () => {
        setSelectedMember({});
        setIsModalOpen(true);
    };

    const handleEdit = (member: Member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleViewReport = (member: Member) => {
        setMemberForReport(member);
        setIsReportModalOpen(true);
    };
    
    const handleDeleteRequest = (member: Member) => {
        setMemberToDelete(member);
        setIsConfirmModalOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if(memberToDelete) {
            onDeleteMember(memberToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setMemberToDelete(null);
    };

    const handleSave = (memberData: Partial<Member>, paymentMethod: Payment['method']) => {
        if (memberData.id) {
            onUpdateMember(memberData as Member, paymentMethod);
        } else {
            const newMember = {
                ...memberData,
                photo: memberData.photo || `https://picsum.photos/seed/${Math.random()}/200`,
                attendance: {},
            } as Omit<Member, 'id'>;

            onAddMember(newMember, paymentMethod);
        }
        setIsModalOpen(false);
        setSelectedMember(null);
    };

    const filteredMembers = members
        .filter(m => !isMemberArchived(m))
        .filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Check for expired members in search results to show warning
    useEffect(() => {
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
                const todayStr = getLocalDateString();
                const isExpired = new Date(m.expiryDate) < new Date(todayStr);
                
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

    return (
        <div className="p-4 md:p-8">
            {isModalOpen && <MemberModal member={selectedMember} existingMembers={members} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {isConfirmModalOpen && <ConfirmDeleteModal member={memberToDelete} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} />}
            {isReportModalOpen && (
                <MemberReportModal 
                    member={memberForReport} 
                    payments={payments} 
                    onClose={() => setIsReportModalOpen(false)} 
                    onUpdateMember={onUpdateMember} 
                    isUnlocked={isUnlocked}
                    onUnlockRequest={onUnlockRequest}
                />
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Members</h1>
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 bg-secondary rounded-lg"
                    />
                    <button onClick={handleAddNew} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors">
                        Add New Member
                    </button>
                </div>
            </div>
            <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary">
                            <tr>
                                <th className="p-4">Photo</th>
                                <th className="p-4">Reg. No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Plan</th>
                                <th className="p-4">Fee Status</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="border-b border-secondary hover:bg-gray-700/50">
                                    <td className="p-4"><img src={member.photo} alt={member.name} className="h-12 w-12 rounded-full object-cover"/></td>
                                    <td className="p-4 font-mono text-text-secondary">{member.registrationNo}</td>
                                    <td className="p-4 font-medium">{member.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[member.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                                            {member.category || 'Strength'}
                                        </span>
                                    </td>
                                    <td className="p-4">{member.plan}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${member.feePaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {member.feePaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <span>{member.expiryDate}</span>
                                            {isExpiringSoon(member.expiryDate, 1) && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400" title="Membership is expiring soon!">
                                                    Expiring
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 flex items-center space-x-2">
                                        <button onClick={() => handleViewReport(member)} className="text-gray-400 hover:text-white" title="View Report"><ReportIcon/></button>
                                        <button onClick={() => handleEdit(member)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                        <button onClick={() => handleDeleteRequest(member)} className="text-red-400 hover:text-red-300">Delete</button>
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

export default Members;