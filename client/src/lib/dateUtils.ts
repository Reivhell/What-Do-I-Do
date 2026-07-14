// Date utility functions

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(time: string): string {
  // time is HH:MM in 24h format
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function isToday(isoDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return isoDate === today;
}

export function isOverdue(isoDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return isoDate < today;
}

export function isUpcoming(isoDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return isoDate > today;
}

export function getDaysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + 'T00:00:00');
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getRelativeDateLabel(isoDate: string): string {
  const days = getDaysUntil(isoDate);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days <= 7) return `In ${days} days`;
  return formatDate(isoDate);
}