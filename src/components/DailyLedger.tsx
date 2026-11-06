import React, { useMemo, useState } from 'react';
import { Member, Payment } from '../types';
import { getLocalDateString, formatDateDDMMYYYY } from '../lib/dateUtils';
import { MaskedAmount } from './MaskedAmount';
import { CashIcon, BankIcon, PhonePayIcon, SearchIcon, CloseIcon } from './icons';
import { GenderBadge } from './Members';
import { ConsistentMemberStar } from './ConsistentMemberStar';
import { DateInputDDMMYYYY } from './DateInputDDMMYYYY';

interface DailyLedgerProps {
  payments: Payment[];
  members: Member[];
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

export type LedgerMethodTab = 'All' | 'Cash' | 'Easypaisa' | 'JazzCash' | 'Bank Transfer';

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const getNormalizedMethod = (method: string): 'Cash' | 'Easypaisa' | 'JazzCash' | 'Bank Transfer' => {
  const clean = (method || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (clean.includes('easy')) return 'Easypaisa';
  if (clean.includes('jazz')) return 'JazzCash';
  if (clean.includes('bank')) return 'Bank Transfer';
  return 'Cash';
};

const TAB_METADATA = {
  'All': {
    label: 'All Transactions',
    badge: 'Master Ledger',
    colorClass: 'text-primary border-primary bg-primary/10',
    activeTabClass: 'bg-primary text-white shadow-lg shadow-emerald-950/30 font-bold',
    description: 'Consolidated master view containing all payment methods',
  },
  'Cash': {
    label: 'Cash',
    badge: 'Cash Register',
    colorClass: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
    activeTabClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-bold',
    description: 'Physical cash collected at front desk counter',
  },
  'Easypaisa': {
    label: 'Easypaisa',
    badge: 'Mobile Account',
    colorClass: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20',
    activeTabClass: 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/40 font-bold',
    description: 'Mobile wallet transfers received through Easypaisa',
  },
  'JazzCash': {
    label: 'JazzCash',
    badge: 'Mobile Account',
    colorClass: 'text-orange-400 border-orange-500/40 bg-orange-950/20',
    activeTabClass: 'bg-orange-600 text-white shadow-lg shadow-orange-950/40 font-bold',
    description: 'Mobile wallet transfers received through JazzCash',
  },
  'Bank Transfer': {
    label: 'Bank Transfer',
    badge: 'Bank Account',
    colorClass: 'text-purple-400 border-purple-500/40 bg-purple-950/20',
    activeTabClass: 'bg-purple-600 text-white shadow-lg shadow-purple-950/40 font-bold',
    description: 'Direct IBFT & Online Bank transfers to gym account',
  },
};

const DailyLedger: React.FC<DailyLedgerProps> = ({ payments, members, isUnlocked = false, onUnlockRequest }) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [activeTab, setActiveTab] = useState<LedgerMethodTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Daily transactions for the chosen date
  const dailyPayments = useMemo(() => {
    return payments
      .filter(p => p.date === selectedDate)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [payments, selectedDate]);

  // Method-specific breakdown for the chosen date
  const dailyBreakdown = useMemo(() => {
    let cash = 0;
    let easyPaisa = 0;
    let jazzCash = 0;
    let bankTransfer = 0;
    let cashCount = 0;
    let easyPaisaCount = 0;
    let jazzCashCount = 0;
    let bankTransferCount = 0;

    dailyPayments.forEach(p => {
      const norm = getNormalizedMethod(p.method);
      if (norm === 'Cash') {
        cash += p.amount;
        cashCount++;
      } else if (norm === 'Easypaisa') {
        easyPaisa += p.amount;
        easyPaisaCount++;
      } else if (norm === 'JazzCash') {
        jazzCash += p.amount;
        jazzCashCount++;
      } else if (norm === 'Bank Transfer') {
        bankTransfer += p.amount;
        bankTransferCount++;
      }
    });

    return { 
      cash, 
      easyPaisa, 
      jazzCash, 
      bankTransfer,
      cashCount,
      easyPaisaCount,
      jazzCashCount,
      bankTransferCount
    };
  }, [dailyPayments]);

  const dailyTotal = useMemo(() => {
    return dailyPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [dailyPayments]);

  // Filter payments by active tab
  const filteredTabPayments = useMemo(() => {
    if (activeTab === 'All') return dailyPayments;
    return dailyPayments.filter(p => getNormalizedMethod(p.method) === activeTab);
  }, [dailyPayments, activeTab]);

  // Search filtered payments
  const searchedPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredTabPayments;

    const cleanQ = q.replace(/^#/, '');
    const isNumeric = /^\d+$/.test(cleanQ);

    if (isNumeric) {
      const qNum = parseInt(cleanQ, 10);
      return filteredTabPayments.filter(p => {
        const member = members.find(m => m.id === p.memberId);
        const regStr = String(p.memberRegNo || member?.registrationNo || '').trim().toLowerCase().replace(/^#/, '');
        if (regStr === cleanQ) return true;
        const regDigits = regStr.replace(/\D/g, '');
        const regNum = regDigits !== '' ? parseInt(regDigits, 10) : NaN;
        return !isNaN(regNum) && regNum === qNum;
      });
    }

    return filteredTabPayments.filter(p => {
      const member = members.find(m => m.id === p.memberId);
      const name = (p.memberName || '').toLowerCase();
      const reg = String(p.memberRegNo || member?.registrationNo || '').toLowerCase();
      const method = (p.method || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();

      return name.includes(q) || reg.includes(q) || method.includes(q) || notes.includes(q);
    });
  }, [filteredTabPayments, searchQuery, members]);

  // Subtotal for currently viewed tab
  const activeTabSubtotal = useMemo(() => {
    return searchedPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [searchedPayments]);

  const distinctDates = useMemo(() => {
    const dates = Array.from(new Set(payments.map(p => p.date)));
    return dates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
  }, [payments]);

  // Helper to extract clean Reg No
  const getDisplayRegNo = (p: Payment): { text: string; isAcc: boolean } => {
    if (p.type === 'Accessory' || p.memberRegNo === 'ACC') {
      return { text: 'ACC', isAcc: true };
    }
    if (p.memberRegNo) {
      return { text: p.memberRegNo, isAcc: false };
    }
    const member = members.find(m => m.id === p.memberId);
    if (member?.registrationNo) {
      return { text: member.registrationNo, isAcc: false };
    }
    return { text: 'N/A', isAcc: false };
  };

  const handleExportCSV = () => {
    const headers = ['Reg No', 'Member Name', 'Payment Method', 'Amount (Rs)', 'Notes', 'Date'];
    const rows = searchedPayments.map(p => {
      const { text: reg } = getDisplayRegNo(p);
      return [
        `"${reg}"`,
        `"${p.memberName.replace(/"/g, '""')}"`,
        `"${p.method}"`,
        p.amount,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
        `"${formatDateDDMMYYYY(p.date)}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Ledger_${activeTab}_${formatDateDDMMYYYY(selectedDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header with Title and Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Daily Ledger
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Separate cash registers and digital accounts for exact daily reconciliation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-surface px-3.5 py-2 rounded-xl border border-gray-700 shadow-sm">
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Date:</span>
            <div className="bg-secondary px-2.5 py-1 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
              <DateInputDDMMYYYY
                value={selectedDate}
                onChange={setSelectedDate}
                id="ledger-date"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1b3d30] hover:bg-[#234d3d] text-emerald-100 rounded-xl border border-[#2d614d] text-xs font-bold transition-all shadow-md cursor-pointer group"
            title="Export to CSV"
          >
            <svg 
              className="w-4 h-4 text-emerald-300 group-hover:translate-y-0.5 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="tracking-wide">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Payment Method Cards (Clicking opens that specific view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Card */}
        <div 
          onClick={() => setActiveTab('Cash')}
          className={`p-5 rounded-2xl shadow-lg border transition-all cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'Cash'
              ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/50 scale-[1.02]'
              : 'border-emerald-500/30 bg-surface hover:bg-emerald-950/20 hover:border-emerald-500/50'
          }`}
          title="Click to view Cash ledger"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Cash</p>
              {activeTab === 'Cash' && (
                <span className="text-[10px] bg-emerald-500 text-black font-black px-1.5 py-0.2 rounded-full">ACTIVE</span>
              )}
            </div>
            <div className="text-2xl font-black text-emerald-400">
              <MaskedAmount amount={dailyBreakdown.cash} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              {dailyBreakdown.cashCount} entries recorded
            </p>
          </div>
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shadow-sm">
            <CashIcon className="h-6 w-6" />
          </div>
        </div>

        {/* Easypaisa Card */}
        <div 
          onClick={() => setActiveTab('Easypaisa')}
          className={`p-5 rounded-2xl shadow-lg border transition-all cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'Easypaisa'
              ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/50 scale-[1.02]'
              : 'border-cyan-500/30 bg-surface hover:bg-cyan-950/20 hover:border-cyan-500/50'
          }`}
          title="Click to view Easypaisa ledger"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Easypaisa</p>
              {activeTab === 'Easypaisa' && (
                <span className="text-[10px] bg-cyan-400 text-black font-black px-1.5 py-0.2 rounded-full">ACTIVE</span>
              )}
            </div>
            <div className="text-2xl font-black text-cyan-400">
              <MaskedAmount amount={dailyBreakdown.easyPaisa} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              {dailyBreakdown.easyPaisaCount} entries recorded
            </p>
          </div>
          <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-sm">
            <PhonePayIcon className="h-6 w-6" />
          </div>
        </div>

        {/* JazzCash Card */}
        <div 
          onClick={() => setActiveTab('JazzCash')}
          className={`p-5 rounded-2xl shadow-lg border transition-all cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'JazzCash'
              ? 'border-orange-400 bg-orange-950/40 ring-2 ring-orange-500/50 scale-[1.02]'
              : 'border-orange-500/30 bg-surface hover:bg-orange-950/20 hover:border-orange-500/50'
          }`}
          title="Click to view JazzCash ledger"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-orange-300 uppercase tracking-wider">JazzCash</p>
              {activeTab === 'JazzCash' && (
                <span className="text-[10px] bg-orange-400 text-black font-black px-1.5 py-0.2 rounded-full">ACTIVE</span>
              )}
            </div>
            <div className="text-2xl font-black text-orange-400">
              <MaskedAmount amount={dailyBreakdown.jazzCash} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              {dailyBreakdown.jazzCashCount} entries recorded
            </p>
          </div>
          <div className="p-3 bg-orange-500/20 border border-orange-500/40 rounded-xl text-orange-400 shadow-sm">
            <PhonePayIcon className="h-6 w-6" />
          </div>
        </div>

        {/* Bank Transfer Card */}
        <div 
          onClick={() => setActiveTab('Bank Transfer')}
          className={`p-5 rounded-2xl shadow-lg border transition-all cursor-pointer select-none flex items-center justify-between ${
            activeTab === 'Bank Transfer'
              ? 'border-purple-400 bg-purple-950/40 ring-2 ring-purple-500/50 scale-[1.02]'
              : 'border-purple-500/30 bg-surface hover:bg-purple-950/20 hover:border-purple-500/50'
          }`}
          title="Click to view Bank Transfer ledger"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Bank Transfer</p>
              {activeTab === 'Bank Transfer' && (
                <span className="text-[10px] bg-purple-400 text-black font-black px-1.5 py-0.2 rounded-full">ACTIVE</span>
              )}
            </div>
            <div className="text-2xl font-black text-purple-400">
              <MaskedAmount amount={dailyBreakdown.bankTransfer} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              {dailyBreakdown.bankTransferCount} entries recorded
            </p>
          </div>
          <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400 shadow-sm">
            <BankIcon className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left sidebar dates + Right main table area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Daily Total & Date history */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="text-text-secondary text-xs font-bold mb-1 uppercase tracking-wider">
              Total Day Income ({formatDateDDMMYYYY(selectedDate)})
            </h3>
            <div className="text-3xl font-black text-primary">
              <MaskedAmount amount={dailyTotal} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-text-secondary flex items-center justify-between font-mono">
              <span>All Method Entries:</span>
              <span className="font-bold text-text-primary">{dailyPayments.length}</span>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="font-bold text-base mb-3 flex items-center justify-between">
              <span>Previous Dates</span>
              <span className="text-xs text-text-secondary font-mono">{distinctDates.length} days</span>
            </h3>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {distinctDates.length > 0 ? distinctDates.map(date => {
                const daySum = payments.filter(p => p.date === date).reduce((s, p) => s + p.amount, 0);
                const isSelected = date === selectedDate;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected 
                        ? 'bg-primary text-white shadow-md font-bold' 
                        : 'bg-secondary/70 text-text-secondary hover:bg-secondary hover:text-text-primary border border-gray-800/60'
                    }`}
                  >
                    <span>{date === getLocalDateString() ? `Today (${formatDateDDMMYYYY(date)})` : formatDateDDMMYYYY(date)}</span>
                    <span className="font-mono font-semibold">
                      <MaskedAmount amount={daySum} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} showLockIcon={false} />
                    </span>
                  </button>
                );
              }) : (
                <p className="text-text-secondary text-xs italic p-2">No payment history recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Method views with dedicated Tabs & Columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs (All, Cash, Easypaisa, JazzCash, Bank Transfer) */}
          <div className="bg-surface p-2 rounded-2xl shadow-lg border border-gray-800">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Cash', 'Easypaisa', 'JazzCash', 'Bank Transfer'] as LedgerMethodTab[]).map((methodKey) => {
                const meta = TAB_METADATA[methodKey];
                const isActive = activeTab === methodKey;
                const count = methodKey === 'All' 
                  ? dailyPayments.length 
                  : methodKey === 'Cash' 
                    ? dailyBreakdown.cashCount 
                    : methodKey === 'Easypaisa' 
                      ? dailyBreakdown.easyPaisaCount 
                      : methodKey === 'JazzCash' 
                        ? dailyBreakdown.jazzCashCount 
                        : dailyBreakdown.bankTransferCount;

                return (
                  <button
                    key={methodKey}
                    type="button"
                    onClick={() => setActiveTab(methodKey)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                      isActive 
                        ? `${meta.activeTabClass} border-transparent` 
                        : 'bg-secondary/60 hover:bg-secondary text-text-secondary hover:text-text-primary border-gray-800 font-semibold'
                    }`}
                  >
                    <span>{meta.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-black/25 text-white' : 'bg-surface text-gray-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Card with Dedicated Table */}
          <div className="bg-surface rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
            {/* Header Banner */}
            <div className="p-4 bg-secondary/80 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-text-primary">
                    {TAB_METADATA[activeTab].label}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${TAB_METADATA[activeTab].colorClass}`}>
                    {TAB_METADATA[activeTab].badge}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  {TAB_METADATA[activeTab].description} &middot; Date: <span className="font-mono text-text-primary font-bold">{formatDateDDMMYYYY(selectedDate)}</span>
                </p>
              </div>

              {/* Subtotal Badge */}
              <div className="flex items-center gap-2.5 bg-surface px-4 py-2 rounded-xl border border-gray-700 shadow-inner">
                <span className="text-xs text-text-secondary font-semibold uppercase">Total:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  <MaskedAmount amount={activeTabSubtotal} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-3 sm:p-4 border-b border-gray-800 bg-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-[460px]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <SearchIcon className="h-4 w-4" />
                </div>
                <input 
                  type="text"
                  placeholder="Search by Reg No, Member Name, or Details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-secondary/90 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-text-primary placeholder-text-secondary/70 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="text-xs text-text-secondary w-full sm:w-auto text-right font-mono">
                Showing <strong className="text-text-primary">{searchedPayments.length}</strong> of <strong className="text-text-primary">{filteredTabPayments.length}</strong> transactions
              </div>
            </div>

            {/* The Table with Explicit "Reg No" Column */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/60 text-text-secondary text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    {/* Reg No Column with same color/style as Member Name */}
                    <th className="p-3.5 pl-4 w-28">Reg No</th>
                    <th className="p-3.5">Member Name</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5">Amount (PKR)</th>
                    <th className="p-3.5">Notes / Transaction Type</th>
                    <th className="p-3.5 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-xs">
                  {searchedPayments.length > 0 ? searchedPayments.map((p, idx) => {
                    const isAccessory = p.type === 'Accessory' || p.memberRegNo === 'ACC';
                    const memberForPayment = members.find(m => m.id === p.memberId);
                    const category = memberForPayment ? memberForPayment.category : 'Strength';
                    const { text: regText, isAcc } = getDisplayRegNo(p);
                    const normMethod = getNormalizedMethod(p.method);

                    return (
                      <tr key={p.id || idx} className="hover:bg-gray-750/30 transition-colors">
                        {/* REG NO COLUMN - same color as Member Name */}
                        <td className="p-3.5 pl-4">
                          <span className="font-bold text-text-primary font-mono text-xs">
                            {regText}
                          </span>
                        </td>

                        {/* MEMBER NAME COLUMN */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-text-primary flex items-center gap-1.5 text-sm">
                              <span>{p.memberName}</span>
                              {!isAccessory && memberForPayment && (
                                <ConsistentMemberStar member={memberForPayment} size="sm" />
                              )}
                            </span>
                            {!isAccessory && memberForPayment && (
                              <GenderBadge gender={memberForPayment.gender || 'Male'} size="sm" />
                            )}
                            {isAccessory ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Store Sale
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                                {category || 'Strength'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PAYMENT METHOD COLUMN */}
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            normMethod === 'Cash' 
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : normMethod === 'Easypaisa'
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : normMethod === 'JazzCash'
                                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          }`}>
                            <span>{p.method}</span>
                          </span>
                        </td>

                        {/* AMOUNT COLUMN */}
                        <td className="p-3.5 font-mono text-sm font-black text-emerald-400">
                          <MaskedAmount amount={p.amount} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                        </td>

                        {/* NOTES / DETAILS COLUMN */}
                        <td className="p-3.5 text-text-secondary">
                          <div className="font-medium text-gray-300">
                            {p.notes || (isAccessory ? 'Accessory Store Item' : 'Monthly Gym Fee')}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            ID: {p.id.slice(0, 14)}...
                          </div>
                        </td>

                        {/* STATUS COLUMN */}
                        <td className="p-3.5 text-right pr-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/15 text-green-400 border border-green-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            <span>Paid</span>
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-text-secondary italic">
                        {searchQuery.trim() 
                          ? `No transactions match "${searchQuery}" in ${TAB_METADATA[activeTab].label}.` 
                          : `No transactions recorded under ${TAB_METADATA[activeTab].label} for ${formatDateDDMMYYYY(selectedDate)}.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            {searchedPayments.length > 0 && (
              <div className="p-4 bg-secondary/40 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-text-secondary">
                  Showing <strong>{searchedPayments.length}</strong> transactions for <strong>{TAB_METADATA[activeTab].label}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Total Collected:</span>
                  <span className="text-base font-black text-emerald-400 font-mono bg-surface px-3 py-1 rounded-lg border border-gray-700">
                    <MaskedAmount amount={activeTabSubtotal} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLedger;
