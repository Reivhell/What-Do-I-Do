import { useLocation, Link } from "react-router-dom";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: "dashboard" },
  { label: "Inbox / Capture", path: "/inbox", icon: "inbox" },
  { label: "Planner", path: "/planner", icon: "calendar_month" },
  { label: "Activity Tracker", path: "/activity", icon: "play_circle" },
  { label: "Tasks", path: "/tasks", icon: "check_box" },
  { label: "Habits", path: "/habits", icon: "local_fire_department" },
  { label: "Goals", path: "/goals", icon: "target" },
  { label: "Money", path: "/money", icon: "account_balance_wallet" },
  { label: "Life Log", path: "/life-log", icon: "bar_chart" },
  { label: "Analytics", path: "/analytics", icon: "analytics" },
  { label: "Statistics", path: "/statistics", icon: "pie_chart" },
  { label: "Achievements", path: "/achievements", icon: "emoji_events" },
  { label: "Insights", path: "/insights", icon: "lightbulb" },
  { label: "Workspace", path: "/workspace", icon: "view_quilt" },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <aside className="w-[230px] h-screen fixed left-0 top-0 rounded-r-[32px] flex flex-col py-6 px-4 gap-2 z-50 overflow-y-auto bg-clay-surface clay-l2 max-lg:hidden">
      {/* Logo */}
      <div className="mb-6 px-4">
        <h1 className="font-display text-[24px] leading-[32px] font-bold clr-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
          What Do I Do
        </h1>
        <p className="font-body text-[12px] leading-[16px] font-medium clr-text-secondary">Productivity Tracker</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-body text-[13px] leading-[18px] font-medium ${
                active
                  ? "bg-clr-primary clr-on-primary shadow-lg scale-[1.02]"
                  : "clr-on-surface-variant hover:clr-primary dark:hover:text-white hover:bg-clr-surface-container-high dark:hover:bg-clr-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto space-y-4">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-body text-[13px] leading-[18px] font-medium ${
            location.pathname === "/settings"
              ? "bg-clr-primary clr-on-primary shadow-lg scale-[1.02]"
              : "clr-on-surface-variant hover:clr-primary dark:hover:text-white hover:bg-clr-surface-container-high dark:hover:bg-clr-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>

        <div className="clay-card p-5 relative overflow-hidden bg-gradient-to-br from-white to-[var(--clay-surface-alt)] dark:from-[var(--clay-surface)] dark:to-[var(--clay-surface-alt)]">
          <div className="relative z-10">
            <span className="material-symbols-outlined clr-primary text-2xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
              stars
            </span>
            <h4 className="font-display text-[16px] leading-[24px] font-semibold clr-text-primary">Keep it up!</h4>
            <p className="font-body text-[12px] leading-[16px] font-medium clr-text-secondary mt-1">
              You're doing great today.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
            <svg className="w-full h-full clr-primary fill-current" viewBox="0 0 100 20">
              <path d="M0 20V10C20 0 30 20 50 10C70 0 80 20 100 10V20H0Z" />
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}
