import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout";
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
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { AchievementsPage } from "./pages/Achievements";

export default function App() {
  return (
    <Routes>
      {/* Dashboard uses its own sidebar (1:1 from Dasboard.html) */}
      <Route path="/" element={<Dashboard />} />
      {/* Other pages use standard AppShell layout */}
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
        <Route path="/insights" element={<PlaceholderPage title="Insights" />} />
        <Route path="/workspace" element={<PlaceholderPage title="Workspace" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Route>
    </Routes>
  );
}
