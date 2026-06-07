import React, { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import 'react-day-picker/style.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const ISO_FORMAT = 'yyyy-MM-dd';
const DISPLAY_FORMAT = 'd MMMM yyyy';

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DatePickerField({ value, onChange, placeholder = 'Выберите дату', required, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = toDate(value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        className="input flex items-center justify-between gap-2 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected ? 'text-white' : 'text-gray-600'}>
          {selected ? format(selected, DISPLAY_FORMAT, { locale: ru }) : placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>
      {required && <input tabIndex={-1} className="sr-only" value={value} required onChange={() => {}} />}
      {open && (
        <div className="absolute z-40 mt-1 bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-2">
          <DayPicker
            mode="single"
            locale={ru}
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? format(date, ISO_FORMAT) : '');
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default DatePickerField;
