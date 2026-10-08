'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock,
  Inbox,
  LifeBuoy,
  Loader,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  SquarePen,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService } from '@/services/ticket.service';
import { activityService } from '@/services/activity.service';
import { AuditLogResponse, PageResponse, Role, TicketResponse, TicketSummary } from '@/types';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { AnimatedNumber, Avatar } from '@/components/ui/Controls';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Tooltip } from '@/components/ui/Tooltip';
import { StatusBadge, PriorityBadge, SlaIndicator } from '@/components/tickets/Badges';
import { CAN_CREATE_TICKETS } from '@/components/layout/nav';
import {
  auditAction,
  cn,
  firstName,
  formatDeadlineCountdown,
  formatRelative,
  PRIORITIES,
  PRIORITY_LABELS,
  PRIORITY_TONE,
  STATUS_LABELS,
  STATUS_TONE,
  Tone,
  TONE_SOFT,
  TONE_SOLID,
  TONE_TEXT,
} from '@/utils';

interface DashboardData {
  summary: TicketSummary;
  recent: TicketResponse[];
  atRisk: PageResponse<TicketResponse>;
  activity: AuditLogResponse[] | null;
}

// Counts come from the server over every ticket the user may see; only the lists are limited
async function loadDashboard(isAdmin: boolean): Promise<DashboardData> {
  const [summary, recent, atRisk, activity] = await Promise.all([
    ticketService.getSummary(),
    ticketService.getPage({ size: 6, sort: 'updatedAt', direction: 'desc' }),
    ticketService.getPage({ atRisk: true, size: 5 }),
    isAdmin ? activityService.getPage({ size: 6 }) : Promise.resolve(null),
  ]);
  return { summary, recent: recent.content, atRisk, activity: activity?.content ?? null };
}

const SCOPE: Record<Role, { subtitle: (dept: string) => string; recentTitle: string; empty: string }> = {
  EMPLOYEE: {
    subtitle: () => 'Here is the status of the requests you have raised.',
    recentTitle: 'Your latest requests',
    empty: 'Raise your first service request and follow it here.',
  },
  SUPPORT_ENGINEER: {
    subtitle: () => 'Here is the work currently assigned to you.',
    recentTitle: 'Recently updated in your queue',
    empty: 'Tickets assigned to you will appear here.',
  },
  MANAGER: {
    subtitle: (dept) => `Here is how ${dept} is doing.`,
    recentTitle: `Recently updated in your department`,
    empty: 'Tickets raised in your department will appear here.',
  },
  ADMIN: {
    subtitle: () => 'An overview of every ticket across all departments.',
    recentTitle: 'Recently updated tickets',
    empty: 'Tickets will appear here as soon as they are raised.',
  },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadDashboard(isAdmin)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(false);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [isAdmin, reload]);

  const retry = useCallback(() => {
    setError(false);
    setReload((r) => r + 1);
  }, []);

  if (!user) return null;
  const scope = SCOPE[user.role];
  const canCreate = CAN_CREATE_TICKETS.includes(user.role);
  const s = data?.summary;
  const loading = !data && !error;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Badge tone="accent" dot>
            {user.role === 'ADMIN' ? 'All departments' : user.department}
          </Badge>
        }
        title={`${greeting()}, ${firstName(user.name)}`}
        subtitle={scope.subtitle(user.department)}
        actions={
          <>
            <Link href="/tickets?atRisk=true" className={buttonClasses('secondary', 'md')}>
              <ShieldAlert className="size-4 text-fg-subtle" />
              At-risk tickets
            </Link>
            {canCreate && (
              <Link href="/tickets/new" className={buttonClasses('primary', 'md')}>
                <SquarePen className="size-4" />
                New ticket
              </Link>
            )}
          </>
        }
      />

      {error && !data ? (
        <Card padding="none">
          <ErrorState title="Dashboard unavailable" description="Your ticket data could not be loaded." onRetry={retry} />
        </Card>
      ) : (
        <div className="space-y-5">
          {/* KPIs */}
          <section aria-label="Ticket counts" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Kpi i={0} label="Active" hint="Open + in progress" value={s && s.open + s.inProgress} icon={<Inbox />} tone="accent" href="/tickets" loading={loading} />
            <Kpi i={1} label="Open" hint="Waiting to be started" value={s?.open} icon={<CircleDot />} tone="blue" href="/tickets?status=OPEN" loading={loading} />
            <Kpi i={2} label="In progress" hint="Being worked on" value={s?.inProgress} icon={<Loader />} tone="amber" href="/tickets?status=IN_PROGRESS" loading={loading} />
            <Kpi i={3} label="Resolved" hint="Resolved, awaiting closure" value={s?.resolved} icon={<CheckCircle2 />} tone="green" href="/tickets?status=RESOLVED" loading={loading} />
            <Kpi i={4} label="At risk" hint="Active tickets in their SLA warning window or past a deadline" value={s?.atRisk} icon={<AlertTriangle />} tone="amber" href="/tickets?atRisk=true" loading={loading} emphasize={!!s?.atRisk} />
            <Kpi i={5} label="SLA breached" hint="Tickets that missed a response or resolution deadline (including finished ones)" value={s?.breached} icon={<ShieldAlert />} tone="red" loading={loading} emphasize={!!s?.breached} />
          </section>

          <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-3">
            <StatusBreakdown summary={s} loading={loading} />
            <PriorityMix summary={s} loading={loading} />
          </div>

          <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-5">
            <AttentionList atRisk={data?.atRisk} loading={loading} />
            <RecentTickets tickets={data?.recent} loading={loading} title={scope.recentTitle} empty={scope.empty} canCreate={canCreate} />
          </div>

          <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-5">
            {isAdmin && <RecentActivity events={data?.activity} loading={loading} />}
            <QuickActions role={user.role} canCreate={canCreate} wide={!isAdmin} />
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function Kpi({
  label,
  hint,
  value,
  icon,
  tone,
  href,
  loading,
  emphasize,
  i,
}: {
  label: string;
  hint: string;
  value: number | undefined;
  icon: React.ReactNode;
  tone: Tone;
  href?: string;
  loading: boolean;
  emphasize?: boolean;
  i: number;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-fg-muted">{label}</span>
        <span className={cn('grid size-7 place-items-center rounded-lg border [&_svg]:size-3.5', TONE_SOFT[tone])} aria-hidden>
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        {loading || value === undefined ? (
          <Skeleton className="h-8 w-14 rounded-md" />
        ) : (
          <AnimatedNumber value={value} className={cn('text-[28px] font-semibold leading-none tracking-tight', emphasize ? TONE_TEXT[tone] : 'text-fg')} />
        )}
        {href && <ArrowUpRight className="size-4 text-fg-subtle opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />}
      </div>
      <span className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100', TONE_SOLID[tone])} aria-hidden />
    </>
  );
  const classes =
    'group relative block overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 stagger';
  return (
    <Tooltip content={hint}>
      {href ? (
        <Link href={href} className={cn(classes, 'hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')} style={{ ['--i' as string]: i }}>
          {body}
        </Link>
      ) : (
        <div className={classes} style={{ ['--i' as string]: i }} tabIndex={0}>
          {body}
        </div>
      )}
    </Tooltip>
  );
}

// ─── Status breakdown ────────────────────────────────────────────────────────

function StatusBreakdown({ summary, loading }: { summary?: TicketSummary; loading: boolean }) {
  const parts = summary
    ? ([
        ['OPEN', summary.open],
        ['IN_PROGRESS', summary.inProgress],
        ['RESOLVED', summary.resolved],
        ['CLOSED', summary.closed],
        ['CANCELLED', summary.cancelled],
      ] as const)
    : [];
  const total = summary?.total ?? 0;
  const finished = (summary?.resolved ?? 0) + (summary?.closed ?? 0);
  const countable = total - (summary?.cancelled ?? 0);
  const completion = countable > 0 ? Math.round((finished / countable) * 100) : 0;

  return (
    <Card className="xl:col-span-2">
      <CardHeader
        title="Status breakdown"
        subtitle={loading ? 'Loading…' : `${total.toLocaleString()} ticket${total === 1 ? '' : 's'} in total`}
        action={
          !loading && countable > 0 ? (
            <Tooltip content="Resolved and closed tickets as a share of all tickets that were not cancelled">
              <div className="text-right" tabIndex={0}>
                <p className="text-[11px] font-medium text-fg-subtle">Completion</p>
                <p className="text-lg font-semibold leading-tight text-fg tabular">{completion}%</p>
              </div>
            </Tooltip>
          ) : undefined
        }
      />
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        </div>
      ) : total === 0 ? (
        <EmptyState compact icon={<TicketIcon />} title="No tickets yet" description="The breakdown appears once tickets exist." />
      ) : (
        <>
          <div className="flex h-3 w-full gap-[3px] overflow-hidden rounded-full" role="img" aria-label={parts.map(([st, n]) => `${STATUS_LABELS[st]}: ${n}`).join(', ')}>
            {parts.map(([st, n], i) =>
              n > 0 ? (
                <span
                  key={st}
                  className={cn('h-full origin-left rounded-[3px] animate-[grow_0.7s_var(--ease-out)_both]', TONE_SOLID[STATUS_TONE[st]])}
                  style={{ width: `${(n / total) * 100}%`, animationDelay: `${i * 70}ms` }}
                />
              ) : null
            )}
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {parts.map(([st, n]) => (
              <li key={st}>
                <Link
                  href={`/tickets?status=${st}`}
                  className="block rounded-lg border border-transparent px-2.5 py-2 transition-colors hover:border-line hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <span className={cn('size-2 rounded-full', TONE_SOLID[STATUS_TONE[st]])} aria-hidden />
                    {STATUS_LABELS[st]}
                  </span>
                  <span className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold text-fg tabular">{n}</span>
                    <span className="text-[11px] text-fg-subtle tabular">{total ? Math.round((n / total) * 100) : 0}%</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

// ─── Priority mix ────────────────────────────────────────────────────────────

function PriorityMix({ summary, loading }: { summary?: TicketSummary; loading: boolean }) {
  const max = summary ? Math.max(1, ...PRIORITIES.map((p) => summary.byPriority[p] ?? 0)) : 1;
  return (
    <Card>
      <CardHeader title="By priority" subtitle="All tickets you can see" />
      {loading ? (
        <div className="space-y-3.5">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-7 rounded-md" />)}
        </div>
      ) : (
        <ul className="space-y-3.5">
          {[...PRIORITIES].reverse().map((p, i) => {
            const n = summary?.byPriority[p] ?? 0;
            return (
              <li key={p}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-fg-muted">{PRIORITY_LABELS[p]}</span>
                  <span className="font-semibold text-fg tabular">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`${PRIORITY_LABELS[p]}: ${n}`}>
                  <div
                    className={cn('h-full origin-left rounded-full animate-[grow_0.7s_var(--ease-out)_both]', TONE_SOLID[PRIORITY_TONE[p]])}
                    style={{ width: `${(n / max) * 100}%`, animationDelay: `${i * 80}ms` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ─── Needs attention ─────────────────────────────────────────────────────────

function AttentionList({ atRisk, loading }: { atRisk?: PageResponse<TicketResponse>; loading: boolean }) {
  const items = atRisk?.content ?? [];
  const total = atRisk?.totalElements ?? 0;
  return (
    <Card padding="none" className="flex flex-col xl:col-span-2">
      <div className="p-5 pb-0">
        <CardHeader
          title="Needs attention"
          subtitle={loading ? 'Checking SLAs…' : total ? `${total} active ticket${total === 1 ? '' : 's'} at risk or past a deadline` : 'Active tickets close to or past an SLA deadline'}
          icon={<ShieldAlert />}
          action={
            total > items.length ? (
              <Link href="/tickets?atRisk=true" className={buttonClasses('ghost', 'xs')}>
                View all <ArrowRight className="size-3" />
              </Link>
            ) : undefined
          }
          className="mb-3"
        />
      </div>
      {loading ? (
        <div className="space-y-2 px-5 pb-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState compact icon={<ShieldCheck />} title="All SLAs on track" description="No active ticket is in its warning window or past a deadline." className="flex-1" />
      ) : (
        <ul className="space-y-2 px-5 pb-5">
          {items.map((t) => {
            const breached = t.escalationLevel === 'BREACHED' || t.responseBreached || t.resolutionBreached;
            return (
              <li key={t.id}>
                <Link
                  href={`/tickets/${t.id}`}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    breached ? 'border-red-line bg-red-bg/50 hover:bg-red-bg' : 'border-amber-line bg-amber-bg/50 hover:bg-amber-bg'
                  )}
                >
                  <span className={cn('size-2 shrink-0 rounded-full', breached ? 'bg-red animate-pulse-ring' : 'bg-amber')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">
                      <span className="mr-1.5 font-mono text-[11px] text-fg-subtle">#{t.id}</span>
                      {t.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-fg-muted">
                      {t.department} · Resolution {formatDeadlineCountdown(t.resolutionDeadline).toLowerCase()}
                    </span>
                  </span>
                  <SlaIndicator compact status={t.status} escalationLevel={t.escalationLevel} responseBreached={t.responseBreached} resolutionBreached={t.resolutionBreached} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ─── Recent tickets ──────────────────────────────────────────────────────────

function RecentTickets({
  tickets,
  loading,
  title,
  empty,
  canCreate,
}: {
  tickets?: TicketResponse[];
  loading: boolean;
  title: string;
  empty: string;
  canCreate: boolean;
}) {
  return (
    <Card padding="none" className="flex flex-col xl:col-span-3">
      <div className="p-5 pb-0">
        <CardHeader
          title={title}
          icon={<Clock />}
          action={
            <Link href="/tickets" className={buttonClasses('ghost', 'xs')}>
              All tickets <ArrowRight className="size-3" />
            </Link>
          }
          className="mb-2"
        />
      </div>
      {loading ? (
        <div className="space-y-2 px-5 pb-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
      ) : !tickets || tickets.length === 0 ? (
        <EmptyState
          compact
          icon={<TicketIcon />}
          title="No tickets yet"
          description={empty}
          action={
            canCreate ? (
              <Link href="/tickets/new" className={buttonClasses('primary', 'sm')}>
                <SquarePen className="size-3.5" /> New ticket
              </Link>
            ) : undefined
          }
          className="flex-1"
        />
      ) : (
        <ul className="divide-y divide-line">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tickets/${t.id}`}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2/70 focus-visible:bg-surface-2 focus-visible:outline-none"
              >
                <span className="w-9 shrink-0 font-mono text-[11px] text-fg-subtle">#{t.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-fg group-hover:text-accent-soft-fg">{t.title}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-fg-subtle">
                    {t.department} · updated {formatRelative(t.updatedAt)}
                  </span>
                </span>
                <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </span>
                <span className="sm:hidden">
                  <StatusBadge status={t.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─── Recent activity (admin) ─────────────────────────────────────────────────

function RecentActivity({ events, loading }: { events?: AuditLogResponse[] | null; loading: boolean }) {
  return (
    <Card padding="none" className="xl:col-span-3">
      <div className="p-5 pb-0">
        <CardHeader
          title="Recent activity"
          subtitle="Latest entries in the audit log"
          icon={<ScrollText />}
          action={
            <Link href="/activity" className={buttonClasses('ghost', 'xs')}>
              Audit log <ArrowRight className="size-3" />
            </Link>
          }
          className="mb-3"
        />
      </div>
      {loading ? (
        <div className="space-y-3 px-5 pb-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
      ) : !events || events.length === 0 ? (
        <EmptyState compact icon={<ScrollText />} title="No activity yet" />
      ) : (
        <ol className="relative px-5 pb-5">
          <span className="absolute bottom-7 left-[33px] top-3 w-px bg-line" aria-hidden />
          {events.map((e) => {
            const a = auditAction(e.action);
            return (
              <li key={e.id} className="relative flex gap-3 py-2">
                {e.performedBy === 'SYSTEM' ? (
                  <span className={cn('relative z-10 grid size-6 shrink-0 place-items-center rounded-full border text-[9px] font-bold', TONE_SOFT.red)}>SYS</span>
                ) : (
                  <Avatar name={e.performedBy} size="sm" className="relative z-10 ring-2 ring-surface" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-fg">
                    <span className={cn('mr-1.5 inline-block rounded px-1.5 py-px text-[11px] font-medium', TONE_SOFT[a.tone])}>{a.label}</span>
                    <span className="text-fg-muted wrap-anywhere">{e.details}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-fg-subtle wrap-anywhere">
                    {e.performedBy === 'SYSTEM' ? 'System' : e.performedBy} · {formatRelative(e.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

// ─── Quick actions ───────────────────────────────────────────────────────────

function QuickActions({ role, canCreate, wide }: { role: Role; canCreate: boolean; wide: boolean }) {
  const actions = [
    canCreate && { href: '/tickets/new', label: 'Raise a request', text: 'Submit a new ticket', icon: <SquarePen />, tone: 'accent' as Tone },
    role === 'SUPPORT_ENGINEER' && { href: '/tickets?status=IN_PROGRESS', label: 'Continue work', text: 'Your in-progress tickets', icon: <Loader />, tone: 'amber' as Tone },
    (role === 'MANAGER' || role === 'ADMIN') && { href: '/tickets?status=OPEN', label: 'Triage open tickets', text: 'Assign and start work', icon: <CircleDot />, tone: 'blue' as Tone },
    { href: '/tickets?atRisk=true', label: 'Review SLA risks', text: 'Tickets near or past deadlines', icon: <ShieldAlert />, tone: 'red' as Tone },
    role === 'ADMIN' && { href: '/users', label: 'Manage users', text: 'Roles, departments, access', icon: <Users />, tone: 'violet' as Tone },
    role === 'ADMIN' && { href: '/sla-policies', label: 'SLA policies', text: 'Response and resolution targets', icon: <ShieldCheck />, tone: 'teal' as Tone },
    { href: '/help', label: 'Help Center', text: 'Guides and answers', icon: <LifeBuoy />, tone: 'neutral' as Tone },
  ].filter(Boolean) as { href: string; label: string; text: string; icon: React.ReactNode; tone: Tone }[];

  return (
    <Card className={wide ? 'xl:col-span-5' : 'xl:col-span-2'}>
      <CardHeader title="Quick actions" />
      <ul className={cn('grid gap-2', wide ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-1')}>
        {actions.map((a, i) => (
          <li key={a.href} className="stagger" style={{ ['--i' as string]: i }}>
            <Link
              href={a.href}
              className="group flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-line-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg border [&_svg]:size-4', TONE_SOFT[a.tone])} aria-hidden>
                {a.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-fg">{a.label}</span>
                <span className="block truncate text-[11.5px] text-fg-subtle">{a.text}</span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
