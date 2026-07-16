import { Card, Badge } from '../ui';
import { ProgressRing } from '../ui';
import type { AchievementWithProgress } from '../../types/achievements';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
}

const categoryColors: Record<string, string> = {
  activity: 'default',
  habits: 'default',
  goals: 'default',
  planner: 'default',
  money: 'default',
  loyalty: 'default',
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const hasProgress = achievement.progress > 0;
  const pct = Math.min(100, Math.round((achievement.progress / achievement.requirementValue) * 100));

  return (
    <Card
      level={1}
      className={`
        relative flex flex-col items-center gap-3 p-5 text-center transition-all duration-300
        ${isUnlocked ? 'clay-l2' : 'clay-l1'}
        ${!isUnlocked && !hasProgress ? 'opacity-60' : ''}
      `}
    >
      {/* Badge icon */}
      <div className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}>
        {achievement.icon}
      </div>

      {/* Title */}
      <h4 className={`font-display text-sm font-semibold ${isUnlocked ? 'text-[var(--ink-900)]' : 'text-[var(--ink-500)]'}`}>
        {isUnlocked ? achievement.title : hasProgress ? achievement.title : '???'}
      </h4>

      {/* Description */}
      <p className="font-body text-xs text-[var(--ink-400)] leading-relaxed">
        {isUnlocked || hasProgress ? achievement.description : 'Keep going to discover this achievement'}
      </p>

      {/* Progress or unlocked badge */}
      {isUnlocked ? (
        <Badge variant="success">Unlocked</Badge>
      ) : hasProgress ? (
        <div className="flex flex-col items-center gap-1">
          <ProgressRing value={pct} size={48} strokeWidth={4} />
          <span className="font-mono text-[11px] text-[var(--ink-400)]">
            {achievement.progress}/{achievement.requirementValue}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="size-12 rounded-full bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] flex items-center justify-center">
            <span className="text-lg text-[var(--ink-300)]">?</span>
          </div>
          <span className="font-mono text-[11px] text-[var(--ink-400)]">???/{achievement.requirementValue}</span>
        </div>
      )}

      {/* Category badge */}
      <div className="absolute top-2 right-2">
        <Badge variant={(categoryColors[achievement.category] || 'default') as any}>
          {achievement.category}
        </Badge>
      </div>
    </Card>
  );
}
