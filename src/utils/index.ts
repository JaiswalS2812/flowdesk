import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TicketStatus, TicketPriority, SlaEscalationLevel, Role } from '@/types';

// ─── Class names ─────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Tones ───────────────────────────────────────────────────────────────────
// Every status, priority, role and audit action maps to one tone; the theme decides
// the actual colours (see app/globals.css), so badges stay readable in every theme.

export type Tone =
  | 'neutral'
  | 'accent'
  | 'blue'
  | 'violet'
  | 'teal'
  | 'green'
  | 'amber'
  | 'orange'
  | 'red'
  | 'rose';

export const TONE_SOFT: Record<Tone, string> = {
  neutral: 'bg-neutral-bg text-neutral-fg border-neutral-line',
  accent: 'bg-accent-soft text-accent-soft-fg border-accent-line',
  blue: 'bg-blue-bg text-blue-fg border-blue-line',
  violet: 'bg-violet-bg text-violet-fg border-violet-line',
  teal: 'bg-teal-bg text-teal-fg border-teal-line',
  green: 'bg-green-bg text-green-fg border-green-line',
  amber: 'bg-amber-bg text-amber-fg border-amber-line',
  orange: 'bg-orange-bg text-orange-fg border-orange-line',
  red: 'bg-red-bg text-red-fg border-red-line',
  rose: 'bg-rose-bg text-rose-fg border-rose-line',
};

export const TONE_SOLID: Record<Tone, string> = {
  neutral: 'bg-neutral',
  accent: 'bg-accent',
  blue: 'bg-blue',
  violet: 'bg-violet',
  teal: 'bg-teal',
  green: 'bg-green',
  amber: 'bg-amber',
  orange: 'bg-orange',
  red: 'bg-red',
  rose: 'bg-rose',
};

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-neutral-fg',
  accent: 'text-accent-soft-fg',
  blue: 'text-blue-fg',
  violet: 'text-violet-fg',
  teal: 'text-teal-fg',
  green: 'text-green-fg',
  amber: 'text-amber-fg',
  orange: 'text-orange-fg',
  red: 'text-red-fg',
  rose: 'text-rose-fg',
};

// CSS variable of a tone's solid colour, for charts and inline SVG
export const toneVar = (tone: Tone) => (tone === 'accent' ? 'var(--accent)' : `var(--${tone})`);

// ─── Status ──────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export const STATUS_TONE: Record<TicketStatus, Tone> = {
  OPEN: 'blue',
  IN_PROGRESS: 'amber',
  RESOLVED: 'green',
  CLOSED: 'neutral',
  CANCELLED: 'rose',
};

// The transitions the backend accepts (TicketService.isValidTransition)
export const NEXT_STATUSES: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export const ACTIVE_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS'];

// ─── Priority ────────────────────────────────────────────────────────────────

export const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const PRIORITY_TONE: Record<TicketPriority, Tone> = {
  LOW: 'neutral',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const PRIORITY_DESCRIPTIONS: Record<TicketPriority, string> = {
  LOW: 'General request or question, no business impact',
  MEDIUM: 'Some impact on your work, a workaround exists',
  HIGH: 'Business operations are significantly affected',
  CRITICAL: 'Severe outage, work is blocked for many people',
};

// ─── SLA ─────────────────────────────────────────────────────────────────────

export const ESCALATION_TONE: Record<SlaEscalationLevel, Tone> = {
  NONE: 'green',
  WARNING: 'amber',
  BREACHED: 'red',
};

// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLES: Role[] = ['EMPLOYEE', 'SUPPORT_ENGINEER', 'MANAGER', 'ADMIN'];

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: 'Employee',
  SUPPORT_ENGINEER: 'Support Engineer',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

export const ROLE_TONE: Record<Role, Tone> = {
  EMPLOYEE: 'neutral',
  SUPPORT_ENGINEER: 'teal',
  MANAGER: 'violet',
  ADMIN: 'accent',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  EMPLOYEE: 'Creates tickets and follows their own requests',
  SUPPORT_ENGINEER: 'Works the tickets assigned to them',
  MANAGER: 'Assigns and manages tickets in their department',
  ADMIN: 'Manages users, SLA policies and every ticket',
};

// ─── Audit actions (AuditLogService entries written by the backend) ──────────

export const AUDIT_ACTIONS: { value: string; label: string; tone: Tone }[] = [
  { value: 'TICKET_CREATED', label: 'Ticket created', tone: 'blue' },
  { value: 'TICKET_ASSIGNED', label: 'Ticket assigned', tone: 'violet' },
  { value: 'TICKET_STATUS_UPDATED', label: 'Status changed', tone: 'amber' },
  { value: 'COMMENT_CREATED', label: 'Comment added', tone: 'teal' },
  { value: 'SLA_BREACHED', label: 'SLA breached', tone: 'red' },
  { value: 'SLA_POLICY_UPDATED', label: 'SLA policy updated', tone: 'accent' },
  { value: 'SLA_POLICY_TOGGLED', label: 'SLA policy toggled', tone: 'accent' },
  { value: 'USER_ROLE_CHANGED', label: 'Role changed', tone: 'violet' },
  { value: 'USER_DEPARTMENT_CHANGED', label: 'Department changed', tone: 'blue' },
  { value: 'USER_DEACTIVATED', label: 'User deactivated', tone: 'rose' },
  { value: 'USER_REACTIVATED', label: 'User reactivated', tone: 'green' },
  { value: 'PASSWORD_CHANGED', label: 'Password changed', tone: 'neutral' },
];

export function auditAction(action: string): { label: string; tone: Tone } {
  const known = AUDIT_ACTIONS.find((a) => a.value === action);
  if (known) return known;
  const label = action.toLowerCase().replace(/_/g, ' ');
  return { label: label.charAt(0).toUpperCase() + label.slice(1), tone: 'neutral' };
}

// ─── People ──────────────────────────────────────────────────────────────────

export function initials(nameOrEmail: string): string {
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0].replace(/[._-]+/g, ' ') : nameOrEmail;
  const parts = base.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_TONES: Tone[] = ['blue', 'violet', 'teal', 'green', 'amber', 'orange', 'rose'];

// Stable colour per person
export function avatarTone(seed: string): Tone {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function firstName(name: string | undefined | null): string {
  return name?.trim().split(/\s+/)[0] || 'there';
}

// ─── Dates ───────────────────────────────────────────────────────────────────

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const TIME = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return DATE_TIME.format(new Date(iso));
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return SHORT_DATE.format(new Date(iso));
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return TIME.format(new Date(iso));
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatShortDate(iso);
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

// "3h 20m", "2d 4h", "45m"
export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const remH = hrs % 24;
  return remH ? `${days}d ${remH}h` : `${days}d`;
}

export function formatMinutes(minutes: number): string {
  return formatDuration(minutes * 60000);
}

export function formatDeadlineCountdown(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return `Overdue by ${formatDuration(-diff)}`;
  return `${formatDuration(diff)} left`;
}

// ─── Misc ────────────────────────────────────────────────────────────────────

export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? word : pluralWord}`;
}

// Builds "?a=1&b=x" from the defined, non-empty values only
export function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}
