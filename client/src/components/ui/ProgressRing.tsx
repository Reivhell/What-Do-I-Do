interface ProgressRingProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  className = "",
}: ProgressRingProps) {
  const safeValue = value ?? 0;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={value !== undefined ? `${Math.round(value)}%` : undefined}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="progress-ring-track"
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-ring-fill transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" />
            <stop offset="100%" />
          </linearGradient>
        </defs>
      </svg>
      {value !== undefined && (
        <span className="absolute font-mono text-[15px] font-medium text-[var(--ink-900)]">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
