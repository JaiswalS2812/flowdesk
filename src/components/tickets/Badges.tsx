import React from 'react';
import { CircleDot, Loader, CheckCircle2, Archive, Ban, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  cn,
  STATUS_LABELS,
  STATUS_TONE,
  PRIORITY_LABELS,
  PRIORITY_TONE,
  ROLE_LABELS,
  ROLE_TONE,
  TONE_SOFT,
} from '@/utils';
import { TicketStatus, TicketPriority, SlaEscalationLevel, Role } from '@/types';

const STATUS_ICON: Record<TicketStatus, React.ReactNode> = {
  OPEN: <CircleDot />,
  IN_PROGRESS: <Loader />,
  RESOLVED: <CheckCircle2 />,
  CLOSED: <Archive />,
  CANCELLED: <Ban />,
};

export function StatusBadge({ status, size }: { status: TicketStatus; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={STATUS_TONE[status]} icon={STATUS_ICON[status]} size={size}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// Signal-strength bars encode priority without relying on colour alone
function PriorityBars({ priority }: { priority: TicketPriority }) {
  const level = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[priority];
  return (
    <span className="flex h-2.5 items-end gap-[2px]" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-[1px]', i <= level ? 'bg-current' : 'bg-current opacity-25')}
          style={{ height: `${25 + i * 18.75}%` }}
        />
      ))}
    </span>
  );
}

export function PriorityBadge({ priority, size }: { priority: TicketPriority; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} icon={<PriorityBars priority={priority} />} size={size}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function RoleBadge({ role, size }: { role: Role; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={ROLE_TONE[role]} size={size}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

interface SlaIndicatorProps {
  escalationLevel: SlaEscalationLevel;
  responseBreached: boolean;
  resolutionBreached: boolean;
  status?: TicketStatus;
  compact?: boolean;
}

// Same precedence as the backend: any breach wins, then the warning window
export function SlaIndicator({ escalationLevel, responseBreached, resolutionBreached, status, compact }: SlaIndicatorProps) {
  const breached = escalationLevel === 'BREACHED' || responseBreached || resolutionBreached;
  const finished = status === 'RESOLVED' || status === 'CLOSED';

  if (status === 'CANCELLED') {
    return compact ? <span className="text-xs text-fg-subtle">—</span> : null;
  }
  if (breached) {
    return (
      <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold', TONE_SOFT.red)}>
        <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
        {compact ? 'Breached' : 'SLA breached'}
      </span>
    );
  }
  if (escalationLevel === 'WARNING') {
    return (
      <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold', TONE_SOFT.amber)}>
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        {compact ? 'At risk' : 'SLA at risk'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-medium text-green-fg">
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
      {finished ? 'Met' : compact ? 'On track' : 'On track'}
    </span>
  );
}
