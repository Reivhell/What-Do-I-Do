import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  usePresetsList,
  useActivePreset,
  useWidgetConfig,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
  useActivatePreset,
  useResetDefault,
} from '../api/workspace';
import type { LayoutPreset, WidgetConfigItem, WidgetType } from '@whatdo/shared';

const WIDGET_ICONS: Record<WidgetType, string> = {
  current_activity: 'code',
  planner_preview: 'calendar_today',
  tasks_preview: 'task_alt',
  habit_streak: 'local_fire_department',
  money_summary: 'account_balance_wallet',
  weekly_chart: 'show_chart',
  insights: 'lightbulb',
  notes: 'note_add',
  quick_actions: 'flash_on',
};

const WIDGET_LABELS: Record<WidgetType, string> = {
  current_activity: 'Current Activity',
  planner_preview: 'Planner Preview',
  tasks_preview: 'Tasks Preview',
  habit_streak: 'Habit Streak',
  money_summary: 'Money Summary',
  weekly_chart: 'Weekly Chart',
  insights: 'Insights',
  notes: 'Notes',
  quick_actions: 'Quick Actions',
};

export function WorkspacePage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<LayoutPreset | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfigItem[]>([]);

  const { data: presets = [], isLoading: presetsLoading } = usePresetsList();
  const { data: activePreset } = useActivePreset();
  const { data: activeWidgetConfig } = useWidgetConfig();
  const createPreset = useCreatePreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();
  const activatePreset = useActivatePreset();
  const resetDefault = useResetDefault();

  // Initialize widget config from active preset
  if (widgetConfig.length === 0 && activeWidgetConfig) {
    setWidgetConfig([...activeWidgetConfig].sort((a, b) => a.position - b.position));
  }

  const handleToggleVisibility = (widgetType: WidgetType) => {
    setWidgetConfig(prev => prev.map(w =>
      w.widgetType === widgetType ? { ...w, visible: !w.visible } : w
    ));
  };

  const handleTogglePin = (widgetType: WidgetType) => {
    setWidgetConfig(prev => prev.map(w =>
      w.widgetType === widgetType ? { ...w, pinned: !w.pinned } : w
    ));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setWidgetConfig(prev => {
      const newConfig = [...prev];
      const [removed] = newConfig.splice(fromIndex, 1);
      newConfig.splice(toIndex, 0, removed);
      return newConfig.map((w, i) => ({ ...w, position: i }));
    });
  };

  const handleSaveConfig = async () => {
    if (editingPreset) {
      await updatePreset.mutateAsync({
        id: editingPreset.id,
        widgetConfig: widgetConfig.map((w, i) => ({ ...w, position: i })),
      });
      setEditingPreset(null);
    }
  };

  const handleCreatePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    await createPreset.mutateAsync({
      name: newPresetName.trim(),
      widgetConfig: widgetConfig.map((w, i) => ({ ...w, position: i })),
    });
    setShowCreateModal(false);
    setNewPresetName('');
  };

  const handleActivate = async (id: string) => {
    await activatePreset.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this preset?')) return;
    await deletePreset.mutateAsync(id);
  };

  const handleResetDefault = async () => {
    if (!confirm('Reset to default layout? This will delete all presets.')) return;
    await resetDefault.mutateAsync();
  };

  const handleEditPreset = (preset: LayoutPreset) => {
    setEditingPreset(preset);
    setWidgetConfig([...preset.widgetConfig].sort((a, b) => a.position - b.position));
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[var(--clay-surface)] dark:bg-[var(--clay-surface-alt)] clay-card-inset h-screen border-r border-[var(--ink-300)] flex flex-col">
        <div className="p-4 border-b border-[var(--ink-300)]">
          <h2 className="font-display text-lg font-semibold text-[var(--ink-900)]">Workspace</h2>
          <p className="font-body text-sm text-[var(--ink-500)] mt-1">
            Manage dashboard layouts
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full clay-l1 bg-[var(--blue-500)] text-[var(--clay-surface)] rounded-xl px-4 py-3 flex items-center gap-3 font-body text-sm font-medium"
          >
            <span className="material-symbols-outlined">add</span>
            New Preset
          </button>

          <div className="pt-2 border-t border-[var(--ink-300)]" />
          <h3 className="font-body text-xs font-medium text-[var(--ink-500)] uppercase tracking-wider px-2">
            Saved Presets
          </h3>

          {presetsLoading ? (
            <div className="flex items-center justify-center py-8 text-[var(--ink-500)]">
              <span className="material-symbols-outlined animate-spin">refresh</span>
            </div>
          ) : presets.length === 0 ? (
            <div className="py-8 text-center text-[var(--ink-500)] text-sm">
              No presets yet. Create one to get started.
            </div>
          ) : (
            <ul className="space-y-2">
              {presets.map(preset => (
                <li key={preset.id} className={`relative clay-card ${preset.isActive ? 'border-2 border-[var(--blue-500)]' : ''}`}>
                  <button
                    onClick={() => handleActivate(preset.id)}
                    className="w-full text-left p-4 flex items-center gap-3"
                    disabled={preset.isActive}
                  >
                    <span className={`material-symbols-outlined ${preset.isActive ? 'text-[var(--blue-500)]' : 'text-[var(--ink-500)]'}`}>
                      {preset.isActive ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <span className="font-body text-sm font-medium text-[var(--ink-900)] flex-1 truncate">
                      {preset.name}
                    </span>
                    <span className="font-body text-xs text-[var(--ink-500)]">
                      {preset.widgetConfig.filter(w => w.visible).length} widgets
                    </span>
                  </button>

                  {!preset.isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditPreset(preset); }}
                        className="clay-l1 bg-[var(--clay-surface)] dark:bg-[var(--clay-surface-alt)] p-2 rounded-lg text-[var(--ink-500)] hover:text-[var(--blue-500)]"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(preset.id); }}
                        className="clay-l1 bg-[var(--clay-surface)] dark:bg-[var(--clay-surface-alt)] p-2 rounded-lg text-[var(--ink-500)] hover:text-[var(--semantic-red)]"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="pt-4 border-t border-[var(--ink-300)]">
            <button
              onClick={handleResetDefault}
              className="w-full clay-l1 bg-[var(--clay-surface)] dark:bg-[var(--clay-surface-alt)] rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-body text-sm font-medium text-[var(--semantic-red)] hover:bg-[color-mix(in_srgb,var(--semantic-red)_10%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--semantic-red)_10%,transparent)]"
            >
              <span className="material-symbols-outlined">restore</span>
              Reset to Default
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 bg-[var(--clay-bg)] text-[var(--ink-900)] overflow-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink-900)]">
            Layout Editor
          </h1>
          <p className="font-body text-base text-[var(--ink-500)] mt-1">
            Drag to reorder, toggle visibility, pin widgets to keep them fixed
          </p>
        </header>

        {editingPreset && (
          <div className="mb-6 clay-card bg-[var(--blue-50)] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--blue-500)]">edit</span>
              <span className="font-body text-lg font-semibold text-[var(--ink-900)]">
                Editing: {editingPreset.name}
              </span>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={updatePreset.isPending}
              className="clay-l1 bg-[var(--blue-500)] text-[var(--clay-surface)] rounded-full px-6 py-2 font-body text-sm font-medium"
            >
              {updatePreset.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgetConfig.map((widget, index) => (
            <WidgetCard
              key={widget.widgetType}
              widget={widget}
              index={index}
              isEditing={!!editingPreset}
              onToggleVisibility={handleToggleVisibility}
              onTogglePin={handleTogglePin}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                handleReorder(fromIndex, index);
              }}
            />
          ))}
        </div>

        {!editingPreset && widgetConfig.length > 0 && (
          <div className="mt-8 clay-card p-6 rounded-2xl">
            <h3 className="font-display text-lg font-semibold text-[var(--ink-900)] mb-4">
              Current Active Layout
            </h3>
            <p className="font-body text-sm text-[var(--ink-500)] mb-4">
              {activePreset?.name || 'Default Layout'} — {widgetConfig.filter(w => w.visible).length} visible widgets
            </p>
            <div className="flex flex-wrap gap-2">
              {widgetConfig.filter(w => w.visible).map((w, i) => (
                <span key={w.widgetType} className="clay-l1 bg-[var(--clay-surface)] dark:bg-[var(--clay-surface-alt)] rounded-full px-3 py-1.5 text-sm font-body text-[var(--ink-500)]">
                  {i + 1}. {WIDGET_LABELS[w.widgetType]}
                  {w.pinned && <span className="material-symbols-outlined text-xs ml-1 align-middle">push_pin</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface WidgetCardProps {
  widget: WidgetConfigItem;
  index: number;
  isEditing: boolean;
  onToggleVisibility: (type: WidgetType) => void;
  onTogglePin: (type: WidgetType) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function WidgetCard({
  widget,
  index,
  isEditing,
  onToggleVisibility,
  onTogglePin,
  onDragStart,
  onDragOver,
  onDrop,
}: WidgetCardProps) {
  const isVisible = widget.visible;
  const isPinned = widget.pinned;

  return (
    <div
      className={`clay-card rounded-2xl p-5 transition-all duration-200 ${
        !isVisible ? 'opacity-40 bg-[var(--clay-surface-alt)]' : ''
      } ${isPinned ? 'ring-2 ring-[var(--blue-500)]' : ''} ${isEditing ? 'cursor-grab' : ''}`}
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`clay-l1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVisible ? 'bg-[var(--blue-50)] text-[var(--blue-500)]' : 'bg-[var(--clay-surface)] dark:bg-[var(--clay-surface-alt)] text-[var(--ink-500)]'}`}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {WIDGET_ICONS[widget.widgetType]}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="font-display text-base font-semibold text-[var(--ink-900)] truncate">
              {WIDGET_LABELS[widget.widgetType]}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`font-body text-xs ${isVisible ? 'text-[var(--semantic-green)]' : 'text-[var(--ink-500)]'}`}>
                {isVisible ? 'Visible' : 'Hidden'}
              </span>
              {isPinned && (
                <span className="clay-l1 bg-[var(--blue-50)] text-[var(--blue-500)] rounded-full px-2 py-0.5 text-xs font-body font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">push_pin</span>
                  Pinned
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isEditing && (
            <span className="material-symbols-outlined text-[var(--ink-500)] cursor-grab hover:text-[var(--ink-900)]" title="Drag to reorder">
              drag_indicator
            </span>
          )}
          <button
            onClick={() => onToggleVisibility(widget.widgetType)}
            className={`p-2 rounded-lg clay-l1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${
              isVisible
                ? 'bg-[var(--blue-50)] text-[var(--blue-500)]'
                : 'bg-[var(--clay-surface)] text-[var(--ink-500)]'
            }`}
            title={isVisible ? 'Hide widget' : 'Show widget'}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isVisible ? 'visibility' : 'visibility_off'}
            </span>
          </button>
          <button
            onClick={() => onTogglePin(widget.widgetType)}
            className={`p-2 rounded-lg clay-l1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${
              isPinned
                ? 'bg-[var(--blue-50)] text-[var(--blue-500)]'
                : 'bg-[var(--clay-surface)] text-[var(--ink-500)]'
            }`}
            title={isPinned ? 'Unpin widget' : 'Pin widget'}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPinned ? 'push_pin' : 'push_pin'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}