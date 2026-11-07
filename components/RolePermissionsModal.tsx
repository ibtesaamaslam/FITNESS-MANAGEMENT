import React from 'react';
import { Role, ROLE_PERMISSIONS } from '../types';
import { CloseIcon, ShieldCheckIcon, LockIcon } from './icons';

interface RolePermissionsModalProps {
  currentRole: Role;
  isOpen: boolean;
  onClose: () => void;
}

interface CapabilityRow {
  category: string;
  feature: string;
  description: string;
  admin: boolean;
  manager: boolean;
  notes?: string;
}

const CAPABILITIES: CapabilityRow[] = [
  // Operations & Members
  {
    category: 'Member Operations',
    feature: 'Register & Edit Members',
    description: 'Add new admissions, update phone numbers, edit plans and assign personal trainers',
    admin: true,
    manager: true,
  },
  {
    category: 'Member Operations',
    feature: 'Body Measurements & Progress',
    description: 'Record body fat, chest, waist, and fitness milestones',
    admin: true,
    manager: true,
  },
  {
    category: 'Member Operations',
    feature: 'Permanent Member Deletion',
    description: 'Permanently remove members and purge customer records from the database',
    admin: true,
    manager: false,
    notes: 'Admin only to prevent accidental loss or malicious erasure of member records',
  },
  // Attendance
  {
    category: 'Attendance Management',
    feature: 'Member Daily Check-Ins',
    description: 'Mark attendance for male/female gym members and monitor active floor counts',
    admin: true,
    manager: true,
  },
  {
    category: 'Attendance Management',
    feature: 'Staff Clock-In / Clock-Out',
    description: 'Log duty check-in and checkout timings for trainers and support staff',
    admin: true,
    manager: true,
  },
  // POS & Fees
  {
    category: 'Cashier & POS',
    feature: 'Collect Fees & Generate Invoices',
    description: 'Receive monthly dues, registration fees, and issue printable invoice receipts',
    admin: true,
    manager: true,
  },
  {
    category: 'Cashier & POS',
    feature: 'Accessory & Supplement Sales',
    description: 'Sell protein shakes, energy drinks, gym straps, and record counter POS sales',
    admin: true,
    manager: true,
  },
  {
    category: 'Cashier & POS',
    feature: 'Delete Payment Records',
    description: 'Void or remove historical fee payments from financial ledgers',
    admin: true,
    manager: false,
    notes: 'Locked for Manager to maintain a strict financial audit trail',
  },
  // Expenses
  {
    category: 'Financials & Expenses',
    feature: 'Record Daily Operating Expenses',
    description: 'Log purchases like drinking water cans, gym cleaning supplies, and minor fixes',
    admin: true,
    manager: true,
  },
  {
    category: 'Financials & Expenses',
    feature: 'Delete Historical Expenses',
    description: 'Remove past expense records from accounting ledgers',
    admin: true,
    manager: false,
    notes: 'Admin only to ensure accounting integrity',
  },
  // Staff & Payroll
  {
    category: 'Staff & Payroll',
    feature: 'Staff Directory & Shift Rosters',
    description: 'View trainer phone contacts, working shifts, and duty schedules',
    admin: true,
    manager: true,
  },
  {
    category: 'Staff & Payroll',
    feature: 'Staff Salaries & Payroll Slips',
    description: 'Configure base salary rates, calculate monthly bonuses/deductions, and disburse pay slips',
    admin: true,
    manager: false,
    notes: 'Strictly confidential; accessible only to Super Admin / Owner',
  },
  {
    category: 'Staff & Payroll',
    feature: 'Delete Staff Personnel',
    description: 'Remove employees, trainers, or contractors from gym roster',
    admin: true,
    manager: false,
    notes: 'Restricted to Super Admin',
  },
  // System Security & Backup
  {
    category: 'System Administration',
    feature: '12-Month Deep Backup & Restore',
    description: 'Export JSON backups, restore database, and inspect historical monthly archives',
    admin: true,
    manager: false,
    notes: 'High-risk system function; restricted exclusively to Super Admin',
  },
  {
    category: 'System Administration',
    feature: 'Gym Branding & Master Password',
    description: 'Rename gym organization name and configure financial master passwords',
    admin: true,
    manager: false,
    notes: 'Owner / Super Admin privilege',
  },
];

export const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({ currentRole, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 text-primary rounded-xl border border-primary/30">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Role Boundaries & Access Permissions</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${ROLE_PERMISSIONS[currentRole].badgeColor}`}>
                  Current: {currentRole}
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Clear separation of privileges between Super Admin and Duty Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Role Comparison Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-800 bg-gray-900/40">
          <div className={`p-4 rounded-xl border transition-all ${
            currentRole === 'Admin'
              ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
              : 'bg-gray-800/40 border-gray-700/60 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <h3 className="font-bold text-white">Super Admin / Owner</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                Full Control
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Unrestricted executive authority. Responsible for Financial Margins, Staff Salaries, Disbursals, Database Backups, Record Deletions, and System Security.
            </p>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${
            currentRole === 'Manager'
              ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
              : 'bg-gray-800/40 border-gray-700/60 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="font-bold text-white">Duty / Operations Manager</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                Operations Only
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Day-to-day gym management. Handles Member admissions, Daily Check-Ins, Fee collections, POS store sales, and Daily operating expenses. Deletions and system-level backups are protected.
            </p>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1f2937] text-gray-300 uppercase tracking-wider font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3.5">Feature & Responsibility</th>
                  <th className="p-3.5 text-center w-28 bg-emerald-950/20 text-emerald-400 border-x border-gray-800/80">
                    <div className="flex items-center justify-center gap-1">
                      <span>👑</span>
                      <span>Admin</span>
                    </div>
                  </th>
                  <th className="p-3.5 text-center w-28 bg-blue-950/20 text-blue-400">
                    <div className="flex items-center justify-center gap-1">
                      <span>🛡️</span>
                      <span>Manager</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {CAPABILITIES.map((cap, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-gray-200 text-sm">{cap.feature}</div>
                      <div className="text-gray-400 mt-0.5">{cap.description}</div>
                      {cap.notes && (
                        <div className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                          <LockIcon className="h-3 w-3 inline" />
                          <span>{cap.notes}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center bg-emerald-950/10 border-x border-gray-800/80">
                      {cap.admin ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center bg-blue-950/10">
                      {cap.manager ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700/60" title="Restricted to Super Admin">
                          🔒 Restricted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#1f2937]/50 flex justify-between items-center text-xs text-gray-400">
          <span>Security Policy: Action-level enforcement protects financial audit records.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
