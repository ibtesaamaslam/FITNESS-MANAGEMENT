
import React, { useMemo } from 'react';
import { Member } from '../types';
import { TrashIcon } from './icons';
import { isMemberArchived } from '../lib/dateUtils';

interface ArchiveProps {
  members: Member[];
  onDeleteMember: (id: string) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const Archive: React.FC<ArchiveProps> = ({ members, onDeleteMember }) => {
  const archivedMembers = useMemo(() => {
    return members.filter(member => isMemberArchived(member));
  }, [members]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Archive (Inactive Records)</h1>
          <p className="text-text-secondary mt-1">Members consistently absent or inactive for more than 5 months are automatically archived.</p>
        </div>
        <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 font-bold">
          {archivedMembers.length} Archived Members
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
              {archivedMembers.length > 0 ? archivedMembers.map(member => {
                const attendanceDates = Object.entries(member.attendance)
                  .filter(([_, present]) => present)
                  .map(([date, _]) => date);
                
                const lastPresence = attendanceDates.length > 0 
                  ? attendanceDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
                  : 'Never';
                
                return (
                  <tr key={member.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                       <img src={member.photo} alt={member.name} className="h-10 w-10 rounded-full object-cover border border-gray-600 grayscale"/>
                       <div>
                         <div className="flex flex-wrap items-center gap-2">
                           <span className="font-bold text-text-primary">{member.name}</span>
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
                       <button 
                         onClick={() => {
                           if(window.confirm(`Are you sure you want to permanently delete archive record of ${member.name}?`)) {
                             onDeleteMember(member.id);
                           }
                         }}
                         className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                       >
                         <TrashIcon className="h-5 w-5"/>
                       </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-secondary italic">
                    No inactive members found in the current threshold.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Archive;
