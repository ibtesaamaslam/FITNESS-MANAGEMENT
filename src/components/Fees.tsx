import React, { useState, useMemo } from 'react';
import { Member, Payment, AccessorySale } from '../types';
import { DownloadIcon, TrashIcon, CloseIcon, CashIcon, BankIcon, PhonePayIcon, AccessoriesIcon } from './icons';
import { getLocalDateString, getLocalMonthString, isMemberArchived } from '../lib/dateUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MaskedAmount } from './MaskedAmount';

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

interface FeesProps {
  members: Member[];
  payments: Payment[];
  accessorySales?: AccessorySale[];
  onToggleReminders: (memberId: string, enabled: boolean) => void;
  onDeletePayment: (id: string) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

const ConfirmPaymentDeleteModal: React.FC<{
    payment: Payment | null;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ payment, onClose, onConfirm }) => {
    if (!payment) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                    <br/><br/>
                    <span className="text-xs text-yellow-500 bg-yellow-500/10 p-1 rounded border border-yellow-500/20">Note: This only removes the record from the ledger. It does not automatically change the member's status to "Unpaid".</span>
                 </p>
                 <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors">Delete Payment</button>
                 </div>
            </div>
        </div>
    );
};

const Fees: React.FC<FeesProps> = ({ members, payments, accessorySales, onToggleReminders, onDeletePayment, isUnlocked = false, onUnlockRequest }) => {
  const [viewMode, setViewMode] = useState<'status' | 'ledger'>('status');
  const [filterMonth, setFilterMonth] = useState<string>(getLocalMonthString());
  const [filterPlan, setFilterPlan] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      if (isMemberArchived(member)) return false;
      const planMatch = filterPlan === 'All' || member.plan === filterPlan;
      const statusMatch = filterStatus === 'All' || (filterStatus === 'Paid' && member.feePaid) || (filterStatus === 'Unpaid' && !member.feePaid);
      return planMatch && statusMatch;
    });
  }, [members, filterPlan, filterStatus]);
  
  const paymentsInMonth = useMemo(() => {
     return payments.filter(p => p.date.startsWith(filterMonth));
  }, [payments, filterMonth]);
  
  const totalRevenue = paymentsInMonth.reduce((sum, p) => sum + p.amount, 0);

  const monthlyAccessorySales = useMemo(() => {
     return (accessorySales || []).filter(s => s.date.startsWith(filterMonth));
  }, [accessorySales, filterMonth]);

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

  const feePayments = useMemo(() => {
     return paymentsInMonth.filter(p => p.type !== 'Accessory');
  }, [paymentsInMonth]);

  const feeRevenue = useMemo(() => {
     return feePayments.reduce((sum, p) => sum + p.amount, 0);
  }, [feePayments]);

  const monthlyBreakdown = useMemo(() => {
    let cash = 0;
    let easyPaisa = 0;
    let jazzCash = 0;
    let bankTransfer = 0;

    paymentsInMonth.forEach(p => {
      const methodLower = (p.method || '').toLowerCase().replace(/\s+/g, '');
      if (methodLower === 'cash') {
        cash += p.amount;
      } else if (methodLower === 'easypaisa') {
        easyPaisa += p.amount;
      } else if (methodLower === 'jazzcash') {
        jazzCash += p.amount;
      } else if (methodLower === 'banktransfer') {
        bankTransfer += p.amount;
      } else {
        cash += p.amount;
      }
    });

    return { cash, easyPaisa, jazzCash, bankTransfer };
  }, [paymentsInMonth]);
  
  const monthlyRevenueData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const revenueMap: Record<string, number> = {};
    payments.forEach(p => {
      const month = p.date.substring(0, 7); // YYYY-MM
      revenueMap[month] = (revenueMap[month] || 0) + p.amount;
    });

    const monthsData = [];
    for (let m = 1; m <= 12; m++) {
      const monthFormatted = m.toString().padStart(2, '0');
      const yearMonth = `${currentYear}-${monthFormatted}`;
      const label = new Date(currentYear, m - 1, 2).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthsData.push({
        month: yearMonth,
        label,
        'Revenue': revenueMap[yearMonth] || 0,
      });
    }
    return monthsData;
  }, [payments]);

  const handleSendReminder = (member: Member) => {
    const message = `Reminder sent to ${member.name} (Phone: ${member.phone}).\n\nThis is a simulation. In a full application, this would trigger a real SMS or Email to the member.`;
    alert(message);
  };
  
  const confirmDeletePayment = () => {
    if(paymentToDelete) {
        onDeletePayment(paymentToDelete.id);
        setPaymentToDelete(null);
    }
  };

  const handleExportCSV = () => {
    if (paymentsInMonth.length === 0) {
      alert('No payment data to export for the selected month.');
      return;
    }

    const headers = ['Payment ID', 'Member Name', 'Date', 'Amount', 'Method'];
    const csvContent = [
      headers.join(','),
      ...paymentsInMonth.map(p => [
        p.id,
        `"${p.memberName.replace(/"/g, '""')}"`, // Handle names with quotes
        p.date,
        p.amount,
        p.method
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `payments_${filterMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Fees & Ledger</h1>
      
      {paymentToDelete && (
        <ConfirmPaymentDeleteModal 
            payment={paymentToDelete} 
            onClose={() => setPaymentToDelete(null)} 
            onConfirm={confirmDeletePayment} 
        />
      )}

      {/* Tabs */}
      <div className="flex space-x-6 mb-6 border-b border-gray-700">
        <button
            className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                viewMode === 'status' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setViewMode('status')}
        >
            Member Status
        </button>
        <button
            className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                viewMode === 'ledger' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setViewMode('ledger')}
        >
            Transaction Ledger
        </button>
      </div>

      {/* Filters & Export Control Bar */}
      <div className="bg-surface border border-gray-800 rounded-2xl p-3.5 sm:p-4 shadow-lg mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/90 border border-gray-700/80 px-3 py-1.5 rounded-xl">
            <label htmlFor="month" className="text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
              Filter by Month:
            </label>
            <input 
              type="month" 
              id="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-text-primary outline-none cursor-pointer"
            />
          </div>
          
          {viewMode === 'status' && (
            <>
              <div className="flex items-center gap-2 bg-secondary/90 border border-gray-700/80 px-3 py-1.5 rounded-xl">
                <label htmlFor="plan" className="text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  Plan:
                </label>
                <select 
                  id="plan" 
                  value={filterPlan} 
                  onChange={(e) => setFilterPlan(e.target.value)} 
                  className="bg-transparent text-sm font-bold text-text-primary outline-none cursor-pointer"
                >
                  <option value="All">All Plans</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-secondary/90 border border-gray-700/80 px-3 py-1.5 rounded-xl">
                <label htmlFor="status" className="text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  Status:
                </label>
                <select 
                  id="status" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  className="bg-transparent text-sm font-bold text-text-primary outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Export Button */}
        <button 
          onClick={handleExportCSV} 
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
        >
          <DownloadIcon />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 5 Monthly Revenue & Payment Method Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Revenue Card */}
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-emerald-500/40 bg-emerald-950/20 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Total Revenue ({new Date(filterMonth + '-02').toLocaleString('default', { month: 'short' })})
            </p>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              <MaskedAmount amount={totalRevenue} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[11px] space-y-1 text-text-secondary font-medium">
            <div className="flex justify-between">
              <span>Fees ({feePayments.length}):</span>
              <span className="text-blue-400 font-mono"><MaskedAmount amount={feeRevenue} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} /></span>
            </div>
            <div className="flex justify-between">
              <span>Acc ({accessorySalesCount}):</span>
              <span className="text-teal-400 font-mono"><MaskedAmount amount={accessoryRevenue} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} /></span>
            </div>
          </div>
        </div>

        {/* Cash */}
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">Cash</p>
            <div className="text-xl font-bold text-emerald-400">
              <MaskedAmount amount={monthlyBreakdown.cash} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 shadow-sm">
            <CashIcon className="h-4 w-4" />
          </div>
        </div>

        {/* Easy Paisa */}
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-cyan-500/30 bg-cyan-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1">Easy Paisa</p>
            <div className="text-xl font-bold text-cyan-400">
              <MaskedAmount amount={monthlyBreakdown.easyPaisa} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-400 shadow-sm">
            <PhonePayIcon className="h-4 w-4" />
          </div>
        </div>

        {/* Jazz Cash */}
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-orange-500/30 bg-orange-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-orange-300 uppercase tracking-wider mb-1">Jazz Cash</p>
            <div className="text-xl font-bold text-orange-400">
              <MaskedAmount amount={monthlyBreakdown.jazzCash} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-orange-500/20 border border-orange-500/40 rounded-full text-orange-400 shadow-sm">
            <PhonePayIcon className="h-4 w-4" />
          </div>
        </div>

        {/* Bank Transfer */}
        <div className="bg-surface p-4 rounded-xl shadow-lg border border-purple-500/30 bg-purple-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">Bank Transfer</p>
            <div className="text-xl font-bold text-purple-400">
              <MaskedAmount amount={monthlyBreakdown.bankTransfer} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>
          <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-400 shadow-sm">
            <BankIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
      
      {viewMode === 'status' ? (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary">
                <tr>
                  <th className="p-4">RegNo</th>
                  <th className="p-4">Member</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Fee Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Reminders</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => {
                  const todayStr = getLocalDateString();
                  const isExpired = new Date(member.expiryDate) < new Date(todayStr);
                  const needsReminder = (!member.feePaid || isExpiringSoon(member.expiryDate)) && (member.remindersEnabled ?? true);
                  return (
                    <tr key={member.id} className={`border-b border-secondary hover:bg-gray-700/50 ${!member.feePaid || isExpired ? 'bg-red-900/40 border-l-4 border-l-red-500 text-red-100' : ''}`}>
                      <td className="p-4 font-mono text-text-secondary">{member.registrationNo}</td>
                      <td className="p-4 font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{member.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[member.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                            {member.category || 'Strength'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">{member.plan}</td>
                      <td className="p-4">
                        <MaskedAmount amount={member.fee} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${member.feePaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {member.feePaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className={`p-4 ${isExpired ? 'text-red-400 font-bold' : ''}`}>
                        {member.expiryDate} {isExpired && "(Expired)"}
                      </td>
                      <td className="p-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={member.remindersEnabled ?? true} 
                            onChange={(e) => onToggleReminders(member.id, e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-hover/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Trends Chart */}
          <div className="bg-surface border border-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-text-primary">Monthly Revenue Trend</h3>
                <p className="text-sm text-text-secondary">Historical dynamic visual collection curves from gym memberships</p>
              </div>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 font-mono text-xs rounded-full border border-green-500/20">
                Live Overview
              </span>
            </div>
            
            <div className="h-64 mt-6">
              {monthlyRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.25} vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '12px' }} 
                      labelStyle={{ fontWeight: 'bold', color: '#f3f4f6' }}
                      formatter={(value: any) => [`Rs ${Number(value).toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Revenue" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-text-secondary italic">
                  No payment transaction entries recorded yet to display trend.
                </div>
              )}
            </div>
          </div>

          {/* Historical Table */}
          <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Member Name</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsInMonth.length > 0 ? (
                    paymentsInMonth.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => {
                      const isAccessory = payment.type === 'Accessory' || payment.memberRegNo === 'ACC';
                      const memberForPayment = members.find(m => m.id === payment.memberId);
                      const category = memberForPayment ? memberForPayment.category : 'Strength';
                      return (
                        <tr key={payment.id} className="border-b border-secondary hover:bg-gray-700/50">
                          <td className="p-4 font-mono text-text-secondary text-xs">{payment.date}</td>
                          <td className="p-4 font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{payment.memberName}</span>
                              {isAccessory ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Accessory
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                                  {category || 'Strength'}
                                </span>
                              )}
                            </div>
                            {payment.notes && <p className="text-xs text-text-secondary mt-0.5">{payment.notes}</p>}
                          </td>
                          <td className="p-4 text-emerald-400 font-bold">
                            <MaskedAmount amount={payment.amount} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                          </td>
                          <td className="p-4">
                            <span className="bg-gray-700/80 px-2.5 py-1 rounded-full text-xs font-semibold">{payment.method}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setPaymentToDelete(payment)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                              title="Delete Payment Record"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary">
                        No payments recorded for {new Date(filterMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;