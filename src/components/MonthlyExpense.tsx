import React, { useMemo, useState } from 'react';
import { Expense, Payment, AccessorySale } from '../types';
import { TrashIcon, ExpenseIcon, AccessoriesIcon } from './icons';
import { getLocalDateString, getLocalMonthString } from '../lib/dateUtils';
import { MaskedAmount } from './MaskedAmount';

interface MonthlyExpenseProps {
  expenses: Expense[];
  payments: Payment[];
  accessorySales?: AccessorySale[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

const MonthlyExpense: React.FC<MonthlyExpenseProps> = ({
  expenses,
  payments,
  accessorySales,
  onAddExpense,
  onDeleteExpense,
  isUnlocked = false,
  onUnlockRequest,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonthString()); // YYYY-MM
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('General');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => p.date.startsWith(selectedMonth));
  }, [payments, selectedMonth]);

  const monthlyAccessorySales = useMemo(() => {
    return (accessorySales || []).filter(s => s.date.startsWith(selectedMonth));
  }, [accessorySales, selectedMonth]);

  const feePayments = useMemo(() => {
    return filteredPayments.filter(p => p.type !== 'Accessory');
  }, [filteredPayments]);

  const feeRevenue = useMemo(() => {
    return feePayments.reduce((sum, p) => sum + p.amount, 0);
  }, [feePayments]);

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

  const totalRevenue = feeRevenue + accessoryRevenue;

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = totalRevenue - totalExpense;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle || !newExpenseAmount) return;

    onAddExpense({
      title: newExpenseTitle,
      amount: parseFloat(newExpenseAmount),
      date: getLocalDateString(),
      category: newExpenseCategory,
    });

    setNewExpenseTitle('');
    setNewExpenseAmount('');
    setNewExpenseCategory('General');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Monthly Expenses & Profit</h1>
          <p className="text-text-secondary mt-1">Manage gym expenses and track financial performance.</p>
        </div>
        <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg border border-gray-700">
          <label htmlFor="month-select" className="text-text-secondary text-sm font-medium">Month:</label>
          <input
            id="month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-secondary p-1 rounded text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-800">
          <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</h3>
          <div className="text-3xl font-black text-green-400">
            <MaskedAmount amount={totalRevenue} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Fees: <span className="text-text-primary font-mono font-semibold"><MaskedAmount amount={feeRevenue} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} /></span> ({feePayments.length}) • Acc: <span className="text-text-primary font-mono font-semibold"><MaskedAmount amount={accessoryRevenue} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} /></span> ({accessorySalesCount})
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-emerald-500/30 bg-emerald-950/10">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Accessory Profit</h3>
            <AccessoriesIcon className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            +<MaskedAmount amount={accessoryProfit} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
          </div>
          <p className="text-xs text-emerald-400/80 mt-2 font-mono">
            {accessorySalesCount} sale(s) • {accessoryItemsCount} total item(s) sold
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-800">
          <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">Total Expenses</h3>
          <div className="text-3xl font-black text-red-400">
            <MaskedAmount amount={totalExpense} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
          </div>
          <p className="text-xs text-text-secondary mt-2">Recorded expenses for {selectedMonth}</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-primary/30 bg-gradient-to-br from-surface to-primary/5">
          <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">Net Profit</h3>
          <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-primary' : 'text-red-500'}`}>
            <MaskedAmount amount={netProfit} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Total Revenue - Total Expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Expense Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-800 sticky top-8">
            <h2 className="text-xl font-bold mb-6 flex items-center">
               <ExpenseIcon className="mr-2 text-primary h-5 w-5" />
               Add New Expense
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Rent, Electricity, Repairs"
                  className="w-full bg-secondary border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={newExpenseTitle}
                  onChange={(e) => setNewExpenseTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Amount (Rs)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-secondary border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                  <select
                    className="w-full bg-secondary border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Supplements">Supplements</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
              >
                <span>Record Expense</span>
              </button>
            </form>
          </div>
        </div>

        {/* Expense History */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl shadow-lg border border-gray-800 overflow-hidden">
             <div className="p-4 bg-secondary border-b border-gray-700 flex justify-between items-center">
               <h2 className="font-bold text-lg">Expense History for {selectedMonth}</h2>
               <span className="text-xs text-text-secondary uppercase font-semibold">
                 {filteredExpenses.length} Records
               </span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-gray-800/50 text-text-secondary text-[10px] uppercase tracking-widest font-bold">
                   <tr>
                     <th className="p-4">Title</th>
                     <th className="p-4">Category</th>
                     <th className="p-4">Date</th>
                     <th className="p-4">Amount</th>
                     <th className="p-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-700">
                   {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                     <tr key={expense.id} className="hover:bg-gray-700/30 transition-colors">
                       <td className="p-4 font-medium text-text-primary">{expense.title}</td>
                       <td className="p-4">
                         <span className="bg-gray-700 text-text-secondary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                           {expense.category}
                         </span>
                       </td>
                       <td className="p-4 text-sm text-text-secondary font-mono">{expense.date}</td>
                       <td className="p-4 text-red-400 font-bold font-mono">
                         <MaskedAmount amount={expense.amount} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                       </td>
                       <td className="p-4 text-right">
                         <button
                           onClick={() => {
                             if(window.confirm(`Delete expense "${expense.title}"?`)) {
                               onDeleteExpense(expense.id);
                             }
                           }}
                           className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                         >
                           <TrashIcon className="h-5 w-5" />
                         </button>
                       </td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan={5} className="p-12 text-center text-text-secondary italic">
                         No expenses recorded for this month.
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE EXPENSE MODAL */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-full">
                <TrashIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Delete Expense?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary bg-secondary/50 p-3 rounded-xl border border-gray-800">
              Are you sure you want to delete <strong className="text-text-primary">{expenseToDelete.title}</strong> (Rs {expenseToDelete.amount})?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2.5 bg-secondary hover:bg-gray-700 text-text-secondary font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyExpense;
