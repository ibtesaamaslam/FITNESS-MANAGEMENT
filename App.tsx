import React, { useState, useCallback, useEffect } from 'react';
import { Member, Payment, Role, View } from './types';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Fees from './components/Fees';
import Attendance from './components/Attendance';
import Report from './components/Report';
import { DashboardIcon, MembersIcon, FeesIcon, AttendanceIcon, DocumentReportIcon, MenuIcon, CloseIcon } from './components/icons';
import { supabase } from './lib/supabaseClient';

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

const SupabaseNotConfigured: React.FC = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
        <div className="max-w-2xl rounded-lg bg-surface p-8 text-center shadow-lg border border-red-500/50">
            <h1 className="text-3xl font-bold text-red-400">Configuration Needed</h1>
            <p className="mt-4 text-text-secondary">
                Your Supabase client is not configured. The application cannot connect to the database.
            </p>
            <div className="mt-6 text-left bg-secondary p-4 rounded-md">
                <p className="font-semibold text-text-primary">Please follow these steps:</p>
                <ol className="mt-2 list-decimal list-inside space-y-2 text-sm text-text-secondary">
                    <li>Open the file: <code className="bg-background px-2 py-1 rounded-md font-mono text-primary">lib/supabaseClient.ts</code></li>
                    <li>Replace the placeholder values for <code className="bg-background px-1 py-0.5 rounded font-mono">supabaseUrl</code> and <code className="bg-background px-1 py-0.5 rounded font-mono">supabaseAnonKey</code> with your actual Supabase project credentials.</li>
                    <li>Make sure you have run the database schema from <code className="bg-background px-2 py-1 rounded-md font-mono text-primary">supabase_schema.sql</code> in your Supabase project's SQL Editor.</li>
                </ol>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [role, setRole] = useState<Role>('Admin');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data: membersData, error: membersError } = await supabase
            .from('members')
            .select('*')
            .order('name', { ascending: true });

        if (membersError) {
            console.error('Error fetching members:', membersError);
        } else {
            setMembers(membersData as Member[]);
        }

        const { data: paymentsData, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .order('date', { ascending: false });

        if (paymentsError) {
            console.error('Error fetching payments:', paymentsError);
        } else {
            setPayments(paymentsData as Payment[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (supabase) {
            fetchData();
        }
    }, [fetchData]);


    const handleAddMember = useCallback(async (memberData: Omit<Member, 'id'>, paymentMethod: Payment['method']) => {
        if (!supabase) return;
        const { data: memberResult, error: memberError } = await supabase
            .from('members')
            .insert([memberData])
            .select();

        if (memberError) {
            console.error('Error adding member:', memberError);
            alert('Failed to add member.');
            return;
        }

        const newMember = memberResult[0] as Member;

        if (newMember.feePaid) {
            const newPayment: Omit<Payment, 'id' | 'created_at'> = {
                memberId: newMember.id,
                memberName: newMember.name,
                date: new Date().toISOString().split('T')[0],
                amount: newMember.fee,
                method: paymentMethod,
            };
            const { error: paymentError } = await supabase.from('payments').insert([newPayment]);
            if (paymentError) {
                console.error('Error adding payment record:', paymentError);
                alert('Member added, but failed to record payment.');
            }
        }
        
        await fetchData();
    }, [fetchData]);

    const handleUpdateMember = useCallback(async (updatedMember: Member, paymentMethod: Payment['method']) => {
        if (!supabase) return;
        const oldMember = members.find(m => m.id === updatedMember.id);

        if (oldMember && !oldMember.feePaid && updatedMember.feePaid) {
            const newPayment: Omit<Payment, 'id' | 'created_at'> = {
                memberId: updatedMember.id,
                memberName: updatedMember.name,
                date: new Date().toISOString().split('T')[0],
                amount: updatedMember.fee,
                method: paymentMethod,
            };
            const { error: paymentError } = await supabase.from('payments').insert([newPayment]);
            if (paymentError) {
                console.error('Error adding payment record on update:', paymentError);
                alert('Failed to record new payment.');
            }
        }

        const { id, ...memberToUpdate } = updatedMember;
        const { error: memberError } = await supabase
            .from('members')
            .update(memberToUpdate)
            .eq('id', id);

        if (memberError) {
            console.error('Error updating member:', memberError);
            alert('Failed to update member.');
        }

        await fetchData();
    }, [members, fetchData]);

    const handleDeleteMember = useCallback(async (id: string) => {
        if (!supabase) return;
        // With "on delete cascade" in the SQL schema, payments are deleted automatically.
        const { error } = await supabase.from('members').delete().eq('id', id);

        if (error) {
            console.error('Error deleting member:', error);
            alert('Failed to delete member.');
        }

        await fetchData();
    }, [fetchData]);

    const handleUpdateAttendance = useCallback(async (memberId: string, date: string, present: boolean) => {
        if (!supabase) return;
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        const newAttendance = { ...member.attendance, [date]: present };

        const { error } = await supabase
            .from('members')
            .update({ attendance: newAttendance })
            .eq('id', memberId);
        
        if (error) {
            console.error('Error updating attendance:', error);
        } else {
            // Optimistic update for better UX
            setMembers(prev => prev.map(m =>
                m.id === memberId
                    ? { ...m, attendance: newAttendance }
                    : m
            ));
        }
    }, [members]);
    
    const handleToggleReminders = useCallback(async (memberId: string, enabled: boolean) => {
        if (!supabase) return;
        const { error } = await supabase
            .from('members')
            .update({ remindersEnabled: enabled })
            .eq('id', memberId);
        
        if (error) {
            console.error('Error toggling reminders:', error);
        } else {
             // Optimistic update for better UX
            setMembers(prev => prev.map(m => 
                m.id === memberId 
                    ? { ...m, remindersEnabled: enabled }
                    : m
            ));
        }
    }, []);

    useEffect(() => {
        if(role === 'Member') {
            setView('attendance');
        } else {
            setView('dashboard');
        }
    }, [role]);

    if (!supabase) {
        return <SupabaseNotConfigured />;
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
                 {loading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-xl text-text-secondary animate-pulse">Loading data from Supabase...</p>
                    </div>
                ) : renderView()}
            </main>
        </div>
    );
};

export default App;