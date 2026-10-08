import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn, Tone, TONE_SOFT } from '@/utils';
import { Button } from '@/components/ui/Button';

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden />;
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5 p-5', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 rounded" style={{ width: `${70 - (i % 3) * 12}%` }} />
            <Skeleton className="h-2.5 w-1/3 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      {icon && (
        <div className="relative mb-4">
          <div className="absolute inset-0 -m-2 rounded-2xl bg-accent-soft opacity-60 blur-md" aria-hidden />
          <div className="relative grid size-11 place-items-center rounded-xl border border-line bg-surface text-fg-muted shadow-sm [&_svg]:size-5">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────

export function ErrorState({
  title = 'Something went wrong',
  description = 'The data could not be loaded. Check your connection and try again.',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)} role="alert">
      <div className="mb-4 grid size-11 place-items-center rounded-xl border border-red-line bg-red-bg text-red-fg">
        <XCircle className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" leftIcon={<RefreshCw className="size-3.5" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── Inline alert / callout ──────────────────────────────────────────────────

const ALERT_ICON: Partial<Record<Tone, React.ReactNode>> = {
  blue: <Info />,
  accent: <Info />,
  amber: <AlertTriangle />,
  red: <AlertTriangle />,
  green: <CheckCircle2 />,
};

export function Alert({
  tone = 'blue',
  title,
  children,
  action,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-start gap-3 rounded-lg border px-3.5 py-3 text-[13px]', TONE_SOFT[tone], className)}
      role={tone === 'red' ? 'alert' : 'status'}
    >
      <span className="mt-px shrink-0 [&_svg]:size-4" aria-hidden>
        {ALERT_ICON[tone] ?? <Info />}
      </span>
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
