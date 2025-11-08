import React, { useState, useCallback, useEffect } from 'react';
import { Member, Payment, Role, View } from './types';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Fees from './components/Fees';
import Attendance from './components/Attendance';
import { DashboardIcon, MembersIcon, FeesIcon, AttendanceIcon, MenuIcon, CloseIcon } from './components/icons';

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
    const [view, setView] = useState<View>('dashboard');
    const [role, setRole] = useState<Role>('Admin');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [members, setMembers] = useState<Member[]>(() => {
        try {
            const storedMembers = localStorage.getItem('gymMembers');
            return storedMembers ? JSON.parse(storedMembers) : [];
        } catch (error) {
            console.error("Failed to parse members from localStorage", error);
            return [];
        }
    });

    const [payments, setPayments] = useState<Payment[]>(() => {
        try {
            const storedPayments = localStorage.getItem('gymPayments');
            return storedPayments ? JSON.parse(storedPayments) : [];
        } catch (error) {
            console.error("Failed to parse payments from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('gymMembers', JSON.stringify(members));
        } catch (error) {
            console.error("Failed to save members to localStorage", error);
        }
    }, [members]);
    
    useEffect(() => {
        try {
            localStorage.setItem('gymPayments', JSON.stringify(payments));
        } catch (error) {
            console.error("Failed to save payments to localStorage", error);
        }
    }, [payments]);


    const handleAddMember = useCallback((memberData: Omit<Member, 'id'>, paymentMethod: Payment['method']) => {
        const newMember: Member = {
            id: `m${Date.now()}`,
            ...memberData
        };
        setMembers(prev => [...prev, newMember]);
        
        if (newMember.feePaid) {
            const newPayment: Payment = {
                id: `p${Date.now()}`,
                memberId: newMember.id,
                memberName: newMember.name,
                date: new Date().toISOString().split('T')[0],
                amount: newMember.fee,
                method: paymentMethod,
            };
            setPayments(prev => [...prev, newPayment]);
        }
    }, [setPayments]);

    const handleUpdateMember = useCallback((updatedMember: Member, paymentMethod: Payment['method']) => {
        const oldMember = members.find(m => m.id === updatedMember.id);

        if (oldMember && !oldMember.feePaid && updatedMember.feePaid) {
            const newPayment: Payment = {
                id: `p${Date.now()}`,
                memberId: updatedMember.id,
                memberName: updatedMember.name,
                date: new Date().toISOString().split('T')[0],
                amount: updatedMember.fee,
                method: paymentMethod,
            };
            setPayments(prev => [...prev, newPayment]);
        }

        setMembers(prev => prev.map(m => m.id === updatedMember.id ? { ...m, ...updatedMember } : m));
    }, [members, setPayments]);

    const handleDeleteMember = useCallback((id: string) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    const handleUpdateAttendance = useCallback((memberId: string, date: string, present: boolean) => {
        setMembers(prev => prev.map(m =>
            m.id === memberId
                ? { ...m, attendance: { ...m.attendance, [date]: present } }
                : m
        ));
    }, []);
    
    useEffect(() => {
        if(role === 'Member') {
            setView('attendance');
        } else {
            setView('dashboard');
        }
    }, [role]);

    const renderView = () => {
        switch (view) {
            case 'members':
                return <Members members={members} payments={payments} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} />;
            case 'fees':
                return <Fees members={members} payments={payments} />;
            case 'attendance':
                return <Attendance members={members} role={role} onUpdateAttendance={handleUpdateAttendance} />;
            case 'dashboard':
            default:
                return <Dashboard members={members} payments={payments} onNavigate={(v) => setView(v)} />;
        }
    };

    const sidebarContent = (
        <div className="h-full bg-surface flex flex-col p-4">
            <h1 className="text-2xl font-bold text-center mb-8 mt-4 text-primary">Saqib Fitness</h1>
            <nav className="flex-grow space-y-2">
                {role !== 'Member' && (
                    <>
                        <NavLink icon={<DashboardIcon />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                        <NavLink icon={<MembersIcon />} label="Members" isActive={view === 'members'} onClick={() => setView('members')} />
                        <NavLink icon={<FeesIcon />} label="Fees & Ledger" isActive={view === 'fees'} onClick={() => setView('fees')} />
                    </>
                )}
                <NavLink icon={<AttendanceIcon />} label={role === 'Member' ? 'My Attendance' : 'Attendance'} isActive={view === 'attendance'} onClick={() => setView('attendance')} />
            </nav>
            <div className="mt-auto">
                <div className="p-4 bg-secondary rounded-lg">
                    <label htmlFor="role-switcher" className="text-sm text-text-secondary">Switch Role</label>
                    <select
                        id="role-switcher"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="w-full mt-1 p-2 bg-background rounded-md text-text-primary"
                    >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Member">Member</option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="w-64 hidden lg:block flex-shrink-0">
                {sidebarContent}
            </aside>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
                <div className="w-64 h-full">
                    {sidebarContent}
                </div>
                <div className="absolute top-4 right-4" onClick={() => setIsSidebarOpen(false)}>
                    <CloseIcon className="h-6 w-6 text-white"/>
                </div>
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="bg-surface p-4 flex justify-between items-center lg:hidden">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <MenuIcon className="h-6 w-6 text-text-primary"/>
                    </button>
                    <h2 className="text-xl font-bold capitalize">{view}</h2>
                    <div></div>
                </header>
                {renderView()}
            </main>
        </div>
    );
};

export default App;