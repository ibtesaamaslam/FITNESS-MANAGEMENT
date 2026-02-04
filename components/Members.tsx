import React, { useState, useEffect, useMemo } from 'react';
import { Member, Payment } from '../types';
import { CloseIcon, ReportIcon } from './icons';

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ConfirmDeleteModal: React.FC<{
    member: Member | null;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ member, onClose, onConfirm }) => {
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <WarningIcon />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-bold text-text-primary" id="modal-title">
                            Delete Member
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-text-secondary">
                                Are you sure you want to delete <span className="font-bold text-text-primary">{member.name}</span>? This action is permanent and cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-secondary text-base font-medium text-text-primary hover:bg-gray-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemberReportModal: React.FC<{
    member: Member | null;
    payments: Payment[];
    onClose: () => void;
}> = ({ member, payments, onClose }) => {
    if (!member) return null;

    const memberPayments = payments
        .filter(p => p.memberId === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const attendanceHistory = Object.entries(member.attendance)
        .map(([date, present]) => ({ date, present }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);
        
    const monthlyAttendanceSummary = useMemo(() => {
        return Object.entries(member.attendance).reduce((acc: Record<string, { present: number, absent: number }>, [date, present]) => {
            const month = date.substring(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = { present: 0, absent: 0 };
            }
            if (present) {
                acc[month].present++;
            } else {
                acc[month].absent++;
            }
            return acc;
        }, {} as Record<string, { present: number, absent: number }>);
    }, [member.attendance]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-8 w-full max-w-2xl relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
                    <CloseIcon />
                </button>
                <div className="flex items-center space-x-4 pb-4 border-b border-gray-700">
                    <img src={member.photo || `https://ui-avatars.com/api/?name=${member.name || '?'}&background=374151&color=F9FAFB`} alt="Profile" className="h-20 w-20 rounded-full object-cover bg-secondary" />
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">{member.name}</h2>
                        <p className="text-text-secondary font-mono">{member.registrationNo}</p>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto mt-6 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-text-primary mb-3">Payment History</h3>
                        <div className="overflow-x-auto max-h-48">
                            <table className="w-full text-left">
                                <thead className="bg-secondary sticky top-0">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {memberPayments.length > 0 ? memberPayments.map(p => (
                                        <tr key={p.id} className="border-b border-secondary">
                                            <td className="p-3">{p.date}</td>
                                            <td className="p-3">Rs {p.amount.toLocaleString()}</td>
                                            <td className="p-3">{p.method}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="text-center p-8 text-text-secondary">No payment history.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold text-text-primary mb-3">Attendance History (Last 30 Records)</h3>
                         <div className="overflow-x-auto max-h-48">
                            <table className="w-full text-left">
                                <thead className="bg-secondary sticky top-0">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceHistory.length > 0 ? attendanceHistory.map(att => (
                                        <tr key={att.date} className="border-b border-secondary">
                                            <td className="p-3">{att.date}</td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${att.present ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {att.present ? 'Present' : 'Absent'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={2} className="text-center p-8 text-text-secondary">No attendance history.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-text-primary mb-3">Monthly Attendance Summary</h3>
                        <div className="overflow-x-auto max-h-48 space-y-2">
                             {Object.keys(monthlyAttendanceSummary).length > 0 ? Object.entries(monthlyAttendanceSummary)
                                .sort(([monthA], [monthB]) => new Date(monthB).getTime() - new Date(monthA).getTime())
                                .map(([month, stats]) => (
                                <div key={month} className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                                    <span className="font-semibold text-text-primary">{new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                    <div className="flex space-x-4 text-sm">
                                        <span className="text-green-400">Present: {stats.present}</span>
                                        <span className="text-red-400">Absent: {stats.absent}</span>
                                    </div>
                                </div>
                             )) : (
                                <p className="text-center p-8 text-text-secondary">No attendance data to summarize.</p>
                             )}
                        </div>
                    </div>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-700 text-right">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 rounded-lg hover:bg-gray-700">Close</button>
                </div>
            </div>
        </div>
    );
};


interface MembersProps {
  members: Member[];
  payments: Payment[];
  onAddMember: (member: Omit<Member, 'id'>, paymentMethod: Payment['method']) => void;
  onUpdateMember: (member: Member, paymentMethod: Payment['method']) => void;
  onDeleteMember: (id: string) => void;
}

const MemberModal: React.FC<{
    member: Partial<Member> | null;
    onClose: () => void;
    onSave: (member: Partial<Member>, paymentMethod: Payment['method']) => void;
}> = ({ member, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Member> & { paymentMethod?: Payment['method'] }>({});

    useEffect(() => {
        const initialData: Partial<Member> & { paymentMethod?: Payment['method'] } = (member && member.id)
            ? { ...member, remindersEnabled: member.remindersEnabled ?? true }
            : {
                name: '',
                registrationNo: '',
                age: 0,
                phone: '',
                plan: 'Monthly',
                fee: 2000,
                feePaid: false,
                joinDate: new Date().toISOString().split('T')[0],
                photo: '',
                expiryDate: '',
                paymentMethod: 'Cash',
                remindersEnabled: true,
              };
        setFormData(initialData);
    }, [member]);

    useEffect(() => {
        if (formData.joinDate && formData.plan) {
            const expiryDate = new Date(formData.joinDate);
            if (formData.plan === 'Monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
            else if (formData.plan === 'Quarterly') expiryDate.setMonth(expiryDate.getMonth() + 3);
            else if (formData.plan === 'Yearly') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            
            const newExpiryDate = expiryDate.toISOString().split('T')[0];
            if (formData.expiryDate !== newExpiryDate) {
              setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
            }
        }
    }, [formData.joinDate, formData.plan, formData.expiryDate]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | boolean = value;

        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        } else if (name === 'feePaid') {
            processedValue = (e.target as HTMLSelectElement).value === 'true';
        } else if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setFormData(prev => ({ ...prev, photo: loadEvent.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, formData.paymentMethod || 'Cash');
    };
    
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl p-8 w-full max-w-lg relative max-h-full overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
                    <CloseIcon />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-text-primary">{member.id ? 'Edit Member' : 'Add New Member'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Full Name" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Registration No.</label>
                        <input type="text" name="registrationNo" value={formData.registrationNo || ''} onChange={handleChange} placeholder="e.g., SF-001" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Age</label>
                        <input type="number" name="age" value={formData.age || ''} onChange={handleChange} placeholder="Age" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone Number" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Plan</label>
                        <select name="plan" value={formData.plan || 'Monthly'} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg">
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Fee</label>
                        <input type="number" name="fee" value={formData.fee || ''} onChange={handleChange} placeholder="Fee Amount" className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Fee Status</label>
                        <select name="feePaid" value={formData.feePaid ? 'true' : 'false'} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg">
                            <option value="true">Paid</option>
                            <option value="false">Unpaid</option>
                        </select>
                    </div>

                    {formData.feePaid && (
                         <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Payment Method</label>
                            <select name="paymentMethod" value={formData.paymentMethod || 'Cash'} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg">
                                <option value="Cash">Cash</option>
                                <option value="Easypaisa">Easypaisa</option>
                                <option value="Jazz Cash">Jazz Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Join Date</label>
                        <input type="date" name="joinDate" value={formData.joinDate || ''} onChange={handleChange} className="w-full p-3 bg-secondary rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Expiry Date</label>
                        <input type="date" name="expiryDate" value={formData.expiryDate || ''} className="w-full p-3 bg-gray-700 rounded-lg cursor-not-allowed text-gray-400" readOnly />
                    </div>

                    <div className="col-span-2 mt-2">
                        <label className="block text-sm font-medium text-text-secondary mb-2">Profile Photo</label>
                        <div className="flex items-center space-x-4">
                            <img src={formData.photo || `https://ui-avatars.com/api/?name=${formData.name || '?'}&background=374151&color=F9FAFB`} alt="Profile" className="h-20 w-20 rounded-full object-cover bg-secondary" />
                            <div>
                                <label htmlFor="photo-upload" className="cursor-pointer bg-secondary px-4 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-gray-600 transition-colors">
                                    Upload Image
                                </label>
                                <input
                                    id="photo-upload"
                                    name="photo"
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-2 mt-2">
                        <div className="flex items-center space-x-3">
                            <input 
                                type="checkbox" 
                                id="remindersEnabled" 
                                name="remindersEnabled"
                                checked={formData.remindersEnabled ?? true} 
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-500 bg-secondary text-primary focus:ring-primary"
                            />
                            <label htmlFor="remindersEnabled" className="text-sm font-medium text-text-secondary">
                                Enable Fee/Expiry Reminders
                            </label>
                        </div>
                    </div>

                    <div className="col-span-2 flex justify-end space-x-4 pt-4 mt-4 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 rounded-lg hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-primary rounded-lg hover:bg-primary-hover">Save Member</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const isExpiringSoon = (expiryDate: string, days: number = 7): boolean => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const threshold = new Date();
    threshold.setDate(today.getDate() + days);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    threshold.setHours(0, 0, 0, 0);

    return expiry <= threshold && expiry >= today;
};


const Members: React.FC<MembersProps> = ({ members, payments, onAddMember, onUpdateMember, onDeleteMember }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Partial<Member> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [memberForReport, setMemberForReport] = useState<Member | null>(null);

    const handleAddNew = () => {
        setSelectedMember({});
        setIsModalOpen(true);
    };

    const handleEdit = (member: Member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleViewReport = (member: Member) => {
        setMemberForReport(member);
        setIsReportModalOpen(true);
    };
    
    const handleDeleteRequest = (member: Member) => {
        setMemberToDelete(member);
        setIsConfirmModalOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if(memberToDelete) {
            onDeleteMember(memberToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setMemberToDelete(null);
    };

    const handleSave = (memberData: Partial<Member>, paymentMethod: Payment['method']) => {
        if (memberData.id) {
            onUpdateMember(memberData as Member, paymentMethod);
        } else {
            const newMember = {
                ...memberData,
                photo: memberData.photo || `https://picsum.photos/seed/${Math.random()}/200`,
                attendance: {},
            } as Omit<Member, 'id'>;

            onAddMember(newMember, paymentMethod);
        }
        setIsModalOpen(false);
        setSelectedMember(null);
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8">
            {isModalOpen && <MemberModal member={selectedMember} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {isConfirmModalOpen && <ConfirmDeleteModal member={memberToDelete} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} />}
            {isReportModalOpen && <MemberReportModal member={memberForReport} payments={payments} onClose={() => setIsReportModalOpen(false)} />}
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Members</h1>
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 bg-secondary rounded-lg"
                    />
                    <button onClick={handleAddNew} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors">
                        Add New Member
                    </button>
                </div>
            </div>
            <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary">
                            <tr>
                                <th className="p-4">Photo</th>
                                <th className="p-4">Reg. No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Plan</th>
                                <th className="p-4">Fee Status</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="border-b border-secondary hover:bg-gray-700/50">
                                    <td className="p-4"><img src={member.photo} alt={member.name} className="h-12 w-12 rounded-full object-cover"/></td>
                                    <td className="p-4 font-mono text-text-secondary">{member.registrationNo}</td>
                                    <td className="p-4 font-medium">{member.name}</td>
                                    <td className="p-4">{member.plan}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${member.feePaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {member.feePaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <span>{member.expiryDate}</span>
                                            {isExpiringSoon(member.expiryDate) && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400" title="Membership is expiring soon!">
                                                    Expiring
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 flex items-center space-x-2">
                                        <button onClick={() => handleViewReport(member)} className="text-gray-400 hover:text-white" title="View Report"><ReportIcon/></button>
                                        <button onClick={() => handleEdit(member)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                        <button onClick={() => handleDeleteRequest(member)} className="text-red-400 hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Members;
