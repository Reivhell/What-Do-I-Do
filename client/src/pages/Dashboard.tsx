import { useState, useEffect } from "react";
import { useTheme } from "../providers";
import { Link, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/layout";
import { TopInsightWidget } from "../components/dashboard/TopInsightWidget";
import { useDashboardSummary } from "../api/dashboard";
import { Card, Button } from "../components/ui";

/* ── Helpers ── */
function formatTimer(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/* ── Skeleton ── */
function StatSkeleton() {
  return (
    <div className="clay-card p-[24px] flex items-center gap-5 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-[var(--ink-300)]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-[var(--ink-300)] rounded" />
        <div className="h-6 w-16 bg-[var(--ink-300)] rounded" />
        <div className="h-2 w-full bg-[var(--ink-300)] rounded" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  // ── API ──
  const userId = "default";
  const { data, isLoading, isError } = useDashboardSummary(userId);

  const activeSession = data?.activeSession ?? null;
  const todayStats = data?.todayStats ?? {
    tasksCompleted: 0,
    tasksTotal: 0,
    minutesTracked: 0,
    expenseToday: 0,
    incomeToday: 0,
    habitsDone: 0,
    habitsTotal: 0,
  };
  const scores = data?.scores ?? { discipline: null, focus: null, consistency: null };
  const streak = data?.streak ?? { current: 0, best: 0 };
  const upcomingEvents = data?.upcomingEvents ?? [];
  const topInsight = data?.topInsight ?? null;

  // ── Live timer ──
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (activeSession?.isActive && activeSession.elapsedSeconds != null) {
      setElapsed(activeSession.elapsedSeconds);
    } else {
      setElapsed(0);
    }
  }, [activeSession?.elapsedSeconds, activeSession?.isActive]);

  useEffect(() => {
    if (!activeSession?.isActive) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [activeSession?.isActive]);

  // Derived
  const taskPct =
    todayStats.tasksTotal > 0
      ? Math.round((todayStats.tasksCompleted / todayStats.tasksTotal) * 100)
      : 0;
  const habitPct =
    todayStats.habitsTotal > 0
      ? Math.round((todayStats.habitsDone / todayStats.habitsTotal) * 100)
      : 0;
  const focusScore = scores.focus ?? 0;
  const focusPct = Math.min(focusScore, 100);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-[230px] p-8 flex-1 bg-[var(--clay-bg)] text-[var(--ink-900)]">
          <header className="flex items-center justify-between w-full mb-10 gap-[16px] h-20">
            <div className="flex-1 max-w-xl">
              <div className="relative clay-card-inset rounded-full flex items-center px-6 py-3 animate-pulse">
                <div className="h-4 w-full bg-[var(--ink-300)] rounded" />
              </div>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="clay-card p-[24px] lg:col-span-3 h-48 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main Content ── */}
      <main className="ml-[230px] p-8 flex-1 bg-[var(--clay-bg)] text-[var(--ink-900)]">
        {/* ── Error Banner ── */}
        {isError && (
          <div className="mb-6 px-6 py-4 rounded-2xl clay-card flex items-center gap-3 text-[var(--semantic-red)] bg-[var(--semantic-red)]/10">
            <span className="material-symbols-outlined">error</span>
            <span className="font-body text-[14px] leading-[20px] font-medium">
              Failed to load dashboard data. Showing cached values.
            </span>
          </div>
        )}

        {/* ── Header ── */}
        <header className="flex items-center justify-between w-full mb-10 gap-[16px] h-20">
          <div className="flex-1 max-w-xl">
            <div className="relative clay-card-inset rounded-full flex items-center px-6 py-3">
              <span className="material-symbols-outlined text-[var(--ink-500)] mr-3">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-body text-[14px] leading-[20px] font-normal text-[var(--ink-900)] placeholder:text-[var(--ink-500)]"
                placeholder="Search anything..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="clay-button bg-[var(--clay-surface)] rounded-full p-3 flex items-center gap-2 font-body text-[13px] leading-[18px] font-medium text-[var(--ink-900)]">
              <span className="material-symbols-outlined text-[var(--blue-500)]">inbox</span>
              <span className="hidden sm:inline">Inbox</span>
              <span className="w-2 h-2 bg-[var(--blue-500)] rounded-full" />
            </button>
            <button className="clay-button bg-[var(--blue-500)] text-white rounded-full px-6 py-3 flex items-center gap-2 font-body text-[16px] leading-[24px] font-semibold hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">add_circle</span>
              Capture
            </button>

            {/* Theme Toggle */}
            <div
              onClick={toggle}
              className="clay-card-inset rounded-full p-1 flex items-center gap-1 relative cursor-pointer hover:scale-105 transition-all duration-200"
            >
              <div
                className={`absolute w-8 h-8 bg-[var(--blue-500)] rounded-full transition-all duration-300 shadow-sm ${
                  isDark ? "translate-x-9" : "translate-x-0"
                }`}
              />
              <button
                className={`relative z-10 w-8 h-8 flex items-center justify-center ${
                  !isDark ? "text-white" : "text-[var(--ink-500)]"
                }`}
              >
                <span className="material-symbols-outlined text-xl">light_mode</span>
              </button>
              <button
                className={`relative z-10 w-8 h-8 flex items-center justify-center ${
                  isDark ? "text-white" : "text-[var(--ink-500)]"
                }`}
              >
                <span className="material-symbols-outlined text-xl">dark_mode</span>
              </button>
            </div>

            <div className="relative">
              <button className="clay-button bg-[var(--clay-surface)] rounded-full p-3 text-[var(--ink-900)]">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <span className="absolute top-0 right-0 w-5 h-5 bg-[var(--semantic-red)] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-[var(--clay-bg)] font-bold">
                3
              </span>
            </div>

            <div className="flex items-center gap-3 clay-button bg-[var(--clay-surface)] rounded-full pl-2 pr-4 py-2 cursor-pointer">
              <img
                className="w-10 h-10 rounded-full object-cover shadow-sm"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGDEjK23si4By4wAO5X74kXUtpuOEhoVox6q_X-tX5YJJpU5Yx-VOMKOhf6PRwsmIko_8ShwiIxXdcE0vviUgtY3RcnoVl454Z_3DhFuusTLw0aZiRaTdIRLdRKM8NIfByCpzPZByLRc63hy-PbG7EEFnswYPdudrReoN5Wzj3EcRsyDggJ-lx1-gYnY1AxuJm6ssUwYcsUTZ6jHiI10wRO64mN369SVo1qlN2mnyWTUF64z0Rzvzcc9uEk25OymvfnFS7etBX1QyR"
                alt="User"
              />
              <div className="hidden lg:block text-left">
                <p className="font-body text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">Fajar</p>
              </div>
              <span className="material-symbols-outlined text-[var(--ink-500)]">
                keyboard_arrow_down
              </span>
            </div>
          </div>
        </header>

        {/* ── Greeting ── */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-display text-[28px] leading-[36px] font-bold tracking-tight text-[var(--ink-900)] flex items-center gap-3">
              Good morning, Fajar 👋
            </h2>
            <p className="font-body text-[16px] leading-[24px] font-normal text-[var(--ink-500)] mt-1">
              Let's make today productive!
            </p>
          </div>
          <div className="clay-card py-3 px-6 flex items-center gap-4 bg-white/80 bg-[var(--clay-surface-alt)]">
            <div className="w-12 h-12 bg-[var(--blue-50)] rounded-2xl flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[var(--blue-500)]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                calendar_today
              </span>
            </div>
            <div>
              <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">Sunday</p>
              <p className="font-body text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">25 May 2025</p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Focus Score */}
          <Card level={1} className="flex items-center gap-5">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isDark ? "#3f3f46" : "#E2E8F0"}
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeDasharray={`${focusPct}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--blue-500)] text-xl">speed</span>
              </div>
            </div>
            <div>
              <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Focus Score</p>
              <h3 className="font-display text-[26px] leading-[32px] font-bold text-[var(--ink-900)]">
                {focusPct}{" "}
                <span className="text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">/100</span>
              </h3>
              <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--semantic-green)] mt-1">
                {focusPct >= 80 ? "Great focus!" : focusPct >= 50 ? "Keep going!" : "Room for improvement"}
              </p>
            </div>
          </Card>

          {/* Productive Time */}
          <Card level={1} className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[var(--blue-50)] dark:bg-[var(--blue-500)]/10 rounded-full flex items-center justify-center clay-button">
              <span
                className="material-symbols-outlined text-[var(--blue-500)] text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
            </div>
            <div>
              <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Productive Time</p>
              <h3 className="font-display text-[26px] leading-[32px] font-bold text-[var(--ink-900)]">
                {formatMinutes(todayStats.minutesTracked)}
              </h3>
              <div className="w-full bg-[var(--ink-300)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[var(--blue-500)] h-full" style={{ width: `${Math.min((todayStats.minutesTracked / 480) * 100, 100)}%` }} />
              </div>
              <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)] mt-1">
                of 8h goal
              </p>
            </div>
          </Card>

          {/* Tasks Completed */}
          <Card level={1} className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[var(--semantic-green)]/10 dark:bg-[var(--semantic-green)]/10 rounded-full flex items-center justify-center clay-button text-[var(--semantic-green)]">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div>
              <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Tasks Completed</p>
              <h3 className="font-display text-[26px] leading-[32px] font-bold text-[var(--ink-900)]">
                {todayStats.tasksCompleted}{" "}
                <span className="text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">/{todayStats.tasksTotal}</span>
              </h3>
              <div className="w-full bg-[var(--ink-300)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[var(--semantic-green)] h-full" style={{ width: `${taskPct}%` }} />
              </div>
              <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--semantic-green)] mt-1">{taskPct}% completed</p>
            </div>
          </Card>

          {/* Spend Today */}
          <Card level={1} className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[var(--semantic-red)]/10 dark:bg-[var(--semantic-red)]/10 rounded-full flex items-center justify-center clay-button text-[var(--semantic-red)]">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <div>
              <p className="font-body text-[13px] leading-[18px] font-medium text-[var(--ink-500)]">Spend Today</p>
              <h3 className="font-display text-[26px] leading-[32px] font-bold text-[var(--ink-900)]">
                {formatCurrency(todayStats.expenseToday)}
              </h3>
              <div className="w-full bg-[var(--ink-300)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[var(--semantic-red)] h-full" style={{ width: `${Math.min((todayStats.expenseToday / 250000) * 100, 100)}%` }} />
              </div>
              <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)] mt-1">
                Budget: Rp 250.000
              </p>
            </div>
          </Card>
        </div>

        {/* ── Top Insight Banner ── */}
        {topInsight && (
          <div className="mb-8 clay-card p-[20px] flex items-start gap-4">
            <span className="material-symbols-outlined text-[var(--blue-500)] text-2xl shrink-0">insight</span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-[15px] leading-[22px] font-semibold text-[var(--ink-900)]">
                {topInsight.message}
              </p>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[var(--blue-50)] font-mono text-[11px] leading-[16px] font-medium text-[var(--blue-500)]">
                {topInsight.type}
              </span>
            </div>
          </div>
        )}

        {/* ── BENTO WIDGET GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ═══ ROW 1 ═══ */}

          {/* Current Activity — span 4 */}
          <Card level={1} className="relative overflow-hidden lg:col-span-4">
            <div className="flex justify-between items-start mb-8">
              <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">
                Current Activity
              </h4>
              {activeSession?.isActive ? (
                <span className="px-3 py-1 bg-[var(--semantic-green)]/10 dark:bg-[var(--semantic-green)]/10 text-[var(--semantic-green)] rounded-full font-body text-[12px] leading-[16px] font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-[var(--semantic-green)] rounded-full animate-pulse" />
                  In Progress
                </span>
              ) : (
                <span className="px-3 py-1 bg-[var(--ink-300)] rounded-full font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)] flex items-center gap-1">
                  Idle
                </span>
              )}
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-28 h-28 bg-[var(--clay-surface)] clay-button rounded-3xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[var(--blue-500)] text-5xl">
                  {activeSession?.isActive ? "code" : "bedtime"}
                </span>
              </div>
              <h5 className="font-display text-[24px] leading-[32px] font-bold text-[var(--ink-900)] text-center">
                {activeSession?.activityName ?? "No active session"}
              </h5>
              <p className="font-body text-[14px] leading-[20px] font-normal text-[var(--ink-500)] mb-6">
                {activeSession?.isActive ? "Tracking now" : "Start an activity to track time"}
              </p>
              <div className="font-mono text-[24px] leading-[32px] font-semibold tracking-[0.05em] text-[var(--blue-500)] mb-8">
                {formatTimer(elapsed)}
              </div>
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full clay-button bg-[var(--clay-surface)] flex items-center justify-center text-[var(--blue-500)]">
                  <span className="material-symbols-outlined">info</span>
                </button>
                <button className="w-16 h-16 rounded-full clay-button bg-[var(--clay-surface)] flex items-center justify-center text-[var(--semantic-red)]">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    stop_circle
                  </span>
                </button>
                <button className="clay-button bg-[var(--clay-surface)] rounded-full px-6 py-3 flex items-center gap-2 font-body text-[13px] leading-[18px] font-medium text-[var(--ink-900)]">
                  <span className="material-symbols-outlined">swap_horiz</span>
                  Switch
                </button>
              </div>
            </div>
          </Card>

          {/* Top Insight — span 3 */}
          <TopInsightWidget />

          {/* Today's Plan — span 5 */}
          <Card level={1} className="lg:col-span-5">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">
                Today's Plan
              </h4>
              <Link to="/" className="text-[var(--blue-500)] font-body text-[12px] leading-[16px] font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-5">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 6).map((evt) => (
                  <div key={evt.id} className="flex items-start gap-4">
                    <span
                      className="material-symbols-outlined text-[var(--blue-500)]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      radio_button_checked
                    </span>
                    <div className="flex-1 flex items-baseline justify-between gap-4">
                      <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)] tabular-nums">{evt.time}</p>
                      <p className="font-body text-[14px] leading-[20px] font-medium text-[var(--ink-900)]">
                        {evt.title}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-body text-[14px] leading-[20px] font-medium text-[var(--ink-500)] text-center py-8">
                  No events planned for today
                </p>
              )}
            </div>
            <div className="mt-6">
              <div className="flex justify-between mb-1.5">
                <span className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">
                  {todayStats.tasksCompleted} of {todayStats.tasksTotal} completed
                </span>
                <span className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">{taskPct}%</span>
              </div>
              <div className="w-full bg-[var(--ink-300)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--blue-500)] h-full" style={{ width: `${taskPct}%` }} />
              </div>
            </div>
          </Card>

          {/* Next Up — span 3 */}
          <Card level={1} className="lg:col-span-3">
            <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)] mb-5">
              Next Up
            </h4>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="clay-card-inset p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--blue-500)]/10 rounded-xl flex items-center justify-center text-[var(--blue-500)] shrink-0">
                      <span className="material-symbols-outlined">calendar_today</span>
                    </div>
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="font-body text-[12px] leading-[16px] font-semibold text-[var(--blue-500)]">{evt.time}</p>
                      <p className="font-body text-[15px] leading-[22px] font-semibold text-[var(--ink-900)]">{evt.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-body text-[14px] leading-[20px] font-medium text-[var(--ink-500)] text-center py-8">
                  No upcoming events
                </p>
              )}
            </div>
            <Link
              to="/"
              className="block text-center text-[var(--blue-500)] font-body text-[12px] leading-[16px] font-medium mt-5 hover:underline"
            >
              View All
            </Link>
          </Card>

          {/* ═══ ROW 2 ═══ */}

          {/* Planned vs Actual — span 4 */}
          <Card level={1} className="lg:col-span-4">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">
                Planned vs Actual
              </h4>
              <button className="flex items-center gap-1 font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)] bg-[var(--clay-surface)] rounded-full px-3 py-1">
                Today
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-4 font-body text-[11px] leading-[14px] font-medium text-[var(--ink-500)] border-b border-[var(--clay-border)] pb-1.5">
                <span>Category</span>
                <span className="text-right">Planned</span>
                <span className="text-right">Actual</span>
                <span className="text-right">Diff</span>
              </div>
              {[
                { cat: "Deep Work", planned: "3h 30m", actual: "2h 45m", diff: "-45m" },
                { cat: "Study", planned: "2h 00m", actual: "1h 20m", diff: "-40m" },
                { cat: "Exercise", planned: "1h 00m", actual: "40m", diff: "-20m" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-4 py-1 font-body text-[14px] leading-[20px]">
                  <span className="font-semibold text-[var(--ink-900)]">{row.cat}</span>
                  <span className="text-right text-[var(--ink-500)]">{row.planned}</span>
                  <span className="text-right text-[var(--ink-500)]">{row.actual}</span>
                  <span className="text-right text-[var(--semantic-red)]">{row.diff}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[--radius-md] bg-[var(--clay-surface-alt)] bg-[var(--clay-surface)]est px-4 py-3 clay-pressed">
              <span className="font-display text-[14px] leading-[20px] font-semibold text-[var(--ink-900)]">Match Score</span>
              <span className="font-mono text-[22px] leading-[28px] font-bold text-[var(--blue-500)]">78%</span>
            </div>
          </Card>

          {/* Today Summary — span 4 */}
          <Card level={1} className="lg:col-span-4">
            <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)] mb-5">
              Today Summary
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "work", label: "Deep Work", val: "2h 31m", bg: "bg-[var(--blue-50)]", text: "text-[var(--blue-500)]" },
                { icon: "sports_esports", label: "Leisure", val: "1h 45m", bg: "bg-[var(--semantic-green)]/10", text: "text-[var(--semantic-green)]" },
                { icon: "dark_mode", label: "Sleep", val: "6h 12m", bg: "bg-[var(--blue-700)]/10", text: "text-[var(--blue-700)]" },
                { icon: "favorite", label: "Exercise", val: "40m", bg: "bg-[var(--semantic-red)]/10", text: "text-[var(--semantic-red)]" },
              ].map((item, idx) => (
                <div key={idx} className="clay-card-inset p-3 rounded-2xl flex items-center gap-3">
                  <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${item.text} text-lg`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-body text-[11px] leading-[14px] font-medium text-[var(--ink-500)]">{item.label}</p>
                    <p className="font-mono text-[15px] leading-[22px] font-semibold text-[var(--ink-900)]">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Habit Progress + Streak — span 4 */}
          <Card level={1} className="lg:col-span-4">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--blue-500)] text-xl">local_fire_department</span>
                Habits
              </h4>
              <Link to="/" className="text-[var(--blue-500)] font-body text-[12px] leading-[16px] font-medium hover:underline">
                View All
              </Link>
            </div>
            {/* Streak summary */}
            <div className="flex items-center gap-4 mb-5 clay-card-inset p-4 rounded-2xl">
              <div className="w-12 h-12 bg-[var(--blue-700)]/10 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[var(--blue-700)] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">Current Streak</p>
                <p className="font-mono text-[22px] leading-[28px] font-bold text-[var(--ink-900)]">
                  {streak.current}{" "}
                  <span className="text-[14px] leading-[20px] font-medium text-[var(--ink-500)]">days</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">Best</p>
                <p className="font-mono text-[18px] leading-[24px] font-bold text-[var(--blue-500)]">{streak.best}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">
                  Today's progress
                </span>
                <span className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">
                  {todayStats.habitsDone}/{todayStats.habitsTotal}
                </span>
              </div>
              <div className="w-full bg-[var(--ink-300)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--blue-700)] h-full" style={{ width: `${habitPct}%` }} />
              </div>
            </div>
            <p className="font-body text-[14px] leading-[20px] font-medium text-[var(--ink-500)] text-center">
              {todayStats.habitsDone === 0 && todayStats.habitsTotal === 0
                ? "No habits tracked today"
                : `${habitPct}% of habits completed`}
            </p>
          </Card>

          {/* ═══ ROW 3: Money Summary — 6 col, Quick Actions — 6 col ═══ */}

          {/* Money Summary — span 6 */}
          <Card level={1} className="lg:col-span-6">
            <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)] mb-4">
              Money Summary
            </h4>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--blue-500)] rounded-2xl flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                </div>
                <div>
                  <p className="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">Balance</p>
                  <p className="font-mono text-[26px] leading-[32px] font-bold text-[var(--ink-900)]">Rp 5.230.000</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="font-body text-[11px] leading-[14px] font-medium text-[var(--ink-500)]">Income</p>
                  <p className="font-mono text-[16px] leading-[24px] font-bold text-[var(--semantic-green)]">
                    {formatCurrency(todayStats.incomeToday)}
                  </p>
                </div>
                <div className="w-px h-8 bg-[var(--clay-border)]" />
                <div className="text-center">
                  <p className="font-body text-[11px] leading-[14px] font-medium text-[var(--ink-500)]">Expense</p>
                  <p className="font-mono text-[16px] leading-[24px] font-bold text-[var(--semantic-red)]">
                    {formatCurrency(todayStats.expenseToday)}
                  </p>
                </div>
                <div className="w-px h-8 bg-[var(--clay-border)]" />
                <div className="text-center">
                  <p className="font-body text-[11px] leading-[14px] font-medium text-[var(--ink-500)]">Net</p>
                  <p className={`font-mono text-[16px] leading-[24px] font-bold ${todayStats.incomeToday - todayStats.expenseToday >= 0 ? "text-[var(--semantic-green)]" : "text-[var(--semantic-red)]"}`}>
                    {formatCurrency(todayStats.incomeToday - todayStats.expenseToday)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions — span 6 (2×3 grid) */}
          <Card level={1} className="lg:col-span-6">
            <h4 className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)] mb-4">
              Quick Actions
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: "play_arrow", label: "Start Activity", color: "text-[var(--blue-500)]", path: "/activity" },
                { icon: "task_alt", label: "Add Task", color: "text-[var(--semantic-green)]", path: "/tasks" },
                { icon: "event", label: "Add Event", color: "text-[var(--blue-500)]", path: "/planner" },
                { icon: "payments", label: "Add Transaction", color: "text-[var(--semantic-red)]", path: "/money" },
                { icon: "note_add", label: "Capture Note", color: "text-[var(--blue-700)]", path: "/inbox" },
                { icon: "mail", label: "Open Inbox", color: "text-[var(--ink-900)]", path: "/inbox" },
              ].map((act, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(act.path)}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <span className={`material-symbols-outlined text-2xl ${act.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{act.icon}</span>
                  <span className="font-body text-[11px] leading-[14px] font-semibold text-center text-[var(--ink-500)]">{act.label}</span>
                </Button>
              ))}
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}
