import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-[var(--radius-md)] bg-[var(--clay-surface-alt)] px-4 py-3 font-body text-[15px] text-[var(--ink-900)] placeholder:text-[var(--ink-300)] clay-inset transition-shadow duration-180 focus:border-[var(--blue-500)] focus:outline-none focus:ring-4 focus:ring-[var(--blue-50)] focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${error ? "ring-2 ring-[var(--semantic-red)]/30" : ""} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled selected>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="font-body text-[13px] text-[var(--semantic-red)]">{error}</p>
        )}

        {hint && !error && (
          <p className="font-body text-[13px] text-[var(--ink-300)]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
