import React from 'react';
import { Member, View } from '../types';
import { CloseIcon } from './icons';

interface NotificationMessageBoxProps {
  isOpen: boolean;
  onClose: () => void;
  expiredMembers: Member[];
  onNavigate: (view: View) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Strength': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Cardio': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'Personal Training': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

export const NotificationMessageBox: React.FC<NotificationMessageBoxProps> = ({ 
  isOpen, 
  onClose, 
  expiredMembers, 
  onNavigate 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-2xl border border-gray-800 w-full max-w-lg overflow-hidden transform scale-100 transition-all flex flex-col max-h-[80vh]">
        <div className="p-5 bg-red-500/10 border-b border-gray-800 flex justify-between items-center shrink-0 animate-pulse-subtle">
          <div className="flex items-center space-x-3 text-red-400">
            <div className="bg-red-500/20 p-2 rounded-full ring-2 ring-red-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-text-primary">Expired Gym Fees</h3>
              <p className="text-xs text-text-secondary">Unpaid or overdue memberships requiring attention</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <CloseIcon className="h-5 w-5"/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {expiredMembers.length > 0 ? (
            expiredMembers.map(m => (
              <div key={m.id} className="p-4 bg-secondary rounded-xl border border-gray-800 hover:border-red-500/30 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <img 
                    src={m.photo || `https://ui-avatars.com/api/?name=${m.name || '?'}&background=374151&color=F9FAFB`} 
                    alt={m.name} 
                    className="h-12 w-12 rounded-full object-cover border border-gray-750" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-text-primary text-base">{m.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      <span className="font-mono bg-gray-800 py-0.5 px-2 rounded border border-gray-700 font-bold text-yellow-400">
                        {m.registrationNo}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${CATEGORY_COLORS[m.category || 'Strength'] || 'bg-gray-500/20 text-gray-400'}`}>
                        {m.category || 'Strength'}
                      </span>
                      <span className="text-text-secondary">{m.plan}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-400 font-mono">Rs {m.fee.toLocaleString()}</p>
                  <p className="text-[10px] text-text-secondary font-mono mt-0.5 font-semibold">Expired: {m.expiryDate}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-text-secondary italic">
              No gym members with expired fees!
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-800 bg-secondary/35 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-650 text-text-primary rounded-lg text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
          {expiredMembers.length > 0 && (
            <button 
              type="button"
              onClick={() => {
                onClose();
                onNavigate('fees');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer shadow-md"
            >
              Collect Fees
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
