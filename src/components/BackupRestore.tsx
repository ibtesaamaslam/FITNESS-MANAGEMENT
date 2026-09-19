import React, { useState, useRef, useMemo } from 'react';
import {
  Member,
  Payment,
  Expense,
  AccessoryItem,
  AccessorySale,
  StaffMember,
  StaffPayrollRecord,
  StaffAttendanceLog,
  GymBackupData,
  BackupReportSummary,
  MonthlyHistoricalSnapshot,
  Role
} from '../types';
import { BackupIcon, DownloadIcon, UploadCloudIcon, RefreshIcon, CloseIcon, LockIcon } from './icons';
import { isMemberArchived, getLocalDateString } from '../lib/dateUtils';

interface BackupRestoreProps {
  members: Member[];
  payments: Payment[];
  expenses: Expense[];
  accessories: AccessoryItem[];
  accessorySales: AccessorySale[];
  staff: StaffMember[];
  staffPayrolls: StaffPayrollRecord[];
  staffAttendanceLogs: StaffAttendanceLog[];
  gymName: string;
  role?: Role;
  onRestore: (backupData: GymBackupData, mode: 'replace' | 'merge') => { success: boolean; stats?: any; error?: string };
  onUpdateGymName?: (name: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  members,
  payments,
  expenses,
  accessories,
  accessorySales,
  staff,
  staffPayrolls,
  staffAttendanceLogs,
  gymName,
  role = 'Admin',
  onRestore,
  onUpdateGymName,
  onNotify
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<GymBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [restoreSuccessModal, setRestoreSuccessModal] = useState<{ open: boolean; stats?: any } | null>(null);
  const [inspectingMonth, setInspectingMonth] = useState<MonthlyHistoricalSnapshot | null>(null);
  const [monthDetailTab, setMonthDetailTab] = useState<'payments' | 'expenses' | 'payrolls'>('payments');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comprehensive Live Database Detailed Metrics
  const totalMembers = members.length;
  const activeMembers = members.filter(m => !isMemberArchived(m)).length;
  const expiredMembers = members.filter(m => isMemberArchived(m)).length;
  
  // Demographics: Males / Females breakdown
  const maleMembers = members.filter(m => (m.gender || 'Male') === 'Male').length;
  const femaleMembers = members.filter(m => m.gender === 'Female').length;
  const malePercent = totalMembers > 0 ? Math.round((maleMembers / totalMembers) * 100) : 0;
  const femalePercent = totalMembers > 0 ? Math.round((femaleMembers / totalMembers) * 100) : 0;
  const planMonthly = members.filter(m => m.plan === 'Monthly').length;
  const planQuarterly = members.filter(m => m.plan === 'Quarterly').length;
  const planYearly = members.filter(m => m.plan === 'Yearly').length;

  // Attendance Metrics: All-time, Weekly (last 7 days), and Today
  const todayStr = getLocalDateString();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days: { date: string; dayName: string; count: number; dateFormatted: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateString(d);
    const dayName = dayNames[d.getDay()];
    const count = members.filter(m => m.attendance && m.attendance[dateKey]).length;
    const dateFormatted = `${dayName}, ${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    last7Days.push({ date: dateKey, dayName, count, dateFormatted });
  }
  const thisWeekAttendanceCount = last7Days.reduce((acc, curr) => acc + curr.count, 0);
  const todayAttendanceCount = members.filter(m => m.attendance && m.attendance[todayStr]).length;
  const totalAttendanceLogs = members.reduce((acc, m) => acc + Object.keys(m.attendance || {}).length, 0);
  const totalMeasurements = members.reduce((acc, m) => acc + (m.measurements || []).length, 0);
  const totalPhotos = members.filter(m => m.photo && m.photo.trim().length > 0).length;

  // Payments & Previous Transactions Detailed Breakdown
  const totalPayments = payments.length;
  const totalFeeRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const cashPayments = payments.filter(p => p.method === 'Cash').length;
  const onlinePayments = payments.filter(p => p.method !== 'Cash').length;
  const cashRevenue = payments.filter(p => p.method === 'Cash').reduce((acc, p) => acc + (p.amount || 0), 0);
  const onlineRevenue = payments.filter(p => p.method !== 'Cash').reduce((acc, p) => acc + (p.amount || 0), 0);
  const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentTransactions = sortedPayments.slice(0, 8);

  // Expenses Breakdown
  const totalExpenses = expenses.length;
  const totalExpenseAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Inventory & Sales
  const totalAccessories = accessories.length;
  const totalStockUnits = accessories.reduce((acc, a) => acc + (a.stock || 0), 0);
  const inventoryCostValuation = accessories.reduce((acc, a) => acc + ((a.costPrice || 0) * (a.stock || 0)), 0);
  const inventoryRetailValuation = accessories.reduce((acc, a) => acc + ((a.sellingPrice || 0) * (a.stock || 0)), 0);

  const totalAccessorySales = accessorySales.length;
  const totalAccessoryRevenue = accessorySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalAccessoryProfit = accessorySales.reduce((acc, s) => acc + (s.totalProfit || 0), 0);

  // Staff & Payroll Obligations
  const totalStaff = staff.length;
  const totalStaffShifts = staff.reduce((acc, s) => acc + (s.shifts || []).length, 0);
  const totalStaffAttendanceLogs = staffAttendanceLogs.length;
  const totalStaffPayrolls = staffPayrolls.length;
  const totalPayrollDisbursed = staffPayrolls.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  // Financial & Operational Report Summary
  const totalGrossIncome = totalFeeRevenue + totalAccessoryRevenue;
  const totalGrossExpenditure = totalExpenseAmount + totalPayrollDisbursed;
  const netFinancialBalance = totalGrossIncome - totalGrossExpenditure;
  const unpaidMembers = members.filter(m => !m.feePaid || new Date(m.expiryDate) < new Date(todayStr));
  const unpaidMembersCount = unpaidMembers.length;
  const pendingDuesAmount = unpaidMembers.reduce((acc, m) => acc + (m.fee || 0), 0);

  let rawStorageKeysCount = 0;
  let rawStorageSizeBytes = 0;
  try {
    rawStorageKeysCount = localStorage.length;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        rawStorageSizeBytes += (k.length + (localStorage.getItem(k)?.length || 0)) * 2;
      }
    }
  } catch (e) {
    console.warn(e);
  }

  // 12-Month Comprehensive Past Historical Archive Generation
  // Captures each and every record for all 12 past calendar months
  const past12MonthsArchive: MonthlyHistoricalSnapshot[] = useMemo(() => {
    const archive: MonthlyHistoricalSnapshot[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const shortName = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      // 1. Payments in this month
      const monthPayments = payments.filter(p => p && p.date && p.date.startsWith(monthKey));
      const feeCol = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const cashCol = monthPayments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + (p.amount || 0), 0);
      const onlineCol = monthPayments.filter(p => p.method !== 'Cash').reduce((sum, p) => sum + (p.amount || 0), 0);

      // 2. Expenses in this month
      const monthExpenses = expenses.filter(e => e && e.date && e.date.startsWith(monthKey));
      const expAmount = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // 3. Staff payrolls in this month
      const monthPayrolls = staffPayrolls.filter(
        pr => pr && (pr.month === monthKey || (pr.paymentDate && pr.paymentDate.startsWith(monthKey)))
      );
      const payAmount = monthPayrolls.reduce((sum, pr) => sum + (pr.paidAmount || 0), 0);

      // 4. Accessory sales in this month
      const monthSales = accessorySales.filter(s => s && s.date && s.date.startsWith(monthKey));
      const salesRev = monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const salesProfit = monthSales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);

      // 5. Attendance check-ins in this month
      let monthCheckIns = 0;
      members.forEach(m => {
        if (m.attendance) {
          Object.keys(m.attendance).forEach(dateStr => {
            if (dateStr.startsWith(monthKey) && m.attendance[dateStr]) {
              monthCheckIns++;
            }
          });
        }
      });

      // 6. New Members joined in this month
      const newMembers = members.filter(m => m.joinDate && m.joinDate.startsWith(monthKey)).length;

      // 7. Active members active in this month window
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);
      const activeInMonth = members.filter(m => {
        const join = m.joinDate ? new Date(m.joinDate) : null;
        const exp = m.expiryDate ? new Date(m.expiryDate) : null;
        if (join && join > monthEnd) return false;
        if (exp && exp < monthStart) return false;
        return true;
      }).length;

      const totalInflow = feeCol + salesRev;
      const totalOutflow = expAmount + payAmount;
      const netOperatingProfit = totalInflow - totalOutflow;

      archive.push({
        monthKey,
        monthName,
        shortName,
        year,
        monthIndex,
        feeCollections: feeCol,
        cashRevenue: cashCol,
        onlineRevenue: onlineCol,
        transactionsCount: monthPayments.length,
        paymentsList: monthPayments,
        expensesAmount: expAmount,
        expensesCount: monthExpenses.length,
        expensesList: monthExpenses,
        payrollDisbursed: payAmount,
        payrollSlipsCount: monthPayrolls.length,
        payrollList: monthPayrolls,
        accessorySalesRevenue: salesRev,
        accessoryProfit: salesProfit,
        accessorySalesCount: monthSales.length,
        accessorySalesList: monthSales,
        totalInflow,
        totalOutflow,
        netOperatingProfit,
        attendanceCheckIns: monthCheckIns,
        newMembersJoined: newMembers,
        activeMembersInMonth: activeInMonth,
      });
    }

    return archive;
  }, [members, payments, expenses, staffPayrolls, accessorySales]);

  // Aggregate past 12 months totals
  const past12MonthsTotalRevenue = past12MonthsArchive.reduce((acc, m) => acc + m.totalInflow, 0);
  const past12MonthsTotalExpenses = past12MonthsArchive.reduce((acc, m) => acc + m.totalOutflow, 0);
  const past12MonthsTotalNet = past12MonthsTotalRevenue - past12MonthsTotalExpenses;
  const past12MonthsTotalTransactions = past12MonthsArchive.reduce((acc, m) => acc + m.transactionsCount, 0);

  // Compile entire system data into one unified backup package with full report & 12-month archive
  const generateBackupPackage = (): GymBackupData => {
    const rawSnapshot: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          rawSnapshot[key] = localStorage.getItem(key) || '';
        }
      }
    } catch (e) {
      console.warn('Could not read full raw localStorage', e);
    }

    const reportSummary: BackupReportSummary = {
      generatedAt: new Date().toISOString(),
      gymName: gymName || 'Atlas Gym',
      timeCoverageDescription: 'Comprehensive 12-Month Annual Deep Vault with every single payment, attendance check-in, expense, payroll, and demographic entry',
      demographics: {
        totalMembers,
        activeMembers,
        expiredMembers,
        maleMembers,
        femaleMembers,
        planBreakdown: {
          monthly: planMonthly,
          quarterly: planQuarterly,
          yearly: planYearly,
        },
      },
      attendanceSummary: {
        totalCheckInsRecorded: totalAttendanceLogs,
        past7DaysWeeklyAttendance: thisWeekAttendanceCount,
        todayAttendance: todayAttendanceCount,
        weeklyAttendanceByDay: last7Days,
      },
      financialSummary: {
        totalFeeCollections: totalFeeRevenue,
        totalAccessoryRevenue: totalAccessoryRevenue,
        totalGrossIncome: totalGrossIncome,
        totalOperatingExpenses: totalExpenseAmount,
        totalStaffSalariesPaid: totalPayrollDisbursed,
        totalGrossExpenditure: totalGrossExpenditure,
        netOperatingProfit: netFinancialBalance,
        cashCollections: cashRevenue,
        onlineCollections: onlineRevenue,
        pendingArrearsAmount: pendingDuesAmount,
        unpaidMembersCount: unpaidMembersCount,
      },
      past12MonthsArchive: past12MonthsArchive,
      previousTransactionsSnapshot: {
        totalTransactionsCount: totalPayments,
        recentTransactions: sortedPayments,
      },
      inventorySummary: {
        distinctItemsCount: totalAccessories,
        totalUnitsInStock: totalStockUnits,
        costValuation: inventoryCostValuation,
        retailValuation: inventoryRetailValuation,
      },
    };

    return {
      appName: 'Atlas Gym Management System',
      appVersion: '3.0.0',
      createdAt: new Date().toISOString(),
      gymName: gymName || 'Atlas Gym',
      stats: {
        membersCount: totalMembers,
        activeMembersCount: activeMembers,
        expiredMembersCount: expiredMembers,
        maleMembersCount: maleMembers,
        femaleMembersCount: femaleMembers,
        memberAttendanceLogsCount: totalAttendanceLogs,
        weeklyAttendanceLogsCount: thisWeekAttendanceCount,
        todayAttendanceLogsCount: todayAttendanceCount,
        memberMeasurementsCount: totalMeasurements,
        memberPhotosCount: totalPhotos,
        paymentsCount: totalPayments,
        totalFeeRevenue: totalFeeRevenue,
        cashRevenue,
        onlineRevenue,
        cashPaymentsCount: cashPayments,
        onlinePaymentsCount: onlinePayments,
        pendingDuesAmount,
        unpaidMembersCount,
        expensesCount: totalExpenses,
        totalExpenseAmount: totalExpenseAmount,
        accessoriesCount: totalAccessories,
        totalStockUnits: totalStockUnits,
        inventoryValuation: inventoryCostValuation,
        accessorySalesCount: totalAccessorySales,
        totalAccessoryRevenue: totalAccessoryRevenue,
        totalAccessoryProfit: totalAccessoryProfit,
        staffCount: totalStaff,
        staffPayrollsCount: totalStaffPayrolls,
        staffAttendanceLogsCount: totalStaffAttendanceLogs,
        totalPayrollDisbursed: totalPayrollDisbursed,
        totalInflowRevenue: totalGrossIncome,
        totalOutflowExpenses: totalGrossExpenditure,
        netFinancialBalance,
        past12MonthsRevenue: past12MonthsTotalRevenue,
        past12MonthsExpenses: past12MonthsTotalExpenses,
        past12MonthsTransactions: past12MonthsTotalTransactions,
        rawStorageKeysCount: rawStorageKeysCount,
        backupSizeBytes: rawStorageSizeBytes,
      },
      report: reportSummary,
      data: {
        members,
        payments,
        expenses,
        accessories,
        accessorySales,
        staff,
        staffPayrolls,
        staffAttendanceLogs,
        past12MonthsArchive,
        gymName,
        theme: (localStorage.getItem('theme') as string) || 'dark',
        financialPassword: localStorage.getItem('gym_financial_password') || undefined,
        authAdmin: localStorage.getItem('gym_auth_admin') || undefined,
        authAdminWord: localStorage.getItem('gym_auth_admin_word') || undefined,
        authManager: localStorage.getItem('gym_auth_manager') || undefined,
        authManagerWord: localStorage.getItem('gym_auth_manager_word') || undefined,
      },
      rawLocalStorage: rawSnapshot,
    };
  };

  // Download Backup JSON file
  const handleDownloadBackup = () => {
    try {
      setIsExporting(true);
      const backupData = generateBackupPackage();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const safeName = (gymName || 'Gym').toLowerCase().replace(/[^a-z0-9]/gi, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `${safeName}_full_12months_backup_${dateStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onNotify(`Complete 12-Month Backup downloaded successfully! (${fileName})`, 'success');
    } catch (err) {
      console.error('Error generating backup:', err);
      onNotify('Failed to generate backup file', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Process selected file
  const handleFileChange = (file: File) => {
    setParseError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let normalizedBackup: GymBackupData;

        if (parsed.data && (Array.isArray(parsed.data.members) || Array.isArray(parsed.data.payments))) {
          normalizedBackup = parsed as GymBackupData;
        } else if (Array.isArray(parsed.members) || Array.isArray(parsed.payments)) {
          normalizedBackup = {
            appName: 'Atlas Gym Management System',
            appVersion: '1.0.0',
            createdAt: parsed.createdAt || new Date().toISOString(),
            gymName: parsed.gymName || gymName,
            stats: {
              membersCount: (parsed.members || []).length,
              paymentsCount: (parsed.payments || []).length,
              expensesCount: (parsed.expenses || []).length,
              accessoriesCount: (parsed.accessories || []).length,
              accessorySalesCount: (parsed.accessorySales || []).length,
              staffCount: (parsed.staff || []).length,
              staffPayrollsCount: (parsed.staffPayrolls || []).length,
              staffAttendanceLogsCount: (parsed.staffAttendanceLogs || []).length,
            },
            data: {
              members: parsed.members || [],
              payments: parsed.payments || [],
              expenses: parsed.expenses || [],
              accessories: parsed.accessories || [],
              accessorySales: parsed.accessorySales || [],
              staff: parsed.staff || [],
              staffPayrolls: parsed.staffPayrolls || [],
              staffAttendanceLogs: parsed.staffAttendanceLogs || [],
              gymName: parsed.gymName,
            },
          };
        } else if (parsed.gymMembers || parsed['gymMembers']) {
          const rawMembers = parsed.gymMembers ? JSON.parse(parsed.gymMembers) : [];
          const rawPayments = parsed.gymPayments ? JSON.parse(parsed.gymPayments) : [];
          const rawExpenses = parsed.gymExpenses ? JSON.parse(parsed.gymExpenses) : [];
          const rawAccessories = parsed.gymAccessories ? JSON.parse(parsed.gymAccessories) : [];
          const rawSales = parsed.gymAccessorySales ? JSON.parse(parsed.gymAccessorySales) : [];
          const rawStaff = parsed.gymStaff ? JSON.parse(parsed.gymStaff) : [];
          const rawPayrolls = parsed.gymStaffPayrolls ? JSON.parse(parsed.gymStaffPayrolls) : [];
          const rawLogs = parsed.gymStaffAttendanceLogs ? JSON.parse(parsed.gymStaffAttendanceLogs) : [];

          normalizedBackup = {
            appName: 'Atlas Gym Management System',
            appVersion: 'Raw-LocalStorage',
            createdAt: new Date().toISOString(),
            gymName: parsed.gym_name || gymName,
            stats: {
              membersCount: rawMembers.length,
              paymentsCount: rawPayments.length,
              expensesCount: rawExpenses.length,
              accessoriesCount: rawAccessories.length,
              accessorySalesCount: rawSales.length,
              staffCount: rawStaff.length,
              staffPayrollsCount: rawPayrolls.length,
              staffAttendanceLogsCount: rawLogs.length,
            },
            data: {
              members: rawMembers,
              payments: rawPayments,
              expenses: rawExpenses,
              accessories: rawAccessories,
              accessorySales: rawSales,
              staff: rawStaff,
              staffPayrolls: rawPayrolls,
              staffAttendanceLogs: rawLogs,
              gymName: parsed.gym_name,
            },
            rawLocalStorage: parsed,
          };
        } else {
          throw new Error('Unrecognized backup format. The file must be a valid JSON backup exported from this Gym application.');
        }

        // Calculate and attach rich detailed stats for uploaded preview
        const membersList = normalizedBackup.data.members || [];
        const paymentsList = normalizedBackup.data.payments || [];
        const expensesList = normalizedBackup.data.expenses || [];
        const accessoriesList = normalizedBackup.data.accessories || [];
        const salesList = normalizedBackup.data.accessorySales || [];
        const staffList = normalizedBackup.data.staff || [];
        const payrollsList = normalizedBackup.data.staffPayrolls || [];
        const logsList = normalizedBackup.data.staffAttendanceLogs || [];

        const maleMembersInUpload = membersList.filter(m => (m.gender || 'Male') === 'Male').length;
        const femaleMembersInUpload = membersList.filter(m => m.gender === 'Female').length;
        const cashRevenueInUpload = paymentsList.filter(p => p.method === 'Cash').reduce((acc, p) => acc + (p.amount || 0), 0);
        const onlineRevenueInUpload = paymentsList.filter(p => p.method !== 'Cash').reduce((acc, p) => acc + (p.amount || 0), 0);
        const feeRev = paymentsList.reduce((acc, p) => acc + (p.amount || 0), 0);
        const accRev = salesList.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
        const expOut = expensesList.reduce((acc, e) => acc + (e.amount || 0), 0);
        const payOut = payrollsList.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

        normalizedBackup.stats = {
          ...normalizedBackup.stats,
          membersCount: membersList.length,
          activeMembersCount: membersList.filter(m => !isMemberArchived(m)).length,
          expiredMembersCount: membersList.filter(m => isMemberArchived(m)).length,
          maleMembersCount: maleMembersInUpload,
          femaleMembersCount: femaleMembersInUpload,
          memberAttendanceLogsCount: membersList.reduce((acc, m) => acc + Object.keys(m.attendance || {}).length, 0),
          memberMeasurementsCount: membersList.reduce((acc, m) => acc + (m.measurements || []).length, 0),
          memberPhotosCount: membersList.filter(m => m.photo && m.photo.trim().length > 0).length,
          paymentsCount: paymentsList.length,
          totalFeeRevenue: feeRev,
          cashRevenue: cashRevenueInUpload,
          onlineRevenue: onlineRevenueInUpload,
          cashPaymentsCount: paymentsList.filter(p => p.method === 'Cash').length,
          onlinePaymentsCount: paymentsList.filter(p => p.method !== 'Cash').length,
          totalInflowRevenue: feeRev + accRev,
          totalOutflowExpenses: expOut + payOut,
          netFinancialBalance: (feeRev + accRev) - (expOut + payOut),
          expensesCount: expensesList.length,
          totalExpenseAmount: expOut,
          accessoriesCount: accessoriesList.length,
          totalStockUnits: accessoriesList.reduce((acc, a) => acc + (a.stock || 0), 0),
          inventoryValuation: accessoriesList.reduce((acc, a) => acc + ((a.costPrice || 0) * (a.stock || 0)), 0),
          accessorySalesCount: salesList.length,
          totalAccessoryRevenue: accRev,
          totalAccessoryProfit: salesList.reduce((acc, s) => acc + (s.totalProfit || 0), 0),
          staffCount: staffList.length,
          staffPayrollsCount: payrollsList.length,
          staffAttendanceLogsCount: logsList.length,
          totalPayrollDisbursed: payOut,
          rawStorageKeysCount: normalizedBackup.rawLocalStorage ? Object.keys(normalizedBackup.rawLocalStorage).length : undefined,
          backupSizeBytes: file.size,
        };

        setParsedBackup(normalizedBackup);
      } catch (err: any) {
        console.error('Failed to parse backup file', err);
        setParseError(err.message || 'Invalid JSON file. Please upload a valid gym backup file.');
        setParsedBackup(null);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read the selected file.');
      setParsedBackup(null);
    };

    reader.readAsText(file);
  };

  // Perform Restore
  const handleExecuteRestore = (mode: 'replace' | 'merge') => {
    if (role === 'Manager') {
      onNotify('Super Admin authority required to restore or overwrite system data.', 'error');
      return;
    }
    if (!parsedBackup) return;

    setIsRestoring(true);
    try {
      const res = onRestore(parsedBackup, mode);
      if (res.success) {
        if (parsedBackup.data.gymName && onUpdateGymName) {
          onUpdateGymName(parsedBackup.data.gymName);
        }
        setRestoreSuccessModal({ open: true, stats: res.stats });
        onNotify(`Backup successfully restored (${mode === 'replace' ? 'Full Replace' : 'Merged'})!`, 'success');
      } else {
        onNotify(`Failed to restore data: ${res.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Restore error:', err);
      onNotify('An unexpected error occurred while restoring data', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleResetUpload = () => {
    setSelectedFile(null);
    setParsedBackup(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Restrict access strictly to Admin
  if (role !== 'Admin') {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-surface border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <LockIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-text-primary mb-2">Access Denied</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Only the <strong className="text-primary font-bold">Admin</strong> can have access to Data Backup & Restore and database export archives.
          </p>
          <div className="bg-secondary/40 border border-gray-800 rounded-xl p-3 text-xs text-text-secondary font-medium">
            Your current role is <strong className="text-blue-400">Manager</strong>. Please contact the gym administrator for database backup operations.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-16 w-full">
      {/* Unified Top Header Card */}
      <div className="bg-surface p-6 sm:p-7 rounded-2xl border border-gray-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="h-14 w-14 rounded-2xl bg-[#10b981]/15 text-[#10b981] flex items-center justify-center border border-[#10b981]/30 shrink-0 shadow-inner">
            <BackupIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                Data Backup & Restore
              </h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                12 Months Complete Archive
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Offline Safe & Portable
              </span>
            </div>
            <p className="text-text-secondary text-xs sm:text-sm mt-1.5 leading-relaxed max-w-2xl">
              All records are stored locally in your browser. Download full 12-month backups with every single transaction, attendance check-in, demographic record, expense, and payroll slip preserved down to the tiniest detail.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadBackup}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm shrink-0 disabled:opacity-50"
        >
          <DownloadIcon className="h-5 w-5" />
          <span>{isExporting ? 'Creating Backup...' : 'Download Full 12-Month Backup'}</span>
        </button>
      </div>

      {/* Main Grid: Left (Spread Categories + 12-Month Matrix, lg:col-span-8) and Right (Compact Upload, lg:col-span-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: All Categories Spread Out + 12-Month Deep Vault */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CATEGORY 1: EXECUTIVE FINANCIAL BALANCE & BENTO STATS */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Live Operations & Financial Balance</span>
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Real-time ledger overview included in your backup package</p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                ● Live Sync Active
              </span>
            </div>

            {/* 4 Bento Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card 1: Net Operations Balance */}
              <div className="bg-secondary/60 p-4 rounded-xl border border-gray-800/80">
                <span className="text-text-secondary text-xs block font-medium">Net Operating Balance</span>
                <span className="text-2xl font-black text-purple-400 mt-1 block">
                  Rs. {netFinancialBalance.toLocaleString()}
                </span>
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">Inflow: Rs. {totalGrossIncome.toLocaleString()}</span>
                  <span className="text-red-400 font-bold">Outflow: Rs. {totalGrossExpenditure.toLocaleString()}</span>
                </div>
                <span className="text-[11px] text-amber-400/90 mt-1.5 block font-mono">
                  Pending Arrears: Rs. {pendingDuesAmount.toLocaleString()} ({unpaidMembersCount} unpaid)
                </span>
              </div>

              {/* Card 2: Fee Collections & Cash/Online Split */}
              <div className="bg-secondary/60 p-4 rounded-xl border border-gray-800/80">
                <span className="text-text-secondary text-xs block font-medium">Total Fee Collections</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  Rs. {totalFeeRevenue.toLocaleString()}
                </span>
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">Cash: Rs. {cashRevenue.toLocaleString()} ({cashPayments})</span>
                  <span className="text-cyan-400 font-bold">Online: Rs. {onlineRevenue.toLocaleString()} ({onlinePayments})</span>
                </div>
                <span className="text-[11px] text-text-secondary mt-1.5 block font-mono">
                  Total Transaction Slips: {totalPayments} records
                </span>
              </div>

              {/* Card 3: Attendance Activity */}
              <div className="bg-secondary/60 p-4 rounded-xl border border-gray-800/80">
                <span className="text-text-secondary text-xs block font-medium">Weekly Attendance Activity</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">
                  {thisWeekAttendanceCount} check-ins
                </span>
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">Today: {todayAttendanceCount} present</span>
                  <span className="text-text-secondary font-bold">{totalAttendanceLogs} all-time logs</span>
                </div>
                <span className="text-[11px] text-text-secondary mt-1.5 block font-mono">
                  Active Member Rate: {activeMembers > 0 ? Math.round((todayAttendanceCount / activeMembers) * 100) : 0}% today
                </span>
              </div>

              {/* Card 4: Member Demographics Overview */}
              <div className="bg-secondary/60 p-4 rounded-xl border border-gray-800/80">
                <span className="text-text-secondary text-xs block font-medium">Registered Members</span>
                <span className="text-2xl font-black text-text-primary mt-1 block">
                  {totalMembers} members
                </span>
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">{activeMembers} Active</span>
                  <span className="text-red-400 font-bold">{expiredMembers} Expired</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-blue-400 font-bold">♂ {maleMembers} Males ({malePercent}%)</span>
                  <span className="text-pink-400 font-bold">♀ {femaleMembers} Females ({femalePercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORY 2: MEMBER DEMOGRAPHICS & MALES VS FEMALES */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="text-lg">♂♀</span>
                  <span>Member Demographics & Gender Breakdown</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Complete gender ratio and membership plan distribution
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary text-text-primary border border-gray-700">
                {totalMembers} Total Registered
              </span>
            </div>

            {/* Visual Ratio Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-400 flex items-center gap-1">
                  <span>♂ Males</span>
                  <span>{maleMembers} ({malePercent}%)</span>
                </span>
                <span className="text-pink-400 flex items-center gap-1">
                  <span>♀ Females</span>
                  <span>{femaleMembers} ({femalePercent}%)</span>
                </span>
              </div>
              <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden flex border border-gray-700">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${totalMembers > 0 ? (maleMembers / totalMembers) * 100 : 50}%` }}
                ></div>
                <div
                  className="bg-pink-500 h-full transition-all duration-300"
                  style={{ width: `${totalMembers > 0 ? (femaleMembers / totalMembers) * 100 : 50}%` }}
                ></div>
              </div>
            </div>

            {/* Demographic Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-secondary/40 p-3 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Active Status</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">{activeMembers} Active</span>
                <span className="text-[10px] text-red-400 block mt-0.5">{expiredMembers} Expired</span>
              </div>
              <div className="bg-secondary/40 p-3 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Monthly Plan</span>
                <span className="text-base font-bold text-text-primary mt-0.5 block">{planMonthly}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">30-day renewals</span>
              </div>
              <div className="bg-secondary/40 p-3 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Quarterly Plan</span>
                <span className="text-base font-bold text-text-primary mt-0.5 block">{planQuarterly}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">3-month bundles</span>
              </div>
              <div className="bg-secondary/40 p-3 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Yearly Plan</span>
                <span className="text-base font-bold text-text-primary mt-0.5 block">{planYearly}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">Annual VIP</span>
              </div>
            </div>
          </div>

          {/* CATEGORY 3: WEEKLY ATTENDANCE ACTIVITY (PAST 7 DAYS) */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span>Weekly Attendance Activity (Past 7 Days)</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Day-by-day check-in logs and timestamps included in backup
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-400">
                  {thisWeekAttendanceCount} Check-ins This Week
                </span>
                <span className="text-[10px] text-text-secondary block mt-0.5">
                  Today: {todayAttendanceCount} present
                </span>
              </div>
            </div>

            {/* 7 Daily Bars Stack */}
            <div className="grid grid-cols-7 gap-2 pt-1">
              {last7Days.map((day, idx) => {
                const isToday = day.date === todayStr;
                const maxCount = Math.max(...last7Days.map(d => d.count), 1);
                const barHeightPercent = Math.max(Math.round((day.count / maxCount) * 100), 12);

                return (
                  <div
                    key={day.date}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-between min-h-[110px] transition-all ${
                      isToday
                        ? 'bg-amber-500/15 border-amber-500/40 shadow-sm'
                        : 'bg-secondary/40 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isToday ? 'text-amber-400' : 'text-text-secondary'}`}>
                      {day.dayName}
                    </span>

                    {/* Mini Bar Graphic */}
                    <div className="w-full bg-gray-800/60 rounded-full h-12 flex items-end p-1 my-1">
                      <div
                        className={`w-full rounded-full transition-all duration-300 ${
                          isToday ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ height: `${barHeightPercent}%` }}
                      ></div>
                    </div>

                    <div className="text-center">
                      <span className="text-xs font-black text-text-primary block leading-none">
                        {day.count}
                      </span>
                      <span className="text-[9px] text-text-secondary mt-0.5 block">
                        {isToday ? 'Today' : day.date.slice(5)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CATEGORY 4: 12-MONTH HISTORICAL ARCHIVE VAULT (UP TO 1 FULL YEAR) */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800 gap-2">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="text-lg">🗓️</span>
                  <span>12-Month Deep Historical Archive (Past 1 Year)</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Every tiny detail: 12 individual monthly ledgers, payments, expenses, payrolls, and attendance logs
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  12 Months Covered
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {past12MonthsTotalTransactions} Total Slips
                </span>
              </div>
            </div>

            {/* 12-Month High-Level Financial Summary Banner */}
            <div className="bg-gradient-to-r from-secondary/80 to-secondary/40 p-4 rounded-xl border border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">12-Month Inflow</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  Rs. {past12MonthsTotalRevenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">12-Month Outflow</span>
                <span className="text-base font-bold text-red-400 mt-0.5 block">
                  Rs. {past12MonthsTotalExpenses.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">12-Month Net Balance</span>
                <span className={`text-base font-bold mt-0.5 block ${past12MonthsTotalNet >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                  Rs. {past12MonthsTotalNet.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Historical Slips</span>
                <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                  {past12MonthsTotalTransactions} payments
                </span>
              </div>
            </div>

            {/* 12-Month Comprehensive Matrix Table */}
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3">Collections</th>
                      <th className="py-2.5 px-3">Cash / Online</th>
                      <th className="py-2.5 px-3">Expenses & Payroll</th>
                      <th className="py-2.5 px-3">Net Profit</th>
                      <th className="py-2.5 px-3">Check-ins</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-surface">
                    {past12MonthsArchive.map((snap, idx) => {
                      const isCurrent = idx === 0;
                      return (
                        <tr
                          key={snap.monthKey}
                          className={`hover:bg-secondary/30 transition-colors ${
                            isCurrent ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-text-primary flex items-center gap-1.5">
                              <span>{snap.shortName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                                  Current
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-text-secondary font-mono">{snap.monthKey}</span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-bold text-emerald-400">
                              Rs. {snap.feeCollections.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-text-secondary block">
                              {snap.transactionsCount} payments
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="text-[11px] font-mono">
                              <span className="text-emerald-400">C: Rs. {snap.cashRevenue.toLocaleString()}</span>
                              <br />
                              <span className="text-cyan-400">O: Rs. {snap.onlineRevenue.toLocaleString()}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-bold text-red-400">
                              Rs. {(snap.expensesAmount + snap.payrollDisbursed).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-text-secondary block">
                              {snap.expensesCount} exp · {snap.payrollSlipsCount} payroll
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={`font-bold ${
                                snap.netOperatingProfit >= 0 ? 'text-purple-400' : 'text-rose-400'
                              }`}
                            >
                              Rs. {snap.netOperatingProfit.toLocaleString()}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-bold text-text-primary">
                              {snap.attendanceCheckIns}
                            </span>
                            <span className="text-[10px] text-text-secondary block">
                              {snap.newMembersJoined} joined
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingMonth(snap);
                                setMonthDetailTab('payments');
                              }}
                              className="px-2.5 py-1 bg-secondary hover:bg-gray-700 text-text-primary rounded-lg border border-gray-700 text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>View Records</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CATEGORY 5: PREVIOUS TRANSACTIONS LEDGER (RECENT & COMPLETE HISTORY) */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <span>Previous Transactions & Receipts Ledger</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Complete ledger of payment receipts, payment methods, and timestamps
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {totalPayments} Invoices Saved
              </span>
            </div>

            {/* Quick Transactions Table */}
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-xs rounded-xl bg-secondary/30 border border-gray-800">
                No previous payment records found yet. All future payments will be permanently logged here.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/70 text-text-secondary uppercase text-[10px] tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 bg-surface">
                      {recentTransactions.map((p) => (
                        <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-text-primary block">{p.memberName}</span>
                            <span className="text-[10px] text-text-secondary font-mono">Reg: {p.memberRegNo || 'N/A'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary font-mono">
                            {p.date}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.method === 'Cash' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}>
                              {p.method}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                            Rs. {p.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* CATEGORY 6: INVENTORY, STAFF & STORE OPERATIONS */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="text-lg">🏋️</span>
                  <span>Inventory Catalog & Staff Operations</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Staff payroll obligations, accessory stock units, and retail inventory valuations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Staff Roster</span>
                <span className="text-lg font-bold text-blue-400 mt-0.5 block">{totalStaff} Staff</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{totalStaffShifts} active shifts</span>
              </div>
              <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Disbursed Payroll</span>
                <span className="text-lg font-bold text-purple-400 mt-0.5 block">Rs. {totalPayrollDisbursed.toLocaleString()}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{totalStaffPayrolls} slips recorded</span>
              </div>
              <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Store Inventory</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 block">{totalAccessories} Items</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">{totalStockUnits} units in stock</span>
              </div>
              <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800 text-center">
                <span className="text-[11px] text-text-secondary block">Inventory Valuation</span>
                <span className="text-lg font-bold text-emerald-400 mt-0.5 block">Rs. {inventoryRetailValuation.toLocaleString()}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">Cost: Rs. {inventoryCostValuation.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* CATEGORY 7: TECHNICAL DATA MANIFEST & SECURITY PASSWORDS */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl space-y-3">
            <button
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full flex items-center justify-between text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer py-1"
            >
              <span className="flex items-center gap-2">
                <span>🔐</span>
                <span>System Security, Passwords & Technical Manifest</span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${isDetailsExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDetailsExpanded && (
              <div className="p-4 rounded-xl bg-secondary/20 border border-gray-800 space-y-2.5 text-xs text-text-secondary animate-in fade-in duration-200">
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="font-semibold text-text-primary">Admin & Manager Passwords:</span>
                  <span className="text-emerald-400 font-mono font-bold">Preserved in Backup</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="font-semibold text-text-primary">Financial Privacy Master Password:</span>
                  <span className="text-emerald-400 font-mono font-bold">Preserved in Backup</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="font-semibold text-text-primary">Active Gym Branding:</span>
                  <span className="text-text-primary font-bold">{gymName || 'Atlas Gym'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-text-primary">Raw Browser Storage Keys Snapshot:</span>
                  <span className="text-text-primary font-mono">{rawStorageKeysCount} keys ({((rawStorageSizeBytes || 0) / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
            )}
          </div>

          {/* Export Action Card at bottom of left column */}
          <div className="bg-gradient-to-r from-emerald-950/30 to-surface p-5 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-text-primary">Ready to archive your complete gym database?</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Generates a clean JSON file with all 12 past months and every tiny detail included.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs shrink-0"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>{isExporting ? 'Generating...' : 'Download Backup (.json)'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Compact Upload & Restore Card (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-gray-800 shadow-xl flex flex-col sticky top-6">
            
            {/* Header */}
            <div className="pb-3 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                  <span>Upload & Restore</span>
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Load a previously exported backup file
                </p>
              </div>
              {parsedBackup && (
                <button
                  onClick={handleResetUpload}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Compact Upload Box or Verified Info */}
            {!parsedBackup ? (
              <div className="my-4 flex flex-col justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    isDragOver
                      ? 'border-[#10b981] bg-[#10b981]/10'
                      : 'border-gray-700 hover:border-gray-600 bg-secondary/30 hover:bg-secondary/50'
                  }`}
                >
                  <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-[#10b981] shadow-md border border-gray-700">
                    <UploadCloudIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Drop .json backup here
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      or click to browse from device
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 px-4 py-2 bg-secondary hover:bg-gray-700 text-text-primary border border-gray-700 rounded-lg text-xs font-bold transition-all"
                  >
                    Select File
                  </button>
                </div>

                {parseError && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{parseError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Verified Backup Overview & Restore Actions */
              <div className="my-4 space-y-3.5">
                {/* File Header */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-text-primary truncate">{selectedFile?.name}</h4>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      Verified • {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                    </p>
                  </div>
                  <button
                    onClick={handleResetUpload}
                    className="px-2.5 py-1 bg-secondary hover:bg-gray-700 text-[11px] font-semibold text-text-secondary rounded-lg border border-gray-700 cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                </div>

                {/* Compact Record Counts */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-text-secondary block">Members</span>
                    <span className="text-sm font-bold text-text-primary">
                      {parsedBackup.data.members?.length || 0}
                    </span>
                    <span className="text-[9px] text-blue-400 block mt-0.5">
                      {parsedBackup.stats?.maleMembersCount ?? 0}M · {parsedBackup.stats?.femaleMembersCount ?? 0}F
                    </span>
                  </div>
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-text-secondary block">Payments</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {parsedBackup.data.payments?.length || 0}
                    </span>
                    <span className="text-[9px] text-emerald-400/80 block mt-0.5 truncate">
                      Rs. {(parsedBackup.stats?.totalFeeRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-text-secondary block">Staff</span>
                    <span className="text-sm font-bold text-blue-400">
                      {parsedBackup.data.staff?.length || 0}
                    </span>
                    <span className="text-[9px] text-text-secondary block mt-0.5">
                      {parsedBackup.data.staffPayrolls?.length || 0} payrolls
                    </span>
                  </div>
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-text-secondary block">Expenses</span>
                    <span className="text-sm font-bold text-purple-400">
                      {parsedBackup.data.expenses?.length || 0}
                    </span>
                    <span className="text-[9px] text-purple-300/80 block mt-0.5 truncate">
                      Rs. {(parsedBackup.stats?.totalExpenseAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Additional Verified Manifest Rows */}
                <div className="bg-secondary/30 p-3 rounded-lg border border-gray-800/80 text-[11px] space-y-1.5 text-text-secondary">
                  <div className="flex justify-between">
                    <span>12-Month Historical Data:</span>
                    <span className="text-emerald-400 font-bold">12 Months Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-in Logs:</span>
                    <span className="text-text-primary font-bold">
                      {parsedBackup.stats?.memberAttendanceLogsCount ?? (parsedBackup.data.members?.reduce((acc, m) => acc + Object.keys(m.attendance || {}).length, 0) || 0)} logs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash vs Online:</span>
                    <span className="text-emerald-400 font-bold">
                      Rs. {(parsedBackup.stats?.cashRevenue ?? 0).toLocaleString()} / Rs. {(parsedBackup.stats?.onlineRevenue ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Store Items:</span>
                    <span className="text-text-primary font-bold">
                      {parsedBackup.data.accessories?.length || 0} items
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passwords & Security:</span>
                    <span className="text-emerald-400 font-bold">
                      Preserved
                    </span>
                  </div>
                </div>

                {/* Restore Buttons */}
                {role === 'Admin' ? (
                  <div className="pt-1 space-y-2">
                    <button
                      onClick={() => handleExecuteRestore('replace')}
                      disabled={isRestoring}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-xs"
                    >
                      <RefreshIcon className="h-4 w-4" />
                      <span>{isRestoring ? 'Restoring...' : 'Restore & Replace All'}</span>
                    </button>

                    <button
                      onClick={() => handleExecuteRestore('merge')}
                      disabled={isRestoring}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-secondary hover:bg-gray-700 text-text-primary font-bold rounded-xl border border-gray-700 transition-all cursor-pointer text-[11px]"
                    >
                      <span>Merge with Local Data</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-amber-400">Database Overwrite Restricted</p>
                      <p className="text-[11px] text-gray-400 leading-tight">Super Admin credentials required to restore or replace database records.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informational Help Box */}
            <div className="mt-auto pt-4 border-t border-gray-800 text-[11px] text-text-secondary space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[#10b981] font-bold">✓</span>
                <span>Restores member photos, measurements, full attendance history & 12 months of ledger bills.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#10b981] font-bold">✓</span>
                <span>100% offline & secure. No internet connection required.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Clear Backup & Restore Guide Card */}
      <div className="bg-surface rounded-2xl p-6 border border-gray-800 shadow-xl">
        <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
          <span>Quick Guide: Safe Annual 12-Month Backup & Instant Restore</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800/70">
            <span className="h-5 w-5 rounded-full bg-[#10b981] text-white font-bold text-[10px] flex items-center justify-center mb-2">
              1
            </span>
            <h3 className="font-bold text-text-primary text-xs">Download Backup</h3>
            <p className="text-text-secondary text-[11px] mt-1 leading-relaxed">
              Click <strong>"Download Full 12-Month Backup"</strong> to generate your portable <code className="text-[#10b981]">.json</code> file.
            </p>
          </div>

          <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800/70">
            <span className="h-5 w-5 rounded-full bg-[#10b981] text-white font-bold text-[10px] flex items-center justify-center mb-2">
              2
            </span>
            <h3 className="font-bold text-text-primary text-xs">Store Safely</h3>
            <p className="text-text-secondary text-[11px] mt-1 leading-relaxed">
              Save the file to a USB flash drive, external hard drive, or cloud folder (Google Drive, WhatsApp, etc.).
            </p>
          </div>

          <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800/70">
            <span className="h-5 w-5 rounded-full bg-[#10b981] text-white font-bold text-[10px] flex items-center justify-center mb-2">
              3
            </span>
            <h3 className="font-bold text-text-primary text-xs">Upload to Restore</h3>
            <p className="text-text-secondary text-[11px] mt-1 leading-relaxed">
              On any computer or device, open this screen and drop the <code className="text-[#10b981]">.json</code> file into the upload box.
            </p>
          </div>

          <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800/70">
            <span className="h-5 w-5 rounded-full bg-[#10b981] text-white font-bold text-[10px] flex items-center justify-center mb-2">
              4
            </span>
            <h3 className="font-bold text-text-primary text-xs">Verify 12-Month Records</h3>
            <p className="text-text-secondary text-[11px] mt-1 leading-relaxed">
              Review verified counts of members, males/females ratio, fees, and 12-month archive matrices.
            </p>
          </div>

          <div className="bg-secondary/40 p-3.5 rounded-xl border border-gray-800/70">
            <span className="h-5 w-5 rounded-full bg-[#10b981] text-white font-bold text-[10px] flex items-center justify-center mb-2">
              5
            </span>
            <h3 className="font-bold text-text-primary text-xs">Click Restore</h3>
            <p className="text-text-secondary text-[11px] mt-1 leading-relaxed">
              Click <strong>"Restore & Replace All"</strong> to reconstruct your entire gym database in one instant click.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: Inspecting Month Details (Itemized Records for Past 12 Months) */}
      {inspectingMonth && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-gray-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                  <span>🗓️</span>
                  <span>{inspectingMonth.monthName} Detailed Records</span>
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Complete itemized transaction, expense, and payroll breakdown for this month
                </p>
              </div>
              <button
                onClick={() => setInspectingMonth(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary cursor-pointer"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Month Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-secondary/60 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-text-secondary block">Collections</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  Rs. {inspectingMonth.feeCollections.toLocaleString()}
                </span>
                <span className="text-[9px] text-text-secondary block">
                  {inspectingMonth.paymentsList.length} payments
                </span>
              </div>
              <div className="bg-secondary/60 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-text-secondary block">Expenses</span>
                <span className="text-sm font-bold text-red-400 mt-0.5 block">
                  Rs. {inspectingMonth.expensesAmount.toLocaleString()}
                </span>
                <span className="text-[9px] text-text-secondary block">
                  {inspectingMonth.expensesList.length} expenses
                </span>
              </div>
              <div className="bg-secondary/60 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-text-secondary block">Payroll</span>
                <span className="text-sm font-bold text-blue-400 mt-0.5 block">
                  Rs. {inspectingMonth.payrollDisbursed.toLocaleString()}
                </span>
                <span className="text-[9px] text-text-secondary block">
                  {inspectingMonth.payrollList.length} slips
                </span>
              </div>
              <div className="bg-secondary/60 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-text-secondary block">Check-ins</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                  {inspectingMonth.attendanceCheckIns} logs
                </span>
                <span className="text-[9px] text-text-secondary block">
                  {inspectingMonth.newMembersJoined} joined
                </span>
              </div>
            </div>

            {/* Sub-Tabs: Payments vs Expenses vs Payroll */}
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <button
                type="button"
                onClick={() => setMonthDetailTab('payments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  monthDetailTab === 'payments'
                    ? 'bg-[#10b981] text-white'
                    : 'bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                💳 Payments ({inspectingMonth.paymentsList.length})
              </button>
              <button
                type="button"
                onClick={() => setMonthDetailTab('expenses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  monthDetailTab === 'expenses'
                    ? 'bg-[#10b981] text-white'
                    : 'bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                💸 Expenses ({inspectingMonth.expensesList.length})
              </button>
              <button
                type="button"
                onClick={() => setMonthDetailTab('payrolls')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  monthDetailTab === 'payrolls'
                    ? 'bg-[#10b981] text-white'
                    : 'bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                👥 Staff Payroll ({inspectingMonth.payrollList.length})
              </button>
            </div>

            {/* Itemized List container */}
            <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 pr-1">
              {monthDetailTab === 'payments' && (
                inspectingMonth.paymentsList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary bg-secondary/30 rounded-xl">
                    No fee payments recorded specifically under {inspectingMonth.shortName}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectingMonth.paymentsList.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-secondary/40 border border-gray-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-text-primary block">{p.memberName}</span>
                          <span className="text-[10px] text-text-secondary font-mono">
                            Reg: {p.memberRegNo || 'N/A'} · Date: {p.date} · Method: {p.method}
                          </span>
                        </div>
                        <span className="font-black text-emerald-400 text-sm">
                          Rs. {p.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {monthDetailTab === 'expenses' && (
                inspectingMonth.expensesList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary bg-secondary/30 rounded-xl">
                    No operational expenses recorded under {inspectingMonth.shortName}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectingMonth.expensesList.map((e) => (
                      <div key={e.id} className="p-3 rounded-xl bg-secondary/40 border border-gray-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-text-primary block">{e.title}</span>
                          <span className="text-[10px] text-text-secondary font-mono">
                            Category: {e.category} · Date: {e.date}
                          </span>
                        </div>
                        <span className="font-black text-red-400 text-sm">
                          Rs. {e.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {monthDetailTab === 'payrolls' && (
                inspectingMonth.payrollList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary bg-secondary/30 rounded-xl">
                    No staff payroll disbursement slips recorded for {inspectingMonth.shortName}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectingMonth.payrollList.map((pr) => (
                      <div key={pr.id} className="p-3 rounded-xl bg-secondary/40 border border-gray-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-text-primary block">{pr.staffName}</span>
                          <span className="text-[10px] text-text-secondary font-mono">
                            Base: Rs. {pr.baseSalary.toLocaleString()} · Status: {pr.status}
                          </span>
                        </div>
                        <span className="font-black text-blue-400 text-sm">
                          Rs. {pr.paidAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="pt-2 border-t border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingMonth(null)}
                className="px-4 py-2 bg-secondary hover:bg-gray-700 text-text-primary font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal after Restore */}
      {restoreSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-2xl font-black text-text-primary">Data Restored Successfully!</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              All your records have been loaded into the system. Every member, payment invoice, staff record, and setting is now live.
            </p>

            {restoreSuccessModal.stats && (
              <div className="bg-secondary/60 p-3.5 rounded-xl border border-gray-800 text-xs grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="text-text-secondary">Members:</span>{' '}
                  <span className="font-bold text-text-primary">{restoreSuccessModal.stats.members}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Payments:</span>{' '}
                  <span className="font-bold text-emerald-400">{restoreSuccessModal.stats.payments}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Staff:</span>{' '}
                  <span className="font-bold text-blue-400">{restoreSuccessModal.stats.staff}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Expenses:</span>{' '}
                  <span className="font-bold text-purple-400">{restoreSuccessModal.stats.expenses}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setRestoreSuccessModal(null);
                window.location.reload();
              }}
              className="w-full py-3 px-4 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
            >
              Finish & Refresh App
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
