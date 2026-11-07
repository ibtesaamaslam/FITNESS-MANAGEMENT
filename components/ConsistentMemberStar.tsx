import React from 'react';
import { isConsistentMember, getMemberConsistencyDetails } from '../lib/dateUtils';
import { Member } from '../types';

interface ConsistentMemberStarProps {
  member?: Partial<Member> | null;
  isConsistent?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
  tooltipText?: string;
}

export const ConsistentMemberStar: React.FC<ConsistentMemberStarProps> = ({
  member,
  isConsistent,
  size = 'sm',
  showBadge = false,
  className = '',
  tooltipText,
}) => {
  // If isConsistent is not explicitly provided, calculate it from member
  const consistent = isConsistent !== undefined 
    ? isConsistent 
    : member 
      ? isConsistentMember(member as any) 
      : false;

  if (!consistent) return null;

  const details = member ? getMemberConsistencyDetails(member as any) : null;
  const title = tooltipText || details?.tooltip || '⭐ Consistent Gym Member (Attending regularly for 5-6+ months)';

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const StarSvg = (
    <svg 
      className={`${sizeClasses} fill-amber-400 text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] animate-pulse`} 
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Consistent Member Star"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  if (showBadge) {
    return (
      <span
        title={title}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 cursor-help select-none tracking-tight transition-transform hover:scale-105 ${className}`}
      >
        {StarSvg}
        <span>Consistent Member</span>
      </span>
    );
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center text-amber-400 hover:text-amber-300 cursor-help select-none transition-transform hover:scale-125 align-middle ${className}`}
    >
      {StarSvg}
    </span>
  );
};

export default ConsistentMemberStar;
