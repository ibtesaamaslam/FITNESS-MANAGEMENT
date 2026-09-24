
import React, { useMemo, useState } from 'react';
import { Member, Role } from '../types';
import { TrashIcon } from './icons';
import { isMemberArchived } from '../lib/dateUtils';
import { GenderBadge } from './Members';

interface ArchiveProps {
  members: Member[];
  role?: Role;
  onDeleteMember: (id: string) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const Archive: React.FC<ArchiveProps> = ({ members, role = 'Admin', onDeleteMember }) => {
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  const archivedMembers = useMemo(() => {
    return members.filter(member => isMemberArchived(member));
  }, [members]);

  const filteredArchivedMembers = useMemo(() => {
    return archivedMembers.filter(member => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        member.name.toLowerCase().includes(term) ||
        member.registrationNo.toLowerCase().includes(term) ||
        (member.phone && member.phone.toLowerCase().includes(term)) ||
        (member.category && member.category.toLowerCase().includes(term));

      const matchesGender = genderFilter === 'All' || (member.gender || 'Male') === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [archivedMembers, searchTerm, genderFilter]);

  const maleCount = useMemo(() => archivedMembers.filter(m => (m.gender || 'Male') === 'Male').length, [archivedMembers]);
  const femaleCount = useMemo(() => archivedMembers.filter(m => m.gender === 'Female').length, [archivedMembers]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Archive (Inactive Records)</h1>
          <p className="text-text-secondary mt-1">Members consistently absent or inactive for more than 5 months are automatically archived.</p>
        </div>
        <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl border border-red-500/30 font-bold self-start sm:self-auto font-mono text-sm">
          {archivedMembers.length} Total Archived
        </div>
      </div>

      {/* Filter Toolbar: Search Bar & Gender Tabs */}
      <div className="bg-surface border border-gray-800 rounded-2xl p-3.5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search archived members by name, Reg No, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-secondary border border-gray-700/80 rounded-xl text-sm font-medium text-text-primary placeholder-gray-500 outline-none focus:border-primary transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Gender Filter Tabs */}
        <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-gray-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setGenderFilter('All')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              genderFilter === 'All'
                ? 'bg-primary text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All ({archivedMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setGenderFilter('Male')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              genderFilter === 'Male'
                ? 'bg-blue-600 text-white shadow'
                : 'text-text-secondary hover:text-blue-400'
            }`}
          >
            <span>♂</span> Male ({maleCount})
          </button>
          <button
            type="button"
            onClick={() => setGenderFilter('Female')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              genderFilter === 'Female'
                ? 'bg-pink-600 text-white shadow'
                : 'text-text-secondary hover:text-pink-400'
            }`}
          >
            <span>♀</span> Female ({femaleCount})
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary text-text-secondary text-xs uppercase">
              <tr>
                <th className="p-4">Member Info</th>
                <th className="p-4">Reg No</th>
                <th className="p-4">Join Date</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Last Presence</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredArchivedMembers.length > 0 ? filteredArchivedMembers.map(member => {
                const attendanceDates = Object.entries(member.attendance)
                  .filter(([_, present]) => present)
                  .map(([date, _]) => date);
                
                const lastPresence = attendanceDates.length > 0 
                  ? attendanceDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
                  : 'Never';
                
                return (
                  <tr key={member.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4">
                       <div>
                         <div className="flex flex-wrap items-center gap-2">
                           <span className="font-bold text-text-primary">{member.name}</span>
                           <GenderBadge gender={member.gender || 'Male'} size="sm" />
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[member.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                             {member.category || 'Strength'}
                           </span>
                         </div>
                         <div className="text-xs text-text-secondary">{member.phone}</div>
                       </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{member.registrationNo}</td>
                    <td className="p-4 text-sm text-text-secondary">{member.joinDate}</td>
                    <td className="p-4 text-sm text-red-400 font-medium">{member.expiryDate}</td>
                    <td className="p-4 text-text-secondary text-sm">
                      {lastPresence}
                    </td>
                    <td className="p-4 text-right">
                      {role === 'Admin' ? (
                        <button 
                          onClick={() => setMemberToDelete(member)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                          title="Permanently Delete Member"
                        >
                          <TrashIcon className="h-5 w-5"/>
                        </button>
                      ) : (
                        <span className="text-gray-500 text-[11px] px-2 py-1 bg-gray-800/40 rounded border border-gray-700/50 cursor-not-allowed select-none" title="Admin authority required to delete archive records">
                          Admin Only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-secondary italic">
                    {searchTerm || genderFilter !== 'All' ? (
                      <div className="space-y-2 not-italic">
                        <p className="text-gray-400">No archived members match "{searchTerm || genderFilter}".</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setGenderFilter('All');
                          }}
                          className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Clear filters & search
                        </button>
                      </div>
                    ) : (
                      'No inactive members found in the current threshold.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MEMBER MODAL */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-full">
                <TrashIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Delete Archive Record?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary bg-secondary/50 p-3 rounded-xl border border-gray-800">
              Permanently delete archived member <strong className="text-text-primary">{memberToDelete.name}</strong> (#{memberToDelete.registrationNo})?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 bg-secondary hover:bg-gray-700 text-text-secondary font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMember(memberToDelete.id);
                  setMemberToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
