
import React, { useMemo } from 'react';
import { Member, Payment, Gym } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
    gym: Gym;
    members: Member[];
    payments: Payment[];
}

const Dashboard: React.FC<Props> = ({ gym, members, payments }) => {
    // Calc stats
    const totalMembers = members.length;
    const activeMembers = members.filter(m => new Date(m.expiryDate) > new Date()).length;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyIncome = payments
        .filter(p => p.date.startsWith(currentMonth))
        .reduce((sum, p) => sum + p.amount, 0);

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === '-') return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [y, m, d] = parts;
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
    };

    // Chart Data (Last 7 Days Attendance)
    const chartData = useMemo(() => {
        return Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const count = members.filter(m => m.attendance[dateStr]).length;
            return {
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                count
            };
        });
    }, [members]);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <p className="text-text-secondary">Total Members</p>
                    <p className="text-3xl font-bold text-primary">{totalMembers}</p>
                    <p className="text-xs text-gray-500 mt-1">{activeMembers} Active</p>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <p className="text-text-secondary">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-green-400">PKR {monthlyIncome.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">This Month</p>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <p className="text-text-secondary">Plan Status</p>
                    <p className="text-3xl font-bold text-indigo-400 capitalize">{gym.subscriptionStatus}</p>
                    <p className="text-xs text-gray-500 mt-1">{gym.planName} Plan</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface p-6 rounded-lg shadow-lg">
                    <h3 className="font-bold text-white mb-4">Weekly Attendance</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="day" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                                <Tooltip contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151'}} />
                                <Bar dataKey="count" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <h3 className="font-bold text-white mb-4">Recent Payments</h3>
                    <div className="space-y-3">
                        {payments.slice(-5).reverse().map(p => (
                            <div key={p.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                                <div>
                                    <div className="text-white font-medium">{p.memberName}</div>
                                    <div className="text-gray-500 text-xs">{formatDate(p.date)}</div>
                                </div>
                                <div className="text-green-400 font-bold">+PKR {p.amount}</div>
                            </div>
                        ))}
                        {payments.length === 0 && <p className="text-gray-500 text-sm">No payments yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
