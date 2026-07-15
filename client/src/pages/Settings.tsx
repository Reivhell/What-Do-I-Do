import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  Settings, User, Bell, Tag, Download, Upload, Plus, Trash2,
  Loader2, Info,
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, Input, Select, Toggle,
  Button, Modal, EmptyState,
} from '../components/ui';
import {
  useProfile, useUpdateProfile,
  usePreferences, useUpdatePreferences,
  useNotifications, useUpdateNotifications,
  useCategories, useCreateCategory, useDeleteCategory,
  useExport, useImport,
} from '../api/settings';
import { useTheme } from '../providers/ThemeProvider';
import { useQueryClient } from '@tanstack/react-query';
import type { CategoryDomain, CategoryDefinition } from '@whatdo/shared';

/* ── Option arrays ── */

const THEME_OPTS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const LANG_OPTS = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
];
const CURRENCY_OPTS = [
  { value: 'IDR', label: 'IDR (Rp)' },
  { value: 'USD', label: 'USD ($)' },
];
const TIMEZONE_OPTS = [
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT)' },
];
const DATE_FMT_OPTS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];
const TIME_FMT_OPTS = [
  { value: '24h', label: '24-hour' },
  { value: '12h', label: '12-hour' },
];

const DOMAIN_OPTS = [
  { value: 'activity', label: 'Activity' },
  { value: 'task', label: 'Task' },
  { value: 'money', label: 'Money' },
];

/* ── Reusable section helpers ── */

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="size-6 animate-spin text-ink-400" />
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card level={1} className="scroll-mt-20">
      <p className="font-body text-[15px] text-semantic-red">{message}</p>
    </Card>
  );
}

/* ── Profile Section ── */

function ProfileSection() {
  const { data, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({ name: '', email: '', avatarUrl: '', bio: '' });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? '',
      email: data.email ?? '',
      avatarUrl: data.avatarUrl ?? '',
      bio: data.bio ?? '',
    });
  }, [data]);

  if (isLoading) return <Card level={1} className="scroll-mt-20" id="profile"><SectionLoader /></Card>;
  if (error) return <div id="profile" className="scroll-mt-20"><ErrorCard message="Gagal memuat data profil." /></div>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      name: form.name,
      email: form.email,
      avatarUrl: form.avatarUrl || null,
      bio: form.bio || null,
    });
  };

  return (
    <Card level={1} className="scroll-mt-20" id="profile">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="size-5 text-ink-500" />
          <CardTitle>Profile</CardTitle>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <Input
          label="Avatar URL"
          value={form.avatarUrl}
          onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
        />
        <Input
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
        />
        {updateProfile.error && (
          <p className="font-body text-[13px] text-semantic-red">Gagal menyimpan profil. Coba lagi.</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Preferences Section ── */

function PreferencesSection() {
  const { data, isLoading, error } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const { setTheme } = useTheme();
  const [prefs, setPrefs] = useState({
    theme: 'light',
    language: 'id',
    currency: 'IDR',
    timezone: 'Asia/Makassar',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  });

  useEffect(() => {
    if (!data) return;
    setPrefs({
      theme: data.theme ?? 'light',
      language: data.language ?? 'id',
      currency: data.currency ?? 'IDR',
      timezone: data.timezone ?? 'Asia/Makassar',
      dateFormat: data.dateFormat ?? 'DD/MM/YYYY',
      timeFormat: data.timeFormat ?? '24h',
    });
  }, [data]);

  if (isLoading) return <Card level={1} className="scroll-mt-20" id="preferences"><SectionLoader /></Card>;
  if (error) return <div id="preferences" className="scroll-mt-20"><ErrorCard message="Gagal memuat preferensi." /></div>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updatePrefs.mutate(prefs, {
      onSuccess: () => setTheme(prefs.theme as 'light' | 'dark'),
    });
  };

  return (
    <Card level={1} className="scroll-mt-20" id="preferences">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-ink-500" />
          <CardTitle>Preferences</CardTitle>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Theme"
            options={THEME_OPTS}
            value={prefs.theme}
            onChange={(e) => setPrefs((p) => ({ ...p, theme: e.target.value }))}
          />
          <Select
            label="Language"
            options={LANG_OPTS}
            value={prefs.language}
            onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
          />
          <Select
            label="Currency"
            options={CURRENCY_OPTS}
            value={prefs.currency}
            onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Timezone"
            options={TIMEZONE_OPTS}
            value={prefs.timezone}
            onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}
          />
          <Select
            label="Date Format"
            options={DATE_FMT_OPTS}
            value={prefs.dateFormat}
            onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))}
          />
          <Select
            label="Time Format"
            options={TIME_FMT_OPTS}
            value={prefs.timeFormat}
            onChange={(e) => setPrefs((p) => ({ ...p, timeFormat: e.target.value }))}
          />
        </div>
        {updatePrefs.error && (
          <p className="font-body text-[13px] text-semantic-red">Gagal menyimpan preferensi. Coba lagi.</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={updatePrefs.isPending}>
            {updatePrefs.isPending && <Loader2 className="size-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Notifications Section ── */

function NotificationsSection() {
  const { data, isLoading, error } = useNotifications();
  const updateNotif = useUpdateNotifications();
  const [notif, setNotif] = useState({
    plannerReminderEnabled: true,
    habitReminderEnabled: true,
    budgetAlertEnabled: true,
    goalReminderEnabled: true,
    achievementAlertEnabled: true,
  });

  useEffect(() => {
    if (!data) return;
    setNotif({
      plannerReminderEnabled: data.plannerReminderEnabled ?? true,
      habitReminderEnabled: data.habitReminderEnabled ?? true,
      budgetAlertEnabled: data.budgetAlertEnabled ?? true,
      goalReminderEnabled: data.goalReminderEnabled ?? true,
      achievementAlertEnabled: data.achievementAlertEnabled ?? true,
    });
  }, [data]);

  if (isLoading) return <Card level={1} className="scroll-mt-20" id="notifications"><SectionLoader /></Card>;
  if (error) return <div id="notifications" className="scroll-mt-20"><ErrorCard message="Gagal memuat pengaturan notifikasi." /></div>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateNotif.mutate(notif);
  };

  const toggleFields = [
    { key: 'plannerReminderEnabled' as const, label: 'Planner Reminders' },
    { key: 'habitReminderEnabled' as const, label: 'Habit Reminders' },
    { key: 'budgetAlertEnabled' as const, label: 'Budget Alerts' },
    { key: 'goalReminderEnabled' as const, label: 'Goal Reminders' },
    { key: 'achievementAlertEnabled' as const, label: 'Achievement Alerts' },
  ];

  return (
    <Card level={1} className="scroll-mt-20" id="notifications">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-ink-500" />
          <CardTitle>Notifications</CardTitle>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {toggleFields.map(({ key, label }) => (
          <Toggle
            key={key}
            label={label}
            checked={notif[key]}
            onChange={(e) => setNotif((p) => ({ ...p, [key]: e.target.checked }))}
          />
        ))}
        {updateNotif.error && (
          <p className="font-body text-[13px] text-semantic-red">Gagal menyimpan notifikasi. Coba lagi.</p>
        )}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={updateNotif.isPending}>
            {updateNotif.isPending && <Loader2 className="size-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Categories Section ── */

function CategoriesSection() {
  const [domainFilter, setDomainFilter] = useState<CategoryDomain | undefined>(undefined);
  const { data: categories, isLoading, error } = useCategories(domainFilter);
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [modalOpen, setModalOpen] = useState(false);
  const [newCat, setNewCat] = useState<{ domain: CategoryDomain; name: string; color: string }>({
    domain: 'activity',
    name: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    if (modalOpen) {
      setNewCat({ domain: 'activity', name: '', color: '#3B82F6' });
    }
  }, [modalOpen]);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    createCategory.mutate(newCat, {
      onSuccess: () => setModalOpen(false),
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Hapus kategori "${name}"?`)) return;
    deleteCategory.mutate(id);
  };

  const filterBtns: { key: CategoryDomain | undefined; label: string }[] = [
    { key: undefined, label: 'All' },
    { key: 'activity', label: 'Activity' },
    { key: 'task', label: 'Task' },
    { key: 'money', label: 'Money' },
  ];

  return (
    <Card level={1} className="scroll-mt-20" id="categories">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tag className="size-5 text-ink-500" />
          <CardTitle>Categories</CardTitle>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </CardHeader>

      {/* Domain filter pills */}
      <div className="mb-4 flex gap-1">
        {filterBtns.map(({ key, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => setDomainFilter(key)}
            className={`tap-target clay-transition rounded-[--radius-md] px-3 py-1.5 font-body text-[13px] font-semibold ${
              domainFilter === key
                ? 'bg-blue-500 text-white'
                : 'bg-clay-surface-alt text-ink-500 hover:text-ink-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SectionLoader />
      ) : error ? (
        <p className="font-body text-[15px] text-semantic-red">Gagal memuat kategori.</p>
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={<Tag className="size-8" />}
          title="Belum ada kategori"
          description="Tambahkan kategori untuk mengatur aktivitas, tugas, dan pengeluaran."
          action={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              Add Category
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-[--radius-md] bg-clay-surface-alt px-4 py-2.5 clay-inset"
            >
              <span
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 font-body text-[15px] text-ink-900">{cat.name}</span>
              <span className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-400">
                {cat.domain}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(cat.id, cat.name)}
                className="tap-target rounded-[--radius-sm] p-1.5 text-ink-400 hover:bg-semantic-red/10 hover:text-semantic-red clay-transition"
                aria-label={`Hapus ${cat.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Category">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Select
            label="Domain"
            options={DOMAIN_OPTS}
            value={newCat.domain}
            onChange={(e) => setNewCat((p) => ({ ...p, domain: e.target.value as CategoryDomain }))}
          />
          <Input
            label="Name"
            value={newCat.name}
            onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Work, Groceries, Reading"
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">
              Color
            </label>
            <input
              type="color"
              value={newCat.color}
              onChange={(e) => setNewCat((p) => ({ ...p, color: e.target.value }))}
              className="h-10 w-full cursor-pointer rounded-[--radius-md] border-0 bg-clay-surface-alt p-1 clay-inset"
            />
          </div>
          {createCategory.error && (
            <p className="font-body text-[13px] text-semantic-red">Gagal membuat kategori. Coba lagi.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newCat.name.trim() || createCategory.isPending}>
              {createCategory.isPending && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ── Backup Section ── */

function BackupSection() {
  const exportMutation = useExport();
  const importMutation = useImport();
  const importRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExportJSON = () => {
    exportMutation.mutate(undefined, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `what-do-i-do-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  const handleImportClick = () => {
    setImportResult(null);
    setImportError(null);
    importRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportResult(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.exportedAt || !data.appVersion || !data.data) {
          setImportError('Format file tidak valid. Pastikan file adalah hasil export dari aplikasi.');
          return;
        }
        importMutation.mutate(data, {
          onSuccess: (result) => {
            const parts: string[] = [];
            let totalImported = 0;
            let totalSkipped = 0;
            for (const [table, counts] of Object.entries(result)) {
              parts.push(`${table}: ${counts.imported} diimport, ${counts.skipped} dilewati`);
              totalImported += counts.imported;
              totalSkipped += counts.skipped;
            }
            setImportResult(`Berhasil mengimport data. ${totalImported} record baru, ${totalSkipped} record dilewati (sudah ada).`);
          },
          onError: () => setImportError('Gagal mengimport data. Pastikan file sesuai format.'),
        });
      } catch {
        setImportError('File tidak valid. Pilih file JSON yang benar.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card level={1} className="scroll-mt-20" id="backup">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="size-5 text-ink-500" />
          <CardTitle>Backup</CardTitle>
        </div>
      </CardHeader>
      <p className="font-body text-[15px] text-ink-600 mb-4">
        Export seluruh data untuk dipindahkan ke device lain, atau import data dari device lain.
      </p>

      {importResult && (
        <div className="mb-4 rounded-[--radius-md] bg-semantic-green/15 px-4 py-3 font-body text-[14px] text-semantic-green">
          {importResult}
        </div>
      )}
      {importError && (
        <div className="mb-4 rounded-[--radius-md] bg-semantic-red/15 px-4 py-3 font-body text-[14px] text-semantic-red">
          {importError}
        </div>
      )}
      {exportMutation.isError && (
        <div className="mb-4 rounded-[--radius-md] bg-semantic-red/15 px-4 py-3 font-body text-[14px] text-semantic-red">
          Gagal mengexport data.
        </div>
      )}
      {importMutation.isError && (
        <div className="mb-4 rounded-[--radius-md] bg-semantic-red/15 px-4 py-3 font-body text-[14px] text-semantic-red">
          Gagal mengimport data.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={handleExportJSON} disabled={exportMutation.isPending}>
          {exportMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {exportMutation.isPending ? 'Exporting...' : 'Export JSON'}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleImportClick} disabled={importMutation.isPending}>
          {importMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {importMutation.isPending ? 'Importing...' : 'Import Data'}
        </Button>
      </div>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
    </Card>
  );
}

/* ── About Section ── */

function AboutSection() {
  return (
    <Card level={1} className="scroll-mt-20" id="about">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="size-5 text-ink-500" />
          <CardTitle>About</CardTitle>
        </div>
      </CardHeader>
      <div className="flex flex-col gap-2 font-body text-[15px] text-ink-700">
        <p>
          <span className="font-semibold text-ink-900">App:</span> What Do I Do
        </p>
        <p>
          <span className="font-semibold text-ink-900">Version:</span> 1.0.0 (Fase 1)
        </p>
        <p>
          <span className="font-semibold text-ink-900">Built with:</span> React, TypeScript, NestJS, Drizzle, SQLite
        </p>
      </div>
    </Card>
  );
}

/* ── Main Export ── */

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Settings className="size-6 text-ink-900" />
        <h1 className="font-display text-2xl font-bold text-ink-900">Settings</h1>
      </div>

      {/* Sticky anchor nav */}
      <nav className="sticky top-0 z-[5] -mx-4 flex gap-1 overflow-x-auto bg-clay-surface px-4 py-2 clay-l2 sm:-mx-0 sm:rounded-[--radius-lg]">
        {[
          { href: '#profile', label: 'Profile', icon: User },
          { href: '#preferences', label: 'Preferences', icon: Settings },
          { href: '#notifications', label: 'Notifications', icon: Bell },
          { href: '#categories', label: 'Categories', icon: Tag },
          { href: '#backup', label: 'Backup', icon: Download },
          { href: '#about', label: 'About', icon: Info },
        ].map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="tap-target clay-transition inline-flex items-center gap-1.5 rounded-[--radius-md] px-3 py-2 font-body text-[13px] font-semibold text-ink-500 hover:bg-blue-50 hover:text-ink-900"
          >
            <Icon className="size-4" />
            {label}
          </a>
        ))}
      </nav>

      {/* Section Cards */}
      <ProfileSection />
      <PreferencesSection />
      <NotificationsSection />
      <CategoriesSection />
      <BackupSection />
      <AboutSection />
    </div>
  );
}
