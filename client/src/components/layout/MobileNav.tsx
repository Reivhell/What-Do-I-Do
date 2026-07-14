import { NavLink } from "react-router-dom";

const mobileItems = [
  { label: "Home", path: "/", icon: "dashboard" },
  { label: "Inbox", path: "/inbox", icon: "inbox" },
  { label: "Activity", path: "/activity", icon: "play_circle" },
  { label: "Planner", path: "/planner", icon: "calendar_month" },
  { label: "Tasks", path: "/tasks", icon: "check_box" },
  { label: "Money", path: "/money", icon: "account_balance_wallet" },
  { label: "Settings", path: "/settings", icon: "settings" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 rounded-t-[--radius-lg] bg-clay-surface px-2 pb-safe clay-l2 lg:hidden">
      <div className="flex items-center justify-around py-2">
        {mobileItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `tap-target flex flex-col items-center gap-0.5 rounded-[--radius-md] px-3 py-1.5 font-[Plus Jakarta Sans] text-[11px] font-medium clay-transition ${
                isActive
                  ? "clr-primary"
                  : "clr-text-secondary"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
