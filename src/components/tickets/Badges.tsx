import React from 'react';
import { cn } from '@/utils';
import { Badge } from '@/components/ui/Card';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_DOT,
  ESCALATION_COLORS,
  ROLE_LABELS,
  ROLE_COLORS,
} from '@/utils';
import { TicketStatus, TicketPriority, SlaEscalationLevel, Role } from '@/types';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={cn('font-medium', STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge
      className={cn('font-medium', PRIORITY_COLORS[priority])}
      dot
      dotColor={PRIORITY_DOT[priority]}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge className={cn('font-medium', ROLE_COLORS[role])}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

// ─── SLA Indicator ────────────────────────────────────────────────────────────

interface SlaIndicatorProps {
  escalationLevel: SlaEscalationLevel;
  responseBreached: boolean;
  resolutionBreached: boolean;
  compact?: boolean;
}

export function SlaIndicator({
  escalationLevel,
  responseBreached,
  resolutionBreached,
  compact = false,
}: SlaIndicatorProps) {
  if (escalationLevel === 'NONE' && !responseBreached && !resolutionBreached) {
    return compact ? null : (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        On Track
      </span>
    );
  }

  if (escalationLevel === 'BREACHED' || responseBreached || resolutionBreached) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold animate-sla-pulse',
          ESCALATION_COLORS['BREACHED']
        )}
      >
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        {compact ? 'Breached' : 'SLA Breached'}
      </span>
    );
  }

  if (escalationLevel === 'WARNING') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold',
          ESCALATION_COLORS['WARNING']
        )}
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {compact ? 'Warning' : 'SLA Warning'}
      </span>
    );
  }

  return null;
}

