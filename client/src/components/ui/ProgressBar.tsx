interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`h-2 w-full rounded-[--radius-pill] bg-blue-100 ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-[--radius-pill] bg-gradient-to-r from-blue-300 to-blue-500 transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
