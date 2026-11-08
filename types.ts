export type Role = 'Admin' | 'Manager' | 'Member';
export type View = 'dashboard' | 'members' | 'fees' | 'attendance' | 'report' | 'dailyledger' | 'archive' | 'expenses';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
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
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}