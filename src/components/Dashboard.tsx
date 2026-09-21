import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Member, Payment, View, AccessorySale, Role } from '../types';
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
  ClipboardListIcon,
  AccessoriesIcon,
  StaffIcon,
  BackupIcon
} from './icons';
import { getLocalDateString, getLocalMonthString, isMemberArchived } from '../lib/dateUtils';
import { MaskedAmount } from './MaskedAmount';
import { GenderBadge } from './Members';

interface DashboardProps {
  members: Member[];
  payments: Payment[];
  accessorySales?: AccessorySale[];
  role?: Role;
  onNavigate: (view: View) => void;
  onDeletePayment: (id: string) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

const StatCard: React.FC<{ 
  title: string; 
  value: React.ReactNode; 
  subValue?: React.ReactNode;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}> = ({ title, value, subValue, icon, iconBgColor = "bg-teal-500/15 border-teal-500/30", iconColor = "text-teal-400" }) => (
  <div className="bg-surface p-5 rounded-xl shadow-lg border border-gray-800/80 flex items-center space-x-4">
    <div className={`p-3 rounded-full border ${iconBgColor} ${iconColor} shrink-0 flex items-center justify-center`}>
      {icon}
    </div>
    <div className="overflow-hidden min-w-0 flex-1">
      <p className="text-xs font-medium text-text-secondary mb-1">{title}</p>
      <div className="text-2xl font-bold text-text-primary tracking-tight">{value}</div>
      {subValue && <div className="mt-1">{subValue}</div>}
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

const Dashboard: React.FC<DashboardProps> = ({ members, payments, accessorySales = [], role = 'Admin', onNavigate, onDeletePayment, isUnlocked = false, onUnlockRequest }) => {
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const nonArchivedMembers = useMemo(() => {
    return members.filter(m => !isMemberArchived(m));
  }, [members]);

  const totalMembers = nonArchivedMembers.length;
  const maleMembers = nonArchivedMembers.filter(m => (m.gender || 'Male') === 'Male').length;
  const femaleMembers = nonArchivedMembers.filter(m => m.gender === 'Female').length;

  const todayStr = getLocalDateString();
  const activeMembers = nonArchivedMembers.filter(m => new Date(m.expiryDate) >= new Date(todayStr)).length;
  const activeMale = nonArchivedMembers.filter(m => (m.gender || 'Male') === 'Male' && new Date(m.expiryDate) >= new Date(todayStr)).length;
  const activeFemale = nonArchivedMembers.filter(m => m.gender === 'Female' && new Date(m.expiryDate) >= new Date(todayStr)).length;

  const todaysAttendance = nonArchivedMembers.map(m => m.attendance[todayStr]).filter(Boolean).length;
  const todayMaleAttendance = nonArchivedMembers.filter(m => (m.gender || 'Male') === 'Male' && m.attendance[todayStr]).length;
  const todayFemaleAttendance = nonArchivedMembers.filter(m => m.gender === 'Female' && m.attendance[todayStr]).length;
  
  const currentMonth = getLocalMonthString();

  const monthlyFeePayments = useMemo(() => {
    return payments.filter(p => p.date.startsWith(currentMonth) && p.type !== 'Accessory');
  }, [payments, currentMonth]);

  const monthlyAccessorySales = useMemo(() => {
    return (accessorySales || []).filter(s => s.date.startsWith(currentMonth));
  }, [accessorySales, currentMonth]);

  const feeIncome = useMemo(() => {
    return monthlyFeePayments.reduce((sum, p) => sum + p.amount, 0);
  }, [monthlyFeePayments]);

  const accessoryRevenue = useMemo(() => {
    return monthlyAccessorySales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [monthlyAccessorySales]);

  const accessoryProfit = useMemo(() => {
    return monthlyAccessorySales.reduce((sum, s) => sum + s.totalProfit, 0);
  }, [monthlyAccessorySales]);

  const accessorySalesCount = monthlyAccessorySales.length;
  const accessoryItemsCount = useMemo(() => {
    return monthlyAccessorySales.reduce((sum, s) => sum + s.quantity, 0);
  }, [monthlyAccessorySales]);

  const monthlyIncome = feeIncome + accessoryRevenue;
  
  const attendanceData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const maleCount = nonArchivedMembers.filter(m => (m.gender || 'Male') === 'Male' && m.attendance[dateStr]).length;
      const femaleCount = nonArchivedMembers.filter(m => m.gender === 'Female' && m.attendance[dateStr]).length;
      const totalCount = maleCount + femaleCount;
      return {
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Male: maleCount,
        Female: femaleCount,
        Total: totalCount,
        Present: totalCount,
      };
    }).reverse();
  }, [nonArchivedMembers]);

  const maxWeeklyPresent = useMemo(() => {
    return Math.max(...attendanceData.map(d => d.Total), 0);
  }, [attendanceData]);

  const { yAxisTicks, yAxisDomain } = useMemo(() => {
    const peak = Math.max(totalMembers, maxWeeklyPresent, 10);
    
    let step = 10;
    if (peak <= 50) {
      step = 10;
    } else if (peak <= 100) {
      step = 20;
    } else if (peak <= 250) {
      step = 50;
    } else if (peak <= 500) {
      step = 100;
    } else if (peak <= 1000) {
      step = 200;
    } else {
      step = 500;
    }
    
    // Calculate top ceiling (at least 50 by default as requested: 0, 10, 20, 30, 40, 50)
    const maxVal = Math.max(50, Math.ceil(peak / step) * step);
    const ticks: number[] = [];
    for (let i = 0; i <= maxVal; i += step) {
      ticks.push(i);
    }
    return { yAxisTicks: ticks, yAxisDomain: [0, maxVal] as [number, number] };
  }, [totalMembers, maxWeeklyPresent]);

  const weeklyAverage = useMemo(() => {
    const sum = attendanceData.reduce((acc, curr) => acc + curr.Total, 0);
    return Math.round(sum / 7);
  }, [attendanceData]);

  const recentPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

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
    <div className="p-4 md:p-8 space-y-6 w-full">
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
          subValue={
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-blue-400">♂ {maleMembers} Male</span>
              <span className="text-gray-600">·</span>
              <span className="text-pink-400">♀ {femaleMembers} Female</span>
            </div>
          }
          icon={<UsersIcon className="h-5 w-5" />} 
          iconBgColor="bg-teal-500/15 border-teal-500/30"
          iconColor="text-teal-400"
        />
        <StatCard 
          title="Active Members" 
          value={activeMembers} 
          subValue={
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-blue-400">♂ {activeMale} Male</span>
              <span className="text-gray-600">·</span>
              <span className="text-pink-400">♀ {activeFemale} Female</span>
            </div>
          }
          icon={<UserCheckIcon className="h-5 w-5" />} 
          iconBgColor="bg-emerald-500/15 border-emerald-500/30"
          iconColor="text-emerald-400"
        />
        <StatCard
          title="Monthly Income"
          value={<MaskedAmount amount={monthlyIncome} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />}
          subValue={
            <div className="text-[11px] font-medium text-text-secondary">
              Fees + Store Sales
            </div>
          }
          icon={<CashIcon className="h-5 w-5" />} 
          iconBgColor="bg-blue-500/15 border-blue-500/30"
          iconColor="text-blue-400"
        />
        <StatCard 
          title="Present Today" 
          value={todaysAttendance} 
          subValue={
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-blue-400">♂ {todayMaleAttendance} Male</span>
              <span className="text-gray-600">·</span>
              <span className="text-pink-400">♀ {todayFemaleAttendance} Female</span>
            </div>
          }
          icon={<ClipboardCheckIcon className="h-5 w-5" />} 
          iconBgColor="bg-amber-500/15 border-amber-500/30"
          iconColor="text-amber-400"
        />
      </div>

      {/* Main Content Grid (Weekly Attendance & Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface p-5 sm:p-6 pb-3 sm:pb-4 rounded-xl shadow-lg border border-gray-800/80 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Weekly Attendance Trend
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">Daily check-in activity for the past 7 days</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                <span>♂ Male</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20">
                <span className="w-2 h-2 rounded-full bg-pink-400 inline-block"></span>
                <span>♀ Female</span>
              </span>
              <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Avg: {weeklyAverage}/day
              </span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[300px] h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={attendanceData} 
                margin={{ top: 10, right: 15, left: -10, bottom: 4 }} 
                barGap={4}
                barCategoryGap="24%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  tickLine={{ stroke: '#6B7280' }}
                  axisLine={{ stroke: '#6B7280', strokeWidth: 1.5 }}
                  tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  tickLine={{ stroke: '#6B7280' }}
                  axisLine={{ stroke: '#6B7280', strokeWidth: 1.5 }}
                  tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                  domain={yAxisDomain}
                  ticks={yAxisTicks}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0f172a] border border-gray-700/90 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 min-w-[160px]">
                          <div className="font-bold text-white border-b border-gray-800 pb-1.5 flex justify-between items-center">
                            <span>{label}</span>
                            <span className="text-gray-400 font-normal">{data.fullDate}</span>
                          </div>
                          <div className="flex justify-between items-center text-blue-400 font-semibold">
                            <span className="flex items-center gap-1">♂ Male</span>
                            <span className="font-mono text-sm">{data.Male}</span>
                          </div>
                          <div className="flex justify-between items-center text-pink-400 font-semibold">
                            <span className="flex items-center gap-1">♀ Female</span>
                            <span className="font-mono text-sm">{data.Female}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-gray-800 pt-1.5">
                            <span>Total Present</span>
                            <span className="font-mono text-sm">{data.Total}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="Male" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32} 
                  name="Male" 
                />
                <Bar 
                  dataKey="Female" 
                  fill="#EC4899" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32} 
                  name="Female" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-surface p-5 sm:p-6 rounded-xl shadow-lg border border-gray-800/80 flex flex-col justify-between">
          <h2 className="text-base font-bold mb-3 text-text-primary tracking-tight">Quick Actions</h2>
          <div className="space-y-2 my-auto">
            <button 
              onClick={() => onNavigate('members')} 
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>Add Member</span>
            </button>
            <button 
              onClick={() => onNavigate('fees')} 
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <ReceiptIcon className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
            <button 
              onClick={() => onNavigate('attendance')} 
              className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <ClipboardListIcon className="h-4 w-4" />
              <span>Mark Attendance</span>
            </button>
            <button 
              onClick={() => onNavigate('dailyledger')} 
              className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <LedgerIcon className="h-4 w-4" />
              <span>Daily Ledger</span>
            </button>
            <button 
              onClick={() => onNavigate('expenses')} 
              className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <ExpenseIcon className="h-4 w-4" />
              <span>Monthly Expense</span>
            </button>
            <button 
              onClick={() => onNavigate('accessories')} 
              className="w-full bg-[#ec4899] hover:bg-[#db2777] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <AccessoriesIcon className="h-4 w-4" />
              <span>Store Accessories</span>
            </button>
            <button 
              onClick={() => onNavigate('staff')} 
              className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <StaffIcon className="h-4 w-4" />
              <span>Staff & Payroll</span>
            </button>
            <button 
              onClick={() => onNavigate('backup')} 
              className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <BackupIcon className="h-4 w-4" />
              <span>Backup & Restore</span>
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
                  recentPayments.map(p => {
                    const member = nonArchivedMembers.find(m => m.id === p.memberId);
                    return (
                    <tr key={p.id} className="hover:bg-secondary/60 transition-colors">
                      <td className="p-3 font-semibold text-text-primary">
                        <div className="flex items-center space-x-2">
                          <span>{p.memberName}</span>
                          {member && <GenderBadge gender={member.gender || 'Male'} size="sm" />}
                        </div>
                      </td>
                      <td className="p-3 text-text-secondary font-mono">{p.date}</td>
                      <td className="p-3 text-emerald-500 dark:text-emerald-400 font-bold">
                        <MaskedAmount amount={p.amount} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                      </td>
                      <td className="p-3">
                        <span className="bg-secondary text-text-secondary border border-gray-700/50 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {role === 'Admin' ? (
                          <button 
                            onClick={() => setPaymentToDelete(p)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete payment entry"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-gray-500 text-[10px] px-2 py-0.5 bg-gray-800/40 rounded border border-gray-700/50 cursor-not-allowed select-none" title="Admin authority required to delete payments">
                            Admin Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );})
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
                      <td className="p-3 font-semibold text-text-primary">
                        <div className="flex items-center space-x-2">
                          <span>{m.name}</span>
                          <GenderBadge gender={m.gender || 'Male'} size="sm" />
                        </div>
                      </td>
                      <td className="p-3 text-red-500 dark:text-red-400 font-mono text-xs font-bold">{m.expiryDate}</td>
                      <td className="p-3 text-text-primary font-semibold">
                        <MaskedAmount amount={m.fee} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
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
