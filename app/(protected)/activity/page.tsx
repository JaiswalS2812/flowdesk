'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { activityService } from '@/services/activity.service';
import { ActivitySummary, AuditLogResponse, PageResponse } from '@/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PageHeader } from '@/components/layout/Sidebar';
import {
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableHead,
  TableBody,
  Th,
  Tr,
  Td,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormFields';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatRelative, cn } from '@/utils';
import {
  Activity,
  AlertTriangle,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Search,
  Ticket,
  UserCheck,
  Users,
  Bot,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

const PAGE_SIZE = 25;

const ACTION_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'SLA_BREACHED', label: 'SLA Breached' },
  { value: 'TICKET_STATUS_UPDATED', label: 'Status Updated' },
  { value: 'TICKET_ASSIGNED', label: 'Ticket Assigned' },
  { value: 'COMMENT_CREATED', label: 'Comment Added' },
  { value: 'TICKET_CREATED', label: 'Ticket Created' },
  { value: 'SLA_POLICY_UPDATED', label: 'SLA Policy Updated' },
  { value: 'SLA_POLICY_TOGGLED', label: 'SLA Policy Toggled' },
  { value: 'USER_ROLE_UPDATED', label: 'User Role Updated' },
  { value: 'USER_DEPARTMENT_UPDATED', label: 'User Department Updated' },
  { value: 'USER_DELETED', label: 'User Deleted' },
];

function ActionBadge({ action }: { action: string }) {
  switch (action) {
    case 'SLA_BREACHED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          SLA Breached
        </span>
      );
    case 'TICKET_CREATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <PlusCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          Created
        </span>
      );
    case 'TICKET_STATUS_UPDATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <RefreshCw className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          Status Updated
        </span>
      );
    case 'TICKET_ASSIGNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          Assigned
        </span>
      );
    case 'COMMENT_CREATED':
    case 'COMMENT_ADDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          <MessageSquare className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          Comment
        </span>
      );
    case 'SLA_POLICY_UPDATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          SLA Updated
        </span>
      );
    case 'SLA_POLICY_TOGGLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
          <Shield className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          SLA Toggled
        </span>
      );
    case 'USER_ROLE_UPDATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
          <UserCheck className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          Role Updated
        </span>
      );
    case 'USER_DEPARTMENT_UPDATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          Dept Updated
        </span>
      );
    case 'USER_DELETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          User Deleted
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {action.replace(/_/g, ' ')}
        </span>
      );
  }
}

export default function ActivityPage() {
  useRequireAuth({ allowedRoles: ['ADMIN'] });

  const [result, setResult] = useState<PageResponse<AuditLogResponse> | null>(null);
  const [metrics, setMetrics] = useState<ActivitySummary>({
    total: 0,
    slaBreaches: 0,
    statusChanges: 0,
    assignments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim());
  const { error } = useToast();

  // Search, filtering and paging happen on the server; the cards count every event
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      activityService.getPage({
        page: currentPage - 1,
        size: PAGE_SIZE,
        action: actionFilter === 'ALL' ? undefined : actionFilter,
        search: debouncedSearch || undefined,
      }),
      activityService.getSummary(),
    ])
      .then(([page, summary]) => {
        if (cancelled) return;
        if (page.content.length === 0 && page.page > 0 && page.totalPages > 0) {
          setCurrentPage(page.totalPages);
          return;
        }
        setResult(page);
        setMetrics(summary);
      })
      .catch(() => {
        if (!cancelled) {
          error('Failed to load activity log', 'Please check your connection and try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, actionFilter, debouncedSearch, reloadKey, error]);

  const fetchLogs = useCallback(() => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleActionFilterChange = (value: string) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('ALL');
    setCurrentPage(1);
  };

  const paginatedLogs = result?.content ?? [];
  const totalEvents = result?.totalElements ?? 0;
  const totalPages = Math.max(result?.totalPages ?? 1, 1);
  const safePage = (result?.page ?? 0) + 1;

  return (
    <div className="animate-fade-in pb-12">
      <PageHeader
        title="Audit Activity Log"
        subtitle="System-wide audit trail of ticket events, assignments, status changes, and SLA alerts"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Activity' },
        ]}
        action={
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
            onClick={fetchLogs}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Events</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">SLA Breaches</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{metrics.slaBreaches}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status Changes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.statusChanges}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assignments</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.assignments}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="p-4 border-slate-200">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search by ticket #, user email, or details..."
                aria-label="Search activity"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftAddon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                options={ACTION_FILTER_OPTIONS}
                aria-label="Filter by action"
                value={actionFilter}
                onChange={(e) => handleActionFilterChange(e.target.value)}
              />
            </div>
            {(search || actionFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="md"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card padding="none">
          {isLoading && !result ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paginatedLogs.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-6 h-6" />}
              title="No activity events found"
              description={
                search || actionFilter !== 'ALL'
                  ? 'No events match your current filter criteria.'
                  : 'System activity events will appear here once ticket actions occur.'
              }
              action={
                search || actionFilter !== 'ALL' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <Tr>
                      <Th className="w-44">Action</Th>
                      <Th className="w-36">Entity</Th>
                      <Th className="w-56">Performed By</Th>
                      <Th>Details</Th>
                      <Th className="w-48 text-right">Timestamp</Th>
                    </Tr>
                  </TableHead>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <Tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <Td className="whitespace-nowrap">
                          <ActionBadge action={log.action} />
                        </Td>
                        <Td className="whitespace-nowrap">
                          {log.entityType === 'TICKET' ? (
                            <Link
                              href={`/tickets/${log.entityId}`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline group"
                            >
                              <Ticket className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-700 shrink-0" />
                              <span>Ticket #{log.entityId}</span>
                            </Link>
                          ) : log.entityType === 'USER' ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>User #{log.entityId}</span>
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-700">
                              {log.entityType} #{log.entityId}
                            </span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {log.performedBy === 'SYSTEM' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <Bot className="w-3.5 h-3.5 text-slate-500" />
                              SYSTEM
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-900" title={log.performedBy}>
                              {log.performedBy}
                            </span>
                          )}
                        </Td>
                        <Td>
                          <span className="text-sm text-slate-600 leading-relaxed block max-w-xl truncate" title={log.details}>
                            {log.details || '—'}
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-slate-800">
                              {formatRelative(log.createdAt)}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-medium text-slate-900">
                    {(safePage - 1) * PAGE_SIZE + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-slate-900">
                    {Math.min(safePage * PAGE_SIZE, totalEvents)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-slate-900">
                    {totalEvents}
                  </span>{' '}
                  events
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1 || isLoading}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 px-2 font-medium">
                      Page {safePage} of {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages || isLoading}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

