import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Member, Payment, View } from '../types';
import { 
  TrashIcon, 
  CloseIcon, 
  LedgerIcon, 
  ExpenseIcon, 
  UsersIcon, 
  UserCheckIcon, 
  CashIcon, 
  ClipboardCheckIcon, 
  UserPlusIcon, 
  ReceiptIcon, 
  ClipboardListIcon 
} from './icons';
import { getLocalDateString, getLocalMonthString, isMemberArchived } from '../lib/dateUtils';
import { MaskedAmount } from './MaskedAmount';

interface DashboardProps {
  members: Member[];
  payments: Payment[];
  onNavigate: (view: View) => void;
  onDeletePayment: (id: string) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

const StatCard: React.FC<{ 
  title: string; 
  value: React.ReactNode; 
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}> = ({ title, value, icon, iconBgColor = "bg-teal-500/15 border-teal-500/30", iconColor = "text-teal-400" }) => (
  <div className="bg-surface p-5 rounded-xl shadow-lg border border-gray-800/80 flex items-center space-x-4">
    <div className={`p-3 rounded-full border ${iconBgColor} ${iconColor} shrink-0 flex items-center justify-center`}>
      {icon}
    </div>
    <div className="overflow-hidden">
      <p className="text-xs font-medium text-text-secondary mb-1">{title}</p>
      <div className="text-2xl font-bold text-text-primary tracking-tight">{value}</div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-md relative border border-gray-700/80">
                 <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-2 rounded-lg hover:bg-secondary transition-colors">
                    <CloseIcon className="h-5 w-5"/>
                 </button>
                 <div className="flex items-center space-x-3 mb-4 text-red-400">
                    <div className="bg-red-400/20 p-2.5 rounded-xl border border-red-500/30">
                        <TrashIcon className="h-6 w-6"/>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Delete Payment</h3>
                 </div>
                 <p className="mb-6 text-text-secondary text-sm">
                    Are you sure you want to delete the payment of <span className="text-text-primary font-bold">Rs {payment.amount}</span> for <span className="text-text-primary font-bold">{payment.memberName}</span> dated {payment.date}?
                 </p>
                 <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-secondary hover:bg-gray-700/50 rounded-xl text-xs font-bold text-text-primary transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white transition-colors">Delete Payment</button>
                 </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ members, payments, onNavigate, onDeletePayment, isUnlocked = false, onUnlockRequest }) => {
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const nonArchivedMembers = useMemo(() => {
    return members.filter(m => !isMemberArchived(m));
  }, [members]);

  const totalMembers = nonArchivedMembers.length;
  const activeMembers = nonArchivedMembers.filter(m => new Date(m.expiryDate) >= new Date(getLocalDateString())).length;
  const monthlyIncome = payments
    .filter(p => p.date.startsWith(getLocalMonthString()))
    .reduce((sum, p) => sum + p.amount, 0);

  const todayStr = getLocalDateString();
  const todaysAttendance = nonArchivedMembers.map(m => m.attendance[todayStr]).filter(Boolean).length;
  
  const attendanceData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const presentCount = nonArchivedMembers.filter(m => m.attendance[dateStr]).length;
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

  const currentMonth = getLocalMonthString();
  const overdueMembers = useMemo(() => {
    return nonArchivedMembers.filter(m => {
      const isUnpaid = !m.feePaid;
      const isExpired = new Date(m.expiryDate) < new Date(todayStr);
      const isThisMonthOrPrior = m.expiryDate.startsWith(currentMonth) || new Date(m.expiryDate) < new Date(currentMonth + "-01");
      return (isUnpaid || isExpired) && isThisMonthOrPrior;
    });
  }, [nonArchivedMembers, currentMonth, todayStr]);

  const confirmDeletePayment = () => {
    if(paymentToDelete) {
        onDeletePayment(paymentToDelete.id);
        setPaymentToDelete(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-[1600px] mx-auto">
      {paymentToDelete && (
        <ConfirmPaymentDeleteModal 
            payment={paymentToDelete} 
            onClose={() => setPaymentToDelete(null)} 
            onConfirm={confirmDeletePayment} 
        />
      )}

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Members" 
          value={totalMembers} 
          icon={<UsersIcon className="h-5 w-5" />} 
          iconBgColor="bg-teal-500/15 border-teal-500/30"
          iconColor="text-teal-400"
        />
        <StatCard 
          title="Active Members" 
          value={activeMembers} 
          icon={<UserCheckIcon className="h-5 w-5" />} 
          iconBgColor="bg-emerald-500/15 border-emerald-500/30"
          iconColor="text-emerald-400"
        />
        <StatCard
          title="Monthly Income"
          value={<MaskedAmount amount={monthlyIncome} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />}
          icon={<CashIcon className="h-5 w-5" />}
          iconBgColor="bg-blue-500/15 border-blue-500/30"
          iconColor="text-blue-400"
        />
        <StatCard 
          title="Present Today" 
          value={todaysAttendance} 
          icon={<ClipboardCheckIcon className="h-5 w-5" />} 
          iconBgColor="bg-amber-500/15 border-amber-500/30"
          iconColor="text-amber-400"
        />
      </div>

      {/* Main Content Grid (Weekly Attendance & Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-lg border border-gray-800/80">
          <h2 className="text-base font-bold mb-6 text-text-primary tracking-tight">
            Weekly Attendance (Count)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attendanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-secondary, #374151)" />
              <XAxis dataKey="name" stroke="var(--color-text-secondary, #9CA3AF)" tick={{ fill: 'var(--color-text-secondary, #9CA3AF)', fontSize: 12 }} />
              <YAxis 
                stroke="var(--color-text-secondary, #9CA3AF)" 
                tick={{ fill: 'var(--color-text-secondary, #9CA3AF)', fontSize: 12 }}
                domain={[0, yAxisTicks[yAxisTicks.length - 1]]}
                ticks={yAxisTicks}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-surface, #1F2937)', borderColor: 'var(--color-secondary, #374151)', borderRadius: '0.5rem', color: 'var(--color-text-primary, #FFF)' }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary, #9CA3AF)', fontSize: '13px' }} />
              <Bar dataKey="Present" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-800/80 flex flex-col justify-between">
          <h2 className="text-base font-bold mb-4 text-text-primary tracking-tight">Quick Actions</h2>
          <div className="space-y-3 my-auto">
            <button 
              onClick={() => onNavigate('members')} 
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <UserPlusIcon className="h-5 w-5" />
              <span>Add Member</span>
            </button>
            <button 
              onClick={() => onNavigate('fees')} 
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <ReceiptIcon className="h-5 w-5" />
              <span>Record Payment</span>
            </button>
            <button 
              onClick={() => onNavigate('attendance')} 
              className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <ClipboardListIcon className="h-5 w-5" />
              <span>Mark Attendance</span>
            </button>
            <button 
              onClick={() => onNavigate('dailyledger')} 
              className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <LedgerIcon className="h-5 w-5" />
              <span>Daily Ledger</span>
            </button>
            <button 
              onClick={() => onNavigate('expenses')} 
              className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <ExpenseIcon className="h-5 w-5" />
              <span>Monthly Expense</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Row (Recent Payments & Overdue Payments) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments Card */}
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-800/80">
          <h2 className="text-base font-bold mb-4 text-text-primary tracking-tight">Recent Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700/80 text-text-primary font-bold text-sm">
                  <th className="p-3 text-text-primary font-bold">Member</th>
                  <th className="p-3 text-text-primary font-bold">Date</th>
                  <th className="p-3 text-text-primary font-bold">Amount</th>
                  <th className="p-3 text-text-primary font-bold">Method</th>
                  <th className="p-3 text-right text-text-primary font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {recentPayments.length > 0 ? (
                  recentPayments.map(p => (
                    <tr key={p.id} className="hover:bg-secondary/60 transition-colors">
                      <td className="p-3 font-semibold text-text-primary">{p.memberName}</td>
                      <td className="p-3 text-text-secondary font-mono">{p.date}</td>
                      <td className="p-3 text-emerald-500 dark:text-emerald-400 font-bold">
                        Rs {p.amount}
                      </td>
                      <td className="p-3">
                        <span className="bg-secondary text-text-secondary border border-gray-700/50 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => setPaymentToDelete(p)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete payment entry"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-secondary text-sm">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Payments Card */}
        <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-800/80">
          <h2 className="text-base font-bold mb-4 text-text-primary tracking-tight">Overdue Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700/80 text-text-primary font-bold text-sm">
                  <th className="p-3 text-text-primary font-bold">Member</th>
                  <th className="p-3 text-text-primary font-bold">Due Date</th>
                  <th className="p-3 text-text-primary font-bold">Fee</th>
                  <th className="p-3 text-right text-text-primary font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {overdueMembers.length > 0 ? (
                  overdueMembers.map(m => (
                    <tr key={m.id} className="hover:bg-secondary/60 transition-colors">
                      <td className="p-3 font-semibold text-text-primary">{m.name}</td>
                      <td className="p-3 text-red-500 dark:text-red-400 font-mono text-xs font-bold">{m.expiryDate}</td>
                      <td className="p-3 text-text-primary font-semibold">
                        Rs {m.fee}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => onNavigate('fees')}
                          className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          Clear Fee
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-emerald-500 dark:text-emerald-400 text-sm font-semibold">
                      ✓ All active members are paid for this month!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
