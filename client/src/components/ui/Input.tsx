import {
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, icon, loading = false, className = "", id, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-300)]">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={loading || props.disabled}
            aria-busy={loading || undefined}
            aria-invalid={error ? true : undefined}
            className={`w-full rounded-[var(--radius-md)] bg-[var(--clay-surface-alt)] px-4 py-3 font-body text-[15px] text-[var(--ink-900)] placeholder:text-[var(--ink-300)] clay-inset transition-shadow duration-180 focus:border-[var(--blue-500)] focus:outline-none focus:ring-4 focus:ring-[var(--blue-50)] focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${
              icon ? "pl-12" : ""
            } ${loading ? "pr-12" : ""} ${
              error ? "ring-2 ring-[var(--semantic-red)]/30" : ""
            } ${className}`}
            {...props}
          />

          {loading && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-4 animate-spin rounded-full border-2 border-[var(--blue-500)] border-t-transparent">
              <span className="sr-only">Loading</span>
            </span>
          )}
        </div>

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

Input.displayName = "Input";
