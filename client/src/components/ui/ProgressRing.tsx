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
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-blue-100)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#progress-grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-blue-300)" />
            <stop offset="100%" stopColor="var(--color-blue-500)" />
          </linearGradient>
        </defs>
      </svg>
      {value !== undefined && (
        <span className="absolute font-mono text-[15px] font-medium text-ink-900">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
