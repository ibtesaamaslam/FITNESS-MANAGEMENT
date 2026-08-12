import React from 'react';
import { LockIcon } from './icons';

interface MaskedAmountProps {
  amount: number | string;
  prefix?: string;
  suffix?: string;
  isUnlocked: boolean;
  onUnlockRequest?: () => void;
  className?: string;
  maskedText?: string;
  showLockIcon?: boolean;
}

export const MaskedAmount: React.FC<MaskedAmountProps> = ({
  amount,
  prefix = 'Rs ',
  suffix = '',
  isUnlocked,
  onUnlockRequest,
  className = '',
  maskedText = '••••••',
  showLockIcon = true,
}) => {
  if (isUnlocked) {
    const numericVal = typeof amount === 'number' ? amount : parseFloat(amount);
    const formatted = !isNaN(numericVal) ? numericVal.toLocaleString() : amount;
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span>{prefix}{formatted}{suffix}</span>
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onUnlockRequest?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onUnlockRequest?.();
        }
      }}
      title="Financial amount is hidden for privacy. Click to enter owner password and reveal."
      className={`inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity bg-secondary/40 px-2 py-0.5 rounded border border-dashed border-gray-700 hover:border-primary/50 text-gray-400 hover:text-text-primary ${className}`}
    >
      {showLockIcon && <LockIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
      <span className="tracking-widest font-mono font-bold select-none">{prefix}{maskedText}{suffix}</span>
    </span>
  );
};
