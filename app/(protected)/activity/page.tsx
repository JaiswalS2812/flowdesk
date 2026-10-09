'use client';

import React, { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Bot, RefreshCw, ScrollText, Search, ShieldCheck, Ticket as TicketIcon, UserCheck, UserRound, X } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { activityService } from '@/services/activity.service';
import { ActivitySummary, AuditLogResponse, PageResponse, Role } from '@/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormFields';
import { Email } from '@/components/ui/Email';
import { Avatar, AnimatedNumber } from '@/components/ui/Controls';
import { EmptyState, ErrorState, RefreshErrorAlert, SkeletonRows } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { Table, Col, TableHead, TableBody, Th, Tr, Td } from '@/components/ui/Table';
import { AUDIT_ACTIONS, auditAction, cn, formatDate, formatRelative, formatTime, Tone, TONE_SOFT } from '@/utils';

const PAGE_SIZE = 25;
const LONG_DETAILS = 220;

const DAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return DAY.format(d);
}

// Groups consecutive (newest-first) entries by calendar day
function byDay(logs: AuditLogResponse[]) {
  const groups: { day: string; items: AuditLogResponse[] }[] = [];
  for (const log of logs) {
    const day = dayLabel(log.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(log);
    else groups.push({ day, items: [log] });
  }
  return groups;
}

const ADMIN_ONLY: Role[] = ['ADMIN'];

// Nothing renders (and nothing is requested) until the session is resolved as an admin's
export default function ActivityPage() {
  const { isAuthorized } = useRequireAuth({ allowedRoles: ADMIN_ONLY });
  return isAuthorized ? <ActivityView /> : null;
}

function ActivityView() {
  const [result, setResult] = useState<PageResponse<AuditLogResponse> | null>(null);
  const [metrics, setMetrics] = useState<ActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('ALL');
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim());

  // Search, filtering and paging happen on the server; the cards count every event
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for the new request
    setIsLoading(true);
    Promise.all([
      activityService.getPage({ page, size: PAGE_SIZE, action: action === 'ALL' ? undefined : action, search: debouncedSearch || undefined }),
      activityService.getSummary(),
    ])
      .then(([p, summary]) => {
        if (cancelled) return;
        if (p.content.length === 0 && p.page > 0 && p.totalPages > 0) {
          setPage(p.totalPages - 1);
          return;
        }
        setResult(p);
        setMetrics(summary);
        setLoadError(false);
      })
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, action, debouncedSearch, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const reset = () => {
    setSearch('');
    setAction('ALL');
    setPage(0);
  };

  const logs = result?.content ?? [];
  const filtered = !!search || action !== 'ALL';
  const groups = byDay(logs);

  const cards: { label: string; value?: number; icon: React.ReactNode; tone: Tone; filter: string }[] = [
    { label: 'Total events', value: metrics?.total, icon: <Activity />, tone: 'accent', filter: 'ALL' },
    { label: 'SLA breaches', value: metrics?.slaBreaches, icon: <AlertTriangle />, tone: 'red', filter: 'SLA_BREACHED' },
    { label: 'Status changes', value: metrics?.statusChanges, icon: <RefreshCw />, tone: 'amber', filter: 'TICKET_STATUS_UPDATED' },
    { label: 'Assignments', value: metrics?.assignments, icon: <UserCheck />, tone: 'violet', filter: 'TICKET_ASSIGNED' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Activity Log"
        subtitle="Every ticket, SLA, user and policy change, with who made it and when."
        actions={
          <Button variant="secondary" leftIcon={<RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />} onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <section aria-label="Activity summary" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => {
          const active = action === c.filter && c.filter !== 'ALL';
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                setAction(active ? 'ALL' : c.filter);
                setPage(0);
              }}
              aria-pressed={active}
              className={cn(
                'stagger group flex items-center justify-between gap-3 rounded-xl border bg-surface p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 cursor-pointer',
                'hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong'
              )}
              style={{ ['--i' as string]: i }}
            >
              <span>
                <span className="block text-xs font-medium text-fg-muted">{c.label}</span>
                <span className="mt-1 block text-2xl font-semibold text-fg">{c.value === undefined ? '–' : <AnimatedNumber value={c.value} />}</span>
              </span>
              <span className={cn('grid size-9 place-items-center rounded-lg border [&_svg]:size-4', TONE_SOFT[c.tone])} aria-hidden>
                {c.icon}
              </span>
            </button>
          );
        })}
      </section>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Input
          placeholder="Search actor, ticket number, action or details…"
          aria-label="Search activity"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          leftAddon={<Search />}
          fieldClassName="sm:max-w-md"
        />
        <Select
          aria-label="Filter by action"
          selectSize="sm"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(0);
          }}
          options={[{ value: 'ALL', label: 'All actions' }, ...AUDIT_ACTIONS.map((a) => ({ value: a.value, label: a.label }))]}
          fieldClassName="sm:w-56"
        />
        {filtered && (
          <Button variant="ghost" size="sm" leftIcon={<X className="size-3.5" />} onClick={reset}>
            Reset
          </Button>
        )}
      </div>

      {loadError && result && (
        <RefreshErrorAlert
          className="mb-4"
          description="The events and totals below are from an earlier request and may not match your current search, filter or page."
          onRetry={refresh}
          retrying={isLoading}
        />
      )}

      {/* The layout responds to the card's own width, so collapsing the sidebar gives the table room */}
      <Card padding="none" className="@container overflow-hidden">
        {isLoading && !result ? (
          <SkeletonRows rows={8} />
        ) : loadError && !result ? (
          <ErrorState title="Activity could not be loaded" onRetry={refresh} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<ScrollText />}
            title="No activity events found"
            description={filtered ? 'No events match your current filters.' : 'Events appear here as soon as tickets, users or policies change.'}
            action={filtered ? <Button variant="secondary" size="sm" onClick={reset}>Clear filters</Button> : undefined}
          />
        ) : (
          <div className={cn('transition-opacity', isLoading && 'opacity-60')} aria-busy={isLoading}>
            {/* Wide: table with fixed columns; Details wraps, Timestamp keeps a stable width */}
            <div className="hidden @[960px]:block">
              <Table minWidth={960} caption="Audit events">
                {/* Action, Entity, Actor and Time are fixed; Details takes the remaining width and wraps */}
                <colgroup>
                  <Col width={168} />
                  <Col width={136} />
                  <Col width={236} />
                  <Col />
                  <Col width={128} />
                </colgroup>
                <TableHead>
                  <tr>
                    <Th>Action</Th>
                    <Th>Entity</Th>
                    <Th>Performed by</Th>
                    <Th>Details</Th>
                    <Th align="right">Time</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {groups.map((g) => (
                    <Fragment key={g.day}>
                      <tr>
                        <th
                          colSpan={5}
                          scope="colgroup"
                          className="border-b border-line bg-canvas/60 px-4 py-1.5 text-left text-[11px] font-semibold text-fg-muted"
                        >
                          {g.day}
                        </th>
                      </tr>
                      {g.items.map((log) => (
                        <Tr key={log.id}>
                          <Td className="align-top"><ActionBadge action={log.action} /></Td>
                          <Td className="align-top"><EntityLink log={log} /></Td>
                          <Td className="align-top"><Actor who={log.performedBy} /></Td>
                          <Td className="align-top"><Details text={log.details} /></Td>
                          <Td align="right" className="align-top"><Timestamp iso={log.createdAt} /></Td>
                        </Tr>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Narrow: stacked entries */}
            <div className="@[960px]:hidden">
              {groups.map((g) => (
                <section key={g.day} aria-label={g.day}>
                  <h3 className="border-b border-line bg-canvas/60 px-4 py-1.5 text-[11px] font-semibold text-fg-muted">{g.day}</h3>
                  <ul className="divide-y divide-line">
                    {g.items.map((log) => (
                      <li key={log.id} className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <ActionBadge action={log.action} />
                          <time dateTime={log.createdAt} className="text-[11.5px] text-fg-subtle tabular" title={formatDate(log.createdAt)}>
                            {formatTime(log.createdAt)} · {formatRelative(log.createdAt)}
                          </time>
                        </div>
                        <div className="mt-2"><Details text={log.details} /></div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <EntityLink log={log} />
                          <Actor who={log.performedBy} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
        {result && logs.length > 0 && (
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            totalElements={result.totalElements}
            size={result.size}
            itemLabel="events"
            onPageChange={setPage}
            disabled={isLoading}
          />
        )}
      </Card>
    </PageContainer>
  );
}

// ─── Cells ───────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const a = auditAction(action);
  return (
    <Badge tone={a.tone} dot title={action}>
      {a.label}
    </Badge>
  );
}

function EntityLink({ log }: { log: AuditLogResponse }) {
  const cls = 'inline-flex items-center gap-1.5 text-[13px] font-medium';
  if (log.entityType === 'TICKET') {
    return (
      <Link href={`/tickets/${log.entityId}`} className={cn(cls, 'text-accent-soft-fg hover:underline focus-visible:outline-none focus-visible:underline')}>
        <TicketIcon className="size-3.5 shrink-0" aria-hidden />
        Ticket #{log.entityId}
      </Link>
    );
  }
  if (log.entityType === 'SLA_POLICY') {
    return (
      <Link href="/sla-policies" className={cn(cls, 'text-accent-soft-fg hover:underline')}>
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
        SLA policy #{log.entityId}
      </Link>
    );
  }
  if (log.entityType === 'USER') {
    return (
      <span className={cn(cls, 'text-fg')}>
        <UserRound className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        User #{log.entityId}
      </span>
    );
  }
  return (
    <span className={cn(cls, 'text-fg')}>
      {log.entityType} #{log.entityId}
    </span>
  );
}

function Actor({ who }: { who: string }) {
  if (who === 'SYSTEM') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11.5px] font-semibold text-fg-muted">
        <Bot className="size-3.5" aria-hidden />
        System
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={who} size="xs" />
      <Email value={who} className="min-w-0 text-[12.5px] text-fg" />
    </span>
  );
}

// Long details are clamped with a toggle; nothing is hidden without a way to read it
function Details({ text }: { text: string | null }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="text-fg-subtle">—</span>;
  const long = text.length > LONG_DETAILS;
  return (
    <div>
      <p className={cn('text-[13px] leading-relaxed text-fg-muted wrap-anywhere', long && !open && 'line-clamp-3')}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-1 text-xs font-medium text-accent-soft-fg hover:underline cursor-pointer"
        >
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function Timestamp({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatDate(iso)} className="block whitespace-nowrap">
      <span className="block text-[13px] font-medium text-fg tabular">{formatTime(iso)}</span>
      <span className="block text-[11.5px] text-fg-subtle">{formatRelative(iso)}</span>
    </time>
  );
}
