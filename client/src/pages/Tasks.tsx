import { useSearchParams } from 'react-router-dom';
import { ListChecks, Plus } from 'lucide-react';
import { TaskList } from '../components/tasks/TaskList';
import type { TaskView } from '../types/tasks';

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as TaskView) || 'inbox';

  const handleViewChange = (newView: TaskView) => {
    setSearchParams({ view: newView });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Tasks</h1>
            <p className="font-body text-[15px] text-ink-500 mt-1">
              Manage your tasks without scheduling — schedule to Planner when ready.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-[--radius-pill] bg-blue-500 px-5 py-2.5 font-body text-sm font-semibold text-white clay-l1 hover:clay-l2 active:clay-pressed">
            <Plus className="size-4" />
            Capture
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">
        <TaskList view={view} onViewChange={handleViewChange} />
      </div>
    </div>
  );
}
