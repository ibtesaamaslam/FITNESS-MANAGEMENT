
import React, { useState } from 'react';
import { Gym, Member, Payment } from '../types';
import { CreditCardIcon, DownloadIcon, EditIcon, SettingsIcon, LockIcon, CloseIcon, WarningIcon, CheckCircleIcon } from './icons';

interface Props {
    gym: Gym;
    members: Member[];
    payments: Payment[];
    onUpdateGym: (settings: Partial<Gym>) => void;
}

const BillingPortal: React.FC<Props> = ({ gym, members, payments, onUpdateGym }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(gym.name);
    
    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Billing Modal State
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);

    const handleSaveName = () => {
        if (tempName.trim()) {
            onUpdateGym({ name: tempName.trim() });
            setIsEditingName(false);
        }
    };

    const handleUpdatePassword = () => {
        if (newPassword.length < 4) {
            alert('Password must be at least 4 characters.');
            return;
        }
        onUpdateGym({ adminPassword: newPassword });
        setNewPassword('');
        setIsChangingPassword(false);
        alert('Admin password updated successfully. Please use this password for your next login.');
    };

    const handleExportCSV = () => {
        // Define Columns with readable headers
        const headers = [
            'Registration No',
            'Full Name',
            'Phone',
            'Age',
            'Membership Plan',
            'Plan Fee (PKR)',
            'Join Date',
            'Expiry Date',
            'Subscription Status',
            'Total Amount Paid (PKR)',
            'Last Payment Date',
            'Attendance Rate'
        ];

        // Map data to rows
        const rows = members.map(m => {
            // 1. Financial Stats
            const memberPayments = payments.filter(p => p.memberId === m.id);
            const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
            const lastPayment = memberPayments.sort((a,b) => b.date.localeCompare(a.date))[0];
            
            // 2. Attendance Stats
            const trackedDays = Object.keys(m.attendance).length;
            const presentDays = Object.values(m.attendance).filter(v => v).length;
            const rate = trackedDays > 0 ? Math.round((presentDays / trackedDays) * 100) : 0;

            // 3. Status logic
            const isExpired = new Date(m.expiryDate) < new Date();
            const status = isExpired ? 'Expired' : 'Active';

            // 4. Construct Row
            return [
                `"${m.registrationNo}"`, // Quote to prevent CSV injection or comma issues
                `"${m.name}"`,
                `"${m.phone || 'N/A'}"`,
                m.age || 0,
                m.plan,
                m.fee,
                m.joinDate,
                m.expiryDate,
                status,
                totalPaid,
                lastPayment ? lastPayment.date : 'Never',
                `${rate}%`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${gym.slug}_master_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Reset instruction view when modal opens/closes
    const toggleBillingModal = (isOpen: boolean) => {
        setIsBillingModalOpen(isOpen);
        if (!isOpen) setShowPaymentInstructions(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Billing & Settings</h2>
                    <p className="text-gray-400">Manage your subscription, security, and brand settings.</p>
                </div>
            </div>

            {/* Branding Section */}
            <div className="bg-surface p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h3 className="text-gray-400 uppercase text-xs font-bold mb-4">Gym Branding</h3>
                <div className="flex items-center gap-4">
                    {isEditingName ? (
                        <div className="flex items-center gap-2 w-full max-w-md">
                            <input 
                                value={tempName} 
                                onChange={e => setTempName(e.target.value)}
                                className="bg-background text-white p-2 rounded border border-gray-600 w-full outline-none focus:border-primary"
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="bg-primary hover:bg-primary-hover px-4 py-2 rounded text-white font-bold text-sm">Save</button>
                            <button onClick={() => { setIsEditingName(false); setTempName(gym.name); }} className="text-gray-400 text-sm hover:text-white">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 group">
                            <span className="text-2xl font-bold text-white">{gym.name}</span>
                            <button onClick={() => setIsEditingName(true)} className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                <EditIcon />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">This name will be displayed on the dashboard and login screen.</p>
            </div>

            {/* Admin Security Section */}
            <div className="bg-surface p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                     <h3 className="text-gray-400 uppercase text-xs font-bold flex items-center gap-2">
                        <LockIcon className="h-4 w-4" /> Admin Security
                    </h3>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white font-medium">Admin Password</p>
                        <p className="text-sm text-gray-500">Used to access this Gym Portal (/g/{gym.slug}/login)</p>
                    </div>
                    
                    {isChangingPassword ? (
                        <div className="flex items-center gap-2">
                             <input 
                                type="password"
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="New Password"
                                className="bg-background text-white p-2 rounded border border-gray-600 outline-none focus:border-primary text-sm"
                                autoFocus
                            />
                             <button onClick={handleUpdatePassword} className="bg-primary hover:bg-primary-hover px-3 py-2 rounded text-white font-bold text-sm">Update</button>
                            <button onClick={() => { setIsChangingPassword(false); setNewPassword(''); }} className="text-gray-400 text-sm hover:text-white">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsChangingPassword(true)} className="border border-gray-600 hover:border-gray-400 text-white px-4 py-2 rounded text-sm transition-colors">
                            Change Password
                        </button>
                    )}
                </div>
            </div>

             {/* Subscription Details */}
            <div className="bg-surface p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h3 className="text-gray-400 uppercase text-xs font-bold mb-4 flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" /> Subscription Plan
                </h3>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white capitalize">{gym.planName} Plan</span>
                            <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold border ${
                                gym.subscriptionStatus === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                gym.subscriptionStatus === 'trial' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' :
                                'bg-red-900/30 text-red-400 border-red-800'
                            }`}>
                                {gym.subscriptionStatus}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                            {gym.subscriptionStatus === 'trial' 
                                ? `Trial expires on ${gym.trialEndsAt}` 
                                : `Next billing date: ${gym.nextBillingDate}`}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                             Price: PKR {gym.subscriptionPrice.toLocaleString()} / month
                        </p>
                    </div>
                    <button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => toggleBillingModal(true)}
                    >
                        Manage Billing
                    </button>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-surface p-6 rounded-lg shadow-lg border border-gray-700">
                <h3 className="text-gray-400 uppercase text-xs font-bold mb-4 flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" /> Data Management
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white font-medium">Export Master Report</p>
                        <p className="text-sm text-gray-500">Download a comprehensive CSV of members and financial summaries.</p>
                    </div>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors border border-gray-600">
                        <DownloadIcon className="h-4 w-4" /> Download CSV
                    </button>
                </div>
            </div>

            {/* BILLING MODAL */}
            {isBillingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh] min-h-[500px] animate-fade-in-up relative">
                        
                        {/* PAYMENT INSTRUCTIONS OVERLAY */}
                        {showPaymentInstructions ? (
                             <div className="absolute inset-0 z-10 bg-surface flex flex-col items-center justify-center p-8 animate-fade-in">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircleIcon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Activation Pending Payment</h3>
                                <p className="text-gray-300 mb-6 max-w-md text-center">
                                    The Admin will allow you full access after you send the payment of subscription to the following given bank account.
                                </p>

                                <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl w-full max-w-sm mb-8">
                                     <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-gray-700/50 pb-2">
                                            <span className="text-gray-500">Bank</span>
                                            <span className="text-white font-bold">UBL (United Bank Limited)</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-700/50 pb-2">
                                            <span className="text-gray-500">Account Title</span>
                                            <span className="text-white font-bold">MUHAMMAD IBTESAAM ASLAM</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-gray-500">Account No</span>
                                            <span className="text-primary font-mono font-bold text-lg">1206272171745</span>
                                        </div>
                                     </div>
                                </div>

                                <button 
                                    onClick={() => toggleBillingModal(false)}
                                    className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Manage Subscription</h3>
                                        <p className="text-gray-400 text-sm">Update your plan and payment details</p>
                                    </div>
                                    <button onClick={() => toggleBillingModal(false)} className="text-gray-400 hover:text-white">
                                        <CloseIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                
                                <div className="p-6 overflow-y-auto space-y-6">
                                    {/* Past Due Alert */}
                                    {gym.subscriptionStatus === 'past_due' && (
                                        <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg flex items-start gap-3">
                                            <WarningIcon className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-yellow-500 text-sm">Payment Past Due</h4>
                                                <p className="text-yellow-200/70 text-sm mt-1">
                                                    Your last payment failed. Please update your payment method to restore full access.
                                                </p>
                                                <button 
                                                    onClick={() => setShowPaymentInstructions(true)}
                                                    className="mt-3 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg"
                                                >
                                                    Pay Now & Reactivate
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Trial Alert */}
                                    {gym.subscriptionStatus === 'trial' && (
                                        <div className="bg-indigo-900/20 border border-indigo-700/50 p-4 rounded-lg flex items-start gap-3">
                                            <CreditCardIcon className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-indigo-400 text-sm">Free Trial Active</h4>
                                                <p className="text-indigo-200/70 text-sm mt-1">
                                                    You have {Math.max(0, Math.ceil((new Date(gym.trialEndsAt).getTime() - Date.now()) / (86400000)))} days remaining.
                                                </p>
                                                <button 
                                                    onClick={() => setShowPaymentInstructions(true)}
                                                    className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg"
                                                >
                                                    Activate Full Subscription
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Plan Selection */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Select Plan</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {['Basic', 'Pro'].map((plan) => {
                                                const isSelected = gym.planName === plan;
                                                const price = plan === 'Basic' ? 3000 : 5000;
                                                return (
                                                    <div 
                                                        key={plan}
                                                        onClick={() => onUpdateGym({ planName: plan as 'Basic' | 'Pro', subscriptionPrice: price })}
                                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                            isSelected 
                                                            ? 'border-primary bg-primary/10' 
                                                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-white text-lg">{plan}</span>
                                                            {isSelected && <CheckCircleIcon className="h-6 w-6 text-primary" />}
                                                        </div>
                                                        <div className="text-2xl font-bold text-white mb-3">
                                                            PKR {price.toLocaleString()} <span className="text-sm text-gray-500 font-normal">/mo</span>
                                                        </div>
                                                        <ul className="text-xs text-gray-400 space-y-2">
                                                            {plan === 'Basic' ? (
                                                                <>
                                                                    <li className="flex gap-2"><CheckCircleIcon className="h-3 w-3 text-gray-500" /> Manage Members</li>
                                                                    <li className="flex gap-2"><CheckCircleIcon className="h-3 w-3 text-gray-500" /> Attendance Tracking</li>
                                                                    <li className="flex gap-2"><CheckCircleIcon className="h-3 w-3 text-gray-500" /> Basic Reports</li>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <li className="flex gap-2"><CheckCircleIcon className="h-3 w-3 text-primary" /> All Basic Features</li>
                                                                    <li className="flex gap-2"><CheckCircleIcon className="h-3 w-3 text-primary" /> <span className="text-gray-300">Advanced Analytics</span></li>
                                                                    <li className="flex gap-2"><CheckCircleIcon className="h-3 w-3 text-primary" /> <span className="text-gray-300">Member Profiles</span></li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Payment Method - Bank Transfer Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Payment Details</h4>
                                        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/30 space-y-4">
                                            <p className="text-sm text-gray-400">Please transfer the subscription fee to the following account:</p>
                                            
                                            <div className="space-y-3">
                                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                                    <span className="text-gray-500 text-sm">Bank</span>
                                                    <span className="text-white font-bold text-sm">(UBL) United Bank Limited</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-700 pb-2">
                                                    <span className="text-gray-500 text-sm">Account Title</span>
                                                    <span className="text-white font-bold text-sm text-right">MUHAMMAD IBTESAAM ASLAM</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 text-sm">Account No</span>
                                                    <span className="text-primary font-mono font-bold text-lg tracking-wider">1206272171745</span>
                                                </div>
                                            </div>
                                            
                                            <div className="text-center mt-2">
                                                <p className="text-xs text-gray-500">
                                                    After payment, please send the receipt to support for verification.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-6 border-t border-gray-700 bg-gray-800/50 flex justify-end">
                                    <button onClick={() => toggleBillingModal(false)} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                                        Done
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPortal;
