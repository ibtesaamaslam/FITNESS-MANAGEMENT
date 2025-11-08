
import React, { useState, useMemo } from 'react';
import { Member, Payment } from '../types';

interface FeesProps {
  members: Member[];
  payments: Payment[];
}

const Fees: React.FC<FeesProps> = ({ members, payments }) => {
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [filterPlan, setFilterPlan] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

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

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Fees & Ledger</h1>

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
          </div>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-lg flex flex-col justify-center items-center">
          <p className="text-text-secondary">Revenue for {new Date(filterMonth + '-02').toLocaleString('default', { month: 'long' })}</p>
          <p className="text-3xl font-bold text-primary">Rs {totalRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Fee Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => {
                const isExpired = new Date(member.expiryDate) < new Date();
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Fees;
