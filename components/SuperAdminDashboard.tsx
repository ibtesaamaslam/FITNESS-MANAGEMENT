
import React, { useState, useEffect } from 'react';
import { Gym, SubscriptionStatus, Member, Payment } from '../types';
import { TrashIcon, CloseIcon, EditIcon, SettingsIcon, WarningIcon, LogOutIcon, DatabaseIcon, DownloadIcon, UploadIcon } from './icons';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigateGym: (slug: string) => void;
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<Props> = ({ onNavigateGym, onLogout }) => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDataToolsOpen, setIsDataToolsOpen] = useState(false); 

  const [gymToDelete, setGymToDelete] = useState<string | null>(null);
  const [gymToImpersonate, setGymToImpersonate] = useState<string | null>(null);
  
  // Data State
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Add Form State
  const [formData, setFormData] = useState({
      name: '',
      slug: '',
      password: '', 
      plan: 'Pro' as 'Basic' | 'Pro',
      price: 5000,
      logoBase64: ''
  });
  const [slugTouched, setSlugTouched] = useState(false);

  // Load gyms from Supabase
  const loadGyms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('gyms').select('*').order('createdAt', { ascending: false });
    if (error) {
        console.error("Error loading gyms:", error);
    } else {
        setGyms(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGyms();
    
    // Subscribe to gym changes
    const channel = supabase.channel('super_admin_gyms')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gyms' }, () => {
            loadGyms();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // --- ACTIONS ---

  const initiateDelete = (id: string) => {
      setGymToDelete(id);
  };

  const confirmDelete = async () => {
    if (!gymToDelete) return;
    
    // Delete from Supabase
    // Note: If you have cascading deletes set up in SQL, this will delete members/payments too.
    // Otherwise, we might need to delete related data first. Assuming SQL Foreign Keys are set to CASCADE.
    const { error } = await supabase.from('gyms').delete().eq('id', gymToDelete);
    
    if (error) {
        alert("Error deleting gym: " + error.message);
    } else {
        setGyms(prev => prev.filter(g => g.id !== gymToDelete));
    }
    setGymToDelete(null);
  };

  const initiateImpersonate = (slug: string) => {
    setGymToImpersonate(slug);
  };

  const confirmImpersonate = () => {
    if (gymToImpersonate) {
        onNavigateGym(gymToImpersonate);
        setGymToImpersonate(null);
    }
  };

  const getPriceForPlan = (plan: string) => {
      switch(plan) {
          case 'Basic': return 3000;
          case 'Pro': return 5000;
          default: return 5000;
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
        alert("Image is too large. Please upload an image smaller than 1MB.");
        return;
    }
    
    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
        
        if (isEdit && editingGym) {
            setEditingGym({ ...editingGym, logoBase64: base64 });
        } else {
            setFormData(prev => ({ ...prev, logoBase64: base64 }));
        }
    } catch (err) {
        console.error("Error reading file", err);
        alert("Failed to upload image. Please try again.");
    }
  };

  // --- MASTER REPORT & BACKUP LOGIC (CSV) ---

  const handleExportData = async () => {
      // Fetch all needed data from Supabase
      // We can use a join query if defined, or parallel requests
      const { data: allPayments, error } = await supabase
        .from('payments')
        .select(`
            *,
            gyms (
                name, slug, adminPassword, planName, subscriptionStatus, subscriptionPrice, createdAt
            )
        `);

      if(error) {
          alert("Failed to fetch data for export.");
          return;
      }

      const headers = [
          'Gym Name',
          'Gym Slug (ID)',
          'Admin Password',
          'Plan Name',
          'Subscription Status',
          'Subscription Price (PKR)',
          'Created At',
          'Payment Date',
          'Member Name',
          'Payment Amount',
          'Payment Method'
      ];
      
      const rows: string[] = [];

      allPayments.forEach((p: any) => {
          if(!p.gyms) return;
          const gym = p.gyms;
          rows.push([
              `"${gym.name}"`,
              gym.slug,
              gym.adminPassword || 'admin',
              gym.planName,
              gym.subscriptionStatus,
              gym.subscriptionPrice,
              gym.createdAt ? gym.createdAt.split('T')[0] : '-',
              p.date,
              `"${p.memberName}"`,
              p.amount,
              p.method
          ].join(','));
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GYM_KHATA_MASTER_REPORT_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- INDIVIDUAL GYM BACKUP (Good Looking CSV) ---
  const handleGymBackup = async (gym: Gym) => {
      try {
          const { data: members } = await supabase.from('members').select('*').eq('gymId', gym.id);
          const { data: payments } = await supabase.from('payments').select('*').eq('gymId', gym.id);

          const mems = members || [];
          const pays = payments || [];

          const headers = [
              'Registration No', 'Full Name', 'Phone', 'Age', 'Membership Plan', 'Plan Fee (PKR)',
              'Join Date', 'Expiry Date', 'Subscription Status', 'Total Amount Paid (PKR)',
              'Last Payment Date', 'Attendance Rate'
          ];

          const rows = mems.map((m: Member) => {
              const memberPayments = pays.filter((p: Payment) => p.memberId === m.id);
              const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
              const lastPayment = memberPayments.sort((a,b) => b.date.localeCompare(a.date))[0];
              
              const trackedDays = Object.keys(m.attendance || {}).length;
              const presentDays = Object.values(m.attendance || {}).filter((v: any) => v).length;
              const rate = trackedDays > 0 ? Math.round((presentDays / trackedDays) * 100) : 0;

              const isExpired = new Date(m.expiryDate) < new Date();
              const status = isExpired ? 'Expired' : 'Active';

              return [
                  `"${m.registrationNo}"`,
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
          link.download = `${gym.slug}_backup_report_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (err) {
          console.error(err);
          alert("Could not generate report for this gym. Data may be corrupted or missing.");
      }
  };

  // --- INDIVIDUAL GYM RESTORE (Import CSV) ---
  const handleGymImport = (e: React.ChangeEvent<HTMLInputElement>, gym: Gym) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const text = event.target?.result as string;
              if (!text) throw new Error("Empty file");

              const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
              if (lines.length < 2) throw new Error("Invalid CSV format");

              const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
              const requiredCols = ['Registration No', 'Full Name'];
              const isValid = requiredCols.every(c => headers.includes(c));
              
              if (!isValid) {
                  alert("Invalid CSV format. Please upload a file generated by the 'Gym Backup' feature.");
                  return;
              }

              // Fetch existing members to avoid ID collision or to update
              const { data: existingMembers } = await supabase.from('members').select('id, registrationNo').eq('gymId', gym.id);
              const { data: existingPayments } = await supabase.from('payments').select('memberId, amount').eq('gymId', gym.id);

              let importedMembersCount = 0;
              let importedPaymentsCount = 0;

              // Parse Rows
              for (let i = 1; i < lines.length; i++) {
                  // CSV Parsing Logic
                  const rowStr = lines[i];
                  const cells: string[] = [];
                  let inQuote = false;
                  let buffer = '';
                  for(let char of rowStr) {
                      if(char === '"') { inQuote = !inQuote; continue; }
                      if(char === ',' && !inQuote) { cells.push(buffer); buffer = ''; continue; }
                      buffer += char;
                  }
                  cells.push(buffer);

                  const regNo = cells[0]?.trim() || '';
                  const name = cells[1]?.trim() || '';
                  const phone = cells[2]?.trim() || '';
                  const age = parseInt(cells[3]) || 18;
                  const plan = (cells[4]?.trim() || 'Monthly') as 'Monthly' | 'Quarterly' | 'Yearly';
                  const fee = parseInt(cells[5]) || 0;
                  const joinDate = cells[6]?.trim() || new Date().toISOString().split('T')[0];
                  const expiryDate = cells[7]?.trim() || new Date().toISOString().split('T')[0];
                  const totalPaidHistory = parseInt(cells[9]) || 0;

                  if (!regNo || !name) continue;

                  // 1. Check if member exists
                  const match = existingMembers?.find(m => m.registrationNo === regNo);
                  let memberId = match?.id;

                  if (memberId) {
                      // Update
                       await supabase.from('members').update({
                          name, phone, age, plan, fee, joinDate, expiryDate
                      }).eq('id', memberId);
                  } else {
                      // Create
                      memberId = crypto.randomUUID();
                      await supabase.from('members').insert({
                          id: memberId,
                          gymId: gym.id,
                          registrationNo: regNo,
                          name, phone, age, plan, fee, joinDate, expiryDate,
                          feePaid: true,
                          attendance: {}
                      });
                      importedMembersCount++;
                  }

                  // 2. Reconcile Payments
                  const currentTotal = existingPayments
                    ?.filter((p: any) => p.memberId === memberId)
                    .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

                  if (totalPaidHistory > currentTotal) {
                      let remainingToImport = totalPaidHistory - currentTotal;
                      let currentDate = new Date(joinDate);
                      
                      const newPayments = [];
                      if (fee > 0) {
                          while (remainingToImport >= fee) {
                              newPayments.push({
                                  id: crypto.randomUUID(),
                                  gymId: gym.id,
                                  memberId: memberId,
                                  memberName: name,
                                  date: currentDate.toISOString().split('T')[0],
                                  amount: fee,
                                  method: 'Cash'
                              });
                              remainingToImport -= fee;
                              importedPaymentsCount++;
                              if (plan === 'Quarterly') currentDate.setMonth(currentDate.getMonth() + 3);
                              else if (plan === 'Yearly') currentDate.setFullYear(currentDate.getFullYear() + 1);
                              else currentDate.setMonth(currentDate.getMonth() + 1);
                          }
                      }
                      if (remainingToImport > 0) {
                          newPayments.push({
                              id: crypto.randomUUID(),
                              gymId: gym.id,
                              memberId: memberId,
                              memberName: name,
                              date: joinDate,
                              amount: remainingToImport,
                              method: 'Cash'
                          });
                          importedPaymentsCount++;
                      }
                      
                      if(newPayments.length > 0) {
                          await supabase.from('payments').insert(newPayments);
                      }
                  }
              }

              alert(`Import Successful!\nAdded/Updated ${importedMembersCount} members and reconciled ${importedPaymentsCount} payments.`);
              
          } catch (err) {
              console.error(err);
              alert("Failed to import CSV.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; 
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!formData.name || !formData.slug) return;

      const newId = crypto.randomUUID();
      const trialDays = 14;
      const trialEnd = new Date(Date.now() + trialDays * 86400000).toISOString().split('T')[0];

      const newGym: Gym = {
          id: newId,
          name: formData.name,
          slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
          adminPassword: formData.password || 'admin',
          subscriptionStatus: 'trial',
          planName: formData.plan,
          subscriptionPrice: formData.price,
          trialEndsAt: trialEnd,
          nextBillingDate: trialEnd,
          createdAt: new Date().toISOString(),
          logoBase64: formData.logoBase64
      };

      const { error } = await supabase.from('gyms').insert([newGym]);

      if (error) {
          alert("Error creating gym: " + error.message);
      } else {
          setGyms(prev => [...prev, newGym]);
          setIsAddModalOpen(false);
          setFormData({ name: '', slug: '', password: '', plan: 'Pro', price: 5000, logoBase64: '' });
          setSlugTouched(false);
      }
  };

  const handleEditSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingGym) return;
      
      const { error } = await supabase.from('gyms').update(editingGym).eq('id', editingGym.id);

      if (error) {
          alert("Error updating gym: " + error.message);
      } else {
          setGyms(prev => prev.map(g => g.id === editingGym.id ? editingGym : g));
          setIsEditModalOpen(false);
          setEditingGym(null);
      }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPassword) return;
      localStorage.setItem('saas_owner_pwd', newPassword);
      alert('Password updated successfully.');
      setIsPasswordModalOpen(false);
      setNewPassword('');
  };

  const openEditModal = (gym: Gym) => {
      setEditingGym(gym);
      setIsEditModalOpen(true);
  };

  const checkExpiring = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0,0,0,0);
    date.setHours(0,0,0,0);
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 0 && diffDays <= 7;
  };

  const totalMRR = gyms.reduce((sum, g) => {
      return sum + (g.subscriptionStatus === 'active' || g.subscriptionStatus === 'past_due' ? (g.subscriptionPrice || 0) : 0);
  }, 0);
  
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
            <div>
                <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
                <p className="text-text-secondary">Gym Management System {loading && "(Syncing...)"}</p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setIsDataToolsOpen(true)} className="flex items-center gap-2 bg-indigo-900/40 text-indigo-300 hover:text-white border border-indigo-700 rounded px-4 py-2 transition-colors">
                    <DatabaseIcon className="h-4 w-4" /> System Backup
                </button>
                <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center gap-2 text-gray-300 hover:text-white border border-gray-600 rounded px-4 py-2 transition-colors">
                    <SettingsIcon className="h-4 w-4" /> Change Password
                </button>
                <button onClick={onLogout} className="text-red-400 hover:text-white border border-red-400 rounded px-4 py-2 transition-colors">Logout</button>
            </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface p-6 rounded-lg border-l-4 border-primary shadow-lg">
                <p className="text-gray-400">Total Revenue (Active)</p>
                <p className="text-3xl font-bold text-white">PKR {totalMRR.toLocaleString()}</p>
            </div>
            <div className="bg-surface p-6 rounded-lg border-l-4 border-blue-500 shadow-lg">
                <p className="text-gray-400">Total Gyms</p>
                <p className="text-3xl font-bold text-white">{gyms.length}</p>
            </div>
            <div className="bg-surface p-6 rounded-lg border-l-4 border-yellow-500 shadow-lg">
                <p className="text-gray-400">At Risk (Past Due)</p>
                <p className="text-3xl font-bold text-white">{gyms.filter(g => g.subscriptionStatus === 'past_due').length}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8 flex-grow">
            {/* Gym List */}
            <div className="bg-surface rounded-lg overflow-hidden shadow-lg h-fit">
                <div className="p-4 bg-secondary flex justify-between items-center border-b border-gray-700">
                    <h2 className="font-bold text-white">Gyms</h2>
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-4 py-2 rounded shadow-lg shadow-primary/20"
                    >
                        + Add Gym
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Plan</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Next Expiry</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gyms.map(gym => {
                                const expiryDate = gym.subscriptionStatus === 'trial' ? gym.trialEndsAt : gym.nextBillingDate;
                                const isExpiring = checkExpiring(expiryDate);

                                return (
                                <tr key={gym.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-medium text-white">
                                        <div className="flex items-center gap-3">
                                            {gym.logoBase64 ? (
                                                <img src={gym.logoBase64} alt={gym.name} className="w-10 h-10 rounded-full object-cover border border-gray-600" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 border border-gray-600">
                                                    {gym.name.substring(0,2).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {gym.name}
                                                    {isExpiring && (
                                                        <span title="Expiring within 7 days" className="flex items-center gap-1 text-[10px] bg-orange-900/50 text-orange-200 px-1.5 py-0.5 rounded border border-orange-800">
                                                            <WarningIcon className="h-3 w-3" /> Due Soon
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">/g/{gym.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                                            gym.subscriptionStatus === 'active' ? 'bg-green-900 text-green-400' :
                                            gym.subscriptionStatus === 'past_due' ? 'bg-yellow-900 text-yellow-400' :
                                            gym.subscriptionStatus === 'trial' ? 'bg-indigo-900 text-indigo-400' : 'bg-red-900 text-red-400'
                                        }`}>
                                            {gym.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="p-3">{gym.planName}</td>
                                    <td className="p-3 text-gray-300">PKR {gym.subscriptionPrice?.toLocaleString() || 0}</td>
                                    <td className="p-3 font-mono text-gray-300">{expiryDate || '-'}</td>
                                    <td className="p-3 text-right space-x-2 flex justify-end">
                                        {/* Restore Button */}
                                        <label className="text-orange-400 hover:text-white p-1 cursor-pointer" title="Import Previous Records (CSV)">
                                            <UploadIcon className="h-4 w-4"/>
                                            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleGymImport(e, gym)} />
                                        </label>
                                        <button onClick={() => handleGymBackup(gym)} className="text-indigo-400 hover:text-white p-1" title="Download Gym Data CSV">
                                            <DatabaseIcon className="h-4 w-4"/>
                                        </button>
                                        <button onClick={() => openEditModal(gym)} className="text-gray-400 hover:text-white p-1" title="Edit Subscription">
                                            <EditIcon className="h-4 w-4"/>
                                        </button>
                                        <button onClick={() => initiateImpersonate(gym.slug)} className="text-blue-400 hover:underline p-1 text-xs mt-0.5" title="Login as Admin">
                                            Impersonate
                                        </button>
                                        <button onClick={() => initiateDelete(gym.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete Gym">
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </td>
                                </tr>
                                );
                            })}
                            {gyms.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-500">
                                        {loading ? "Loading gyms..." : "No gyms found. Click 'Add Gym' to start."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Footer */}
        <footer className="py-6 mt-8 text-center border-t border-gray-800">
            <p className="text-gray-500 text-sm font-semibold tracking-wide">GYM KHATA &copy; 2026</p>
        </footer>

        {/* --- MODALS --- */}

        {/* 1. Add Gym Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-surface p-6 rounded-lg w-full max-w-md shadow-2xl border border-gray-700 overflow-y-auto max-h-[90vh] animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Add New Gym</h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5"/></button>
                    </div>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Gym Logo (Max 1MB)</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, false)}
                                className="w-full text-gray-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                            />
                            {formData.logoBase64 && (
                                <img src={formData.logoBase64} alt="Preview" className="mt-2 h-16 w-16 rounded-lg object-cover border border-gray-600" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Gym Name</label>
                            <input 
                                className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                placeholder="e.g. Iron Titan Fitness"
                                value={formData.name}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData(prev => {
                                        const newData = { ...prev, name: val };
                                        if (!slugTouched) {
                                            newData.slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                        }
                                        return newData;
                                    });
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">URL Slug</label>
                            <div className="flex items-center bg-secondary rounded border border-gray-600 px-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                <span className="text-gray-500 text-sm select-none">/g/</span>
                                <input 
                                    className="w-full bg-transparent text-white p-2 outline-none"
                                    placeholder="iron-titan"
                                    value={formData.slug}
                                    onChange={e => {
                                        setSlugTouched(true);
                                        setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')});
                                    }}
                                    required
                                />
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm text-gray-400 mb-1">Initial Admin Password</label>
                            <input 
                                className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                placeholder="Default: admin"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Plan</label>
                                <select 
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                    value={formData.plan}
                                    onChange={e => {
                                        const newPlan = e.target.value as any;
                                        setFormData({
                                            ...formData, 
                                            plan: newPlan,
                                            price: getPriceForPlan(newPlan)
                                        });
                                    }}
                                >
                                    <option value="Basic">Basic</option>
                                    <option value="Pro">Pro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Price (PKR)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        
                        {/* Information about Trial */}
                        <div className="bg-indigo-900/30 border border-indigo-700 rounded p-3 text-xs text-indigo-300">
                             New gyms start on a 14-day <b>Trial</b> automatically.
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded shadow-lg shadow-primary/20">Create Gym</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* 2. Edit Gym Modal (Subscription Management) */}
        {isEditModalOpen && editingGym && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-surface p-6 rounded-lg w-full max-w-md shadow-2xl border border-gray-700 overflow-y-auto max-h-[90vh] animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Manage Subscription</h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5"/></button>
                    </div>
                    
                    <form onSubmit={handleEditSave} className="space-y-4">
                        <div className="mb-4 p-3 bg-secondary/50 rounded border border-gray-700 flex items-center gap-3">
                             {editingGym.logoBase64 && (
                                <img src={editingGym.logoBase64} alt={editingGym.name} className="w-12 h-12 rounded-full object-cover border border-gray-600" />
                            )}
                            <div>
                                <h4 className="text-white font-bold">{editingGym.name}</h4>
                                <p className="text-xs text-gray-400">ID: {editingGym.id}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Update Logo (Max 1MB)</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, true)}
                                className="w-full text-gray-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Status</label>
                            <select 
                                className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                value={editingGym.subscriptionStatus}
                                onChange={e => setEditingGym({...editingGym, subscriptionStatus: e.target.value as SubscriptionStatus})}
                            >
                                <option value="trial">Trial</option>
                                <option value="active">Active</option>
                                <option value="past_due">Past Due</option>
                                <option value="suspended">Suspended</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Plan</label>
                                <select 
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                    value={editingGym.planName}
                                    onChange={e => setEditingGym({...editingGym, planName: e.target.value as any})}
                                >
                                    <option value="Basic">Basic</option>
                                    <option value="Pro">Pro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Price (PKR)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                    value={editingGym.subscriptionPrice || 0}
                                    onChange={e => setEditingGym({...editingGym, subscriptionPrice: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                        {/* Date Inputs based on Status */}
                        {editingGym.subscriptionStatus === 'trial' ? (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Trial End Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                    value={editingGym.trialEndsAt}
                                    onChange={e => setEditingGym({
                                        ...editingGym, 
                                        trialEndsAt: e.target.value 
                                    })}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Next Billing Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-secondary text-white p-2 rounded border border-gray-600 outline-none"
                                    value={editingGym.nextBillingDate}
                                    onChange={e => setEditingGym({
                                        ...editingGym, 
                                        nextBillingDate: e.target.value 
                                    })}
                                />
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded shadow-lg shadow-primary/20">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* 3. Change Password Modal */}
        {isPasswordModalOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-surface p-6 rounded-lg w-full max-w-sm shadow-2xl border border-gray-700 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Change Password</h3>
                        <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5"/></button>
                    </div>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">New Password</label>
                            <input 
                                type="password"
                                className="w-full bg-secondary text-white p-2 rounded border border-gray-600 focus:border-primary outline-none"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded shadow-lg shadow-primary/20">Update</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* 4. Delete Confirmation Modal */}
        {gymToDelete && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-surface p-6 rounded-lg w-full max-w-sm shadow-2xl border border-red-500/30 animate-fade-in-up">
                    <div className="text-center mb-4">
                        <div className="mx-auto w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                            <TrashIcon className="h-6 w-6 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Gym?</h3>
                        <p className="text-gray-400 text-sm">
                            Are you sure you want to delete this gym? This action cannot be undone and will orphan all associated data.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setGymToDelete(null)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                        <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded shadow-lg shadow-red-600/20">
                            Delete Permanently
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 5. Impersonate Confirmation Modal */}
        {gymToImpersonate && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-surface p-6 rounded-lg w-full max-w-sm shadow-2xl border border-blue-500/30 animate-fade-in-up">
                    <div className="text-center mb-4">
                        <div className="mx-auto w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                            <LogOutIcon className="h-6 w-6 text-blue-500" /> 
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Impersonate Gym?</h3>
                        <p className="text-gray-400 text-sm">
                            Are you sure you want to impersonate this gym? You will view the dashboard as the gym admin.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setGymToImpersonate(null)} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                        <button onClick={confirmImpersonate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded shadow-lg shadow-blue-600/20">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 6. Data Tools Modal (Backup & Restore) */}
        {isDataToolsOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-surface p-6 rounded-lg w-full max-w-md shadow-2xl border border-indigo-500/30 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                             <DatabaseIcon className="h-6 w-6 text-indigo-400" /> System Reports
                        </h3>
                        <button onClick={() => setIsDataToolsOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5"/></button>
                    </div>
                    
                    <div className="space-y-6">
                        {/* Backup Section */}
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                <DownloadIcon className="h-4 w-4 text-green-400" /> Master Ledger & Credentials
                            </h4>
                            <p className="text-sm text-gray-400 mb-4">
                                Download a professional CSV report containing all Gym Credentials (Passwords) and consolidated Payment History from all gyms.
                            </p>
                            <button 
                                onClick={handleExportData}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded shadow-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="h-4 w-4" /> Download Master Report (CSV)
                            </button>
                        </div>
                        
                        <div className="p-3 rounded bg-blue-900/20 border border-blue-800/50 text-xs text-blue-200">
                            <strong>Note:</strong> This report is formatted for administrative use and financial auditing. To restore a full system backup, please use the legacy raw data tools if available.
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setIsDataToolsOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Close</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SuperAdminDashboard;
