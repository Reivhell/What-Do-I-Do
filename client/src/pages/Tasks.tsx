import { useSearchParams } from 'react-router-dom';
import { TaskList } from '../components/tasks/TaskList';

export function TasksPage() {
  const [searchParams] = useSearchParams();
  const view = (searchParams.get('view') as 'inbox' | 'today' | 'upcoming' | 'completed') || 'inbox';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold clr-text-primary flex items-center gap-3">
              <span className="clr-primary">📋</span>
              Tasks
            </h1>
            <p className="font-body text-[15px] clr-text-secondary mt-1">
              Manage your tasks without scheduling — schedule to Planner when ready.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-full bg-clr-primary clr-on-primary px-6 py-3 font-body text-sm font-semibold clay-button">
            <span>+</span>
            Capture
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="clay-card p-6">
        <TaskList view={view} />
      </div>
    </div>
  );
}
