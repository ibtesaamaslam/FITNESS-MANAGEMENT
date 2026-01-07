import React, { useState, useMemo } from 'react';
import { Member, Payment } from '../types';
import { DownloadIcon, TrashIcon, CloseIcon } from './icons';

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

interface FeesProps {
  members: Member[];
  payments: Payment[];
  onToggleReminders: (memberId: string, enabled: boolean) => void;
  onDeletePayment: (id: string) => void;
}

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

const Fees: React.FC<FeesProps> = ({ members, payments, onToggleReminders, onDeletePayment }) => {
  const [viewMode, setViewMode] = useState<'status' | 'ledger'>('status');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [filterPlan, setFilterPlan] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const planMatch = filterPlan === 'All' || member.plan === filterPlan;
      const statusMatch = filterStatus === 'All' || (filterStatus === 'Paid' && member.feePaid) || (filterStatus === 'Unpaid' && !member.feePaid);
      return planMatch && statusMatch;
    });
  }, [members, filterPlan, filterStatus]);
  
  const paymentsInMonth = useMemo(() => {
     return payments.filter(p => p.date.startsWith(filterMonth));
  }, [payments, filterMonth]);
  
  const totalRevenue = paymentsInMonth.reduce((sum, p) => sum + p.amount, 0);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-3 bg-surface p-6 rounded-lg shadow-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-text-secondary mb-1">Filter by Month</label>
              <input 
                type="month" 
                id="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="p-2 bg-secondary rounded-lg"
              />
            </div>
            
            {viewMode === 'status' && (
                <>
                    <div>
                    <label htmlFor="plan" className="block text-sm font-medium text-text-secondary mb-1">Filter by Plan</label>
                    <select id="plan" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="p-2 bg-secondary rounded-lg">
                        <option>All</option>
                        <option>Monthly</option>
                        <option>Quarterly</option>
                        <option>Yearly</option>
                    </select>
                    </div>
                    <div>
                    <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">Filter by Status</label>
                    <select id="status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 bg-secondary rounded-lg">
                        <option>All</option>
                        <option>Paid</option>
                        <option>Unpaid</option>
                    </select>
                    </div>
                </>
            )}
            
            <div className="self-end ml-auto">
              <button onClick={handleExportCSV} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors flex items-center space-x-2">
                <DownloadIcon />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-lg flex flex-col justify-center items-center">
          <p className="text-text-secondary">Revenue for {new Date(filterMonth + '-02').toLocaleString('default', { month: 'long' })}</p>
          <p className="text-3xl font-bold text-primary">Rs {totalRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'status' ? (
              <table className="w-full text-left">
                <thead className="bg-secondary">
                  <tr>
                    <th className="p-4">Member</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Fee Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Reminders</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => {
                    const isExpired = new Date(member.expiryDate) < new Date();
                    const needsReminder = (!member.feePaid || isExpiringSoon(member.expiryDate)) && (member.remindersEnabled ?? true);
                    return (
                      <tr key={member.id} className={`border-b border-secondary hover:bg-gray-700/50 ${!member.feePaid || isExpired ? 'bg-red-900/20' : ''}`}>
                        <td className="p-4 font-medium">{member.name}</td>
                        <td className="p-4">{member.plan}</td>
                        <td className="p-4">Rs {member.fee.toLocaleString()}</td>
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
                        <td className="p-4">
                          {needsReminder && (
                            <button onClick={() => handleSendReminder(member)} className="bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-lg hover:bg-blue-700 transition-colors">
                              Send Reminder
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          ) : (
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
                         paymentsInMonth.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                            <tr key={payment.id} className="border-b border-secondary hover:bg-gray-700/50">
                                <td className="p-4">{payment.date}</td>
                                <td className="p-4 font-medium">{payment.memberName}</td>
                                <td className="p-4 text-green-400">Rs {payment.amount.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className="bg-gray-700 px-2 py-1 rounded text-sm">{payment.method}</span>
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-text-secondary">
                                No payments recorded for {new Date(filterMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}.
                            </td>
                        </tr>
                    )}
                </tbody>
              </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fees;