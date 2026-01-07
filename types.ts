export type Role = 'Admin' | 'Manager' | 'Member';
export type View = 'dashboard' | 'members' | 'fees' | 'attendance' | 'report';

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
}

export interface Payment {
  id: string;
  memberId: string;
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