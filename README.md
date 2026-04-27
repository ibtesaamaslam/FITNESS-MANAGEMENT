<div align="center">

<img src="https://img.shields.io/badge/TypeScript-99.0%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind%20CSS-Styling-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
<img src="https://img.shields.io/badge/Visibility-Private%20Repository-red?style=for-the-badge&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/License-Proprietary-FF0000?style=for-the-badge"/>

<br/><br/>

# 🏋️‍♂️ Saqib Fitness
### *Gym Management System*

**A modern, full-featured, and fully responsive gym management web application — managing members, tracking payments, recording attendance, generating reports, and providing real-time dashboard analytics with role-based access control for Admins, Managers, and Members.**

<br/>

🌐 **Live Demo:** [saqibfitness.vercel.app](https://saqibfitness.vercel.app)
🔒 **Visibility:** Private Repository — source code is not publicly accessible

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Role-Based Access Control](#-role-based-access-control)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Data Flow](#-data-flow)
- [TypeScript Interfaces](#-typescript-interfaces)
- [Getting Started](#-getting-started)
- [Login & First-Run Setup](#-login--first-run-setup)
- [Payment Methods Supported](#-payment-methods-supported)
- [Membership Plans](#-membership-plans)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Author](#-author)
- [License](#-license)

---

## 🔍 Overview

**Saqib Fitness** is a production-ready gym management system built to replace paper-based or spreadsheet workflows in fitness centres. It provides a unified platform where gym staff — Admins and Managers — can manage the full member lifecycle from registration through payment tracking, attendance monitoring, and detailed reporting, while Members get their own dedicated self-service portal.

The system runs entirely in the browser using **LocalStorage** as its persistence layer (demo mode), making it instantly deployable with zero backend setup. The codebase is architected for a straightforward upgrade path to a real database backend via the pre-wired `lib/dbConfig.ts` configuration for **PostgreSQL / Supabase**.

> 💡 **Real-world context:** The payment methods — Cash, Easypaisa, Jazz Cash, and Bank Transfer — and the Pakistan-specific gym member registration format (`SF-001`) reflect a real operational gym environment. This is not a generic template — it is built to handle actual gym business logic including membership expiry warnings, fee reminder toggles, and per-method financial reporting.

---

## 🌐 Live Demo

| Environment | URL |
|-------------|-----|
| Production (Vercel) | [saqibfitness.vercel.app](https://saqibfitness.vercel.app) |
| Repository | Private — access granted by owner only |

**Demo login credentials:**

| Role | How to Log In |
|------|--------------|
| Admin | Select Admin → Create a password on first run |
| Manager | Select Manager → Create a password on first run |
| Member | Select Member → Enter registration number e.g. `SF-001` |

---

## 🧰 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| [React](https://react.dev/) | 19.2.0 | UI framework — component-based architecture |
| [TypeScript](https://www.typescriptlang.org/) | — | 99.0% of codebase — end-to-end static typing |
| [Vite](https://vitejs.dev/) | Latest | Build tool — ESM-native, fast HMR |
| [Tailwind CSS](https://tailwindcss.com/) | Latest | Utility-first CSS — responsive layout and theming |
| [Recharts](https://recharts.org/) | Latest | Weekly attendance bar charts on dashboard |
| Custom SVG Components | — | `icons.tsx` — all iconography rendered as typed SVG components |
| LocalStorage | Browser API | Simulated database persistence in demo mode |
| [PostgreSQL / Supabase](https://supabase.com/) | — | Pre-configured in `lib/dbConfig.ts` for future backend migration |
| [Vercel](https://vercel.com/) | — | Production hosting via `vercel.json` |
| Google AI Studio | — | Repository scaffolded from `google-gemini/aistudio-repository-template` |

---

## ✨ Features

### 🔐 Authentication & Security

- **Role-Based Access Control** — three distinct user roles (Admin, Manager, Member) each with their own views, permissions, and navigation.
- **First-Time Setup Flow** — on the very first launch, the app enters Setup Mode. Admins and Managers are prompted to create and confirm a secure password before gaining access. All future logins require this password.
- **Member Self-Service Login** — members log in using their unique registration number (e.g. `SF-001`) and access only their own attendance history and membership details.
- **Password Reset** — a "Forgot/Reset?" link on the login screen allows clearing stored credentials and restarting the setup flow.
- **Encrypted LocalStorage** — credentials and sensitive data are encrypted before being written to browser LocalStorage in demo mode.

### 📊 Interactive Dashboard

- **Real-Time Stat Cards** — four key metrics displayed at a glance: Total Members, Active Members, Monthly Income, and Daily Attendance count.
- **Weekly Attendance Bar Chart** — a Recharts `BarChart` visualises the past 7 days of attendance, helping staff spot low-attendance trends at a glance.
- **Recent Payments Panel** — the latest transactions are listed with member name, amount, payment method, and date, with the ability to delete erroneous records inline.
- **Quick Actions** — one-click navigation buttons to the most common tasks: Add Member, Record Payment, Mark Attendance.

### 👥 Member Management

- **Full CRUD** — Add, Edit, and Delete member profiles with confirmation prompts before destructive actions.
- **Profile Fields** — photo, full name, unique registration number (`SF-XXX` format), phone number, age, and emergency contact.
- **Membership Plans** — Monthly, Quarterly, and Yearly plans with automatic expiry date calculation from the join date.
- **Status Indicators** — colour-coded visual badges: `Paid` (green), `Unpaid` (red), and `Expiring Soon` (amber — triggered when fewer than 7 days remain on the current plan).
- **Instant Search** — real-time name search filters the member list without page reload.

### 💰 Fees & Payment Ledger

- **Transaction Ledger** — complete history of all payments across the gym, showing member name, amount, payment method, date, and recorded-by staff member.
- **Payment Method Support** — Cash, Easypaisa, Jazz Cash, and Bank Transfer — covering the full range of payment options commonly used in Pakistani gyms.
- **CSV Export** — download a formatted monthly financial report as a `.csv` file for external accounting software or record-keeping.
- **Fee Reminder Toggle** — enable or disable fee/expiry reminders per member, allowing staff to focus follow-ups on high-priority members.
- **Secure Deletion** — payment records can only be deleted after a confirmation prompt, preventing accidental data loss.

### 📅 Attendance System

- **Daily Register** — staff mark each member as Present or Absent for a specific date using a simple toggle interface. The date can be changed to record past or future attendance.
- **Daily Summary** — a live counter shows how many members are Present vs. Absent for the selected date.
- **Member Attendance History** — when a Member logs in, they see their own personal 30-day rolling attendance history with day-by-day status.
- **Date Navigation** — browse attendance records for any past date without losing current data.

### 📈 Reports

- **Individual Member Report** — drill down into a specific member's complete payment history and attendance trends over time, including total fees paid, last payment date, and attendance percentage.
- **Monthly Summaries** — aggregated attendance data grouped by month — total present, total absent, and attendance rate — helping management evaluate member engagement.

---

## 🔐 Role-Based Access Control

| Feature | Admin | Manager | Member |
|---------|-------|---------|--------|
| View dashboard | ✅ | ✅ | ❌ |
| Add / edit members | ✅ | ✅ | ❌ |
| Delete members | ✅ | ❌ | ❌ |
| Record payments | ✅ | ✅ | ❌ |
| Delete payment records | ✅ | ❌ | ❌ |
| Export CSV reports | ✅ | ✅ | ❌ |
| Mark attendance | ✅ | ✅ | ❌ |
| View own attendance | ❌ | ❌ | ✅ |
| View own membership | ❌ | ❌ | ✅ |
| Toggle fee reminders | ✅ | ✅ | ❌ |
| View individual reports | ✅ | ✅ | ❌ |
| Reset system passwords | ✅ | ❌ | ❌ |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  React 19 + TypeScript + Vite                                   │
│                                                                 │
│  ┌──────────────┐   ┌────────────────────────────────────────┐  │
│  │  Login.tsx   │   │            App.tsx                     │  │
│  │  Role select │   │  Layout + Tab Routing (no React Router)│  │
│  │  Setup flow  │   │  Dashboard · Members · Fees ·          │  │
│  │  Auth guard  │   │  Attendance · Reports                  │  │
│  └──────┬───────┘   └────────────────┬───────────────────────┘  │
│         │                           │                           │
│         └────────────┬──────────────┘                           │
│                      │                                          │
│            ┌─────────▼──────────┐                               │
│            │   useGymData.ts    │                               │
│            │  Central data hook │                               │
│            │  All state mgmt    │                               │
│            │  CRUD operations   │                               │
│            └─────────┬──────────┘                               │
│                      │                                          │
│            ┌─────────▼──────────┐   ┌──────────────────────┐   │
│            │   LocalStorage     │   │   lib/dbConfig.ts    │   │
│            │   (Demo mode)      │   │   PostgreSQL/Supabase │   │
│            │   Encrypted data   │   │   (Future backend)   │   │
│            └────────────────────┘   └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **No React Router** — navigation between tabs (Dashboard, Members, Fees, Attendance, Reports) is handled by a simple state variable in `App.tsx`, keeping the bundle lean and the URL clean.
- **Single central data hook** — `useGymData.ts` owns all application state and exposes typed CRUD functions to every component, eliminating prop drilling.
- **LocalStorage as database** — all data (members, payments, attendance, credentials) is serialised, encrypted, and stored in `localStorage`. This makes the app instantly deployable with zero backend configuration.
- **Future-proof DB config** — `lib/dbConfig.ts` contains the full PostgreSQL/Supabase connection configuration, ready to be activated by swapping the LocalStorage calls in `useGymData.ts`.

---

## 📂 Project Structure

```
Fitness-Management/
│
├── components/                  # All UI page components
│   ├── Attendance.tsx           # Daily attendance register, date navigation, member view
│   ├── Dashboard.tsx            # Stat cards, Recharts bar chart, recent payments, quick actions
│   ├── Fees.tsx                 # Payment ledger, CSV export, reminder toggles, delete records
│   ├── Login.tsx                # Role selection, first-run password setup, member reg login
│   ├── Members.tsx              # Member CRUD — add, edit, delete, search, status badges
│   ├── Report.tsx               # Individual member reports and monthly attendance summaries
│   ├── Toast.tsx                # Notification toast system (success, error, warning)
│   └── icons.tsx                # All SVG icons as typed React components
│
├── data/                        # Static seed data
│   └── (initial member and payment data for demo mode)
│
├── hooks/
│   └── useGymData.ts            # Central state management hook — all CRUD, LocalStorage logic
│
├── lib/
│   └── dbConfig.ts              # PostgreSQL / Supabase connection config (future backend)
│
├── App.tsx                      # Root layout, tab navigation state, role-based view rendering
├── index.tsx                    # React DOM root mount
├── index.html                   # Vite HTML entry point
├── types.ts                     # TypeScript interfaces — Member, Payment, Attendance, Role
├── metadata.json                # App metadata (Google AI Studio template config)
├── package.json                 # Dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite build configuration
├── vercel.json                  # Vercel deployment configuration (SPA rewrites)
└── .gitignore
```

---

## 🔄 Data Flow

```
User Action (e.g. "Add Member")
        ↓
Component (Members.tsx)
  └── Calls useGymData() hook function: addMember(memberData)
        ↓
useGymData.ts
  ├── Validates data against TypeScript types
  ├── Updates React state (useState)
  └── Serialises + encrypts → writes to localStorage
        ↓
React re-renders all subscribed components
  └── Dashboard stat cards update
  └── Members list updates
  └── Toast notification fires (Toast.tsx)
```

---

## 🔷 TypeScript Interfaces

All core data shapes are defined in `types.ts`:

```typescript
// Role — controls what the logged-in user can see and do
type Role = 'admin' | 'manager' | 'member';

// Member — full gym member profile
interface Member {
  id: string;               // e.g. "SF-001"
  name: string;
  phone: string;
  age: number;
  photo?: string;           // base64 encoded image
  plan: 'monthly' | 'quarterly' | 'yearly';
  joinDate: string;         // ISO date string
  expiryDate: string;       // auto-calculated from plan + joinDate
  status: 'paid' | 'unpaid';
  reminderEnabled: boolean;
  emergencyContact?: string;
}

// Payment — single fee transaction record
interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  method: 'cash' | 'easypaisa' | 'jazzcash' | 'bank_transfer';
  date: string;
  recordedBy: string;       // staff member who recorded the payment
}

// Attendance — single day attendance record
interface AttendanceRecord {
  memberId: string;
  date: string;             // ISO date string YYYY-MM-DD
  status: 'present' | 'absent';
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ibtesaamaslam/Fitness-Management.git
cd Fitness-Management

# 2. Install all dependencies
npm install

# 3. Start the development server
npm run dev
# → Opens on http://localhost:5173
```

### Build for Production

```bash
npm run build
# Output goes to dist/ — deploy to Vercel, Netlify, or any static host
```

### Preview Production Build

```bash
npm run preview
# Serves the dist/ build locally for production testing
```

---

## 🔑 Login & First-Run Setup

When the application is launched for the very first time (or after a password reset), it enters **Setup Mode**:

### Admin Login

1. Select the **Admin** role on the login screen.
2. The app detects no existing Admin password and prompts you to **create a new password**.
3. Confirm the password and click **Set Password**.
4. You are logged in immediately and all future Admin logins require this password.

### Manager Login

1. Select the **Manager** role.
2. Create and confirm a new Manager password on first run.
3. All subsequent Manager logins use this password.

### Member Login

1. Select the **Member** role.
2. Enter a valid **Registration Number** — for example, `SF-001`.
3. Members access only their own personal portal (attendance history and membership status).
4. No password is required for member login — only the registration number.

### Password Reset

To clear all stored passwords and restart the setup flow, click the **"Forgot/Reset?"** link on the login screen and confirm the action. This does not delete member or payment data — only the Admin and Manager passwords are cleared.

---

## 💳 Payment Methods Supported

| Method | Description |
|--------|-------------|
| **Cash** | In-person cash payment at the gym counter |
| **Easypaisa** | Pakistan's leading mobile wallet — Telenor |
| **Jazz Cash** | Mobile wallet by Jazz (Mobilink) |
| **Bank Transfer** | Direct bank transfer via IBFT or inter-bank |

All four methods are recorded in the payment ledger and included in CSV exports, allowing the gym to reconcile income across different channels in their monthly financial reports.

---

## 📅 Membership Plans

| Plan | Duration | Expiry Calculation |
|------|----------|--------------------|
| **Monthly** | 1 month | Join date + 30 days |
| **Quarterly** | 3 months | Join date + 90 days |
| **Yearly** | 12 months | Join date + 365 days |

Expiry dates are calculated automatically when a member is added or their plan is updated. Members within 7 days of expiry are flagged with an **"Expiring Soon"** amber badge on the Members page and the Dashboard.

---

## 🚢 Deployment

### Vercel (Live — Recommended)

The project is deployed at [saqibfitness.vercel.app](https://saqibfitness.vercel.app) via Vercel with a `vercel.json` configuration that handles SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This ensures all routes resolve to `index.html`, allowing React to handle navigation client-side without 404 errors on direct URL access.

To deploy your own instance:

1. Push to GitHub.
2. Import the repository in [vercel.com](https://vercel.com).
3. Set build command: `npm run build` and output directory: `dist`.
4. Click Deploy.

### Manual Static Deployment

```bash
npm run build
# Upload the contents of dist/ to any static host:
# Netlify, GitHub Pages, Cloudflare Pages, AWS S3 + CloudFront
```

---

## 🗺 Roadmap

- [ ] **Real Backend** — activate `lib/dbConfig.ts` and replace all LocalStorage calls in `useGymData.ts` with Supabase SDK queries.
- [ ] **JWT Authentication** — replace LocalStorage credential storage with proper server-side JWT sessions for production security.
- [ ] **SMS Reminders** — connect the "Send Reminder" toggle to Twilio or a local Pakistani SMS gateway to automatically notify members before expiry.
- [ ] **Email Invoices** — automatically generate and email monthly PDF invoices to members when payments are recorded.
- [ ] **Multi-Branch Support** — extend the data model to support multiple gym branches under a single admin account.
- [ ] **Biometric Attendance** — integrate with fingerprint or RFID reader APIs for automated attendance marking.
- [ ] **Mobile App** — React Native port for staff to manage attendance and payments from a phone on the gym floor.
- [ ] **Dark Mode** — system-aware dark/light theme toggle via Tailwind's `dark:` variant classes.

---

## 🔒 Private Repository Notice

This repository is **private**. The source code is proprietary and not available for public forking, cloning, or redistribution.

If you are an authorised collaborator granted access by the owner:

```bash
# Clone using your authorised GitHub account
git clone https://github.com/ibtesaamaslam/Fitness-Management.git
cd Fitness-Management

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, commit, and push
git add .
git commit -m "feat: description of your change"
git push origin feature/your-feature-name

# Open a Pull Request for review by the owner
```

> Unauthorised access, redistribution, or use of this codebase is strictly prohibited. See the [License](#-license) section for full terms.

---

## 👤 Author

<div align="center">

**Ibtesaam Aslam**

[![GitHub](https://img.shields.io/badge/GitHub-ibtesaamaslam-181717?style=for-the-badge&logo=github)](https://github.com/ibtesaamaslam)

*Full-Stack Developer & AI Enthusiast*

</div>

---

## 📜 License

```
Proprietary License

Copyright (c) 2024 Ibtesaam Aslam. All Rights Reserved.

This software and its source code are the exclusive property of Ibtesaam Aslam.
No part of this codebase may be copied, modified, distributed, sublicensed,
sold, or used in any form — in whole or in part — without the express prior
written permission of the copyright owner.

Unauthorised use, reproduction, or distribution of this software, via any
medium, is strictly prohibited and may result in severe civil and criminal
penalties, and will be prosecuted to the maximum extent possible under
applicable law.

THE SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY KIND.
THE AUTHOR ACCEPTS NO LIABILITY FOR ANY DAMAGES ARISING FROM UNAUTHORISED USE.
```

| Permission | Status |
|-----------|--------|
| ❌ Public distribution | Not permitted |
| ❌ Forking or cloning | Not permitted without authorisation |
| ❌ Commercial use by third parties | Not permitted |
| ❌ Modification and redistribution | Not permitted |
| ✅ Authorised collaborator access | Permitted with explicit owner approval |
| ✅ Personal / internal use by owner | Permitted |

---

## 🙏 Acknowledgements

- **[React Team](https://react.dev/)** — for React 19 with its improved performance and concurrent features.
- **[Recharts](https://recharts.org/)** — for the composable SVG charting library powering the dashboard attendance chart.
- **[Tailwind CSS](https://tailwindcss.com/)** — for the utility-first CSS framework that makes building responsive layouts fast and maintainable.
- **[Vite](https://vitejs.dev/)** — for the ESM-native build tool that makes development iteration instant.
- **[Supabase](https://supabase.com/)** — for the open-source Firebase alternative pre-wired in `lib/dbConfig.ts` for the future backend migration.
- **[Google AI Studio](https://aistudio.google.com/)** — this repository was scaffolded from the `google-gemini/aistudio-repository-template`, providing the initial project structure and configuration.

---

<div align="center">

🌐 [saqibfitness.vercel.app](https://saqibfitness.vercel.app)

*Built with ❤️ by [Ibtesaam Aslam](https://github.com/ibtesaamaslam)*

</div>
