import { type InputHTMLAttributes } from 'react';

interface ClayInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  loading?: boolean;
}

export function ClayInput({ label, error, loading = false, className = '', id, ...props }: ClayInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        disabled={loading || props.disabled}
        aria-busy={loading || undefined}
        aria-invalid={error ? true : undefined}
        className={`clay-inset p-3 rounded-2xl w-full bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] font-body text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-300)] transition-shadow focus:outline-none focus:border-[var(--blue-500)] focus:clay-l1 focus:ring-4 focus:ring-[var(--blue-50)] focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${error ? 'ring-2 ring-[var(--semantic-red)]/30' : ''} ${className}`}
        {...props}
      />
      {error && <p className="font-body text-xs text-[var(--semantic-red)]">{error}</p>}
    </div>
  );
}
