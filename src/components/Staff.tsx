import React, { useState, useMemo } from 'react';
import { StaffMember, StaffRole, StaffCategory, PayrollType, StaffStatus, Member, StaffShift, StaffPayrollRecord, StaffAttendanceLog } from '../types';
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
  ClipboardListIcon,
  FeesIcon,
  CashIcon
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
  staffPayrolls?: StaffPayrollRecord[];
  staffAttendanceLogs?: StaffAttendanceLog[];
  members: Member[];
  onAddStaff: (staff: Omit<StaffMember, 'id'>) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  onAssignMember: (staffId: string, memberId: string) => void;
  onUnassignMember: (staffId: string, memberId: string) => void;
  onRecordPayroll?: (record: Omit<StaffPayrollRecord, 'id'>) => void;
  onDeletePayroll?: (id: string) => void;
  onRecordAttendance?: (log: Omit<StaffAttendanceLog, 'id'>) => void;
  onDeleteAttendanceLog?: (id: string) => void;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Staff: React.FC<StaffProps> = ({
  staff,
  staffPayrolls = [],
  staffAttendanceLogs = [],
  members,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAssignMember,
  onUnassignMember,
  onRecordPayroll,
  onDeletePayroll,
  onRecordAttendance,
  onDeleteAttendanceLog,
  isUnlocked = false,
  onUnlockRequest,
  onNotify
}) => {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<'directory' | 'scheduler' | 'attendance' | 'payroll'>('directory');
  
  // Selection Inspector State
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | StaffCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | StaffStatus>('All');

  // Attendance Sheet Date & Logs State
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState<string>('All');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState<boolean>(false);
  const [selectedStaffForAttendance, setSelectedStaffForAttendance] = useState<StaffMember | null>(null);

  const [attendanceForm, setAttendanceForm] = useState<{
    status: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'On Leave';
    checkInTime: string;
    checkOutTime: string;
    workingHours: number;
    notes: string;
  }>({
    status: 'Present',
    checkInTime: '',
    checkOutTime: '',
    workingHours: 8,
    notes: ''
  });

  const handleOpenAttendanceModal = (s: StaffMember) => {
    setSelectedStaffForAttendance(s);
    const existingLog = staffAttendanceLogs.find(l => l.staffId === s.id && l.date === attendanceDate);
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (existingLog) {
      setAttendanceForm({
        status: existingLog.status,
        checkInTime: existingLog.checkInTime || '',
        checkOutTime: existingLog.checkOutTime || '',
        workingHours: existingLog.workingHours || 8,
        notes: existingLog.notes || ''
      });
    } else {
      setAttendanceForm({
        status: 'Present',
        checkInTime: currentTimeStr,
        checkOutTime: '',
        workingHours: s.shiftHoursPerDay || 8,
        notes: ''
      });
    }
    setIsAttendanceModalOpen(true);
  };

  const handleQuickClockIn = (s: StaffMember) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const existingLog = staffAttendanceLogs.find(l => l.staffId === s.id && l.date === attendanceDate);
    
    const log: Omit<StaffAttendanceLog, 'id'> = {
      staffId: s.id,
      staffName: s.name,
      date: attendanceDate,
      status: 'Present',
      checkInTime: existingLog?.checkInTime || timeNow,
      checkOutTime: existingLog?.checkOutTime || '',
      workingHours: existingLog?.workingHours || s.shiftHoursPerDay || 8,
      notes: existingLog?.notes || 'Quick Clock-In Recorded'
    };

    onRecordAttendance?.(log);
    onNotify?.(`Clock-In recorded for ${s.name} at ${timeNow}`, 'success');
  };

  const handleQuickClockOut = (s: StaffMember) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const existingLog = staffAttendanceLogs.find(l => l.staffId === s.id && l.date === attendanceDate);

    const log: Omit<StaffAttendanceLog, 'id'> = {
      staffId: s.id,
      staffName: s.name,
      date: attendanceDate,
      status: existingLog?.status || 'Present',
      checkInTime: existingLog?.checkInTime || '09:00 AM',
      checkOutTime: timeNow,
      workingHours: existingLog?.workingHours || s.shiftHoursPerDay || 8,
      notes: existingLog?.notes ? `${existingLog.notes} | Clock-Out at ${timeNow}` : `Clock-Out at ${timeNow}`
    };

    onRecordAttendance?.(log);
    onNotify?.(`Clock-Out recorded for ${s.name} at ${timeNow}`, 'info');
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForAttendance) return;

    const log: Omit<StaffAttendanceLog, 'id'> = {
      staffId: selectedStaffForAttendance.id,
      staffName: selectedStaffForAttendance.name,
      date: attendanceDate,
      status: attendanceForm.status,
      checkInTime: attendanceForm.checkInTime,
      checkOutTime: attendanceForm.checkOutTime,
      workingHours: Number(attendanceForm.workingHours) || 0,
      notes: attendanceForm.notes
    };

    onRecordAttendance?.(log);
    onNotify?.(`Saved attendance log for ${selectedStaffForAttendance.name} (${attendanceDate})`, 'success');
    setIsAttendanceModalOpen(false);
  };

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<StaffMember | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // PT Member Picker in Inspector
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState<string>('');

  // Payroll Management State
  const [payrollMonth, setPayrollMonth] = useState<string>('2026-08');
  const [payrollSearch, setPayrollSearch] = useState<string>('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Partial'>('All');
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState<boolean>(false);
  const [selectedStaffForPayroll, setSelectedStaffForPayroll] = useState<StaffMember | null>(null);

  // Full Month Attendance Audit Report Modal State
  const [isFullMonthReportOpen, setIsFullMonthReportOpen] = useState<boolean>(false);
  const [reportMonth, setReportMonth] = useState<string>('2026-08');
  const [reportStaffId, setReportStaffId] = useState<string>('All');

  // Helper for Monthly Attendance Audit
  const getMonthlyAttendanceAudit = (staffId: string, monthStr: string) => {
    const monthLogs = staffAttendanceLogs.filter(l => l.staffId === staffId && l.date.startsWith(monthStr));
    
    const presentLogs = monthLogs.filter(l => l.status === 'Present');
    const lateLogs = monthLogs.filter(l => l.status === 'Late');
    const halfDayLogs = monthLogs.filter(l => l.status === 'Half Day');
    const absentLogs = monthLogs.filter(l => l.status === 'Absent');
    const leaveLogs = monthLogs.filter(l => l.status === 'On Leave');

    return {
      totalLogs: monthLogs.length,
      presentCount: presentLogs.length,
      lateCount: lateLogs.length,
      halfDayCount: halfDayLogs.length,
      absentCount: absentLogs.length,
      leaveCount: leaveLogs.length,
      lateLogs,
      halfDayLogs,
      absentLogs,
      leaveLogs,
      allLogs: [...monthLogs].sort((a, b) => b.date.localeCompare(a.date))
    };
  };

  const activePayrollAudit = useMemo(() => {
    if (!selectedStaffForPayroll) return null;
    return getMonthlyAttendanceAudit(selectedStaffForPayroll.id, payrollMonth);
  }, [selectedStaffForPayroll, payrollMonth, staffAttendanceLogs]);

  const activeDailyRate = useMemo(() => {
    if (!selectedStaffForPayroll) return 0;
    return selectedStaffForPayroll.payrollType === 'Daily'
      ? selectedStaffForPayroll.baseSalary
      : Math.round(calculateMonthlyPayout(selectedStaffForPayroll) / (selectedStaffForPayroll.workingDaysPerMonth || 26));
  }, [selectedStaffForPayroll]);
  
  const [payrollForm, setPayrollForm] = useState<{
    baseSalary: number;
    bonus: number;
    deductions: number;
    paidAmount: number;
    status: 'Paid' | 'Unpaid' | 'Partial';
    paymentMethod: 'Cash' | 'Easypaisa' | 'Jazz Cash' | 'Bank Transfer';
    paymentDate: string;
    notes: string;
  }>({
    baseSalary: 0,
    bonus: 0,
    deductions: 0,
    paidAmount: 0,
    status: 'Paid',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [payslipModalRecord, setPayslipModalRecord] = useState<{
    staff: StaffMember;
    record: StaffPayrollRecord;
  } | null>(null);

  const handleOpenPaySalaryModal = (s: StaffMember) => {
    setSelectedStaffForPayroll(s);
    const existing = staffPayrolls.find(p => p.staffId === s.id && p.month === payrollMonth);
    const calculatedBase = calculateMonthlyPayout(s);

    if (existing) {
      setPayrollForm({
        baseSalary: existing.baseSalary,
        bonus: existing.bonus,
        deductions: existing.deductions,
        paidAmount: existing.paidAmount,
        status: existing.status,
        paymentMethod: existing.paymentMethod || 'Cash',
        paymentDate: existing.paymentDate || new Date().toISOString().split('T')[0],
        notes: existing.notes || ''
      });
    } else {
      setPayrollForm({
        baseSalary: calculatedBase,
        bonus: 0,
        deductions: 0,
        paidAmount: calculatedBase,
        status: 'Paid',
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: `Salary payout for ${payrollMonth}`
      });
    }
    setIsPayrollModalOpen(true);
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPayroll) return;

    const netPay = Number(payrollForm.baseSalary) + Number(payrollForm.bonus) - Number(payrollForm.deductions);
    const record: Omit<StaffPayrollRecord, 'id'> = {
      staffId: selectedStaffForPayroll.id,
      staffName: selectedStaffForPayroll.name,
      month: payrollMonth,
      baseSalary: Number(payrollForm.baseSalary),
      bonus: Number(payrollForm.bonus),
      deductions: Number(payrollForm.deductions),
      netPay: netPay,
      paidAmount: Number(payrollForm.paidAmount),
      status: payrollForm.status,
      paymentDate: payrollForm.paymentDate,
      paymentMethod: payrollForm.paymentMethod,
      notes: payrollForm.notes
    };

    onRecordPayroll?.(record);
    onNotify?.(`Recorded salary payout for ${selectedStaffForPayroll.name} (${payrollMonth})`, 'success');
    setIsPayrollModalOpen(false);
  };

  const handleOpenPayslip = (s: StaffMember) => {
    const record = staffPayrolls.find(p => p.staffId === s.id && p.month === payrollMonth);
    if (record) {
      setPayslipModalRecord({ staff: s, record });
    } else {
      const calculatedBase = calculateMonthlyPayout(s);
      const tempRecord: StaffPayrollRecord = {
        id: 'draft',
        staffId: s.id,
        staffName: s.name,
        month: payrollMonth,
        baseSalary: calculatedBase,
        bonus: 0,
        deductions: 0,
        netPay: calculatedBase,
        paidAmount: 0,
        status: 'Unpaid'
      };
      setPayslipModalRecord({ staff: s, record: tempRecord });
    }
  };

  // Payroll calculations for current payrollMonth
  const monthlyPayrollStats = useMemo(() => {
    let totalExpected = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    staff.forEach(s => {
      const expected = calculateMonthlyPayout(s);
      totalExpected += expected;

      const rec = staffPayrolls.find(p => p.staffId === s.id && p.month === payrollMonth);
      if (rec) {
        totalPaid += rec.paidAmount || 0;
        if (rec.status === 'Paid') paidCount++;
        else if (rec.status === 'Partial') partialCount++;
        else unpaidCount++;
      } else {
        unpaidCount++;
      }
    });

    const totalOutstanding = Math.max(0, totalExpected - totalPaid);

    return { totalExpected, totalPaid, totalOutstanding, paidCount, partialCount, unpaidCount };
  }, [staff, staffPayrolls, payrollMonth]);

  // Attendance calculations for selected attendanceDate
  const dailyAttendanceStats = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;

    staff.forEach(s => {
      const log = staffAttendanceLogs.find(l => l.staffId === s.id && l.date === attendanceDate);
      if (log) {
        if (log.status === 'Present') presentCount++;
        else if (log.status === 'Late') lateCount++;
        else if (log.status === 'Half Day') halfDayCount++;
        else if (log.status === 'Absent') absentCount++;
        else if (log.status === 'On Leave') onLeaveCount++;
      }
    });

    const clockedInTotal = presentCount + lateCount + halfDayCount;

    return {
      totalStaff: staff.length,
      clockedInTotal,
      presentCount,
      lateCount,
      halfDayCount,
      absentCount,
      onLeaveCount,
      notClockedIn: Math.max(0, staff.length - (clockedInTotal + absentCount + onLeaveCount))
    };
  }, [staff, staffAttendanceLogs, attendanceDate]);

  const filteredAttendanceStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || 
        s.role.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        s.phone.includes(attendanceSearch);

      const log = staffAttendanceLogs.find(l => l.staffId === s.id && l.date === attendanceDate);
      const status = log ? log.status : 'Not Clocked In';
      const matchesStatus = attendanceFilterStatus === 'All' || status === attendanceFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [staff, staffAttendanceLogs, attendanceDate, attendanceSearch, attendanceFilterStatus]);

  const filteredPayrollStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(payrollSearch.toLowerCase()) || 
        s.role.toLowerCase().includes(payrollSearch.toLowerCase()) ||
        s.phone.includes(payrollSearch);

      const rec = staffPayrolls.find(p => p.staffId === s.id && p.month === payrollMonth);
      const status = rec ? rec.status : 'Unpaid';
      const matchesStatus = payrollStatusFilter === 'All' || status === payrollStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [staff, staffPayrolls, payrollMonth, payrollSearch, payrollStatusFilter]);

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
  const [shiftToDeleteIndex, setShiftToDeleteIndex] = useState<number | null>(null);

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
    setShiftToDeleteIndex(index);
  };

  const handleConfirmRemoveShift = () => {
    if (shiftToDeleteIndex !== null) {
      setFormShifts(prev => prev.filter((_, i) => i !== shiftToDeleteIndex));
      setShiftToDeleteIndex(null);
    }
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
    const s = staff.find(st => st.id === staffId);
    if (!s) return;
    const log: Omit<StaffAttendanceLog, 'id'> = {
      staffId: s.id,
      staffName: s.name,
      date: attendanceDate,
      status: status === 'On Leave' ? 'On Leave' : status === 'Absent' ? 'Absent' : 'Present',
      checkInTime: status === 'Present' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
      checkOutTime: '',
      workingHours: s.shiftHoursPerDay || 8,
      notes: ''
    };
    onRecordAttendance?.(log);
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

        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-3 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'text-[#10b981] border-b-2 border-[#10b981]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FeesIcon className="h-4 w-4" />
          <span>Payroll & Payouts</span>
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
              { short: 'MON', full: 'Monday' },
              { short: 'TUE', full: 'Tuesday' },
              { short: 'WED', full: 'Wednesday' },
              { short: 'THU', full: 'Thursday' },
              { short: 'FRI', full: 'Friday' },
              { short: 'SAT', full: 'Saturday' },
              { short: 'SUN', full: 'Sunday' }
            ].map((col) => {
              const dayShifts = staff.flatMap(s => 
                (s.shifts || [])
                  .filter(sh => sh.day.toLowerCase() === col.full.toLowerCase())
                  .map(sh => ({ name: s.name, role: s.role, time: `${sh.startTime}-${sh.endTime}` }))
              );

              return (
                <div key={col.short} className="flex flex-col space-y-4">
                  <div className="text-center font-bold text-xs tracking-wider text-gray-300 uppercase border-b border-gray-800 pb-2">
                    {col.short}
                  </div>

                  <div className="space-y-4 flex-1">
                    {dayShifts.length > 0 ? (
                      dayShifts.map((s, idx) => (
                        <div key={idx} className="space-y-1 bg-[#1a2333]/50 p-2 rounded-lg border border-gray-800">
                          <div className="font-bold text-xs text-white">{s.name}</div>
                          <div className="flex flex-col gap-0.5 text-[11px]">
                            <span className="text-[#10b981] font-medium">{s.role}</span>
                            <span className="text-gray-400 font-mono text-[10px]">{s.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 italic pt-2 text-center">No shifts</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PERSONNEL ATTENDANCE VIEW */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Top Bar: Sheet Date, Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] p-4 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#1f2937] px-3 py-1.5 rounded-xl border border-gray-700">
                <CalendarIcon className="h-4 w-4 text-[#10b981]" />
                <span className="text-xs text-gray-400 font-semibold">Attendance Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#1f2937] p-1 rounded-xl border border-gray-700 overflow-x-auto">
                {(['All', 'Present', 'Late', 'Half Day', 'Absent', 'On Leave'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setAttendanceFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      attendanceFilterStatus === st
                        ? 'bg-[#10b981] text-white shadow'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsFullMonthReportOpen(true)}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-[#10b981] font-bold rounded-xl border border-emerald-500/30 text-xs flex items-center gap-2 cursor-pointer transition-all shadow"
              >
                <ReportIcon className="h-4 w-4" />
                <span>Full Month Register & Audit</span>
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                placeholder="Search worker attendance..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#1f2937] text-white rounded-xl border border-gray-700 text-xs focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Daily Attendance Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-[#111827] p-3.5 rounded-2xl border border-gray-800 space-y-1">
              <span className="text-xs text-gray-400 font-medium block">Total Staff</span>
              <span className="text-lg font-bold text-white">{dailyAttendanceStats.totalStaff} Workers</span>
              <p className="text-[10px] text-gray-500">On duty roster</p>
            </div>

            <div className="bg-[#111827] p-3.5 rounded-2xl border border-emerald-900/40 bg-gradient-to-b from-emerald-950/10 to-transparent space-y-1">
              <span className="text-xs text-emerald-400 font-medium block">Present / On Time</span>
              <span className="text-lg font-bold text-emerald-400">{dailyAttendanceStats.presentCount} Workers</span>
              <p className="text-[10px] text-emerald-500/80">Punctual arrival</p>
            </div>

            <div className="bg-[#111827] p-3.5 rounded-2xl border border-amber-900/40 bg-gradient-to-b from-amber-950/10 to-transparent space-y-1">
              <span className="text-xs text-amber-400 font-medium block">Late Arrivals</span>
              <span className="text-lg font-bold text-amber-400">{dailyAttendanceStats.lateCount} Workers</span>
              <p className="text-[10px] text-amber-500/80">Delayed check-in</p>
            </div>

            <div className="bg-[#111827] p-3.5 rounded-2xl border border-blue-900/40 bg-gradient-to-b from-blue-950/10 to-transparent space-y-1">
              <span className="text-xs text-blue-400 font-medium block">Half Day Shift</span>
              <span className="text-lg font-bold text-blue-400">{dailyAttendanceStats.halfDayCount} Workers</span>
              <p className="text-[10px] text-blue-500/80">Partial shift hours</p>
            </div>

            <div className="bg-[#111827] p-3.5 rounded-2xl border border-red-900/40 bg-gradient-to-b from-red-950/10 to-transparent space-y-1">
              <span className="text-xs text-red-400 font-medium block">Absent / On Leave</span>
              <span className="text-lg font-bold text-red-400">{dailyAttendanceStats.absentCount + dailyAttendanceStats.onLeaveCount} Workers</span>
              <p className="text-[10px] text-red-400/80">{dailyAttendanceStats.absentCount} Absent • {dailyAttendanceStats.onLeaveCount} Leave</p>
            </div>
          </div>

          {/* Daily Staff Punch & Attendance Sheet Table */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheckIcon className="h-4 w-4 text-[#10b981]" />
                  <span>Workers Check-in & Punch Time Sheet — {attendanceDate}</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Track exact arrival (Check-In) and departure (Check-Out) time for gym employees.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#1a2333]/80 text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Scheduled Shift</th>
                    <th className="py-3 px-3">Check-In Time</th>
                    <th className="py-3 px-3">Check-Out Time</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Remarks / Notes</th>
                    <th className="py-3 px-4 text-right">Punch & Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-800/80">
                  {filteredAttendanceStaff.length > 0 ? (
                    filteredAttendanceStaff.map((s) => {
                      const log = staffAttendanceLogs.find(l => l.staffId === s.id && l.date === attendanceDate);
                      const status = log ? log.status : 'Not Clocked In';

                      // Shift timing display
                      const dateObj = new Date(attendanceDate);
                      const dayNames: StaffShift['day'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const currentDayName = dayNames[dateObj.getDay()];
                      const todayShift = (s.shifts || []).find(sh => sh.day.toLowerCase() === currentDayName?.toLowerCase());

                      let shiftDisplay = 'No shift scheduled';
                      if (todayShift) {
                        shiftDisplay = `${todayShift.startTime} - ${todayShift.endTime}`;
                      } else if (s.shifts && s.shifts.length > 0) {
                        shiftDisplay = `${s.shifts[0].startTime} - ${s.shifts[0].endTime}`;
                      } else if (s.shiftHoursPerDay > 0) {
                        shiftDisplay = `${s.shiftHoursPerDay} hrs/day`;
                      }

                      return (
                        <tr key={s.id} className="hover:bg-[#1a2333]/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30 text-xs shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs">{s.name}</div>
                                <div className="text-[10px] text-gray-400">{s.phone || 'No Phone'}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                              {s.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-amber-400 font-medium">
                            {shiftDisplay}
                          </td>

                          <td className="py-3.5 px-3 font-mono">
                            {log?.checkInTime ? (
                              <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/50">
                                🟢 {log.checkInTime}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">Not checked in</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 font-mono">
                            {log?.checkOutTime ? (
                              <span className="text-blue-400 font-bold bg-blue-950/40 px-2 py-1 rounded border border-blue-800/50">
                                🔵 {log.checkOutTime}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">Not checked out</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            {status === 'Present' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Present
                              </span>
                            ) : status === 'Late' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Late Entry
                              </span>
                            ) : status === 'Half Day' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Half Day
                              </span>
                            ) : status === 'Absent' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                Absent
                              </span>
                            ) : status === 'On Leave' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                On Leave
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-[11px] text-gray-400 max-w-xs truncate">
                            {log?.notes || '-'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleQuickClockIn(s)}
                                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                                title="Record Check-In Time Now"
                              >
                                Clock In
                              </button>

                              <button
                                onClick={() => handleQuickClockOut(s)}
                                className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-[11px] rounded-lg border border-blue-500/30 transition-all cursor-pointer"
                                title="Record Check-Out Time Now"
                              >
                                Clock Out
                              </button>

                              <button
                                onClick={() => handleOpenAttendanceModal(s)}
                                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                                title="Edit Full Log & Notes"
                              >
                                Edit Log
                              </button>

                              {log && onDeleteAttendanceLog && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Clear attendance log for ${s.name} on ${attendanceDate}?`)) {
                                      onDeleteAttendanceLog(log.id);
                                      onNotify?.(`Cleared log for ${s.name}`, 'info');
                                    }
                                  }}
                                  className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors cursor-pointer"
                                  title="Delete Log"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                        No employees found matching attendance criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYROLL & PAYOUTS VIEW */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Top Bar: Month Selector & Search/Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] p-4 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#1f2937] px-3 py-1.5 rounded-xl border border-gray-700">
                <span className="text-xs text-gray-400 font-semibold">Payroll Month:</span>
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#1f2937] p-1 rounded-xl border border-gray-700">
                {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPayrollStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      payrollStatusFilter === st
                        ? 'bg-[#10b981] text-white shadow'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={payrollSearch}
                onChange={(e) => setPayrollSearch(e.target.value)}
                placeholder="Search staff payout..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#1f2937] text-white rounded-xl border border-gray-700 text-xs focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Payroll Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Base Budget */}
            <div className="bg-[#111827] p-4 rounded-2xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>Estimated Payroll</span>
                <FeesIcon className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white">
                <MaskedAmount amount={monthlyPayrollStats.totalExpected} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
              </div>
              <p className="text-[10px] text-gray-500">For {payrollMonth} ({staff.length} staff)</p>
            </div>

            {/* Stat 2: Total Paid */}
            <div className="bg-[#111827] p-4 rounded-2xl border border-emerald-900/40 bg-gradient-to-b from-emerald-950/10 to-transparent space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                <span>Total Salary Paid</span>
                <CashIcon className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400">
                <MaskedAmount amount={monthlyPayrollStats.totalPaid} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
              </div>
              <p className="text-[10px] text-emerald-500/80">{monthlyPayrollStats.paidCount} Fully Paid • {monthlyPayrollStats.partialCount} Partial</p>
            </div>

            {/* Stat 3: Total Outstanding */}
            <div className="bg-[#111827] p-4 rounded-2xl border border-red-900/40 bg-gradient-to-b from-red-950/10 to-transparent space-y-2">
              <div className="flex items-center justify-between text-xs text-red-400 font-medium">
                <span>Remaining / Unpaid</span>
                <ClockIcon className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-xl font-bold text-red-400">
                <MaskedAmount amount={monthlyPayrollStats.totalOutstanding} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
              </div>
              <p className="text-[10px] text-red-400/80">{monthlyPayrollStats.unpaidCount} Staff pending pay</p>
            </div>

            {/* Stat 4: Ratio */}
            <div className="bg-[#111827] p-4 rounded-2xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>Payout Progress</span>
                <UserCheckIcon className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white">
                {monthlyPayrollStats.paidCount} / {staff.length}
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#10b981] h-full transition-all duration-500"
                  style={{ width: `${staff.length ? (monthlyPayrollStats.paidCount / staff.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Staff Payroll Table */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FeesIcon className="h-4 w-4 text-[#10b981]" />
                <span>Monthly Staff Payroll Sheet — {payrollMonth}</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#1a2333]/80 text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-3">Base / Rate</th>
                    <th className="py-3 px-3">Bonus / Additions</th>
                    <th className="py-3 px-3">Deductions</th>
                    <th className="py-3 px-3">Net Pay</th>
                    <th className="py-3 px-3">Paid Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Payment Info</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-800/80">
                  {filteredPayrollStaff.length > 0 ? (
                    filteredPayrollStaff.map((s) => {
                      const record = staffPayrolls.find(p => p.staffId === s.id && p.month === payrollMonth);
                      const baseCalc = calculateMonthlyPayout(s);
                      const bonus = record ? record.bonus : 0;
                      const deductions = record ? record.deductions : 0;
                      const netPay = record ? record.netPay : baseCalc;
                      const paidAmount = record ? record.paidAmount : 0;
                      const status = record ? record.status : 'Unpaid';

                      return (
                        <tr key={s.id} className="hover:bg-[#1a2333]/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30 text-xs shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs">{s.name}</div>
                                <div className="text-[10px] text-gray-400">{s.role} • {s.payrollType}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-mono font-semibold text-gray-200">
                            <MaskedAmount amount={baseCalc} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                          </td>

                          <td className="py-3.5 px-3 font-mono text-emerald-400">
                            {bonus > 0 ? `+ Rs ${bonus.toLocaleString()}` : '-'}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-red-400">
                            {deductions > 0 ? `- Rs ${deductions.toLocaleString()}` : '-'}
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-white">
                            <MaskedAmount amount={netPay} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                            <MaskedAmount amount={paidAmount} isUnlocked={isUnlocked} onUnlockRequest={onUnlockRequest} />
                          </td>

                          <td className="py-3.5 px-3">
                            {status === 'Paid' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Paid
                              </span>
                            ) : status === 'Partial' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Partial
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                Unpaid
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-[11px] text-gray-400">
                            {record ? (
                              <div>
                                <div>{record.paymentMethod || 'Cash'}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{record.paymentDate || '-'}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">Not paid yet</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenPaySalaryModal(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow ${
                                  status === 'Paid'
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    : 'bg-[#10b981] hover:bg-[#0d9488] text-black'
                                }`}
                              >
                                <CashIcon className="h-3.5 w-3.5" />
                                <span>{status === 'Paid' ? 'Edit Pay' : 'Pay Salary'}</span>
                              </button>

                              <button
                                onClick={() => handleOpenPayslip(s)}
                                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors cursor-pointer"
                                title="View Payslip"
                              >
                                <ClipboardListIcon className="h-4 w-4" />
                              </button>

                              {record && onDeletePayroll && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete salary payout record for ${s.name} (${payrollMonth})?`)) {
                                      onDeletePayroll(record.id);
                                      onNotify?.(`Removed salary payout record for ${s.name}`, 'info');
                                    }
                                  }}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Record"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 italic">
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

      {/* DELETE SHIFT SCHEDULE CONFIRMATION MODAL */}
      {shiftToDeleteIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Shift Schedule?</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete <span className="text-white font-bold">{formShifts[shiftToDeleteIndex]?.day} ({formShifts[shiftToDeleteIndex]?.startTime} - {formShifts[shiftToDeleteIndex]?.endTime})</span>?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShiftToDeleteIndex(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveShift}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Delete Shift
              </button>
            </div>
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

      {/* PAY SALARY MODAL */}
      {isPayrollModalOpen && selectedStaffForPayroll && activePayrollAudit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Record Salary Payout & Attendance Audit</h3>
                <p className="text-xs text-[#10b981] font-medium mt-0.5">{selectedStaffForPayroll.name} ({selectedStaffForPayroll.role})</p>
              </div>
              <button onClick={() => setIsPayrollModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* MONTHLY ATTENDANCE AUDIT SUMMARY BOX */}
            <div className="bg-[#1a2333] border border-gray-700/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserCheckIcon className="h-4 w-4 text-[#10b981]" />
                  <span>Monthly Attendance Audit — {payrollMonth}</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Total Logged: {activePayrollAudit.totalLogs} Days</span>
              </div>

              {/* KPI Badges Row */}
              <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center font-bold">
                <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 p-1.5 rounded-lg">
                  <span>Present</span>
                  <span className="block text-xs font-mono">{activePayrollAudit.presentCount}d</span>
                </div>
                <div className="bg-amber-950/60 border border-amber-500/30 text-amber-400 p-1.5 rounded-lg">
                  <span>Late Entry</span>
                  <span className="block text-xs font-mono">{activePayrollAudit.lateCount}d</span>
                </div>
                <div className="bg-blue-950/60 border border-blue-500/30 text-blue-400 p-1.5 rounded-lg">
                  <span>Half Day</span>
                  <span className="block text-xs font-mono">{activePayrollAudit.halfDayCount}d</span>
                </div>
                <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-1.5 rounded-lg">
                  <span>Absent</span>
                  <span className="block text-xs font-mono">{activePayrollAudit.absentCount}d</span>
                </div>
                <div className="bg-purple-950/60 border border-purple-500/30 text-purple-400 p-1.5 rounded-lg">
                  <span>Leave</span>
                  <span className="block text-xs font-mono">{activePayrollAudit.leaveCount}d</span>
                </div>
              </div>

              {/* Late Arrivals & Absent Logs Details Box */}
              <div className="bg-[#111827] p-2.5 rounded-lg border border-gray-800 space-y-1.5 max-h-32 overflow-y-auto text-[11px]">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                  Late Arrival & Absent Breakdown
                </span>
                {activePayrollAudit.lateLogs.length > 0 || activePayrollAudit.absentLogs.length > 0 || activePayrollAudit.halfDayLogs.length > 0 ? (
                  <>
                    {activePayrollAudit.lateLogs.map(l => (
                      <div key={l.id} className="flex items-center justify-between text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/40">
                        <span>🟡 {l.date}: Late Entry</span>
                        <span className="font-mono font-bold">In: {l.checkInTime || 'N/A'} {l.notes ? `(${l.notes})` : ''}</span>
                      </div>
                    ))}
                    {activePayrollAudit.absentLogs.map(l => (
                      <div key={l.id} className="flex items-center justify-between text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/40">
                        <span>🔴 {l.date}: Absent</span>
                        <span className="font-mono">Unexcused</span>
                      </div>
                    ))}
                    {activePayrollAudit.halfDayLogs.map(l => (
                      <div key={l.id} className="flex items-center justify-between text-blue-400 bg-blue-950/20 px-2 py-0.5 rounded border border-blue-900/40">
                        <span>🔵 {l.date}: Half Day</span>
                        <span className="font-mono">{l.workingHours || 4} hrs shift</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-emerald-400 text-[10px] italic">
                    ✓ Perfect attendance record for {payrollMonth}! No late check-ins or absents logged.
                  </p>
                )}
              </div>

              {/* Quick Deduction Assistant Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold block">Quick Fine & Deduction Assistant:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activePayrollAudit.lateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const lateFine = activePayrollAudit.lateCount * 200; // Rs 200 per late
                        setPayrollForm(p => {
                          const newDeductions = p.deductions + lateFine;
                          const newNet = p.baseSalary + p.bonus - newDeductions;
                          return { ...p, deductions: newDeductions, paidAmount: p.status === 'Paid' ? newNet : p.paidAmount };
                        });
                        onNotify?.(`Added Rs ${lateFine} late fine (${activePayrollAudit.lateCount} late entries @ Rs 200/day)`, 'info');
                      }}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      + Fine Rs 200/Late (Rs {activePayrollAudit.lateCount * 200})
                    </button>
                  )}

                  {activePayrollAudit.absentCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const absentFine = activePayrollAudit.absentCount * activeDailyRate;
                        setPayrollForm(p => {
                          const newDeductions = p.deductions + absentFine;
                          const newNet = p.baseSalary + p.bonus - newDeductions;
                          return { ...p, deductions: newDeductions, paidAmount: p.status === 'Paid' ? newNet : p.paidAmount };
                        });
                        onNotify?.(`Added Rs ${absentFine} absent deduction (${activePayrollAudit.absentCount} absents @ Rs ${activeDailyRate}/day)`, 'info');
                      }}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500/30 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      + Deduct Absents (Rs {activePayrollAudit.absentCount * activeDailyRate})
                    </button>
                  )}

                  {activePayrollAudit.halfDayCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const halfDayFine = Math.round(activePayrollAudit.halfDayCount * activeDailyRate * 0.5);
                        setPayrollForm(p => {
                          const newDeductions = p.deductions + halfDayFine;
                          const newNet = p.baseSalary + p.bonus - newDeductions;
                          return { ...p, deductions: newDeductions, paidAmount: p.status === 'Paid' ? newNet : p.paidAmount };
                        });
                        onNotify?.(`Added Rs ${halfDayFine} half-day deduction`, 'info');
                      }}
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded border border-blue-500/30 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      + Deduct Half Days (Rs {Math.round(activePayrollAudit.halfDayCount * activeDailyRate * 0.5)})
                    </button>
                  )}

                    <button
                      type="button"
                      onClick={() => {
                        setPayrollForm(p => {
                          const newNet = p.baseSalary + p.bonus;
                          return { ...p, deductions: 0, paidAmount: p.status === 'Paid' ? newNet : p.paidAmount };
                        });
                        onNotify?.('Reset deductions to 0', 'info');
                      }}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 text-[10px] font-bold cursor-pointer transition-all"
                    >
                      Reset Fine
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePayroll} className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Payroll Month</label>
                  <input
                    type="month"
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Base Salary (Rs)</label>
                  <input
                    type="number"
                    value={payrollForm.baseSalary}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPayrollForm(p => {
                        const newNet = val + p.bonus - p.deductions;
                        return { ...p, baseSalary: val, paidAmount: p.status === 'Paid' ? newNet : p.paidAmount };
                      });
                    }}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Bonus / Allowance (Rs)</label>
                  <input
                    type="number"
                    value={payrollForm.bonus}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPayrollForm(p => {
                        const newNet = p.baseSalary + val - p.deductions;
                        return { ...p, bonus: val, paidAmount: p.status === 'Paid' ? newNet : p.paidAmount };
                      });
                    }}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Fine / Deductions (Rs)</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPayrollForm(p => {
                        const newNet = p.baseSalary + p.bonus - val;
                        return { ...p, deductions: val, paidAmount: p.status === 'Paid' ? newNet : p.paidAmount };
                      });
                    }}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Total Net Payable (Rs)</label>
                  <div className="w-full bg-[#1a2333] border border-gray-800 rounded-lg p-2 text-[#10b981] font-mono font-bold text-sm">
                    Rs {(Number(payrollForm.baseSalary) + Number(payrollForm.bonus) - Number(payrollForm.deductions)).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Payment Status</label>
                  <select
                    value={payrollForm.status}
                    onChange={(e) => {
                      const st = e.target.value as 'Paid' | 'Unpaid' | 'Partial';
                      const calcNet = Number(payrollForm.baseSalary) + Number(payrollForm.bonus) - Number(payrollForm.deductions);
                      setPayrollForm(p => ({
                        ...p,
                        status: st,
                        paidAmount: st === 'Paid' ? calcNet : st === 'Unpaid' ? 0 : p.paidAmount
                      }));
                    }}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white"
                  >
                    <option value="Paid">Paid (Full)</option>
                    <option value="Partial">Partial Pay</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Amount Paid (Rs)</label>
                  <input
                    type="number"
                    value={payrollForm.paidAmount}
                    onChange={(e) => setPayrollForm(p => ({ ...p, paidAmount: Number(e.target.value) }))}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Payment Method</label>
                  <select
                    value={payrollForm.paymentMethod}
                    onChange={(e) => setPayrollForm(p => ({ ...p, paymentMethod: e.target.value as any }))}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="Jazz Cash">Jazz Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payrollForm.paymentDate}
                    onChange={(e) => setPayrollForm(p => ({ ...p, paymentDate: e.target.value }))}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Notes / Remittance Reference</label>
                <input
                  type="text"
                  value={payrollForm.notes}
                  onChange={(e) => setPayrollForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Salary payout details..."
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#10b981] hover:bg-[#0d9488] text-black font-bold rounded-lg cursor-pointer shadow"
                >
                  Save Salary Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYSLIP STATEMENT MODAL */}
      {payslipModalRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Staff Payslip Statement</h3>
                <p className="text-xs text-gray-400">Month: {payslipModalRecord.record.month}</p>
              </div>
              <button onClick={() => setPayslipModalRecord(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Slip Paper View */}
            <div className="bg-[#1f2937] p-5 rounded-xl border border-gray-700 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                <div>
                  <p className="font-bold text-[#10b981] text-sm">GYM MANAGEMENT SYSTEM</p>
                  <p className="text-[10px] text-gray-400">Official Personnel Payroll Slip</p>
                </div>
                <div className="text-right font-mono">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    payslipModalRecord.record.status === 'Paid'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : payslipModalRecord.record.status === 'Partial'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {payslipModalRecord.record.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-gray-300">
                <div>
                  <span className="text-gray-400 block text-[10px]">Staff Name</span>
                  <span className="font-bold text-white">{payslipModalRecord.staff.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Role / Job</span>
                  <span className="font-semibold text-white">{payslipModalRecord.staff.role}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">CNIC Number</span>
                  <span className="font-mono text-gray-200">{payslipModalRecord.staff.cnic || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Phone Contact</span>
                  <span className="font-mono text-gray-200">{payslipModalRecord.staff.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="border-t border-b border-gray-700 py-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Salary:</span>
                  <span className="font-mono font-bold text-white">Rs {payslipModalRecord.record.baseSalary.toLocaleString()}</span>
                </div>
                {payslipModalRecord.record.bonus > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Bonus / Allowance (+):</span>
                    <span className="font-mono font-bold">+ Rs {payslipModalRecord.record.bonus.toLocaleString()}</span>
                  </div>
                )}
                {payslipModalRecord.record.deductions > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Deductions / Fine (-):</span>
                    <span className="font-mono font-bold">- Rs {payslipModalRecord.record.deductions.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2 text-[#10b981]">
                  <span>Net Payable:</span>
                  <span className="font-mono">Rs {payslipModalRecord.record.netPay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-white">
                  <span>Amount Paid:</span>
                  <span className="font-mono">Rs {payslipModalRecord.record.paidAmount.toLocaleString()}</span>
                </div>
              </div>

              {payslipModalRecord.record.paymentMethod && (
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Paid Via: {payslipModalRecord.record.paymentMethod}</span>
                  <span>Date: {payslipModalRecord.record.paymentDate || 'N/A'}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer text-xs"
              >
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setPayslipModalRecord(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD / EDIT ATTENDANCE LOG MODAL */}
      {isAttendanceModalOpen && selectedStaffForAttendance && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Record Employee Time Sheet</h3>
                <p className="text-xs text-[#10b981] font-medium mt-0.5">
                  {selectedStaffForAttendance.name} ({selectedStaffForAttendance.role}) — {attendanceDate}
                </p>
              </div>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Present', 'Late', 'Half Day', 'Absent', 'On Leave'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAttendanceForm(p => ({ ...p, status: st }))}
                      className={`p-2 rounded-lg font-bold border text-center cursor-pointer transition-all ${
                        attendanceForm.status === st
                          ? st === 'Present'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                            : st === 'Late'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                            : st === 'Half Day'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                            : st === 'Absent'
                            ? 'bg-red-500/20 text-red-400 border-red-500/50'
                            : 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                          : 'bg-[#1f2937] text-gray-400 border-gray-700 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Check-In / Punch-In Time</label>
                  <input
                    type="text"
                    value={attendanceForm.checkInTime}
                    onChange={(e) => setAttendanceForm(p => ({ ...p, checkInTime: e.target.value }))}
                    placeholder="e.g. 08:30 AM"
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                      setAttendanceForm(p => ({ ...p, checkInTime: timeNow }));
                    }}
                    className="mt-1 text-[10px] text-[#10b981] hover:underline block cursor-pointer font-semibold"
                  >
                    Set to current time
                  </button>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Check-Out / Departure Time</label>
                  <input
                    type="text"
                    value={attendanceForm.checkOutTime}
                    onChange={(e) => setAttendanceForm(p => ({ ...p, checkOutTime: e.target.value }))}
                    placeholder="e.g. 05:00 PM"
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                      setAttendanceForm(p => ({ ...p, checkOutTime: timeNow }));
                    }}
                    className="mt-1 text-[10px] text-blue-400 hover:underline block cursor-pointer font-semibold"
                  >
                    Set to current time
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Total Shift Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  value={attendanceForm.workingHours}
                  onChange={(e) => setAttendanceForm(p => ({ ...p, workingHours: Number(e.target.value) }))}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Supervisor Remarks / Notes</label>
                <input
                  type="text"
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Traffic delay 15 mins, approved leave, etc."
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#10b981] hover:bg-[#0d9488] text-black font-bold rounded-lg cursor-pointer shadow"
                >
                  Save Time Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL MONTH ATTENDANCE REGISTER & AUDIT REPORT MODAL */}
      {isFullMonthReportOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <ReportIcon className="h-5 w-5 text-[#10b981]" />
                  <span>Full Month Worker Attendance Register & Late Audit Report</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Inspect entire month check-ins, late arrivals, absents, and shift hours for any worker.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFullMonthReportOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white cursor-pointer bg-gray-800 rounded-lg"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#1a2333] p-3 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-300">Select Month:</span>
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="bg-[#1f2937] border border-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-mono font-bold focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">Filter Worker:</span>
                <select
                  value={reportStaffId}
                  onChange={(e) => setReportStaffId(e.target.value)}
                  className="bg-[#1f2937] border border-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg w-full font-medium focus:outline-none focus:border-[#10b981]"
                >
                  <option value="All">All Workers / Employees</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Render Report Content */}
            {(() => {
              const allReportLogs = staffAttendanceLogs.filter(l => 
                l.date.startsWith(reportMonth) && (reportStaffId === 'All' || l.staffId === reportStaffId)
              ).sort((a, b) => b.date.localeCompare(a.date));

              const presentLogs = allReportLogs.filter(l => l.status === 'Present');
              const lateLogs = allReportLogs.filter(l => l.status === 'Late');
              const halfDayLogs = allReportLogs.filter(l => l.status === 'Half Day');
              const absentLogs = allReportLogs.filter(l => l.status === 'Absent');

              return (
                <div className="space-y-4 text-xs">
                  {/* KPI Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-[#1a2333] p-3 rounded-xl border border-gray-800">
                      <span className="text-gray-400 text-[11px]">Total Logs</span>
                      <span className="block text-base font-bold text-white font-mono">{allReportLogs.length} Days</span>
                    </div>
                    <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/50">
                      <span className="text-emerald-400 text-[11px]">Presents</span>
                      <span className="block text-base font-bold text-emerald-400 font-mono">{presentLogs.length}</span>
                    </div>
                    <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-900/50">
                      <span className="text-amber-400 text-[11px]">Late Arrivals</span>
                      <span className="block text-base font-bold text-amber-400 font-mono">{lateLogs.length}</span>
                    </div>
                    <div className="bg-blue-950/30 p-3 rounded-xl border border-blue-900/50">
                      <span className="text-blue-400 text-[11px]">Half Days</span>
                      <span className="block text-base font-bold text-blue-400 font-mono">{halfDayLogs.length}</span>
                    </div>
                    <div className="bg-red-950/30 p-3 rounded-xl border border-red-900/50">
                      <span className="text-red-400 text-[11px]">Absents</span>
                      <span className="block text-base font-bold text-red-400 font-mono">{absentLogs.length}</span>
                    </div>
                  </div>

                  {/* Table of Monthly Logs */}
                  <div className="bg-[#1a2333] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-[#111827] text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-gray-800 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Worker Name</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Check-In</th>
                            <th className="py-2.5 px-3">Check-Out</th>
                            <th className="py-2.5 px-3">Worked Hrs</th>
                            <th className="py-2.5 px-3">Remarks / Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80">
                          {allReportLogs.length > 0 ? (
                            allReportLogs.map(log => {
                              const worker = staff.find(s => s.id === log.staffId);
                              return (
                                <tr key={log.id} className="hover:bg-gray-800/40">
                                  <td className="py-2.5 px-3 font-mono font-bold text-white">{log.date}</td>
                                  <td className="py-2.5 px-3 font-medium text-white">
                                    {log.staffName || worker?.name || 'Worker'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {log.status === 'Present' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        Present
                                      </span>
                                    ) : log.status === 'Late' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                        Late Entry
                                      </span>
                                    ) : log.status === 'Half Day' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                        Half Day
                                      </span>
                                    ) : log.status === 'Absent' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                        Absent
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        On Leave
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {log.checkInTime ? (
                                      <span className={log.status === 'Late' ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                                        {log.checkInTime}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-blue-400">
                                    {log.checkOutTime || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {log.workingHours ? `${log.workingHours} hrs` : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-400 text-[11px] truncate max-w-xs">
                                    {log.notes || '-'}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                                No attendance records logged for {reportMonth}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsFullMonthReportOpen(false)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
