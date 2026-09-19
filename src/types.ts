export type Role = 'Admin' | 'Manager';
export type View = 'dashboard' | 'members' | 'fees' | 'attendance' | 'report' | 'dailyledger' | 'archive' | 'expenses' | 'accessories' | 'staff' | 'backup';

export interface RolePermissions {
  role: Role;
  title: string;
  subtitle: string;
  badgeColor: string;
  canAccessBackup: boolean;
  canManagePayroll: boolean;
  canDeleteMembers: boolean;
  canDeletePayments: boolean;
  canDeleteExpenses: boolean;
  canDeleteStaff: boolean;
  canEditGymBranding: boolean;
  canManageFinancialSecurity: boolean;
  canPurgeArchive: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  Admin: {
    role: 'Admin',
    title: 'Super Admin / Owner',
    subtitle: 'Full Unrestricted System Authority',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    canAccessBackup: true,
    canManagePayroll: true,
    canDeleteMembers: true,
    canDeletePayments: true,
    canDeleteExpenses: true,
    canDeleteStaff: true,
    canEditGymBranding: true,
    canManageFinancialSecurity: true,
    canPurgeArchive: true,
  },
  Manager: {
    role: 'Manager',
    title: 'Duty / Floor Manager',
    subtitle: 'Daily Gym Operations & Floor Management',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    canAccessBackup: false,
    canManagePayroll: false,
    canDeleteMembers: false,
    canDeletePayments: false,
    canDeleteExpenses: false,
    canDeleteStaff: false,
    canEditGymBranding: false,
    canManageFinancialSecurity: false,
    canPurgeArchive: false,
  },
};

export type StaffRole = 'Trainer' | 'Senior Trainer' | 'Receptionist' | 'General Manager' | 'Maintenance' | 'Accountant' | 'Cleaner';
export type StaffCategory = 'Trainers' | 'Administrative' | 'Support';
export type PayrollType = 'Monthly' | 'Hourly' | 'Daily';
export type StaffStatus = 'Active' | 'Inactive' | 'On Leave';

export interface StaffShift {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
}

export interface StaffEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  category: StaffCategory;
  phone: string;
  email: string;
  cnic: string;
  avatar?: string;
  joinDate: string; // YYYY-MM-DD
  status: StaffStatus;
  payrollType: PayrollType;
  baseSalary: number; // Monthly base salary (Rs) or Hourly rate (Rs/hr)
  shiftHoursPerDay: number; // e.g. 8
  workingDaysPerMonth?: number; // default 26
  assignedMemberIds?: string[]; // IDs of members assigned to trainer
  emergencyContact: StaffEmergencyContact;
  notes?: string;
  shifts?: StaffShift[];
}

export interface StaffPayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  month: string; // YYYY-MM
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  paidAmount: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: 'Cash' | 'Easypaisa' | 'Jazz Cash' | 'Bank Transfer';
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  description?: string;
}

export interface AccessorySale {
  id: string;
  accessoryId: string;
  accessoryName: string;
  quantity: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  totalAmount: number;
  totalProfit: number;
  paymentMethod: 'Cash' | 'Easypaisa' | 'Jazz Cash' | 'Bank Transfer';
  buyerName: string;
  date: string; // YYYY-MM-DD
}

export interface MeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
  waist?: number; // in inches
  chest?: number; // in inches
  arms?: number; // in inches
  thighs?: number; // in inches
  bodyFat?: number; // in %
}

export type Gender = 'Male' | 'Female' | 'Other';

export interface Member {
  id: string;
  registrationNo: string;
  name: string;
  gender?: Gender;
  age: number;
  phone: string;
  plan: 'Monthly' | 'Quarterly' | 'Yearly';
  fee: number;
  feePaid: boolean;
  joinDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  photo: string;
  remindersEnabled?: boolean;
  attendance: { [date: string]: boolean }; // date: YYYY-MM-DD
  category?: 'Strength' | 'Cardio' | 'Personal Training';
  assignedTrainerId?: string;
  measurements?: MeasurementEntry[];
}

export interface Payment {
  id: string;
  memberId: string;
  memberRegNo: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: 'Cash' | 'Easypaisa' | 'Jazz Cash' | 'Bank Transfer';
  type?: 'Fee' | 'Accessory';
  notes?: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface StaffAttendanceLog {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'On Leave';
  checkInTime?: string; // HH:MM AM/PM or HH:MM
  checkOutTime?: string; // HH:MM AM/PM or HH:MM
  workingHours?: number;
  notes?: string;
  loggedAt?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface MonthlyHistoricalSnapshot {
  monthKey: string; // YYYY-MM e.g. "2026-09"
  monthName: string; // e.g. "September 2026"
  shortName: string; // e.g. "Sep 2026"
  year: number;
  monthIndex: number; // 0-11
  feeCollections: number;
  cashRevenue: number;
  onlineRevenue: number;
  transactionsCount: number;
  paymentsList: Payment[];
  expensesAmount: number;
  expensesCount: number;
  expensesList: Expense[];
  payrollDisbursed: number;
  payrollSlipsCount: number;
  payrollList: StaffPayrollRecord[];
  accessorySalesRevenue: number;
  accessoryProfit: number;
  accessorySalesCount: number;
  accessorySalesList: AccessorySale[];
  totalInflow: number;
  totalOutflow: number;
  netOperatingProfit: number;
  attendanceCheckIns: number;
  newMembersJoined: number;
  activeMembersInMonth: number;
}

export interface BackupStats {
  membersCount: number;
  activeMembersCount?: number;
  expiredMembersCount?: number;
  maleMembersCount?: number;
  femaleMembersCount?: number;
  memberAttendanceLogsCount?: number;
  weeklyAttendanceLogsCount?: number;
  todayAttendanceLogsCount?: number;
  memberMeasurementsCount?: number;
  memberPhotosCount?: number;
  paymentsCount: number;
  totalFeeRevenue?: number;
  cashRevenue?: number;
  onlineRevenue?: number;
  cashPaymentsCount?: number;
  onlinePaymentsCount?: number;
  pendingDuesAmount?: number;
  unpaidMembersCount?: number;
  expensesCount: number;
  totalExpenseAmount?: number;
  accessoriesCount: number;
  totalStockUnits?: number;
  inventoryValuation?: number;
  accessorySalesCount: number;
  totalAccessoryRevenue?: number;
  totalAccessoryProfit?: number;
  staffCount: number;
  staffPayrollsCount: number;
  staffAttendanceLogsCount: number;
  totalPayrollDisbursed?: number;
  totalInflowRevenue?: number;
  totalOutflowExpenses?: number;
  netFinancialBalance?: number;
  past12MonthsRevenue?: number;
  past12MonthsExpenses?: number;
  past12MonthsTransactions?: number;
  rawStorageKeysCount?: number;
  backupSizeBytes?: number;
}

export interface BackupReportSummary {
  generatedAt: string;
  gymName: string;
  timeCoverageDescription?: string;
  demographics: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    maleMembers: number;
    femaleMembers: number;
    planBreakdown: {
      monthly: number;
      quarterly: number;
      yearly: number;
    };
  };
  attendanceSummary: {
    totalCheckInsRecorded: number;
    past7DaysWeeklyAttendance: number;
    todayAttendance: number;
    weeklyAttendanceByDay: { date: string; dayName: string; count: number }[];
  };
  financialSummary: {
    totalFeeCollections: number;
    totalAccessoryRevenue: number;
    totalGrossIncome: number;
    totalOperatingExpenses: number;
    totalStaffSalariesPaid: number;
    totalGrossExpenditure: number;
    netOperatingProfit: number;
    cashCollections: number;
    onlineCollections: number;
    pendingArrearsAmount: number;
    unpaidMembersCount: number;
  };
  past12MonthsArchive?: MonthlyHistoricalSnapshot[];
  previousTransactionsSnapshot: {
    totalTransactionsCount: number;
    recentTransactions: Payment[];
  };
  inventorySummary: {
    distinctItemsCount: number;
    totalUnitsInStock: number;
    costValuation: number;
    retailValuation: number;
  };
}

export interface GymBackupData {
  appName: string;
  appVersion: string;
  createdAt: string;
  gymName: string;
  stats: BackupStats;
  report?: BackupReportSummary;
  data: {
    members: Member[];
    payments: Payment[];
    expenses: Expense[];
    accessories: AccessoryItem[];
    accessorySales: AccessorySale[];
    staff: StaffMember[];
    staffPayrolls: StaffPayrollRecord[];
    staffAttendanceLogs: StaffAttendanceLog[];
    past12MonthsArchive?: MonthlyHistoricalSnapshot[];
    gymName?: string;
    theme?: string;
    financialPassword?: string;
    authAdmin?: string;
    authAdminWord?: string;
    authManager?: string;
    authManagerWord?: string;
  };
  rawLocalStorage?: Record<string, string>;
}
