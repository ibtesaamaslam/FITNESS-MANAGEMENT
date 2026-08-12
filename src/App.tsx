import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Member, Payment, Role, View, ToastMessage, ToastType, Expense } from './types';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Fees from './components/Fees';
import Attendance from './components/Attendance';
import Report from './components/Report';
import DailyLedger from './components/DailyLedger';
import Archive from './components/Archive';
import MonthlyExpense from './components/MonthlyExpense';
import { Accessories } from './components/Accessories';
import { Staff } from './components/Staff';
import Login from './components/Login';
import ToastContainer from './components/Toast';
import { useGymData } from './hooks/useGymData';
import { useFinancialPrivacy } from './hooks/useFinancialPrivacy';
import { FinancialSecurityModal } from './components/FinancialSecurityModal';
import { getLocalDateString, getLocalMonthString, isMemberArchived } from './lib/dateUtils';
import { NotificationMessageBox } from './components/NotificationMessageBox';
import { DashboardIcon, MembersIcon, FeesIcon, AttendanceIcon, DocumentReportIcon, MenuIcon, CloseIcon, LogOutIcon, LedgerIcon, ExpenseIcon, LockIcon, ArchiveIcon, AccessoriesIcon, StaffIcon } from './components/icons';
import { DB_CONFIG } from './lib/dbConfig';

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
            isActive 
              ? 'bg-[#10b981] text-white shadow-lg font-bold' 
              : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
        }`}
    >
        <span className={isActive ? 'text-white' : 'text-text-secondary'}>{icon}</span>
        <span className="text-sm">{label}</span>
    </button>
);

const App: React.FC = () => {
    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<Role>('Admin');
    
    // View State
    const [view, setView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Gym Branding State
    const [gymName, setGymName] = useState<string>(() => {
        return localStorage.getItem('gym_name') || 'Atlas';
    });

    const handleUpdateGymName = (newName: string) => {
        setGymName(newName);
        localStorage.setItem('gym_name', newName);
    };

    useEffect(() => {
        document.title = `${gymName} - Gym Management System`;
    }, [gymName]);

    // Theme State & Persistence
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Notification State
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Data Hook
    const { 
        members, 
        payments, 
        expenses,
        accessories,
        accessorySales,
        staff,
        addMember, 
        updateMember, 
        deleteMember, 
        deletePayment,
        addExpense,
        deleteExpense,
        addAccessoryItem,
        updateAccessoryItem,
        deleteAccessoryItem,
        sellAccessoryItem,
        deleteAccessorySale,
        updateAttendance, 
        toggleReminder,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        assignMemberToTrainer,
        unassignMemberFromTrainer
    } = useGymData();

    // Financial Privacy Hook
    const {
        isUnlocked,
        isModalOpen,
        modalMode,
        financialPassword,
        lockFinancials,
        openUnlockModal,
        openChangePasswordModal,
        closeModal,
        verifyAndUnlock,
        setInitialPassword,
        changePassword,
        setModalMode,
    } = useFinancialPrivacy();

    // Overdue Members calculation for global sidebar bell notification
    const overdueMembers = useMemo(() => {
        const todayStr = getLocalDateString();
        const currentMonth = getLocalMonthString();
        const nonArchivedMembers = members.filter(m => !isMemberArchived(m));
        
        return nonArchivedMembers.filter(m => {
            const isUnpaid = !m.feePaid;
            const isExpired = new Date(m.expiryDate) < new Date(todayStr);
            const isThisMonthOrPrior = m.expiryDate.startsWith(currentMonth) || new Date(m.expiryDate) < new Date(currentMonth + "-01");
            return (isUnpaid || isExpired) && isThisMonthOrPrior;
        });
    }, [members]);

    // Toast State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Handlers (Wrapped to trigger toasts)
    const handleAddMember = useCallback((memberData: Omit<Member, 'id'>, paymentMethod: Payment['method']) => {
        addMember(memberData, paymentMethod);
        showToast(`Member ${memberData.name} added successfully!`);
    }, [addMember, showToast]);

    const handleUpdateMember = useCallback((updatedMember: Member, paymentMethod: Payment['method']) => {
        updateMember(updatedMember, paymentMethod);
        showToast(`Member ${updatedMember.name} updated successfully!`);
    }, [updateMember, showToast]);

    const handleDeleteMember = useCallback((id: string) => {
        deleteMember(id);
        showToast('Member deleted successfully', 'info');
    }, [deleteMember, showToast]);

    const handleDeletePayment = useCallback((id: string) => {
        deletePayment(id);
        showToast('Payment record deleted successfully', 'info');
    }, [deletePayment, showToast]);

    const handleUpdateAttendance = useCallback((memberId: string, date: string, present: boolean) => {
        updateAttendance(memberId, date, present);
        // Optional: show toast for attendance? Might be too spammy.
    }, [updateAttendance]);
    
    const handleToggleReminders = useCallback((memberId: string, enabled: boolean) => {
        toggleReminder(memberId, enabled);
        showToast(`Reminders ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }, [toggleReminder, showToast]);

    const handleAddExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
        addExpense(expenseData);
        showToast(`Expense "${expenseData.title}" recorded!`);
    }, [addExpense, showToast]);

    const handleDeleteExpense = useCallback((id: string) => {
        deleteExpense(id);
        showToast(`Expense record removed`, 'info');
    }, [deleteExpense, showToast]);

    const handleLogin = (selectedRole: Role) => {
        setRole(selectedRole);
        setIsLoggedIn(true);
        setView(selectedRole === 'Member' ? 'attendance' : 'dashboard');
        showToast(`Welcome back, ${selectedRole}!`);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setRole('Admin');
        setView('dashboard');
    };

    // Ensure correct view based on role changes
    useEffect(() => {
        if(role === 'Member' && view !== 'attendance') {
            setView('attendance');
        }
    }, [role, view]);

    if (!isLoggedIn) {
        return (
            <>
                <Login onLogin={handleLogin} gymName={gymName} onUpdateGymName={handleUpdateGymName} />
                <ToastContainer toasts={toasts} removeToast={removeToast} />
            </>
        );
    }

    const renderView = () => {
        switch (view) {

            case 'members':
                return <Members members={members} payments={payments} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} onWarning={(msg) => showToast(msg, 'error')} isUnlocked={isUnlocked} onUnlockRequest={openUnlockModal} />;
            case 'fees':
                return <Fees members={members} payments={payments} accessorySales={accessorySales} onToggleReminders={handleToggleReminders} onDeletePayment={handleDeletePayment} isUnlocked={isUnlocked} onUnlockRequest={openUnlockModal} />;
            case 'attendance':
                return <Attendance members={members} role={role} onUpdateAttendance={handleUpdateAttendance} onWarning={(msg) => showToast(msg, 'error')} />;
            case 'report':
                return <Report members={members} payments={payments} />;
            case 'dailyledger':
                return <DailyLedger payments={payments} members={members} isUnlocked={isUnlocked} onUnlockRequest={openUnlockModal} />;
            case 'archive':
                return <Archive members={members} onDeleteMember={handleDeleteMember} />;
            case 'expenses':
                return <MonthlyExpense expenses={expenses} payments={payments} accessorySales={accessorySales} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} isUnlocked={isUnlocked} onUnlockRequest={openUnlockModal} />;
            case 'accessories':
                return (
                    <Accessories
                        accessories={accessories}
                        accessorySales={accessorySales}
                        members={members}
                        onAddAccessoryItem={addAccessoryItem}
                        onUpdateAccessoryItem={updateAccessoryItem}
                        onDeleteAccessoryItem={deleteAccessoryItem}
                        onSellAccessoryItem={sellAccessoryItem}
                        onDeleteAccessorySale={deleteAccessorySale}
                        isUnlocked={isUnlocked}
                        onUnlockRequest={openUnlockModal}
                        onNotify={(msg, type) => showToast(msg, type || 'success')}
                    />
                );
            case 'staff':
                return (
                    <Staff
                        staff={staff}
                        members={members}
                        onAddStaff={addStaffMember}
                        onUpdateStaff={updateStaffMember}
                        onDeleteStaff={deleteStaffMember}
                        onAssignMember={assignMemberToTrainer}
                        onUnassignMember={unassignMemberFromTrainer}
                        isUnlocked={isUnlocked}
                        onUnlockRequest={openUnlockModal}
                        onNotify={(msg, type) => showToast(msg, type || 'success')}
                    />
                );
            case 'dashboard':
            default:
                return <Dashboard members={members} payments={payments} accessorySales={accessorySales} onNavigate={(v) => setView(v)} onDeletePayment={handleDeletePayment} isUnlocked={isUnlocked} onUnlockRequest={openUnlockModal} />;
        }
    };

    const sidebarContent = (
        <div className="h-full bg-surface flex flex-col p-4 overflow-y-auto">
            <h1 className="text-2xl font-black text-center mb-6 mt-3 text-[#10b981] tracking-tight">{gymName}</h1>
            <div className="mb-6">
                <div className="p-3 bg border border-gray-800/80 rounded-xl flex items-center justify-between shadow-inner">
                    <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-[#10b981] flex items-center justify-center text-white font-black text-base shadow-md">
                            {role[0]}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-primary leading-tight">{role}</p>
                            <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                                <span>Online</span>
                            </p>
                        </div>
                    </div>
                    {role !== 'Member' && (
                        <button
                            type="button"
                            onClick={() => setIsNotificationOpen(true)}
                            className="relative p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg border border-red-500/20 transition-all focus:outline-none flex items-center justify-center cursor-pointer group shrink-0"
                            title="Overdue monthly fees alert"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {overdueMembers.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center shadow-lg ring-2 ring-surface animate-bounce select-none">
                                    {overdueMembers.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>
            
            <nav className="flex-grow space-y-2">
                {role !== 'Member' && (
                    <>
                        <NavLink icon={<DashboardIcon />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                        <NavLink icon={<MembersIcon />} label="Members" isActive={view === 'members'} onClick={() => setView('members')} />
                        <NavLink icon={<FeesIcon />} label="Fees & Ledger" isActive={view === 'fees'} onClick={() => setView('fees')} />
                        <NavLink icon={<LedgerIcon />} label="Daily Ledger" isActive={view === 'dailyledger'} onClick={() => setView('dailyledger')} />
                        <NavLink icon={<AccessoriesIcon />} label="Accessories" isActive={view === 'accessories'} onClick={() => setView('accessories')} />
                        <NavLink icon={<StaffIcon />} label="Staff & Payroll" isActive={view === 'staff'} onClick={() => setView('staff')} />
                        <NavLink icon={<ExpenseIcon />} label="Monthly Expense" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                        <NavLink icon={<ArchiveIcon />} label="Archive" isActive={view === 'archive'} onClick={() => setView('archive')} />
                    </>
                )}
                <NavLink icon={<AttendanceIcon />} label={role === 'Member' ? 'My Attendance' : 'Attendance'} isActive={view === 'attendance'} onClick={() => setView('attendance')} />
                {role !== 'Member' && (
                     <NavLink icon={<DocumentReportIcon />} label="Reports" isActive={view === 'report'} onClick={() => setView('report')} />
                )}
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-700 space-y-3">
                {/* Financial Privacy Settings */}
                {role !== 'Member' && (
                    <div className="px-4 py-2 bg-secondary/40 rounded-lg flex items-center justify-between border border-gray-800/50">
                        <span className="text-xs font-semibold text-text-secondary">Financial Privacy</span>
                        <button
                            type="button"
                            onClick={isUnlocked ? lockFinancials : openUnlockModal}
                            className={`py-1 px-3 rounded text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer ${
                                isUnlocked 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                            }`}
                            title={isUnlocked ? "Financial balances are visible. Click to lock." : "Financial balances masked. Click to enter owner password."}
                        >
                            <LockIcon className="h-3.5 w-3.5" />
                            <span>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
                        </button>
                    </div>
                )}

                {/* Global Theme Settings Toggle */}
                <div className="px-4 py-2 bg-secondary/40 rounded-lg flex items-center justify-between border border-gray-800/50">
                    <span className="text-xs font-semibold text-text-secondary">App Theme</span>
                    <button
                        type="button"
                        onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                        className="py-1 px-3 bg-secondary hover:bg-gray-650 rounded text-xs font-bold text-text-primary transition-all flex items-center gap-1.5 border border-gray-700 shadow-sm cursor-pointer"
                        title="Switch theme mode"
                    >
                        {theme === 'dark' ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                                <span>Light Theme</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                <span>Dark Theme</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Gym Name Customizer */}
                <div className="px-4 py-2 bg-secondary/40 rounded-lg border border-gray-800/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary">Gym Name</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={gymName}
                        onChange={(e) => handleUpdateGymName(e.target.value)}
                        className="w-full bg-secondary py-1 px-2.5 rounded text-xs font-bold text-text-primary border border-gray-700 focus:outline-none focus:border-primary transition-all outline-none"
                        placeholder="Gym Name Branding"
                        maxLength={32}
                    />
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
                >
                    <LogOutIcon />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-screen bg-background w-full overflow-hidden"
        >
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <NotificationMessageBox 
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                expiredMembers={overdueMembers}
                onNavigate={setView}
            />

            <FinancialSecurityModal
                isOpen={isModalOpen}
                mode={modalMode}
                onClose={closeModal}
                onVerifyAndUnlock={verifyAndUnlock}
                onSetInitialPassword={setInitialPassword}
                onChangePassword={changePassword}
                onSwitchMode={(mode) => {
                    if (mode === 'unlock') openUnlockModal();
                    else if (mode === 'change_password') openChangePasswordModal();
                    else setModalMode('set_password');
                }}
            />
            
            {/* Desktop Sidebar */}
            <aside className="w-64 hidden lg:block flex-shrink-0 border-r border-gray-800">
                {sidebarContent}
            </aside>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
                <div className="w-64 h-full shadow-2xl">
                    {sidebarContent}
                </div>
                <div className="absolute top-4 right-4" onClick={() => setIsSidebarOpen(false)}>
                    <CloseIcon className="h-6 w-6 text-white"/>
                </div>
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="bg-surface p-4 flex justify-between items-center lg:hidden sticky top-0 z-20 shadow-md">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <MenuIcon className="h-6 w-6 text-text-primary"/>
                    </button>
                    <h2 className="text-xl font-bold capitalize">{view}</h2>
                    <div className="w-6"></div>
                </header>
                {renderView()}
            </main>
        </motion.div>
    );
};

export default App;