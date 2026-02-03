import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Member, Payment } from '../types';
import { TrashIcon, CloseIcon } from './icons';

interface DashboardProps {
  members: Member[];
  payments: Payment[];
  onNavigate: (view: 'members' | 'fees' | 'attendance') => void;
  onDeletePayment: (id: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-surface p-6 rounded-lg shadow-lg flex items-center space-x-4">
    <div className="bg-gray-700 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const ConfirmPaymentDeleteModal: React.FC<{
    payment: Payment | null;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ payment, onClose, onConfirm }) => {
    if (!payment) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
                    <CloseIcon className="h-5 w-5"/>
                 </button>
                 <div className="flex items-center space-x-3 mb-4 text-red-400">
                    <div className="bg-red-400/20 p-2 rounded-full">
                        <TrashIcon className="h-6 w-6"/>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Delete Payment</h3>
                 </div>
                 <p className="mb-6 text-text-secondary">
                    Are you sure you want to delete the payment of <span className="text-white font-bold">Rs {payment.amount}</span> for <span className="text-white font-bold">{payment.memberName}</span> dated {payment.date}?
                 </p>
                 <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors">Delete Payment</button>
                 </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ members, payments, onNavigate, onDeletePayment }) => {
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const totalMembers = members.length;
  const activeMembers = members.filter(m => new Date(m.expiryDate) > new Date()).length;
  const monthlyIncome = payments
    .filter(p => new Date(p.date).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAttendance = members.map(m => m.attendance[todayStr]).filter(Boolean).length;
  
  const attendanceData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const presentCount = members.filter(m => m.attendance[dateStr]).length;
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      'Present': presentCount,
    };
  }).reverse();

  const yAxisTicks = useMemo(() => {
    if (totalMembers === 0) return [0, 25, 50, 75, 100];
    
    const increment = totalMembers > 150 ? 100 : 25;
    const maxVal = Math.max(totalMembers, increment);
    const topTick = Math.ceil(maxVal / increment) * increment;
    
    const ticks = [];
    for (let i = 0; i <= topTick; i += increment) {
        ticks.push(i);
    }
    return ticks;
  }, [totalMembers]);


  const recentPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const confirmDeletePayment = () => {
    if(paymentToDelete) {
        onDeletePayment(paymentToDelete.id);
        setPaymentToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {paymentToDelete && (
        <ConfirmPaymentDeleteModal 
            payment={paymentToDelete} 
            onClose={() => setPaymentToDelete(null)} 
            onConfirm={confirmDeletePayment} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={totalMembers} icon={<UsersIcon />} />
        <StatCard title="Active Members" value={activeMembers} icon={<UserCheckIcon />} />
        <StatCard title="Monthly Income" value={`Rs ${monthlyIncome.toLocaleString()}`} icon={<CashIcon />} />
        <StatCard title="Present Today" value={todaysAttendance} icon={<ClipboardCheckIcon />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Weekly Attendance (Count)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis 
                stroke="#9CA3AF" 
                domain={[0, yAxisTicks[yAxisTicks.length - 1]]}
                ticks={yAxisTicks}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
              />
              <Legend />
              <Bar dataKey="Present" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Quick Actions</h2>
          <div className="space-y-4">
            <button onClick={() => onNavigate('members')} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center space-x-2">
              <UserPlusIcon />
              <span>Add Member</span>
            </button>
            <button onClick={() => onNavigate('fees')} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
              <ReceiptIcon />
              <span>Record Payment</span>
            </button>
            <button onClick={() => onNavigate('attendance')} className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2">
              <ClipboardListIcon />
              <span>Mark Attendance</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Recent Payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3">Member</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length > 0 ? recentPayments.map(p => (
                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-3">{p.memberName}</td>
                  <td className="p-3">{p.date}</td>
                  <td className="p-3">Rs {p.amount.toLocaleString()}</td>
                  <td className="p-3">{p.method}</td>
                  <td className="p-3 text-right">
                    <button 
                        onClick={() => setPaymentToDelete(p)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                        title="Delete Payment"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-text-secondary">No payments recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper Icons
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 12a4 4 0 110-8 4 4 0 010 8z" /></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ClipboardCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;

export default Dashboard;