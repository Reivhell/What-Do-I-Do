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
            className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 pr-10 font-body text-[15px] text-ink-900 placeholder:text-ink-300 clay-inset transition-shadow duration-180 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 ${
              error ? "ring-2 ring-semantic-red/30" : ""
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron -- positioned absolutely so it doesn't clip */}
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-300">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {error && (
          <p className="font-body text-[13px] text-semantic-red">{error}</p>
        )}

        {hint && !error && (
          <p className="font-body text-[13px] text-ink-300">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
