import { useSearchParams } from 'react-router-dom';
import { ListChecks, Plus } from 'lucide-react';
import { TaskList } from '../components/tasks/TaskList';
import { Button, Card } from '../components/ui';
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
            <h1 className="font-display text-2xl font-bold text-[var(--ink-900)]">Tasks</h1>
            <p className="font-body text-[15px] text-[var(--ink-500)] mt-1">
              Manage your tasks without scheduling — schedule to Planner when ready.
            </p>
          </div>
          <Button variant="primary" size="md">
            <Plus className="size-4" />
            Capture
          </Button>
        </div>
      </div>

      {/* Task List */}
      <Card level={1} className="p-5">
        <TaskList view={view} onViewChange={handleViewChange} />
      </Card>
    </div>
  );
}
