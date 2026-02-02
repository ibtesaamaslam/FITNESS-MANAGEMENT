
export type Role = 'SuperAdmin' | 'Admin' | 'Member';
export type View = 'dashboard' | 'members' | 'fees' | 'attendance' | 'billing' | 'report' | 'visitors';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface Gym {
  id: string;
  name: string;
  slug: string; // Used for URL routing
  logoBase64?: string; // Base64 string of the gym logo
  adminPassword?: string; // Admin password for the gym
  
  // Billing & Subscription
  subscriptionStatus: SubscriptionStatus;
  stripeMockCustomerId?: string;
  planName: 'Basic' | 'Pro';
  subscriptionPrice: number; // Custom price for the gym's plan
  
  // Dates
  trialEndsAt: string; // ISO Date string
  nextBillingDate: string; // ISO Date string (Acts as Next Expiry)
  createdAt: string;

  contactPhone?: string;
}

export interface Member {
  id: string;
  gymId: string; // Strict Data Isolation
  registrationNo: string;
  name: string;
  age: number;
  phone: string;
  plan: 'Monthly' | 'Quarterly' | 'Yearly';
  fee: number;
  feePaid: boolean;
  joinDate: string; 
  expiryDate: string; 
  photoBase64?: string;
  remindersEnabled?: boolean;
  attendance: { [date: string]: boolean };
}

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  date: string; // ISO Date
  amount: number;
  method: 'Cash' | 'Easypaisa' | 'Jazz Cash' | 'Bank Transfer';
  invoiceMockUrl?: string;
}

export interface Visitor {
    id: string;
    gymId: string;
    name: string;
    phone: string;
    date: string; // Visit Date
    purpose: string; // e.g. 'Inquiry', 'Day Pass', 'Guest'
    note?: string;
}

// Router types
export interface RouteParams {
  type: 'owner' | 'gym' | 'landing';
  slug?: string; // For gym
  action?: string; // e.g., 'login', 'dashboard'
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}
