import { useState, useEffect } from "react";
import { useTheme } from "../providers";
import { Link, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/layout";

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

export function Dashboard() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const [seconds, setSeconds] = useState(5077);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar (shared component) ── */}
      <Sidebar />

      {/* ── Main Content ── */}
      <main className="ml-[230px] p-8 flex-1 bg-clr-background clr-on-surface">
        {/* ── Header ── */}
        <header className="flex items-center justify-between w-full mb-10 gap-[16px] h-20">
          <div className="flex-1 max-w-xl">
            <div className="relative clay-card-inset rounded-full flex items-center px-6 py-3">
              <span className="material-symbols-outlined clr-text-secondary mr-3">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-normal clr-text-primary placeholder:clr-text-secondary"
                placeholder="Search anything..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="clay-button bg-clr-surface-white dark:bg-clr-surface-container-high rounded-full p-3 flex items-center gap-2 font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-primary">
              <span className="material-symbols-outlined clr-primary">inbox</span>
              <span className="hidden sm:inline">Inbox</span>
              <span className="w-2 h-2 bg-clr-primary rounded-full" />
            </button>
            <button className="clay-button bg-clr-primary clr-on-primary rounded-full px-6 py-3 flex items-center gap-2 font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">add_circle</span>
              Capture
            </button>

            {/* Theme Toggle */}
            <div
              onClick={toggle}
              className="clay-card-inset rounded-full p-1 flex items-center gap-1 relative cursor-pointer hover:scale-105 transition-all duration-200"
            >
              <div
                className={`absolute w-8 h-8 bg-clr-primary rounded-full transition-all duration-300 shadow-sm ${
                  isDark ? "translate-x-9" : "translate-x-0"
                }`}
              />
              <button
                className={`relative z-10 w-8 h-8 flex items-center justify-center ${
                  !isDark ? "clr-on-primary" : "clr-text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-xl">light_mode</span>
              </button>
              <button
                className={`relative z-10 w-8 h-8 flex items-center justify-center ${
                  isDark ? "clr-on-primary" : "clr-text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-xl">dark_mode</span>
              </button>
            </div>

            <div className="relative">
              <button className="clay-button bg-clr-surface-white dark:bg-clr-surface-container-high rounded-full p-3 clr-text-primary">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <span className="absolute top-0 right-0 w-5 h-5 bg-clr-danger text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-[var(--background)] font-bold">
                3
              </span>
            </div>

            <div className="flex items-center gap-3 clay-button bg-clr-surface-white dark:bg-clr-surface-container-high rounded-full pl-2 pr-4 py-2 cursor-pointer">
              <img
                className="w-10 h-10 rounded-full object-cover shadow-sm"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGDEjK23si4By4wAO5X74kXUtpuOEhoVox6q_X-tX5YJJpU5Yx-VOMKOhf6PRwsmIko_8ShwiIxXdcE0vviUgtY3RcnoVl454Z_3DhFuusTLw0aZiRaTdIRLdRKM8NIfByCpzPZByLRc63hy-PbG7EEFnswYPdudrReoN5Wzj3EcRsyDggJ-lx1-gYnY1AxuJm6ssUwYcsUTZ6jHiI10wRO64mN369SVo1qlN2mnyWTUF64z0Rzvzcc9uEk25OymvfnFS7etBX1QyR"
                alt="User"
              />
              <div className="hidden lg:block text-left">
                <p className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary">Fajar</p>
              </div>
              <span className="material-symbols-outlined clr-text-secondary">
                keyboard_arrow_down
              </span>
            </div>
          </div>
        </header>

        {/* ── Greeting ── */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-[Plus Jakarta Sans] text-[28px] leading-[36px] font-bold tracking-tight clr-text-primary flex items-center gap-3">
              Good morning, Fajar 👋
            </h2>
            <p className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-normal clr-text-secondary mt-1">
              Let's make today productive!
            </p>
          </div>
          <div className="clay-card py-3 px-6 flex items-center gap-4 bg-white/80 dark:bg-clr-surface-container">
            <div className="w-12 h-12 bg-clr-primary-20 rounded-2xl flex items-center justify-center">
              <span
                className="material-symbols-outlined clr-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                calendar_today
              </span>
            </div>
            <div>
              <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary">Sunday</p>
              <p className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary">25 May 2025</p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Discipline Score */}
          <div className="clay-card p-[24px] flex items-center gap-5">
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
                  strokeDasharray="82, 100"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined clr-primary text-xl">speed</span>
              </div>
            </div>
            <div>
              <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Discipline Score</p>
              <h3 className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-text-primary">
                82{" "}
                <span className="text-[13px] leading-[18px] font-medium clr-text-secondary">/100</span>
              </h3>
              <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-success mt-1">Great consistency!</p>
            </div>
          </div>

          {/* Productive Time */}
          <div className="clay-card p-[24px] flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-50 dark:bg-clr-primary-10 rounded-full flex items-center justify-center clay-button">
              <span
                className="material-symbols-outlined clr-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
            </div>
            <div>
              <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Productive Time</p>
              <h3 className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-text-primary">4h 27m</h3>
              <div className="w-full bg-clr-track-neutral h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-clr-primary h-full" style={{ width: "55%" }} />
              </div>
              <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary mt-1">
                of 8h 30m goal
              </p>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="clay-card p-[24px] flex items-center gap-5">
            <div className="w-16 h-16 bg-green-50 dark:bg-clr-success-10 rounded-full flex items-center justify-center clay-button clr-success">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div>
              <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Tasks Completed</p>
              <h3 className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-text-primary">
                7{" "}
                <span className="text-[13px] leading-[18px] font-medium clr-text-secondary">/12</span>
              </h3>
              <div className="w-full bg-clr-track-neutral h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-clr-success h-full" style={{ width: "58%" }} />
              </div>
              <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-success mt-1">58% completed</p>
            </div>
          </div>

          {/* Spend Today */}
          <div className="clay-card p-[24px] flex items-center gap-5">
            <div className="w-16 h-16 bg-red-50 dark:bg-clr-danger-10 rounded-full flex items-center justify-center clay-button clr-danger">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <div>
              <p className="font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-secondary">Spend Today</p>
              <h3 className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-text-primary">Rp 105.000</h3>
              <div className="w-full bg-clr-track-neutral h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-clr-danger h-full" style={{ width: "42%" }} />
              </div>
              <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary mt-1">
                Budget: Rp 250.000
              </p>
            </div>
          </div>
        </div>

        {/* ── BENTO WIDGET GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ═══ ROW 1 ═══ */}

          {/* Current Activity — span 4 */}
          <section className="clay-card p-[24px] relative overflow-hidden lg:col-span-4">
            <div className="flex justify-between items-start mb-8">
              <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary">
                Current Activity
              </h4>
              <span className="px-3 py-1 bg-green-100 dark:bg-clr-success-10 clr-success rounded-full font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-clr-success rounded-full animate-pulse" />
                In Progress
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-28 h-28 bg-clr-surface-white dark:bg-clr-surface-container-high clay-button rounded-3xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined clr-primary text-5xl">code</span>
              </div>
              <h5 className="font-[Plus Jakarta Sans] text-[24px] leading-[32px] font-bold clr-text-primary text-center">
                Coding Project
              </h5>
              <p className="font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-normal clr-text-secondary mb-6">
                Personal Project
              </p>
              <div className="font-[Plus Jakarta Sans] text-[24px] leading-[32px] font-semibold tracking-[0.05em] clr-primary mb-8">
                {formatTimer(seconds)}
              </div>
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full clay-button bg-clr-surface-white dark:bg-clr-surface-container-high flex items-center justify-center clr-primary">
                  <span className="material-symbols-outlined">info</span>
                </button>
                <button className="w-16 h-16 rounded-full clay-button bg-clr-surface-white dark:bg-clr-surface-container-high flex items-center justify-center clr-danger">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    stop_circle
                  </span>
                </button>
                <button className="clay-button bg-clr-surface-white dark:bg-clr-surface-container-high rounded-full px-6 py-3 flex items-center gap-2 font-[Plus Jakarta Sans] text-[13px] leading-[18px] font-medium clr-text-primary">
                  <span className="material-symbols-outlined">swap_horiz</span>
                  Switch
                </button>
              </div>
            </div>
          </section>

          {/* Today's Plan — span 5 (widest — highest content density) */}
          <section className="clay-card p-[24px] lg:col-span-5">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary">
                Today's Plan
              </h4>
              <Link to="/" className="clr-primary font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-5">
              {[
                { time: "07:00 – 08:00", label: "Morning Routine", icon: "check_circle", color: "clr-success", fill: 1 },
                { time: "08:30 – 10:30", label: "Deep Work: Project", icon: "check_circle", color: "clr-success", fill: 1 },
                { time: "11:00 – 12:00", label: "Study", icon: "radio_button_checked", color: "clr-primary", fill: 1, bold: true },
                { time: "13:00 – 14:00", label: "Lunch Break", icon: "radio_button_unchecked", color: "clr-text-secondary", fill: 0 },
                { time: "15:00 – 17:00", label: "Work on Features", icon: "radio_button_unchecked", color: "clr-text-secondary", fill: 0 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <span
                    className={`material-symbols-outlined ${item.color}`}
                    style={{ fontVariationSettings: `'FILL' ${item.fill}` }}
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1 flex items-baseline justify-between gap-4">
                    <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary tabular-nums">{item.time}</p>
                    <p
                      className={`font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-medium clr-text-primary ${item.bold ? "font-bold" : ""}`}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <div className="flex justify-between mb-1.5">
                <span className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary">
                  3 of 6 completed
                </span>
                <span className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary">50%</span>
              </div>
              <div className="w-full bg-clr-track-neutral h-2 rounded-full overflow-hidden">
                <div className="bg-clr-primary h-full" style={{ width: "50%" }} />
              </div>
            </div>
          </section>

          {/* Upcoming / Next Action — span 3 (compact) */}
          <section className="clay-card p-[24px] lg:col-span-3">
            <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary mb-5">
              Next Up
            </h4>
            <div className="space-y-3">
              <div className="clay-card-inset p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-clr-primary-10 rounded-xl flex items-center justify-center clr-primary shrink-0">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-semibold clr-primary">In 35 min</p>
                  <p className="font-[Plus Jakarta Sans] text-[15px] leading-[22px] font-semibold clr-text-primary">Study</p>
                  <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary">11:00 – 12:00</p>
                </div>
              </div>
              <div className="clay-card-inset p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-clr-danger-10 rounded-xl flex items-center justify-center clr-danger shrink-0">
                  <span className="material-symbols-outlined">assignment_late</span>
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-semibold clr-danger">High Priority</p>
                  <p className="font-[Plus Jakarta Sans] text-[15px] leading-[22px] font-semibold clr-text-primary">Fix landing page bug</p>
                </div>
              </div>
            </div>
            <Link
              to="/"
              className="block text-center clr-primary font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium mt-5 hover:underline"
            >
              View All
            </Link>
          </section>

          {/* ═══ ROW 2 ═══ */}

          {/* Planned vs Actual — span 4 */}
          <section className="clay-card p-[24px] lg:col-span-4">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary">
                Planned vs Actual
              </h4>
              <button className="flex items-center gap-1 font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary bg-clr-surface-container dark:bg-clr-surface-container-highest rounded-full px-3 py-1">
                Today
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-4 font-[Plus Jakarta Sans] text-[11px] leading-[14px] font-medium clr-text-secondary border-b brd-clr-divider-soft pb-1.5">
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
                <div key={i} className="grid grid-cols-4 py-1 font-[Plus Jakarta Sans] text-[14px] leading-[20px]">
                  <span className="font-semibold clr-text-primary">{row.cat}</span>
                  <span className="text-right clr-text-secondary">{row.planned}</span>
                  <span className="text-right clr-text-secondary">{row.actual}</span>
                  <span className="text-right clr-danger">{row.diff}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[--radius-md] bg-clr-surface-container dark:bg-clr-surface-container-highest px-4 py-3 clay-pressed">
              <span className="font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-semibold clr-text-primary">Match Score</span>
              <span className="font-[Plus Jakarta Sans] text-[22px] leading-[28px] font-bold clr-primary">78%</span>
            </div>
          </section>

          {/* Today Summary — span 4 */}
          <section className="clay-card p-[24px] lg:col-span-4">
            <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary mb-5">
              Today Summary
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "work", label: "Deep Work", val: "2h 31m", bg: "bg-clr-primary-20", text: "clr-primary" },
                { icon: "sports_esports", label: "Leisure", val: "1h 45m", bg: "bg-clr-success-10", text: "clr-success" },
                { icon: "dark_mode", label: "Sleep", val: "6h 12m", bg: "bg-clr-secondary-10", text: "clr-secondary" },
                { icon: "favorite", label: "Exercise", val: "40m", bg: "bg-clr-danger-10", text: "clr-danger" },
              ].map((item, idx) => (
                <div key={idx} className="clay-card-inset p-3 rounded-2xl flex items-center gap-3">
                  <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${item.text} text-lg`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-[Plus Jakarta Sans] text-[11px] leading-[14px] font-medium clr-text-secondary">{item.label}</p>
                    <p className="font-[Plus Jakarta Sans] text-[15px] leading-[22px] font-semibold clr-text-primary">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Habit Progress — span 4 */}
          <section className="clay-card p-[24px] lg:col-span-4">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined clr-primary text-xl">local_fire_department</span>
                Habits
              </h4>
              <Link to="/" className="clr-primary font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { name: "Morning Run", icon: "directions_run", streak: 12, color: "clr-primary", bg: "bg-clr-primary-20" },
                { name: "Read 30m", icon: "menu_book", streak: 5, color: "clr-success", bg: "bg-clr-success-10" },
                { name: "Meditate", icon: "self_improvement", streak: 3, color: "clr-secondary", bg: "bg-clr-secondary-10" },
              ].map((habit, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${habit.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${habit.color} text-2xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{habit.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-semibold clr-text-primary">{habit.name}</p>
                    <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary">{habit.streak} day streak</p>
                  </div>
                  <span className="material-symbols-outlined clr-text-secondary text-xl">chevron_right</span>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ ROW 3: Money Summary — 6 col, Quick Actions — 6 col (2×3 grid) ═══ */}

          {/* Money Summary — span 6 */}
          <section className="clay-card p-[24px] lg:col-span-6">
            <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary mb-4">
              Money Summary
            </h4>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-clr-primary rounded-2xl flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                </div>
                <div>
                  <p className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium clr-text-secondary">Balance</p>
                  <p className="font-[Plus Jakarta Sans] text-[26px] leading-[32px] font-bold clr-text-primary">Rp 5.230.000</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="font-[Plus Jakarta Sans] text-[11px] leading-[14px] font-medium clr-text-secondary">Income</p>
                  <p className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-bold clr-success">Rp 0</p>
                </div>
                <div className="w-px h-8 bg-clr-divider-soft" />
                <div className="text-center">
                  <p className="font-[Plus Jakarta Sans] text-[11px] leading-[14px] font-medium clr-text-secondary">Expense</p>
                  <p className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-bold clr-danger">Rp 105k</p>
                </div>
                <div className="w-px h-8 bg-clr-divider-soft" />
                <div className="text-center">
                  <p className="font-[Plus Jakarta Sans] text-[11px] leading-[14px] font-medium clr-text-secondary">Net</p>
                  <p className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-bold clr-danger">-105k</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions — span 6 (2×3 grid) */}
          <section className="clay-card p-[24px] lg:col-span-6">
            <h4 className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold clr-text-primary mb-4">
              Quick Actions
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: "play_arrow", label: "Start Activity", color: "clr-primary", path: "/activity" },
                { icon: "task_alt", label: "Add Task", color: "clr-success", path: "/tasks" },
                { icon: "event", label: "Add Event", color: "clr-primary", path: "/planner" },
                { icon: "payments", label: "Add Transaction", color: "clr-danger", path: "/money" },
                { icon: "note_add", label: "Capture Note", color: "clr-secondary", path: "/inbox" },
                { icon: "mail", label: "Open Inbox", color: "clr-text-primary", path: "/inbox" },
              ].map((act, idx) => (
                <button key={idx} onClick={() => navigate(act.path)} className="flex flex-col items-center gap-2 group">
                  <div className={`clay-button w-full aspect-square max-w-[56px] flex items-center justify-center rounded-2xl bg-clr-surface-white dark:bg-clr-surface-container-high ${act.color} group-hover:scale-110 transition-transform mx-auto`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{act.icon}</span>
                  </div>
                  <span className="font-[Plus Jakarta Sans] text-[11px] leading-[14px] font-semibold text-center clr-text-secondary">{act.label}</span>
                </button>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
