import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-clay-bg clr-on-surface">
      {/* Desktop & Tablet sidebar — drawer on tablet, always visible on desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Hamburger — tablet only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 tap-target clr-text-secondary hover:clr-primary bg-clay-surface clay-l1 rounded-xl p-2.5 hidden md:flex lg:hidden"
        aria-label="Open sidebar"
      >
        <span className="material-symbols-outlined text-xl">menu</span>
      </button>

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-[230px] p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="content-container">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
