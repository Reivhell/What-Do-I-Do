import { NavLink } from "react-router-dom";

const mobileItems = [
  { label: "Home", path: "/", icon: "dashboard" },
  { label: "Inbox", path: "/inbox", icon: "inbox" },
  { label: "Planner", path: "/planner", icon: "calendar_month" },
  { label: "Activity", path: "/activity", icon: "play_circle" },
  { label: "Tasks", path: "/tasks", icon: "check_box" },
  { label: "Habits", path: "/habits", icon: "local_fire_department" },
  { label: "Goals", path: "/goals", icon: "target" },
  { label: "Money", path: "/money", icon: "account_balance_wallet" },
  { label: "Log", path: "/life-log", icon: "bar_chart" },
  { label: "Analytics", path: "/analytics", icon: "analytics" },
  { label: "Stats", path: "/statistics", icon: "pie_chart" },
  { label: "Achievements", path: "/achievements", icon: "emoji_events" },
  { label: "Insights", path: "/insights", icon: "lightbulb" },
  { label: "Workspace", path: "/workspace", icon: "view_quilt" },
  { label: "Settings", path: "/settings", icon: "settings" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 rounded-t-[--radius-lg] bg-clay-surface clay-l2 lg:hidden safe-bottom">
      <div className="scrollable-x flex items-center gap-1 px-2 py-2">
        {mobileItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `tap-target flex flex-col items-center gap-0.5 rounded-[--radius-md] px-2.5 py-1 font-body text-[10px] font-medium clay-transition whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-blue-500/10 clr-primary"
                  : "clr-text-secondary"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
