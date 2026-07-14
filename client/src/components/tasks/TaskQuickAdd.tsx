import { useState, type FormEvent } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { useCreateTask } from '../../api/tasks';
import type { CreateTaskInput } from '../../types/tasks';

interface TaskQuickAddProps {
  defaultView?: string;
  onTaskCreated?: () => void;
}

export function TaskQuickAdd({ defaultView, onTaskCreated }: TaskQuickAddProps) {
  const [title, setTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const createTask = useCreateTask();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || createTask.isPending) return;

    const input: CreateTaskInput = {
      title: trimmed,
    };

    createTask.mutate(input, {
      onSuccess: () => {
        setTitle('');
        setExpanded(false);
        setShowDetails(false);
        onTaskCreated?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full clay-card-inset rounded-[--radius-lg] px-5 py-4 text-left font-body text-[15px] text-ink-500 hover:text-ink-900 clay-transition focus:outline-none focus:ring-4 focus:ring-blue-50"
          disabled={createTask.isPending}
        >
          <span className="flex items-center gap-3">
            <Plus className="size-5 text-ink-300 shrink-0" />
            Add a task...
          </span>
        </button>
      ) : (
        <div className="space-y-3 clay-card p-4 clay-l2">
          <div className="relative">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-300 clay-inset clay-transition ring-0 focus:outline-none focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {showDetails && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <textarea
                placeholder="Description (optional)"
                className="w-full min-h-[80px] rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[14px] text-ink-900 placeholder:text-ink-300 clay-inset clay-transition ring-0 focus:outline-none focus:ring-4 focus:ring-blue-50 resize-none"
              />
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 tap-target rounded-[--radius-md] px-3 py-1.5 text-[12px] font-medium text-ink-500 hover:bg-blue-50 hover:text-blue-700 clay-transition cursor-pointer">
                  <input type="checkbox" className="size-4 accent-blue-500" />
                  <span>High priority</span>
                </label>
                <label className="flex items-center gap-1.5 tap-target rounded-[--radius-md] px-3 py-1.5 text-[12px] font-medium text-ink-500 hover:bg-blue-50 hover:text-blue-700 clay-transition cursor-pointer">
                  <input type="checkbox" className="size-4 accent-blue-500" />
                  <span>Add due date</span>
                </label>
                <label className="flex items-center gap-1.5 tap-target rounded-[--radius-md] px-3 py-1.5 text-[12px] font-medium text-ink-500 hover:bg-blue-50 hover:text-blue-700 clay-transition cursor-pointer">
                  <input type="checkbox" className="size-4 accent-blue-500" />
                  <span>Add tags</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setTitle('');
                setShowDetails(false);
              }}
              className="tap-target rounded-[--radius-md] px-4 py-2 font-body text-[13px] font-medium text-ink-500 hover:text-ink-900 clay-transition"
            >
              Cancel
            </button>
            {!showDetails ? (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="tap-target rounded-[--radius-md] px-4 py-2 font-body text-[13px] font-medium text-blue-600 hover:bg-blue-50 clay-transition"
              >
                Add details
              </button>
            ) : (
              <button
                type="submit"
                disabled={!title.trim() || createTask.isPending}
                className="tap-target rounded-[--radius-md] bg-blue-500 px-4 py-2 font-body text-[13px] font-semibold text-white clay-l1 hover:clay-l2 active:clay-pressed clay-transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createTask.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Add task'
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}