import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppShell } from "./components/layout";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { Dashboard } from "./pages/Dashboard";
import { InboxPage } from "./pages/Inbox";
import { ActivityTrackerPage } from "./pages/ActivityTracker";
import PlannerPage from "./pages/Planner";
import { GoalsPage } from "./pages/Goals";
import { TasksPage } from "./pages/Tasks";
import { MoneyPage } from "./pages/Money";
import { LifeLogPage } from "./pages/LifeLog";
import { HabitsPage } from "./pages/Habits";
import { StatisticsPage } from "./pages/Statistics";
import { AnalyticsPage } from "./pages/Analytics";
import { SettingsPage } from "./pages/Settings";
import { AchievementsPage } from "./pages/Achievements";
import { InsightsPage } from "./pages/Insights";
import { WorkspacePage } from "./pages/Workspace";

function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { unlock } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (lockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
        if (remaining === 0) {
          setLockedUntil(null);
          setAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || lockedUntil) return;
    setLoading(true);
    setError('');

    const success = await unlock(pin);
    if (success) {
      onUnlock();
      setPin('');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');

      if (newAttempts >= 3) {
        const lockUntil = Date.now() + 30 * 1000;
        setLockedUntil(lockUntil);
        setError('Too many failed attempts. Locked for 30 seconds.');
      } else {
        setError(`Incorrect PIN. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm clay-surface">
      <div className="w-full max-w-sm clay-surface p-6 rounded-2xl clay-shadow-strong">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full clay-inset mb-4">
            <svg className="size-8 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink-900">App Locked</h1>
          <p className="text-sm text-ink-500 mt-1">Enter your PIN to unlock</p>
        </div>

        {lockedUntil && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 clay-inset">
            <div className="flex items-center gap-2 text-amber-700">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">Locked for {Math.ceil((lockedUntil - Date.now()) / 1000)}s</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 clay-inset" role="alert">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleUnlock}>
          <div className="relative mb-6">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              inputMode="numeric"
              maxLength={6}
              disabled={loading || lockedUntil !== null}
              className="w-full text-center text-3xl tracking-widest font-mono clay-inset py-3 rounded-lg"
              aria-label="PIN code"
              autoComplete="one-time-code"
              onKeyDown={(e) => e.key === 'Enter' && !loading && !lockedUntil && handleUnlock(e)}
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex gap-2 pointer-events-none" aria-hidden="true">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${i < pin.length ? 'bg-ink-600' : 'bg-ink-200'}`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4 || lockedUntil !== null}
            className="w-full clay-btn clay-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-ink-100">
          <button
            onClick={() => {
              if (confirm('This will delete ALL your data. Are you sure?')) {
                fetch('/api/settings/pin/forgot', { method: 'POST' });
              }
            }}
            className="w-full text-sm text-ink-500 hover:text-red-600 flex items-center justify-center gap-2"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Forgot PIN? Reset all data
          </button>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { locked, checkPinSettings, pinSettings } = useAuth();
  const [showPinLock, setShowPinLock] = useState(false);

  useEffect(() => {
    checkPinSettings();
    if (pinSettings.enabled) {
      setShowPinLock(true);
    }
  }, [checkPinSettings, pinSettings.enabled]);

  if (showPinLock && pinSettings.enabled) {
    return <PinLockScreen onUnlock={() => setShowPinLock(false)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route element={<AppShell />}>
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/activity" element={<ActivityTrackerPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/life-log" element={<LifeLogPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}