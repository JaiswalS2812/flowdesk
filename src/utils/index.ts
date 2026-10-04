import { TicketStatus, TicketPriority, SlaEscalationLevel, Role } from '@/types';

// ─── Status helpers ───────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
};

// ─── Priority helpers ─────────────────────────────────────────────────────────

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};

export const PRIORITY_DOT: Record<TicketPriority, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

// ─── SLA helpers ──────────────────────────────────────────────────────────────

export const ESCALATION_COLORS: Record<SlaEscalationLevel, string> = {
  NONE: 'text-green-600',
  WARNING: 'text-amber-600',
  BREACHED: 'text-red-600',
};

// ─── Role helpers ─────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: 'Employee',
  SUPPORT_ENGINEER: 'Support Engineer',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

export const ROLE_COLORS: Record<Role, string> = {
  EMPLOYEE: 'bg-slate-100 text-slate-700',
  SUPPORT_ENGINEER: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-rose-100 text-rose-700',
};

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatNotificationTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return '1 hour ago';
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
}

export function formatDeadlineCountdown(
  iso: string | null | undefined
): string {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Overdue';
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `< 1h left`;
  if (hrs < 24) return `${hrs}h left`;
  const days = Math.floor(hrs / 24);
  return `${days}d left`;
}

// ─── Class name utility ───────────────────────────────────────────────────────

type ClassValue = string | undefined | null | false;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}

export const PRIORITY_CHART_COLORS = {
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
} as const;

