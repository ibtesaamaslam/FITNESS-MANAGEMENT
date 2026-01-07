import React, { useState, useCallback, useEffect } from 'react';
import { Member, Payment, Role, View, ToastMessage, ToastType } from './types';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Fees from './components/Fees';
import Attendance from './components/Attendance';
import Report from './components/Report';
import Login from './components/Login';
import ToastContainer from './components/Toast';
import { useGymData } from './hooks/useGymData';
import { DashboardIcon, MembersIcon, FeesIcon, AttendanceIcon, DocumentReportIcon, MenuIcon, CloseIcon, LogOutIcon } from './components/icons';
import { DB_CONFIG } from './lib/dbConfig';

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
        }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const App: React.FC = () => {
    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<Role>('Admin');
    
    // View State
    const [view, setView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data Hook
    const { 
        members, 
        payments, 
        addMember, 
        updateMember, 
        deleteMember, 
        updateAttendance, 
        toggleReminder 
    } = useGymData();

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

    const handleUpdateAttendance = useCallback((memberId: string, date: string, present: boolean) => {
        updateAttendance(memberId, date, present);
        // Optional: show toast for attendance? Might be too spammy.
    }, [updateAttendance]);
    
    const handleToggleReminders = useCallback((memberId: string, enabled: boolean) => {
        toggleReminder(memberId, enabled);
        showToast(`Reminders ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }, [toggleReminder, showToast]);

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
                <Login onLogin={handleLogin} />
                <ToastContainer toasts={toasts} removeToast={removeToast} />
            </>
        );
    }

    const renderView = () => {
        switch (view) {
            case 'members':
                return <Members members={members} payments={payments} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} />;
            case 'fees':
                return <Fees members={members} payments={payments} onToggleReminders={handleToggleReminders} />;
            case 'attendance':
                return <Attendance members={members} role={role} onUpdateAttendance={handleUpdateAttendance} />;
            case 'report':
                return <Report members={members} payments={payments} />;
            case 'dashboard':
            default:
                return <Dashboard members={members} payments={payments} onNavigate={(v) => setView(v)} />;
        }
    };

    const sidebarContent = (
        <div className="h-full bg-surface flex flex-col p-4">
            <h1 className="text-2xl font-bold text-center mb-8 mt-4 text-primary">Saqib Fitness</h1>
            <div className="mb-6 px-4">
                <div className="p-3 bg-secondary rounded-lg flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        {role[0]}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-primary">{role}</p>
                        <p className="text-xs text-text-secondary">Online</p>
                    </div>
                </div>
            </div>
            
            <nav className="flex-grow space-y-2">
                {role !== 'Member' && (
                    <>
                        <NavLink icon={<DashboardIcon />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                        <NavLink icon={<MembersIcon />} label="Members" isActive={view === 'members'} onClick={() => setView('members')} />
                        <NavLink icon={<FeesIcon />} label="Fees & Ledger" isActive={view === 'fees'} onClick={() => setView('fees')} />
                    </>
                )}
                <NavLink icon={<AttendanceIcon />} label={role === 'Member' ? 'My Attendance' : 'Attendance'} isActive={view === 'attendance'} onClick={() => setView('attendance')} />
                {role !== 'Member' && (
                     <NavLink icon={<DocumentReportIcon />} label="Reports" isActive={view === 'report'} onClick={() => setView('report')} />
                )}
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-700">
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
        <div className="flex h-screen bg-background">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
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
        </div>
    );
};

export default App;