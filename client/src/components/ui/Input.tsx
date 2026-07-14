import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-300">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-300 clay-inset transition-shadow duration-180 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 ${
              icon ? "pl-12" : ""
            } ${error ? "ring-2 ring-semantic-red/30" : ""} ${className}`}
            {...props}
          />
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

Input.displayName = "Input";
