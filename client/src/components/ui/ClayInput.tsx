import { type InputHTMLAttributes } from 'react';

interface ClayInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function ClayInput({ label, error, className = '', id, ...props }: ClayInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary placeholder-clr-text-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-clr-primary/30 ${error ? 'ring-2 ring-clr-danger/30' : ''} ${className}`}
        {...props}
      />
      {error && <p className="font-[Plus Jakarta Sans] text-xs clr-danger">{error}</p>}
    </div>
  );
}
