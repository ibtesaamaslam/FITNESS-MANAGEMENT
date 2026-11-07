import React, { useRef } from 'react';
import { formatDateDDMMYYYY } from '../lib/dateUtils';

interface DateInputDDMMYYYYProps {
  value: string; // YYYY-MM-DD format internally
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const DateInputDDMMYYYY: React.FC<DateInputDDMMYYYYProps> = ({
  value,
  onChange,
  max,
  min,
  className = '',
  id,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled) return;
    try {
      if (inputRef.current && typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current?.focus();
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const displayDate = value ? formatDateDDMMYYYY(value) : 'DD-MM-YYYY';

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
      title="Click to pick date (DD-MM-YYYY)"
    >
      <span className="font-mono font-bold text-sm tracking-wide text-text-primary">
        {displayDate}
      </span>
      {/* Calendar indicator icon */}
      <svg
        className="w-4 h-4 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>

      {/* Invisible overlay input for native browser date picker interactions */}
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value || ''}
        max={max}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        tabIndex={0}
      />
    </div>
  );
};

export default DateInputDDMMYYYY;
