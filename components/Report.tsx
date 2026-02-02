
import React, { useMemo } from 'react';
import { Gym, Member, Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { LockIcon } from './icons';

interface Props {
    gym: Gym;
    members: Member[];
    payments: Payment[];
}

const Report: React.FC<Props> = ({ gym, members, payments }) => {
    // 1. Pro Plan Guard
    if (gym.planName !== 'Pro') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="bg-gray-700 p-6 rounded-full mb-6 relative group">
                    <LockIcon className="h-16 w-16 text-gray-400" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Professional Analytics</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                    Upgrade to the <span className="text-primary font-bold">Pro Plan</span> to unlock detailed financial reports, member growth trends, and retention analytics.
                </p>
                <div className="bg-surface border border-gray-700 p-6 rounded-lg w-full max-w-sm text-left opacity-75 grayscale blur-[1px]">
                     <div className="h-4 bg-gray-600 rounded w-1/3 mb-4"></div>
                     <div className="h-32 bg-gray-600/50 rounded mb-4"></div>
                     <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // 2. Data Processing for Charts
    
    // Revenue by Month (Last 6 months)
    const revenueData = useMemo(() => {
        const months: Record<string, number> = {};
        // Init last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            months[key] = 0;
        }

        payments.forEach(p => {
            const key = p.date.slice(0, 7);
            if (months[key] !== undefined) {
                months[key] += p.amount;
            }
        });

        return Object.entries(months).map(([date, amount]) => ({
            name: new Date(date + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            revenue: amount
        }));
    }, [payments]);

    // Member Growth by Month (Joined)
    const growthData = useMemo(() => {
        const months: Record<string, number> = {};
        // Init last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7);
            months[key] = 0;
        }

        members.forEach(m => {
            const key = m.joinDate.slice(0, 7);
            if (months[key] !== undefined) {
                months[key] += 1;
            }
        });

        return Object.entries(months).map(([date, count]) => ({
            name: new Date(date + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            members: count
        }));
    }, [members]);

    // Key Metrics
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const averageAge = members.length > 0 
        ? Math.round(members.reduce((sum, m) => sum + m.age, 0) / members.length) 
        : 0;
    
    // Find best performing month
    let maxRev = 0;
    let bestMonth = '-';
    revenueData.forEach(d => {
        if (d.revenue > maxRev) {
            maxRev = d.revenue;
            bestMonth = d.name;
        }
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Analytics Report</h2>
                <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    Pro Feature
                </span>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface p-6 rounded-lg shadow-lg border-t-4 border-green-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Lifetime Revenue</p>
                    <p className="text-3xl font-bold text-white mt-1">PKR {totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow-lg border-t-4 border-blue-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Best Month</p>
                    <p className="text-3xl font-bold text-white mt-1">{bestMonth}</p>
                    <p className="text-xs text-green-400">PKR {maxRev.toLocaleString()}</p>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow-lg border-t-4 border-purple-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Avg Member Age</p>
                    <p className="text-3xl font-bold text-white mt-1">{averageAge}</p>
                    <p className="text-xs text-gray-500">Years Old</p>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="font-bold text-white mb-6">Revenue History (Last 6 Months)</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{fontSize: 12}} />
                            <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff'}}
                                itemStyle={{color: '#10B981'}}
                                formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Member Growth Chart */}
            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h3 className="font-bold text-white mb-6">New Members Acquisition</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{fontSize: 12}} />
                            <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} allowDecimals={false} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff'}}
                                itemStyle={{color: '#3B82F6'}}
                            />
                            <Line type="monotone" dataKey="members" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#1F2937', strokeWidth: 2}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Report;
