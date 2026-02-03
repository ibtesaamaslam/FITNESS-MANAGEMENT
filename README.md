
# 🏋️‍♂️ GYM KHATA - Enterprise Gym Management SaaS

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)
![Tech](https://img.shields.io/badge/React%2019-TypeScript-blue)
![Backend](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Styling](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

**GYM KHATA** is a cutting-edge, multi-tenant SaaS (Software as a Service) platform designed to revolutionize fitness center operations. Built with modern web technologies, it offers real-time data synchronization, robust financial tracking, and a seamless user experience for both Gym Owners and the Super Admin.

---

## 📑 Table of Contents
- [🚀 Technical Architecture](#-technical-architecture)
- [📂 Project Structure](#-project-structure)
- [✨ Key Features](#-key-features)
  - [👑 Super Admin (Owner Console)](#-super-admin-owner-console)
  - [🏢 Gym Admin Portal](#-gym-admin-portal)
- [🗄️ Database Schema](#-database-schema)
- [🛠️ Installation & Setup](#-installation--setup)
- [🖥️ Usage Guide](#-usage-guide)
- [🔐 Security & Access](#-security--access)

---

## 🚀 Technical Architecture

### **Frontend**
- **Framework**: [React 18+](https://react.dev/) with [Vite](https://vitejs.dev/) for lightning-fast builds.
- **Language**: **TypeScript** for type safety and maintainable code.
- **Styling**: **Tailwind CSS** with a custom dark-mode theme (`bg-background`, `text-primary`).
- **Charts**: **Recharts** for responsive financial and attendance analytics.
- **Icons**: Custom SVG component library.

### **Backend (BaaS)**
- **Database**: **PostgreSQL** hosted on **Supabase**.
- **Realtime**: Supabase Realtime subscriptions for live updates across dashboards.
- **Storage**: Supabase Storage for gym logos and member photos (Base64 fallback supported).
- **Security**: Row Level Security (RLS) configured (currently open for demo purposes).

---

## 📂 Project Structure

A comprehensive overview of the file organization:

```text
/
├── .env                       # Environment variables (Supabase URL & Anon Key)
├── index.html                 # Entry HTML file with Tailwind config
├── index.tsx                  # React Entry point
├── App.tsx                    # Main Routing Logic & Layout Shell
├── types.ts                   # TypeScript Interfaces (Member, Gym, Payment models)
├── supabase_schema.sql        # Database initialization script
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite build configuration
│
├── components/                # UI Components
│   ├── Landing.tsx            # Public Landing Page (Gym Login)
│   ├── Login.tsx              # Universal Login Component (Owner/Gym/Member)
│   ├── SuperAdminDashboard.tsx# SaaS Owner Control Panel (Manage Gyms)
│   ├── Dashboard.tsx          # Gym-specific Dashboard (Stats & Charts)
│   ├── Members.tsx            # Member List & CRUD Modal
│   ├── MemberProfile.tsx      # Detailed Member View (Pro feature)
│   ├── Fees.tsx               # Payment Ledger, Renewals & CSV Export
│   ├── Attendance.tsx         # Daily Attendance Tracker
│   ├── Visitors.tsx           # Visitor/Inquiry Log
│   ├── Report.tsx             # Advanced Analytics (Charts)
│   ├── BillingPortal.tsx      # Gym Subscription & Settings
│   ├── SubscriptionGuard.tsx  # HOC for blocking features based on plan status
│   ├── Toast.tsx              # Notification system
│   └── icons.tsx              # SVG Icon System
│
├── hooks/
│   └── useGymData.ts          # Custom Hook: Manages Realtime Supabase Sync
│
├── lib/
│   ├── supabase.ts            # Supabase Client Initialization
│   └── dbConfig.ts            # Server-side DB connection strings (Reference)
│
└── data/
    └── mockData.ts            # Fallback/Test data structures
```

---

## ✨ Key Features

### 👑 Super Admin (Owner Console)
*Access Route: `#/owner/login`*

The command center for the SaaS owner to manage all gym tenants.

1.  **Global Dashboard**:
    *   View Total Monthly Recurring Revenue (MRR).
    *   Track total active gyms and those with past-due payments.
    *   Real-time list of all registered gyms with status indicators.

2.  **Tenant Management**:
    *   **Create Gyms**: Provision new instances with custom Slugs (URLs), logos, and initial passwords.
    *   **Edit Subscription**: Upgrade/Downgrade plans (Basic vs Pro), adjust pricing, and manage billing dates.
    *   **Manage Status**: Manually suspend, cancel, or extend trials for gyms.
    *   **Impersonation**: "God Mode" login to access any gym's dashboard instantly without knowing their password.

3.  **System Tools**:
    *   **Master Backup**: Generate a consolidated CSV report of *all* gyms, including admin passwords and financial summaries.
    *   **Security**: Update the global Super Admin password.

### 🏢 Gym Admin Portal
*Access Route: `#/g/[gym-slug]/login`*

A comprehensive operating system for individual gym owners.

#### 1. **Dashboard**
*   **Live Stats**: Total members, active memberships count, monthly revenue.
*   **Visuals**: Weekly attendance bar chart, recent payment activity feed.
*   **Plan Status**: Visibility into the gym's own subscription status (Trial/Active/Due).

#### 2. **Member Management**
*   **CRUD Operations**: Add, Edit, and Delete members.
*   **Profile Management**: Upload photos, store contact info, age, and registration numbers.
*   **Membership Tracking**:
    *   **Plans**: Monthly, Quarterly, Yearly.
    *   **Auto-Expiry**: Expiry dates calculated automatically based on join date and plan.
    *   **Status Indicators**: Visual badges for **Active**, **Due Soon** (≤5 days), and **Expired**.
*   **Search & Sort**: Filter by name/reg-no; sort by expiry to find at-risk members.

#### 3. **Fees Ledger & Billing**
*   **Payment Recording**: Log payments via Cash, Easypaisa, JazzCash, or Bank Transfer.
*   **Smart Renewals**:
    *   Renewing a member automatically extends their expiry date based on their current plan.
    *   **Safety Guard**: Prevents accidental double-renewals if a member is still active (with override option).
*   **Financial Reports**:
    *   Monthly Revenue Navigation (Prev/Next Month).
    *   **Export to CSV**: Download detailed fee ledgers for accounting.

#### 4. **Attendance System**
*   **Daily Log**: Mark members Present/Absent for the current date.
*   **Stats**: Real-time calculation of Daily Turnout Rate (%).
*   **History**: View attendance history in member profiles (Last 14 records visualizer).

#### 5. **Visitors Log**
*   Track walk-in inquiries, day-pass users, and guests.
*   Store contact details and follow-up notes.

#### 6. **Analytics Report (Pro Plan Feature)**
*   **Revenue History**: 6-month bar chart visualization of income.
*   **Growth Trends**: Line chart showing new member acquisition over time.
*   **Key Metrics**: Lifetime Revenue, Best Performing Month, Average Member Age.

#### 7. **Settings & Billing**
*   **Branding**: Update Gym Name and Logo.
*   **Security**: Change the Gym Admin Password.
*   **Data Export**: Download a full backup of members and payments (CSV).
*   **Subscription**: View current SaaS plan details and payment instructions for the SaaS owner.

---

## 🗄️ Database Schema

The application uses a relational PostgreSQL schema.

| Table | Description | Key Relationships |
| :--- | :--- | :--- |
| **`gyms`** | Stores tenant information (Name, Slug, Auth, Plan Status). | Primary Key `id` |
| **`members`** | Stores gym members. Contains JSONB for attendance. | `gymId` -> `gyms.id` |
| **`payments`** | Financial records for memberships. | `gymId` -> `gyms.id`, `memberId` -> `members.id` |
| **`visitors`** | Log for non-member walk-ins. | `gymId` -> `gyms.id` |

*Note: All tables have Realtime enabled via Supabase Publication.*

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- A Supabase Project

### 1. Environment Configuration
Create a `.env` file in the root directory (or use the provided one):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
1. Copy the contents of `supabase_schema.sql` from the project root.
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Paste and run the script. This creates:
   - `uuid-ossp` extension.
   - Tables: `gyms`, `members`, `payments`, `visitors`.
   - Security Policies (RLS).
   - Storage Buckets.

### 3. Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🖥️ Usage Guide

### 1. Initial Setup (Owner)
1.  Navigate to `http://localhost:5173/#/owner/login`.
2.  Login with default password: `*469702*`.
3.  Click **+ Add Gym** to create your first tenant (e.g., "Iron Fitness", slug: "iron-fitness").

### 2. Gym Admin Login
1.  Navigate to `http://localhost:5173/#/landing`.
2.  Enter the Gym ID (Slug) created above (e.g., `iron-fitness`).
3.  Enter the password (default: `admin`).

### 3. Workflow
*   **Add Members**: Go to the **Members** tab and register new users.
*   **Receive Fees**: Go to **Fees**, click "Record Payment", select a member.
*   **Mark Attendance**: Go to **Attendance**, toggle checkboxes for present members.
*   **View Reports**: Check **Dashboard** or **Reports** (if on Pro plan) for insights.

---

## 🔐 Security & Access

*   **Role-Based Views**: The app strictly separates the "Owner" view from the "Gym" view.
*   **Subscription Guard**: If a gym's subscription status is `suspended` or `cancelled`, access to features is blocked automatically. `past_due` allows access but shows warnings.
*   **Data Isolation**: While RLS is currently set to public for demonstration ease, the frontend logic strictly filters data by `gymId` to ensure tenants only see their own data.

---

*© 2026 GYM KHATA SaaS. All Rights Reserved.*
