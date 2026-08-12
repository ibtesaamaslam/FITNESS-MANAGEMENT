# 🏋️‍♂️ Saqib Fitness - Gym Management System

A modern, responsive, and full-featured web application designed to streamline gym operations. This system manages members, tracks payments, records attendance, and provides actionable insights via a real-time dashboard.

Built with **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Features

### 🔐 Authentication & Security
*   **Role-Based Access Control:** Distinct views and permissions for **Admins**, **Managers**, and **Members**.
*   **First-Time Setup Flow:** Admins and Managers set their own secure passwords upon first login.
*   **Encrypted Storage:** Credentials and data are simulated and encrypted in browser LocalStorage (Demo Mode).

### 📊 Interactive Dashboard
*   **Real-time Stats:** key metrics like Total Members, Active Members, Monthly Income, and Daily Attendance.
*   **Visual Analytics:** Weekly attendance bar charts using `recharts`.
*   **Recent Payments:** Quick view of the latest transactions with the ability to delete erroneous records.
*   **Quick Actions:** One-click navigation to common tasks.

### 👥 Member Management
*   **CRUD Operations:** Add, Edit, and Delete member profiles.
*   **Profile Details:** Manage photos, registration numbers, contact info, and age.
*   **Membership Plans:** Support for Monthly, Quarterly, and Yearly plans with automatic expiry calculation.
*   **Status Tracking:** Visual indicators for "Paid/Unpaid" status and "Expiring Soon" warnings.
*   **Search:** Instant search by name.

### 💰 Fees & Ledger
*   **Transaction Ledger:** Detailed history of all payments (Cash, Easypaisa, Jazz Cash, Bank Transfer).
*   **CSV Export:** Download monthly financial reports for external accounting.
*   **Reminders:** Toggle fee/expiry reminders for specific members.
*   **Delete Records:** secure deletion of payment records with confirmation prompts.

### 📅 Attendance System
*   **Daily Register:** Mark members present or absent for any specific date.
*   **Member View:** Members can log in to view their own 30-day attendance history.
*   **Summary:** Daily counters for Present vs. Absent members.

### 📈 Reports
*   **Individual Reports:** Deep dive into a specific member's payment history and attendance trends.
*   **Monthly Summaries:** Aggregated attendance data per month.

---

## 🛠️ Tech Stack

*   **Frontend Framework:** React (v19.2.0)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Charts:** Recharts
*   **Icons:** Custom SVG Components
*   **Build Tool:** Vite
*   **Persistence:** LocalStorage (Simulating a database for demo purposes)
*   **Database Config:** PostgreSQL/Supabase (Configuration ready in `lib/dbConfig.ts` for future backend integration).

---

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/saqib-fitness-gym.git
    cd saqib-fitness-gym
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 🔑 Login Credentials (First Run)

When you run the app for the first time, it enters **Setup Mode**.

1.  **Admin Login:**
    *   Select **Admin**.
    *   You will be prompted to **Create a New Password**.
    *   Confirm the password and log in.
    *   *Note: Future logins will require this password.*

2.  **Manager Login:**
    *   Select **Manager**.
    *   Create and confirm a new password.

3.  **Member Login:**
    *   Select **Member**.
    *   Enter a valid **Registration Number** (e.g., `SF-001`) of an existing member to view their specific portal.

*To reset the demo passwords, click the "Forgot/Reset?" link on the login screen and confirm the reset action.*

---

## 📂 Project Structure

```text
src/
├── components/                  # UI Components
│   ├── Archive.tsx              # Inactive / archived member management
│   ├── Attendance.tsx           # Attendance register and stats tracking
│   ├── DailyLedger.tsx          # Daily income and collection logs
│   ├── Dashboard.tsx            # Main analytics dashboard & chart overviews
│   ├── Fees.tsx                 # Fee ledger, renewals, and CSV exporting
│   ├── Login.tsx                # Role-based authentication & setup
│   ├── Members.tsx              # Member profiles, CRUD & measurement logs
│   ├── MonthlyExpense.tsx       # Expense tracking & financial overview
│   ├── NotificationMessageBox.tsx # Alert modals & overdue member notices
│   ├── Report.tsx               # Individual member reports & attendance analysis
│   ├── Toast.tsx                # Toast alert notifications component
│   └── icons.tsx                # Custom SVG icon library
├── data/
│   └── mockData.ts              # Default mock data
├── hooks/
│   └── useGymData.ts            # Central state hook & LocalStorage persistence
├── lib/
│   ├── dateUtils.ts             # Date calculation and formatting helpers
│   └── dbConfig.ts              # Database configuration (PostgreSQL/Supabase)
├── App.tsx                      # Root component, layout & view router
├── index.css                    # Tailwind CSS setup & theme custom variables
├── main.tsx                     # Application entry point
└── types.ts                     # Global TypeScript interfaces & types
```

---

## 🛡️ Future Roadmap

*   **Backend Integration:** Connect `lib/dbConfig.ts` to a real Supabase or PostgreSQL instance to replace LocalStorage.
*   **Auth:** Implement JWT authentication for more secure sessions.
*   **SMS Integration:** Hook up the "Send Reminder" button to a real SMS gateway (e.g., Twilio).
*   **Email Reports:** Automatically email monthly invoices to members.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
