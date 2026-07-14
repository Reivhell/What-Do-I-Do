import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-clr-background clr-on-surface">
      {/* Desktop sidebar — fixed */}
      <Sidebar />

      {/* Main content */}
      <main className="ml-[230px] flex-1 min-w-0 p-8 max-lg:ml-0 max-lg:pb-24 max-lg:p-4">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
