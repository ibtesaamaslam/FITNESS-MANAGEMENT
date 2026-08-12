export type Role = 'Admin' | 'Manager' | 'Member';
export type View = 'dashboard' | 'members' | 'fees' | 'attendance' | 'report' | 'dailyledger' | 'archive' | 'expenses' | 'accessories' | 'staff';

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

export interface Member {
  id: string;
  registrationNo: string;
  name: string;
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

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}