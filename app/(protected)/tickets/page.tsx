'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, RefreshCw, Search, ShieldAlert, Ticket as TicketIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService } from '@/services/ticket.service';
import { PageResponse, TicketPriority, TicketResponse, TicketSortKey, TicketStatus, TicketSummary } from '@/types';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormFields';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, RefreshErrorAlert, SkeletonRows } from '@/components/ui/Feedback';
import { Avatar } from '@/components/ui/Controls';
import { Table, Col, TableHead, TableBody, Th, Tr, Td } from '@/components/ui/Table';
import { Tooltip } from '@/components/ui/Tooltip';
import { StatusBadge, PriorityBadge, SlaIndicator } from '@/components/tickets/Badges';
import { CAN_CREATE_TICKETS } from '@/components/layout/nav';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn, formatDate, formatRelative, PRIORITIES, PRIORITY_LABELS, STATUS_LABELS } from '@/utils';

const PAGE_SIZE = 20;
const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'];
const SORTS: TicketSortKey[] = ['id', 'title', 'status', 'priority', 'department', 'createdAt', 'updatedAt'];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'priority:desc', label: 'Priority: high to low' },
  { value: 'priority:asc', label: 'Priority: low to high' },
  { value: 'status:asc', label: 'Status' },
  { value: 'title:asc', label: 'Title A–Z' },
];

export default function TicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsView />
    </Suspense>
  );
}

function TicketsView() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // The URL is the source of truth for filters, sort and page, so views can be linked and shared
  const status = STATUSES.includes(params.get('status') as TicketStatus) ? (params.get('status') as TicketStatus) : undefined;
  const priority = PRIORITIES.includes(params.get('priority') as TicketPriority) ? (params.get('priority') as TicketPriority) : undefined;
  const atRisk = params.get('atRisk') === 'true';
  const sort = SORTS.includes(params.get('sort') as TicketSortKey) ? (params.get('sort') as TicketSortKey) : 'createdAt';
  const direction = params.get('direction') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const urlSearch = params.get('q') ?? '';

  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(search.trim());
  const [result, setResult] = useState<PageResponse<TicketResponse> | null>(null);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const update = useCallback(
    (patch: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, v);
      }
      if (resetPage) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  // Debounced search box → URL
  useEffect(() => {
    if (debouncedSearch !== urlSearch) update({ q: debouncedSearch || undefined });
  }, [debouncedSearch, urlSearch, update]);

  // Filtering, sorting and paging happen on the server, which returns only visible tickets
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for the new request
    setIsLoading(true);
    ticketService
      .getPage({ page, size: PAGE_SIZE, sort, direction, status, priority, atRisk: atRisk || undefined, search: urlSearch || undefined })
      .then((data) => {
        if (cancelled) return;
        // A page past the end (the list shrank) falls back to the last page
        if (data.content.length === 0 && data.page > 0 && data.totalPages > 0) {
          update({ page: String(data.totalPages - 1) }, false);
          return;
        }
        setResult(data);
        setLoadError(false);
      })
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, sort, direction, status, priority, atRisk, urlSearch, reloadKey, update]);

  // Status tab counts (all visible tickets, independent of the other filters)
  useEffect(() => {
    let cancelled = false;
    ticketService.getSummary().then((s) => !cancelled && setSummary(s)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const tickets = result?.content ?? [];
  const total = result?.totalElements ?? 0;
  const isFiltered = !!urlSearch || !!status || !!priority || atRisk;
  const canCreate = !!user && CAN_CREATE_TICKETS.includes(user.role);

  const statusCount = useMemo(
    () =>
      summary
        ? ({ OPEN: summary.open, IN_PROGRESS: summary.inProgress, RESOLVED: summary.resolved, CLOSED: summary.closed, CANCELLED: summary.cancelled } as Record<TicketStatus, number>)
        : null,
    [summary]
  );

  const sortBy = (key: TicketSortKey) =>
    update({ sort: key, direction: sort === key && direction === 'desc' ? 'asc' : 'desc' });
  const sorted = (key: TicketSortKey) => (sort === key ? direction : false);

  return (
    <PageContainer>
      <PageHeader
        title="Tickets"
        subtitle={result ? `${total.toLocaleString()} ticket${total !== 1 ? 's' : ''} found` : 'Loading tickets…'}
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />} onClick={refresh} disabled={isLoading}>
              Refresh
            </Button>
            {canCreate && (
              <Link href="/tickets/new" className={buttonClasses('primary', 'md')}>
                <Plus className="size-4" />
                New Ticket
              </Link>
            )}
          </>
        }
      />

      {/* Status tabs */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by status">
        <div className="flex min-w-max gap-1 border-b border-line">
          {[undefined, ...STATUSES].map((st) => {
            const active = status === st;
            const count = st ? statusCount?.[st] : summary?.total;
            return (
              <button
                key={st ?? 'ALL'}
                type="button"
                aria-pressed={active}
                onClick={() => update({ status: st })}
                className={cn(
                  'relative -mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-[13px] font-medium transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring rounded-t-md',
                  active ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                )}
              >
                {st ? STATUS_LABELS[st] : 'All'}
                {count !== undefined && (
                  <span className={cn('rounded-md px-1.5 py-px text-[11px] tabular', active ? 'bg-accent-soft text-accent-soft-fg' : 'bg-surface-3 text-fg-subtle')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <Input
          placeholder="Search by title, description or number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search tickets"
          leftAddon={<Search />}
          fieldClassName="lg:max-w-sm"
          rightAddon={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            ) : undefined
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filter by priority"
            selectSize="sm"
            value={priority ?? 'ALL'}
            onChange={(e) => update({ priority: e.target.value === 'ALL' ? undefined : e.target.value })}
            options={[{ value: 'ALL', label: 'All priorities' }, ...[...PRIORITIES].reverse().map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))]}
            fieldClassName="w-auto"
            className="w-[150px]"
          />
          <Select
            aria-label="Sort tickets"
            selectSize="sm"
            value={`${sort}:${direction}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(':');
              update({ sort: k, direction: d });
            }}
            options={SORT_OPTIONS.some((o) => o.value === `${sort}:${direction}`) ? SORT_OPTIONS : [...SORT_OPTIONS, { value: `${sort}:${direction}`, label: 'Custom order' }]}
            fieldClassName="w-auto"
            className="w-[180px]"
          />
          <button
            type="button"
            aria-pressed={atRisk}
            onClick={() => update({ atRisk: atRisk ? undefined : 'true' })}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              atRisk ? 'border-amber-line bg-amber-bg text-amber-fg' : 'border-line bg-surface text-fg-muted shadow-xs hover:text-fg hover:bg-surface-2'
            )}
          >
            <ShieldAlert className="size-4" />
            SLA at risk
          </button>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X className="size-3.5" />}
              onClick={() => {
                setSearch('');
                router.replace(pathname, { scroll: false });
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {loadError && result && (
        <RefreshErrorAlert
          className="mb-4"
          description="The tickets below are from an earlier request and may not match your current filters, sort or page."
          onRetry={refresh}
          retrying={isLoading}
        />
      )}

      <Card padding="none" className="@container overflow-hidden">
        {isLoading && !result ? (
          <SkeletonRows rows={8} />
        ) : loadError && !result ? (
          <ErrorState title="Tickets could not be loaded" onRetry={refresh} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<TicketIcon />}
            title={isFiltered ? 'No tickets match your filters' : 'No tickets yet'}
            description={isFiltered ? 'Try a different search, status or priority.' : 'Service requests you can see will appear here.'}
            action={
              isFiltered ? (
                <Button variant="secondary" size="sm" onClick={() => { setSearch(''); router.replace(pathname, { scroll: false }); }}>
                  Clear filters
                </Button>
              ) : canCreate ? (
                <Link href="/tickets/new" className={buttonClasses('primary', 'sm')}>
                  <Plus className="size-3.5" /> New Ticket
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className={cn('transition-opacity duration-200', isLoading && 'opacity-60')} aria-busy={isLoading}>
            {/* Wide containers: table (switches with the card width, so the sidebar state matters) */}
            <div className="hidden @[1000px]:block">
              <Table minWidth={992} caption="Tickets">
                {/* Title flexes; every other column has a fixed width shared by header and rows */}
                <colgroup>
                  <Col width={72} />
                  <Col />
                  <Col width={132} />
                  <Col width={124} />
                  <Col width={172} />
                  <Col width={108} />
                  <Col width={104} />
                </colgroup>
                <TableHead>
                  <tr>
                    <Th sortable sorted={sorted('id')} onSort={() => sortBy('id')}>#</Th>
                    <Th sortable sorted={sorted('title')} onSort={() => sortBy('title')}>Title</Th>
                    <Th sortable sorted={sorted('status')} onSort={() => sortBy('status')}>Status</Th>
                    <Th sortable sorted={sorted('priority')} onSort={() => sortBy('priority')}>Priority</Th>
                    <Th>Assignee</Th>
                    <Th>SLA</Th>
                    <Th sortable sorted={sorted('createdAt')} onSort={() => sortBy('createdAt')}>Created</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {tickets.map((t) => (
                    <Tr key={t.id} interactive onClick={() => router.push(`/tickets/${t.id}`)}>
                      <Td className="font-mono text-xs text-fg-subtle">#{t.id}</Td>
                      <Td>
                        <Link
                          href={`/tickets/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="line-clamp-2 font-medium text-fg transition-colors hover:text-accent-soft-fg focus-visible:outline-none focus-visible:underline wrap-anywhere"
                          title={t.title}
                        >
                          {t.title}
                        </Link>
                        <span className="mt-0.5 block truncate text-[11.5px] text-fg-subtle">{t.department}</span>
                      </Td>
                      <Td><StatusBadge status={t.status} /></Td>
                      <Td><PriorityBadge priority={t.priority} /></Td>
                      <Td>
                        {t.assignedTo ? (
                          <span className="flex min-w-0 items-center gap-2" title={t.assignedTo}>
                            <Avatar name={t.assignedTo} size="xs" />
                            <span className="truncate text-[12.5px] text-fg-muted">{t.assignedTo}</span>
                          </span>
                        ) : (
                          <span className="text-[12.5px] text-fg-subtle">Unassigned</span>
                        )}
                      </Td>
                      <Td>
                        <SlaIndicator compact status={t.status} escalationLevel={t.escalationLevel} responseBreached={t.responseBreached} resolutionBreached={t.resolutionBreached} />
                      </Td>
                      <Td className="whitespace-nowrap text-[12.5px] text-fg-muted">
                        <Tooltip content={formatDate(t.createdAt)}>
                          <time dateTime={t.createdAt} tabIndex={-1}>{formatRelative(t.createdAt)}</time>
                        </Tooltip>
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Narrower containers: cards */}
            <ul className="divide-y divide-line @[1000px]:hidden">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`} className="block px-4 py-3.5 transition-colors active:bg-surface-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[13.5px] font-medium leading-snug text-fg wrap-anywhere">
                        <span className="mr-1.5 font-mono text-[11px] text-fg-subtle">#{t.id}</span>
                        {t.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-fg-subtle">{formatRelative(t.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      <SlaIndicator compact status={t.status} escalationLevel={t.escalationLevel} responseBreached={t.responseBreached} resolutionBreached={t.resolutionBreached} />
                    </div>
                    <p className="mt-2 truncate text-[11.5px] text-fg-subtle">
                      {t.department} · {t.assignedTo ?? 'Unassigned'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result && tickets.length > 0 && (
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            totalElements={result.totalElements}
            size={result.size}
            itemLabel="tickets"
            onPageChange={(p) => update({ page: p ? String(p) : undefined }, false)}
            disabled={isLoading}
          />
        )}
      </Card>
    </PageContainer>
  );
}
