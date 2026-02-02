
# 🏋️‍♂️ GYM KHATA - Ultimate Gym Management SaaS

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)
![Tech](https://img.shields.io/badge/react-19-61DAFB.svg)
![License](https://img.shields.io/badge/license-MIT-purple.svg)

**GYM KHATA** is a cutting-edge, multi-tenant SaaS (Software as a Service) platform designed to revolutionize fitness center operations. Built with a "Local-First" architecture, it offers a dual-interface ecosystem: a robust **Super Admin Console** for SaaS owners to manage tenants and subscriptions, and a feature-rich **Gym Portal** for facility managers to handle members, financials, and analytics.

---

## 📑 Table of Contents

- [🌟 System Overview](#-system-overview)
- [👑 Super Admin Console](#-super-admin-console)
- [🏢 Gym Management Portal](#-gym-management-portal)
  - [Dashboard & Insights](#dashboard--insights)
  - [Member Management](#member-management)
  - [Financial Ledger & Smart Billing](#financial-ledger--smart-billing)
  - [Attendance Tracking](#attendance-tracking)
  - [Visitor CRM](#visitor-crm)
  - [Pro Analytics](#pro-analytics)
- [💾 Data Management & Backup](#-data-management--backup)
- [🛡️ Security & Access Control](#-security--access-control)
- [💻 Technical Architecture](#-technical-architecture)
- [🚀 Quick Start Guide](#-quick-start-guide)

---

## 🌟 System Overview

Gym Khata operates on a strict multi-tenant model ensuring data isolation and privacy.

-   **Role-Based Access Control (RBAC)**: Distinct workflows for Super Admins (Owners), Gym Admins (Tenants), and Members.
-   **Subscription-Driven Access**: Features are gated by subscription status (Trial, Active, Past Due, Suspended).
-   **Local-First Persistence**: Utilizes browser `localStorage` to simulate a database, ensuring offline capabilities and zero-latency interactions.

---

## 👑 Super Admin Console

The central command center for the SaaS owner to manage the business.

-   **Access Route**: `#/owner/login`
-   **Default Credentials**: Password `*469702*` (Changeable via settings)

### Key Capabilities

1.  **Tenant Lifecycle Management**:
    *   **Onboarding**: Create new gym instances with custom branding (Logo) and URL slugs.
    *   **Monitoring**: Real-time view of all gyms, their plan status (Basic/Pro), and expiry dates.
    *   **Alerts**: Automatic visual indicators for gyms expiring within 7 days or those that are past due.

2.  **Subscription Control**:
    *   **Plan Management**: Assign plans (Basic vs. Pro) and set custom pricing.
    *   **Status Override**: Manually suspend, cancel, or extend trials for any tenant.
    *   **Revenue Tracking**: Dashboard KPI showing total Monthly Recurring Revenue (MRR) from active tenants.

3.  **Advanced Data Tools**:
    *   **Master System Backup**: Generate a comprehensive CSV report containing **all** data from **all** gyms, including admin credentials and consolidated financial records.
    *   **Gym Data Import/Restore**: Upload CSV backups for specific gyms directly from the dashboard. The system intelligently merges members and creates historical payment records to reconcile revenue figures.
    *   **Impersonation**: One-click "Login as Admin" to view any gym's dashboard without needing their specific password (useful for support).

---

## 🏢 Gym Management Portal

A comprehensive operating system for gym owners.

-   **Access Route**: `#/g/[gym-slug]/login`
-   **Default Password**: `admin` (Customizable)

### Dashboard & Insights
*Component: `Dashboard.tsx`*
-   **Live KPIs**: Instant view of Total Members, Active Memberships, and Current Month's Revenue.
-   **Visual Analytics**:
    -   **Weekly Attendance**: Bar chart visualizing footfall trends over the last 7 days.
    -   **Recent Payments**: Real-time feed of the latest fee collections.

### Member Management
*Component: `Members.tsx`*
-   **Smart Profiles**: Detailed view of every member including photo, contact info, and current plan.
-   **Status Intelligence**:
    -   <span style="color:green">● Active</span>: Membership is valid.
    -   <span style="color:orange">● Due Soon</span>: Expires in ≤ 5 days.
    -   <span style="color:red">● Expired</span>: Membership has lapsed.
-   **Sorting & Filtering**: Natural sorting by Registration Number, Name, or Join Date.
-   **Actions**: Edit details, delete records, or view deep-dive profiles.

### Financial Ledger & Smart Billing
*Component: `Fees.tsx`*
-   **Revenue Engine**: Dedicated revenue widget with month-over-month navigation.
-   **Smart Renewals**:
    -   **One-Click Renewal**: Recording a payment automatically extends the member's expiry date based on their plan (Monthly/Quarterly/Yearly).
    -   **Double-Charge Protection**: Alerts the admin if they attempt to renew an already active member.
    -   **Auto-Calculation**: Extends expiry date based on plan duration.
-   **Ledger**: Detailed history of all transactions (Cash, Bank Transfer, Digital Wallets).
-   **Export**: Download fee history as CSV for external accounting.

### Attendance Tracking
*Component: `Attendance.tsx`*
-   **Daily Log**: Rapidly mark members as Present/Absent.
-   **Live Stats**: View daily turnout percentage and absolute counts.
-   **Contextual Cues**: See member expiry status directly in the attendance list to catch unpaid members at the door.

### Visitor CRM
*Component: `Visitors.tsx`*
-   **Lead Tracking**: Log walk-ins and inquiries.
-   **Categorization**: Tag visitors as Inquiry, Day Pass, or Guest.
-   **Notes**: Keep detailed remarks for follow-ups.

### Pro Analytics
*Component: `Report.tsx`*
*(Available only on Pro Plan)*
-   **Revenue Trends**: 6-month historical revenue bar chart.
-   **Growth Metrics**: Line chart tracking new member acquisition.
-   **Business Health**: Lifetime Value (LTV) calculation and Best Performing Month analysis.

---

## 💾 Data Management & Backup

Gym Khata includes a sophisticated Data Import/Export system to ensure data portability and safety.

### 1. Gym-Level Backup
-   **Export**: Gym Admins can download a "Master Report" CSV from their settings. This includes granular details on members, attendance rates, and financial totals.
-   **Restore (Smart Import)**:
    -   Super Admins can upload a previous backup CSV via the Super Admin Dashboard.
    -   **Intelligent Merge**: The system matches members by Registration Number. If they exist, details are updated; if not, new profiles are created.
    -   **Financial Reconciliation**: The importer reads the "Total Amount Paid" from the CSV. If the imported total is higher than the current system record, it automatically creates **historical payment records** distributed across previous months based on the plan fee. This ensures your **revenue charts** look correct even after a fresh restore!

### 2. System-Level Backup
-   Super Admins can download a global CSV containing credentials and financial summaries for *every* gym in the system for auditing purposes.

---

## 🛡️ Security & Access Control

-   **Subscription Guard**: A higher-order component that wraps the application logic.
    -   **Trial Mode**: Shows countdown banner.
    -   **Past Due**: Restricts write access and shows warning banners.
    -   **Suspended**: Completely blocks UI access with a lock screen.
-   **Credential Management**: Admins can rotate their passwords instantly. Super Admin can reset any gym's password.
-   **Sandboxed Environment**: Data is stored in browser `localStorage` keyed by Gym ID, preventing cross-tenant data leakage.

---

## 💻 Technical Architecture

-   **Frontend**: React 19 (Functional Components, Hooks).
-   **Language**: TypeScript (Strict typing for robust data handling).
-   **Styling**: Tailwind CSS (Dark Mode optimized, Responsive).
-   **Charts**: Recharts library for data visualization.
-   **State Management**: React Context + Event Bus pattern for cross-component synchronization without prop-drilling.
-   **Storage**: `localStorage` based persistence (simulates backend database).

---

## 🚀 Quick Start Guide

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/your-repo/gym-khata.git
    cd gym-khata
    npm install
    ```

2.  **Run Locally**:
    ```bash
    npm start
    ```

3.  **First Login**:
    -   Navigate to `http://localhost:3000/#/owner/login`
    -   Login with: `*469702*`
    -   Create your first Gym!

4.  **Gym Login**:
    -   Use the credentials you just created (default password is `admin`).
    -   Start adding members!

---

*© 2026 GYM KHATA SaaS. Engineered for Performance & Reliability.*
