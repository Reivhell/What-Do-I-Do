import { Injectable } from '@nestjs/common';

export interface Scores {
  discipline: number | null;
  focus: number | null;
  consistency: number | null;
}

/**
 * Score formulas — PLACEHOLDER implementation.
 *
 * Per 10-analytics.md line 74: formulas are intentionally undefined in the product spec.
 * These placeholders use reasonable defaults. Tune after user feedback.
 *
 * Current formulas:
 * - discipline_score: ratio of planned events that were realized (have a matching activity session)
 * - focus_score: ratio of activity sessions > 30min (uninterrupted deep work)
 * - consistency_score: inverse of daily variation in total tracked minutes
 */
@Injectable()
export class ScoreCalculator {
  compute(data: ScoreInput): Scores {
    return {
      discipline: this.computeDiscipline(data),
      focus: this.computeFocus(data),
      consistency: this.computeConsistency(data),
    };
  }

  private computeDiscipline(data: ScoreInput): number | null {
    if (data.plannedEvents === 0) return null;
    return Math.round((data.realizedEvents / data.plannedEvents) * 100) / 100;
  }

  private computeFocus(data: ScoreInput): number | null {
    if (data.totalSessions === 0) return null;
    return Math.round((data.longSessions / data.totalSessions) * 100) / 100;
  }

  private computeConsistency(data: ScoreInput): number | null {
    if (data.avgDailyMinutes === 0) return null;
    // 1 - (variance / avg) — higher means more consistent
    const variation = data.stdDailyMinutes / data.avgDailyMinutes;
    return Math.max(0, Math.round((1 - Math.min(variation, 1)) * 100) / 100);
  }
}

export interface ScoreInput {
  plannedEvents: number;
  realizedEvents: number;
  totalSessions: number;
  longSessions: number; // sessions > 30 min
  avgDailyMinutes: number;
  stdDailyMinutes: number;
}
