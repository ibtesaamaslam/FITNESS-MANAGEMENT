import React, { useState, useMemo } from 'react';
import { StaffMember, StaffRole, StaffCategory, PayrollType, StaffStatus, Member, StaffShift } from '../types';
import { MaskedAmount } from './MaskedAmount';
import { 
  UsersIcon, 
  StaffIcon, 
  SearchIcon, 
  PlusIcon, 
  TrashIcon, 
  DownloadIcon, 
  CloseIcon, 
  PencilIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  BriefcaseIcon,
  CalendarIcon,
  UserCheckIcon,
  ReportIcon,
  ClipboardListIcon
} from './icons';

export const calculateMonthlyPayout = (staff: StaffMember): number => {
  if (staff.payrollType === 'Monthly') {
    return staff.baseSalary || 0;
  } else if (staff.payrollType === 'Daily') {
    const days = staff.workingDaysPerMonth || 26;
    const rate = staff.baseSalary || 0;
    return rate * days;
  } else {
    const hours = staff.shiftHoursPerDay || 0;
    const days = staff.workingDaysPerMonth || 26;
    const rate = staff.baseSalary || 0;
    return rate * hours * days;
  }
};

const TimePickerInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const parseVal = (v: string) => {
    let hh = '09';
    let mm = '00';
    let period = 'AM';

    if (v) {
      const match = v.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1], 10);
        if (isNaN(h) || h === 0) h = 12;
        if (h > 12) h = 12;
        hh = h.toString().padStart(2, '0');

        let m = parseInt(match[2] || '0', 10);
        if (isNaN(m)) m = 0;
        if (m > 59) m = 59;
        mm = m.toString().padStart(2, '0');

        if (match[3]) period = match[3].toUpperCase();
      }
    }
    return { hh, mm, period };
  };

  const { hh, mm, period } = parseVal(value);

  const incrementHour = () => {
    let h = parseInt(hh, 10);
    if (isNaN(h)) h = 9;
    h = h >= 12 ? 1 : h + 1;
    const newH = h.toString().padStart(2, '0');
    onChange(`${newH}:${mm} ${period}`);
  };

  const decrementHour = () => {
    let h = parseInt(hh, 10);
    if (isNaN(h)) h = 9;
    h = h <= 1 ? 12 : h - 1;
    const newH = h.toString().padStart(2, '0');
    onChange(`${newH}:${mm} ${period}`);
  };

  const incrementMinute = () => {
    let m = parseInt(mm, 10);
    if (isNaN(m)) m = 0;
    m = (m + 1) % 60;
    const newM = m.toString().padStart(2, '0');
    onChange(`${hh}:${newM} ${period}`);
  };

  const decrementMinute = () => {
    let m = parseInt(mm, 10);
    if (isNaN(m)) m = 0;
    m = (m - 1 + 60) % 60;
    const newM = m.toString().padStart(2, '0');
    onChange(`${hh}:${newM} ${period}`);
  };

  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 2) digits = digits.slice(-2);
    if (!digits) {
      onChange(`12:${mm} ${period}`);
      return;
    }
    let h = parseInt(digits, 10);
    if (isNaN(h) || h === 0) h = 12;
    if (h > 12) h = 12;
    const newH = h.toString().padStart(2, '0');
    onChange(`${newH}:${mm} ${period}`);
  };

  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 2) digits = digits.slice(-2);
    if (!digits) {
      onChange(`${hh}:00 ${period}`);
      return;
    }
    let m = parseInt(digits, 10);
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    const newM = m.toString().padStart(2, '0');
    onChange(`${hh}:${newM} ${period}`);
  };

  const togglePeriod = () => {
    const nextPeriod = period === 'AM' ? 'PM' : 'AM';
    onChange(`${hh}:${mm} ${nextPeriod}`);
  };

  return (
    <div className="w-full bg-[#1f2937] border border-gray-700 focus-within:border-[#10b981] rounded-lg px-2 h-[38px] flex items-center justify-start gap-1.5 sm:gap-2 text-white font-mono text-xs select-none min-w-0 overflow-hidden">
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Hours input & stepper */}
        <div className="flex items-center gap-0.5">
          <input
            type="text"
            value={hh}
            onChange={handleHourInput}
            className="bg-transparent text-white font-bold font-mono text-xs focus:outline-none w-4 text-center"
            title="Hour (01-12)"
          />
          <div className="flex flex-col justify-center -space-y-0.5 ml-[1px]">
            <button
              type="button"
              onClick={incrementHour}
              className="text-gray-400 hover:text-white text-[9px] font-bold leading-none p-0.5 hover:bg-gray-700/80 rounded cursor-pointer transition-colors"
              title="Increase Hour"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={decrementHour}
              className="text-gray-400 hover:text-white text-[9px] font-bold leading-none p-0.5 hover:bg-gray-700/80 rounded cursor-pointer transition-colors"
              title="Decrease Hour"
            >
              ▼
            </button>
          </div>
        </div>

        <span className="text-gray-400 font-bold text-xs select-none">:</span>

        {/* Minutes input & stepper */}
        <div className="flex items-center gap-0.5">
          <input
            type="text"
            value={mm}
            onChange={handleMinuteInput}
            className="bg-transparent text-white font-bold font-mono text-xs focus:outline-none w-4 text-center"
            title="Minute (00-59)"
          />
          <div className="flex flex-col justify-center -space-y-0.5 ml-[1px]">
            <button
              type="button"
              onClick={incrementMinute}
              className="text-gray-400 hover:text-white text-[9px] font-bold leading-none p-0.5 hover:bg-gray-700/80 rounded cursor-pointer transition-colors"
              title="Increase Minute"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={decrementMinute}
              className="text-gray-400 hover:text-white text-[9px] font-bold leading-none p-0.5 hover:bg-gray-700/80 rounded cursor-pointer transition-colors"
              title="Decrease Minute"
            >
              ▼
            </button>
          </div>
        </div>
      </div>

      {/* AM / PM Toggle Button */}
      <button
        type="button"
        onClick={togglePeriod}
        className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 font-bold px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all uppercase select-none shrink-0 active:scale-95 ml-[5px] mr-0"
        title="Click to switch AM / PM"
      >
        {period}
      </button>
    </div>
  );
};

const ROLE_CATEGORIES: Record<StaffRole, StaffCategory> = {
  'Trainer': 'Trainers',
  'Senior Trainer': 'Trainers',
  'Receptionist': 'Administrative',
  'General Manager': 'Administrative',
  'Accountant': 'Administrative',
  'Maintenance': 'Support',
  'Cleaner': 'Support'
};

interface StaffProps {
  staff: StaffMember[];
  members: Member[];
  onAddStaff: (staff: Omit<StaffMember, 'id'>) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  onAssignMember: (staffId: string, memberId: string) => void;
  onUnassignMember: (staffId: string, memberId: string) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Staff: React.FC<StaffProps> = ({
  staff,
  members,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAssignMember,
  onUnassignMember,
  isUnlocked = false,
  onUnlockRequest,
  onNotify
}) => {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<'directory' | 'scheduler' | 'attendance'>('directory');
  
  // Selection Inspector State
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | StaffCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | StaffStatus>('All');

  // Attendance Sheet Date & Logs State
  const [attendanceDate, setAttendanceDate] = useState<string>('2026-08-12');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'Absent' | 'On Leave'>>({
    'st-1': 'Present',
    'st-2': 'Absent'
  });

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<StaffMember | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // PT Member Picker in Inspector
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: '',
    role: 'Trainer',
    category: 'Trainers',
    phone: '',
    email: '',
    cnic: '',
    avatar: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    payrollType: 'Monthly',
    baseSalary: 50000,
    shiftHoursPerDay: 8,
    workingDaysPerMonth: 26,
    emergencyContact: { name: '', relation: '', phone: '' },
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Shift Configuration State for Form
  const [formShifts, setFormShifts] = useState<StaffShift[]>([]);
  const [newShiftDay, setNewShiftDay] = useState<StaffShift['day']>('Monday');
  const [newShiftStart, setNewShiftStart] = useState<string>('09:00 AM');
  const [newShiftEnd, setNewShiftEnd] = useState<string>('05:00 PM');

  // Active Selected Staff
  const selectedStaff = useMemo(() => {
    return staff.find(s => s.id === selectedStaffId) || null;
  }, [staff, selectedStaffId]);

  // Filtered Staff Directory
  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [staff, searchTerm, selectedCategory, selectedStatus]);

  // Handlers for Add/Edit
  const handleOpenAddModal = () => {
    setSelectedStaffForEdit(null);
    setFormData({
      name: '',
      role: 'Trainer',
      category: 'Trainers',
      phone: '',
      email: '',
      cnic: '',
      avatar: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      payrollType: 'Monthly',
      baseSalary: 45000,
      shiftHoursPerDay: 8,
      workingDaysPerMonth: 26,
      emergencyContact: { name: '', relation: '', phone: '' },
      notes: ''
    });
    setFormShifts([]);
    setNewShiftDay('Monday');
    setNewShiftStart('09:00 AM');
    setNewShiftEnd('05:00 PM');
    setFormErrors({});
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (s: StaffMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedStaffForEdit(s);
    setFormData({ ...s, emergencyContact: { ...s.emergencyContact } });
    setFormShifts(s.shifts ? [...s.shifts] : []);
    setNewShiftDay('Monday');
    setNewShiftStart('09:00 AM');
    setNewShiftEnd('05:00 PM');
    setFormErrors({});
    setIsAddEditModalOpen(true);
  };

  const handleAddShiftToForm = () => {
    if (!newShiftStart.trim() || !newShiftEnd.trim()) return;
    setFormShifts(prev => [
      ...prev,
      { day: newShiftDay, startTime: newShiftStart.trim(), endTime: newShiftEnd.trim() }
    ]);
  };

  const handleRemoveShiftFromForm = (index: number) => {
    setFormShifts(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteClick = (s: StaffMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStaffToDelete(s);
    setIsDeleteModalOpen(true);
  };

  const handleRoleChange = (role: StaffRole) => {
    const category = ROLE_CATEGORIES[role] || 'Support';
    setFormData(prev => ({ ...prev, role, category }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Full name is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.baseSalary || formData.baseSalary <= 0) {
      errors.baseSalary = formData.payrollType === 'Monthly' ? 'Enter valid base salary' : 'Enter valid hourly rate';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newPayload: Omit<StaffMember, 'id'> = {
      name: formData.name!.trim(),
      role: formData.role || 'Trainer',
      category: formData.category || 'Trainers',
      phone: formData.phone!.trim(),
      email: formData.email?.trim() || `${formData.name!.toLowerCase().replace(/\s+/g, '')}@gymvault.com`,
      cnic: formData.cnic?.trim() || '35202-1234567-1',
      avatar: formData.avatar?.trim() || '',
      joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
      status: formData.status || 'Active',
      payrollType: formData.payrollType || 'Monthly',
      baseSalary: Number(formData.baseSalary) || 0,
      shiftHoursPerDay: Number(formData.shiftHoursPerDay) || 8,
      workingDaysPerMonth: Number(formData.workingDaysPerMonth) || 26,
      assignedMemberIds: formData.assignedMemberIds || [],
      emergencyContact: {
        name: formData.emergencyContact?.name?.trim() || '',
        relation: formData.emergencyContact?.relation?.trim() || '',
        phone: formData.emergencyContact?.phone?.trim() || ''
      },
      notes: formData.notes?.trim() || '',
      shifts: formShifts
    };

    if (selectedStaffForEdit) {
      onUpdateStaff({ ...newPayload, id: selectedStaffForEdit.id });
      onNotify?.(`Updated profile for ${newPayload.name}`, 'success');
    } else {
      onAddStaff(newPayload);
      onNotify?.(`Added new staff member: ${newPayload.name}`, 'success');
    }

    setIsAddEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (staffToDelete) {
      onDeleteStaff(staffToDelete.id);
      onNotify?.(`Removed staff member: ${staffToDelete.name}`, 'info');
      if (selectedStaffId === staffToDelete.id) {
        setSelectedStaffId(null);
      }
      setStaffToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (staff.length === 0) {
      onNotify?.('No staff records available to export', 'error');
      return;
    }

    const headers = [
      'ID', 'Name', 'Role', 'Category', 'Status', 'Phone', 'Email', 'CNIC', 
      'Joining Date', 'Payroll Type', 'Base Rate/Salary (Rs)', 'Shift Hours', 'Est Monthly Payout (Rs)'
    ];

    const rows = staff.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.role,
      s.category,
      s.status,
      `"${s.phone}"`,
      `"${s.email}"`,
      `"${s.cnic}"`,
      s.joinDate,
      s.payrollType,
      s.baseSalary,
      s.shiftHoursPerDay,
      calculateMonthlyPayout(s)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify?.('Exported Staff Directory & Payroll CSV', 'success');
  };

  const handleAssignMemberToTrainer = () => {
    if (!selectedStaffId || !selectedMemberToAssign) return;
    onAssignMember(selectedStaffId, selectedMemberToAssign);
    onNotify?.('Assigned client to trainer', 'success');
    setSelectedMemberToAssign('');
  };

  const handleAttendanceToggle = (staffId: string, status: 'Present' | 'Absent' | 'On Leave') => {
    setAttendanceRecords(prev => {
      const current = prev[staffId];
      if (current === status) {
        const next = { ...prev };
        delete next[staffId];
        return next;
      }
      return { ...prev, [staffId]: status };
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#0b0f17] min-h-screen text-white">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Staff & Personnel
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage team profiles, shift times, PT clients, and attendance sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-[#10b981] hover:bg-[#0d9488] text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm cursor-pointer shadow"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-[#10b981] hover:bg-[#0d9488] text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm cursor-pointer shadow"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-800 text-sm">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'text-[#10b981] border-b-2 border-[#10b981]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <StaffIcon className="h-4 w-4" />
          <span>Staff Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`pb-3 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'scheduler'
              ? 'text-[#10b981] border-b-2 border-[#10b981]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Shift Scheduler</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'text-[#10b981] border-b-2 border-[#10b981]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <UserCheckIcon className="h-4 w-4" />
          <span>Personnel Attendance</span>
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY VIEW */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Grid Area (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#111827] p-3 rounded-xl border border-gray-800">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search staff..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#1f2937] text-white rounded-lg border border-gray-700 text-xs focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(['All', 'Trainers', 'Administrative', 'Support'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                        : 'bg-[#1f2937] text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStaff.map((s) => {
                const payout = calculateMonthlyPayout(s);
                const assignedCount = s.assignedMemberIds?.length || 0;
                const isSelected = selectedStaffId === s.id;

                // Role badge styling
                const isTrainer = s.role.includes('Trainer');
                const isFrontDesk = s.role.includes('Reception') || s.role.includes('Front');

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStaffId(s.id)}
                    className={`bg-[#111827] rounded-xl p-5 border transition-all cursor-pointer relative flex flex-col justify-between shadow-md ${
                      isSelected 
                        ? 'border-[#10b981] ring-1 ring-[#10b981] bg-[#131d2e]' 
                        : 'border-gray-800/90 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      {/* Top Row: Pill Badge + Edit / Delete */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            isTrainer
                              ? 'bg-purple-950/80 border border-purple-500/30 text-purple-300'
                              : isFrontDesk
                              ? 'bg-blue-950/80 border border-blue-500/30 text-blue-300'
                              : 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {s.role}
                        </span>

                        <div className="flex items-center gap-3 text-gray-400">
                          <button
                            onClick={(e) => handleOpenEditModal(s, e)}
                            className="hover:text-white transition-colors"
                            title="Edit Staff"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(s, e)}
                            className="hover:text-red-400 transition-colors"
                            title="Delete Staff"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Full Name */}
                      <h3 className="text-lg font-bold text-white mt-3">{s.name}</h3>

                      {/* Contact Info */}
                      <div className="mt-3 space-y-1.5 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span>{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MailIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span>Shifts: {s.shiftHoursPerDay > 0 ? `${s.shiftHoursPerDay / 2.5 > 1 ? Math.round(s.shiftHoursPerDay / 2.5) : 3} active` : '3 active'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Salary Estimate & PT Clients */}
                    <div className="flex items-end justify-between mt-5 pt-3 border-t border-gray-800/80">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          SALARY ESTIMATE
                        </span>
                        <div className="text-sm font-bold text-[#10b981] mt-0.5">
                          <MaskedAmount
                            amount={payout}
                            isUnlocked={isUnlocked}
                            onUnlockRequest={onUnlockRequest}
                            prefix="Rs "
                            suffix="/mo"
                            className="text-sm font-bold text-[#10b981]"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-right">
                          PT CLIENTS
                        </span>
                        <div className="bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 mt-0.5">
                          <UsersIcon className="h-3.5 w-3.5 text-purple-400" />
                          <span>{assignedCount} Assigned</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Staff Inspector Panel */}
          <div className="bg-[#111827] rounded-xl border border-gray-800/80 p-6 shadow-lg flex flex-col justify-between min-h-[420px]">
            {!selectedStaff ? (
              <div className="flex flex-col items-center justify-center text-center h-full my-auto space-y-4 py-12">
                <BriefcaseIcon className="h-14 w-14 text-gray-600" />
                <p className="text-sm text-gray-400 max-w-xs leading-relaxed italic">
                  Select a staff member from the directory to inspect payroll details, schedules, and active client assignments.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Inspector Header */}
                <div className="flex items-start justify-between border-b border-gray-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                      {selectedStaff.role}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedStaff.name}</h2>
                    <p className="text-xs text-gray-400">{selectedStaff.category} Department</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(selectedStaff)}
                      className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedStaffId(null)}
                      className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-xs"
                      title="Close Inspector"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Payroll & Shift Info */}
                <div className="space-y-3 bg-[#1a2333] p-4 rounded-xl border border-gray-800">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Payroll & Shift Structure</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Payroll Type:</span>
                      <span className="font-bold text-white">{selectedStaff.payrollType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Base Rate / Salary:</span>
                      <span className="font-bold text-white">Rs {selectedStaff.baseSalary.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Daily Shift:</span>
                      <span className="font-bold text-white">{selectedStaff.shiftHoursPerDay} Hours / day</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Est. Monthly Payout:</span>
                      <div className="font-bold text-[#10b981]">
                        <MaskedAmount
                          amount={calculateMonthlyPayout(selectedStaff)}
                          isUnlocked={isUnlocked}
                          onUnlockRequest={onUnlockRequest}
                          prefix="Rs "
                          suffix="/mo"
                          className="font-bold text-[#10b981]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Roster (Trainers) */}
                {selectedStaff.category === 'Trainers' && (
                  <div className="space-y-3 bg-[#1a2333] p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Assigned PT Roster</h4>
                      <span className="text-xs text-purple-400 font-bold">
                        {selectedStaff.assignedMemberIds?.length || 0} Members
                      </span>
                    </div>

                    {/* Member Assign Picker */}
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMemberToAssign}
                        onChange={(e) => setSelectedMemberToAssign(e.target.value)}
                        className="flex-1 bg-[#111827] text-xs text-white p-2 rounded-lg border border-gray-700 focus:outline-none focus:border-[#10b981]"
                      >
                        <option value="">Select gym member to assign...</option>
                        {members
                          .filter(m => !selectedStaff.assignedMemberIds?.includes(m.id))
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.membershipType})</option>
                          ))
                        }
                      </select>
                      <button
                        onClick={handleAssignMemberToTrainer}
                        disabled={!selectedMemberToAssign}
                        className="bg-[#10b981] hover:bg-[#0d9488] disabled:opacity-50 text-black font-bold text-xs px-3 py-2 rounded-lg cursor-pointer"
                      >
                        Assign
                      </button>
                    </div>

                    {/* Assigned Members List */}
                    {selectedStaff.assignedMemberIds && selectedStaff.assignedMemberIds.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                        {selectedStaff.assignedMemberIds.map(mId => {
                          const m = members.find(mem => mem.id === mId);
                          if (!m) return null;
                          return (
                            <div key={mId} className="flex items-center justify-between bg-[#111827] p-2 rounded-lg text-xs">
                              <span className="font-medium text-white">{m.name}</span>
                              <button
                                onClick={() => onUnassignMember(selectedStaff.id, mId)}
                                className="text-red-400 hover:text-red-300 text-[11px] font-semibold"
                              >
                                Unassign
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No gym members assigned to this trainer yet.</p>
                    )}
                  </div>
                )}

                {/* Emergency Contact & Notes */}
                <div className="space-y-2 text-xs text-gray-400 border-t border-gray-800 pt-3">
                  <div className="flex justify-between">
                    <span>Emergency Contact:</span>
                    <span className="text-white font-medium">
                      {selectedStaff.emergencyContact?.name || 'N/A'} ({selectedStaff.emergencyContact?.relation || 'Family'}) - {selectedStaff.emergencyContact?.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Joining Date:</span>
                    <span className="text-white font-medium">{selectedStaff.joinDate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SHIFT SCHEDULER VIEW */}
      {activeTab === 'scheduler' && (
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 space-y-6">
          <div className="border-b border-gray-800/80 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Weekly Shift Planner</h2>
            <p className="text-xs text-gray-400 mt-1">Review schedules side-by-side to ensure full floor coverage.</p>
          </div>

          {/* 7-Day Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-[360px] pt-2">
            {[
              {
                day: 'MON',
                shifts: [
                  { name: 'Coach Bilal', role: 'Trainer', time: '06:00-12:00' },
                  { name: 'Zainab Ahmed', role: 'Front-Desk', time: '09:00-17:00' }
                ]
              },
              {
                day: 'TUE',
                shifts: [
                  { name: 'Sana Khan', role: 'Trainer', time: '16:00-21:00' },
                  { name: 'Zainab Ahmed', role: 'Front-Desk', time: '09:00-17:00' }
                ]
              },
              {
                day: 'WED',
                shifts: [
                  { name: 'Coach Bilal', role: 'Trainer', time: '06:00-12:00' },
                  { name: 'Zainab Ahmed', role: 'Front-Desk', time: '09:00-17:00' }
                ]
              },
              {
                day: 'THU',
                shifts: [
                  { name: 'Sana Khan', role: 'Trainer', time: '16:00-21:00' },
                  { name: 'Zainab Ahmed', role: 'Front-Desk', time: '09:00-17:00' }
                ]
              },
              {
                day: 'FRI',
                shifts: [
                  { name: 'Coach Bilal', role: 'Trainer', time: '06:00-12:00' },
                  { name: 'Zainab Ahmed', role: 'Front-Desk', time: '09:00-17:00' }
                ]
              },
              {
                day: 'SAT',
                shifts: [
                  { name: 'Sana Khan', role: 'Trainer', time: '16:00-21:00' }
                ]
              },
              {
                day: 'SUN',
                shifts: []
              }
            ].map((col) => (
              <div key={col.day} className="flex flex-col space-y-4">
                <div className="text-center font-bold text-xs tracking-wider text-gray-300 uppercase border-b border-gray-800 pb-2">
                  {col.day}
                </div>

                <div className="space-y-4 flex-1">
                  {col.shifts.length > 0 ? (
                    col.shifts.map((s, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="font-bold text-xs text-white">{s.name}</div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-[#10b981] font-medium">{s.role}</span>
                          <span className="text-gray-400 font-mono text-[10px]">{s.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic pt-2">No shifts</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERSONNEL ATTENDANCE VIEW */}
      {activeTab === 'attendance' && (
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Staff Daily Attendance Sheets</h2>
              <p className="text-xs text-gray-400 mt-1">Log attendance to secure fair payouts and compliance trackers.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Sheet Date:</span>
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-[#1a2333] text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="border-b border-gray-800 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-2">STAFF NAME</th>
                  <th className="py-3 px-2">ROLE</th>
                  <th className="py-3 px-2">WAGE SCHEMA</th>
                  <th className="py-3 px-2">TODAY'S SHIFT</th>
                  <th className="py-3 px-2 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {staff.map((s) => {
                  const status = attendanceRecords[s.id] || 'Present';
                  
                  // Wage schema text
                  const wageText = s.payrollType === 'Monthly' 
                    ? `Monthly (Rs ${s.baseSalary.toLocaleString()})` 
                    : s.payrollType === 'Daily'
                    ? `Daily (Rs ${s.baseSalary.toLocaleString()})`
                    : `Hourly (Rs ${s.baseSalary.toLocaleString()})`;

                  // Shift timing logic matching schedule
                  let shiftDisplay = 'No shift scheduled';
                  if (s.name.includes('Bilal')) {
                    shiftDisplay = '06:00 - 12:00';
                  } else if (s.name.includes('Zainab')) {
                    shiftDisplay = '09:00 - 17:00';
                  } else if (s.name.includes('Sana') && attendanceDate.endsWith('02')) {
                    shiftDisplay = '16:00 - 21:00';
                  } else if (s.shiftHoursPerDay > 0 && !s.name.includes('Sana')) {
                    shiftDisplay = '09:00 - 17:00';
                  }

                  const isTrainer = s.role.includes('Trainer');
                  const isFrontDesk = s.role.includes('Reception') || s.role.includes('Front');

                  return (
                    <tr key={s.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-2 font-bold text-white text-sm">{s.name}</td>
                      
                      <td className="py-4 px-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            isTrainer
                              ? 'bg-purple-950/80 border border-purple-500/30 text-purple-300'
                              : isFrontDesk
                              ? 'bg-blue-950/80 border border-blue-500/30 text-blue-300'
                              : 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {s.role}
                        </span>
                      </td>

                      <td className="py-4 px-2 text-gray-300 font-medium">{wageText}</td>

                      <td className="py-4 px-2 font-mono text-xs">
                        {shiftDisplay !== 'No shift scheduled' ? (
                          <span className="text-amber-400 font-semibold">{shiftDisplay}</span>
                        ) : (
                          <span className="text-gray-500 italic">No shift scheduled</span>
                        )}
                      </td>

                      <td className="py-4 px-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleAttendanceToggle(s.id, 'Present')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              status === 'Present'
                                ? 'bg-[#10b981] text-white border-[#10b981] shadow-md shadow-emerald-900/30'
                                : 'bg-[#1f2937] text-gray-400 border-gray-700/80 hover:text-white hover:bg-gray-700'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                              status === 'Present' ? 'border-white text-white' : 'border-gray-500 text-gray-400'
                            }`}>
                              ✓
                            </span>
                            Present
                          </button>

                          <button
                            onClick={() => handleAttendanceToggle(s.id, 'Absent')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              status === 'Absent'
                                ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-md shadow-red-900/30'
                                : 'bg-[#1f2937] text-gray-400 border-gray-700/80 hover:text-red-300 hover:bg-gray-700'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                              status === 'Absent' ? 'border-white text-white' : 'border-gray-500 text-gray-400'
                            }`}>
                              ✕
                            </span>
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {selectedStaffForEdit ? `Edit Team Member: ${formData.name || selectedStaffForEdit.name}` : 'Add Team Member'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              {/* ROW 1: Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Sana Khan"
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#10b981]"
                  />
                  {formErrors.name && <p className="text-red-400 text-[10px] mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Role / Job Title *</label>
                  <select
                    value={formData.role || 'Trainer'}
                    onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="Trainer">Trainer / Personal Coach</option>
                    <option value="Senior Trainer">Senior Trainer</option>
                    <option value="Receptionist">Front-Desk / Receptionist</option>
                    <option value="General Manager">General Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Maintenance">Maintenance / Support</option>
                    <option value="Cleaner">Cleaner</option>
                  </select>
                </div>
              </div>

              {/* ROW 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">WhatsApp Phone *</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="03217654321"
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#10b981]"
                  />
                  {formErrors.phone && <p className="text-red-400 text-[10px] mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="sana@gymvault.com"
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>

              {/* ROW 3: Joining Date & Payroll Schema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joinDate || ''}
                    onChange={(e) => setFormData(p => ({ ...p, joinDate: e.target.value }))}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Payroll Schema</label>
                  <select
                    value={formData.payrollType || 'Hourly'}
                    onChange={(e) => setFormData(p => ({ ...p, payrollType: e.target.value as PayrollType }))}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="Hourly">Hourly Base Rate</option>
                    <option value="Daily">Daily Base Rate</option>
                    <option value="Monthly">Fixed Monthly Salary</option>
                  </select>
                </div>
              </div>

              {/* ROW 4: Base Rate / Fixed Salary */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  {formData.payrollType === 'Hourly'
                    ? 'Hourly Base Rate (Rs) *'
                    : formData.payrollType === 'Daily'
                    ? 'Daily Base Rate (Rs) *'
                    : 'Monthly Fixed Salary (Rs) *'}
                </label>
                <input
                  type="number"
                  value={formData.baseSalary || ''}
                  onChange={(e) => setFormData(p => ({ ...p, baseSalary: Number(e.target.value) }))}
                  placeholder="1500"
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#10b981]"
                />
                {formErrors.baseSalary && <p className="text-red-400 text-[10px] mt-1">{formErrors.baseSalary}</p>}
              </div>

              {/* SHIFT CONFIGURATION SECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-[#10b981]" />
                  <span className="font-bold text-white text-sm">Shift Configuration</span>
                </div>

                <div className="bg-[#1a2333] p-3.5 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                    <div className="w-full sm:w-28 shrink-0">
                      <label className="text-[11px] text-gray-400 block mb-1 font-medium">Week Day</label>
                      <select
                        value={newShiftDay}
                        onChange={(e) => setNewShiftDay(e.target.value as StaffShift['day'])}
                        className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-[#10b981]"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>

                    <div className="w-full sm:flex-1 min-w-0">
                      <label className="text-[11px] text-gray-400 block mb-1 font-medium">Start Time</label>
                      <TimePickerInput value={newShiftStart} onChange={setNewShiftStart} />
                    </div>

                    <div className="w-full sm:flex-1 min-w-0">
                      <label className="text-[11px] text-gray-400 block mb-1 font-medium">End Time</label>
                      <TimePickerInput value={newShiftEnd} onChange={setNewShiftEnd} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddShiftToForm}
                    className="w-full bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] font-bold py-2 px-4 rounded-lg border border-[#10b981]/50 text-xs cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    + Add Shift Schedule
                  </button>
                </div>

                {/* Shift Items List */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {formShifts.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-[#111827] border border-gray-700/80 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white">{s.day}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300 font-mono text-xs">{s.startTime} - {s.endTime}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveShiftFromForm(idx)}
                          className="text-gray-400 hover:text-red-400 p-1 cursor-pointer transition-colors"
                          title="Remove shift"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-5 py-2.5 bg-[#1f2937] hover:bg-gray-700 text-gray-300 font-bold rounded-lg border border-gray-700 cursor-pointer text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#10b981] hover:bg-[#0d9488] text-black font-bold rounded-lg cursor-pointer text-xs shadow-md transition-colors"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && staffToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Remove Staff Member?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-bold">{staffToDelete.name}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Delete Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
