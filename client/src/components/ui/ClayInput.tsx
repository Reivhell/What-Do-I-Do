import { type InputHTMLAttributes } from "react";

interface ClayInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  loading?: boolean;
}

export function ClayInput({ label, error, className = "", id, ...props }: ClayInputProps) {
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

      <input
        id={inputId}
        className={`clay-inset w-full rounded-[--radius-md] bg-clay-surface-alt p-3 font-body text-[15px] text-ink-900 placeholder:text-ink-300 transition-shadow duration-180 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 ${
          error ? "ring-2 ring-semantic-red/30" : ""
        } ${className}`}
        {...props}
      />

      {error && (
        <p className="font-body text-[13px] text-semantic-red">{error}</p>
      )}
    </div>
  );
}
