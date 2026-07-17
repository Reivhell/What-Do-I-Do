import { type InputHTMLAttributes } from "react";

interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: string;
  size?: "sm" | "md";
}

const trackSizes = { sm: "h-6 w-10", md: "h-7 w-12" };
const thumbSizes = { sm: "size-5", md: "size-6" };
const translateX = { sm: "translate-x-4", md: "translate-x-5" };

export function Toggle({
  label,
  size = "md",
  className = "",
  id,
  ...props
}: ToggleProps) {
  const toggleId = id || `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label
      htmlFor={toggleId}
      className={`inline-flex cursor-pointer items-center gap-3 ${className}`}
    >
      <span className="relative">
        {/* Track (inset — looks like a hole) */}
        <span
          className={`block rounded-[var(--radius-pill)] bg-[var(--clay-surface-alt)] clay-inset ${trackSizes[size]}`}
        />
        {/* Thumb (timbul — clay level 1) */}
        <span
          className={`absolute left-0.5 top-0.5 rounded-full clay-l1 transition-transform duration-180 ease-out ${
            thumbSizes[size]
          } ${
            props.checked
              ? `${translateX[size]} bg-[var(--blue-500)] active:clay-pressed`
              : "translate-x-0 bg-[var(--ink-200)]"
          }`}
        />
      </span>

      <input
        type="checkbox"
        id={toggleId}
        className="sr-only focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:ring-offset-2 rounded-[var(--radius-pill)]"
        role="switch"
        aria-checked={props.checked}
        {...props}
      />

      <span className="font-body text-[15px] text-[var(--ink-900)]">{label}</span>
    </label>
  );
}
