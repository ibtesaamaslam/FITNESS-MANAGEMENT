
import React, { useMemo, useState } from 'react';
import { Member, Payment } from '../types';
import { getLocalDateString } from '../lib/dateUtils';
import { MaskedAmount } from './MaskedAmount';

interface DailyLedgerProps {
  payments: Payment[];
  members: Member[];
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const DailyLedger: React.FC<DailyLedgerProps> = ({ payments, members, isUnlocked = false, onUnlockRequest }) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  const dailyPayments = useMemo(() => {
    return payments
      .filter(p => p.date === selectedDate)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [payments, selectedDate]);

  const dailyTotal = useMemo(() => {
    return dailyPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [dailyPayments]);

  const distinctDates = useMemo(() => {
    const dates = Array.from(new Set(payments.map(p => p.date)));
    return dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
  }, [payments]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Daily Ledger</h1>
        <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg border border-gray-700">
          <label htmlFor="ledger-date" className="text-text-secondary text-sm font-medium">Select Date:</label>
          <input
            id="ledger-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-secondary p-1 rounded text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Summary and list of dates with transactions */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-800">
            <h3 className="text-text-secondary text-sm font-medium mb-1 uppercase tracking-wider">Total Income for {selectedDate}</h3>
            <div className="text-4xl font-black text-primary">
              <MaskedAmount amount={dailyTotal} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
          </div>

          <div className="bg-surface p-4 rounded-xl shadow-lg border border-gray-800 min-h-[300px]">
            <h3 className="font-bold text-lg mb-4">Previous Dates</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {distinctDates.length > 0 ? distinctDates.map(date => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    date === selectedDate 
                    ? 'bg-primary text-white shadow-md font-bold' 
                    : 'bg-secondary text-text-secondary hover:bg-gray-700 hover:text-text-primary'
                  }`}
                >
                  {date === getLocalDateString() ? 'Today' : date}
                  <span className="float-right text-xs opacity-70 font-mono">
                    Rs {payments.filter(p => p.date === date).reduce((s, p) => s + p.amount, 0)}
                  </span>
                </button>
              )) : (
                <p className="text-text-secondary text-sm italic">No payment history found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Detailed transactions for selected date */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl shadow-lg border border-gray-800 overflow-hidden">
            <div className="p-4 bg-secondary border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-bold text-xl">Transactions on {selectedDate}</h2>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
                {dailyPayments.length} Records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-text-secondary text-xs uppercase">
                  <tr>
                    <th className="p-4">Member Name</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 text-right">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dailyPayments.length > 0 ? dailyPayments.map(p => {
                    const memberForPayment = members.find(m => m.id === p.memberId);
                    const category = memberForPayment ? memberForPayment.category : 'Strength';
                    return (
                    <tr key={p.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-text-primary">{p.memberName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                            {category || 'Strength'}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary font-mono">Reg No: {p.memberRegNo || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-mono font-bold">
                          Rs {p.amount}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-block bg-gray-700 px-2 py-1 rounded text-xs">
                          {p.method}
                        </span>
                      </td>
                    </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-text-secondary italic">
                        No transactions recorded for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLedger;
