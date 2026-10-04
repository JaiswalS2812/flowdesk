'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService } from '@/services/ticket.service';
import { TicketResponse } from '@/types';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card, CardHeader, EmptyState, Skeleton } from '@/components/ui/Card';
import { StatusBadge, PriorityBadge, SlaIndicator } from '@/components/tickets/Badges';
import { Button } from '@/components/ui/Button';
import { formatRelative, PRIORITY_CHART_COLORS } from '@/utils';
import Link from 'next/link';
import {
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Stats computation ────────────────────────────────────────────────────────

function computeStats(tickets: TicketResponse[]) {
  return {
    total:      tickets.length,
    open:       tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved:   tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    breached:   tickets.filter((t) => t.responseBreached || t.resolutionBreached).length,
  };
}

function computePriorityData(tickets: TicketResponse[]) {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  tickets.forEach((t) => counts[t.priority]++);
  return [
    { name: 'Low',      value: counts.LOW,      color: PRIORITY_CHART_COLORS.LOW },
    { name: 'Medium',   value: counts.MEDIUM,   color: PRIORITY_CHART_COLORS.MEDIUM },
    { name: 'High',     value: counts.HIGH,     color: PRIORITY_CHART_COLORS.HIGH },
    { name: 'Critical', value: counts.CRITICAL, color: PRIORITY_CHART_COLORS.CRITICAL },
  ];
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  isLoading: boolean;
  className?: string;
}

function KpiCard({ label, value, icon, iconClass, isLoading, className }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          {icon}
        </div>
      </div>
      {isLoading ? (
        <div className="skeleton h-9 w-12" />
      ) : (
        <p className="text-[32px] font-semibold text-slate-900 tracking-tight leading-none animate-count">
          {value}
        </p>
      )}
    </div>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="text-slate-500 mt-0.5">{payload[0].value} ticket{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ticketService.getAll();
      setTickets(data);
      setError(null);
    } catch {
      setError('Could not load tickets. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      try {
        const data = await ticketService.getAll();
        if (!cancelled) {
          setTickets(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load tickets. Please refresh.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats        = computeStats(tickets);
  const priorityData = computePriorityData(tickets);
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  const slaWarnings = tickets.filter(
    (t) => t.escalationLevel === 'WARNING' || t.escalationLevel === 'BREACHED'
  );

  const canCreate =
    user?.role === 'EMPLOYEE' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const firstName = user?.name?.split(' ')[0] ?? 'User';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle={`Here's what's happening across your ${user?.department ?? 'team'} tickets`}
        action={
          canCreate && (
            <Link href="/tickets/new">
              <Button leftIcon={<Plus className="w-3.5 h-3.5" />} size="md">
                New Ticket
              </Button>
            </Link>
          )
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-5">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchTickets}
              className="text-xs font-semibold underline hover:no-underline text-red-800 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            label="Total"
            value={stats.total}
            icon={<Layers className="w-4 h-4 text-slate-500" />}
            iconClass="bg-slate-100"
            isLoading={isLoading}
          />
          <KpiCard
            label="Open"
            value={stats.open}
            icon={<Clock className="w-4 h-4 text-blue-600" />}
            iconClass="bg-blue-50"
            isLoading={isLoading}
          />
          <KpiCard
            label="In Progress"
            value={stats.inProgress}
            icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
            iconClass="bg-amber-50"
            isLoading={isLoading}
          />
          <KpiCard
            label="Resolved"
            value={stats.resolved}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            iconClass="bg-emerald-50"
            isLoading={isLoading}
          />
          <KpiCard
            label="SLA Breached"
            value={stats.breached}
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
            iconClass="bg-red-50"
            isLoading={isLoading}
            className="col-span-2 md:col-span-1"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Priority chart */}
          <Card className="xl:col-span-1" padding="md">
            <CardHeader
              title="Tickets by Priority"
              subtitle="Current distribution"
            />
            {isLoading ? (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <EmptyState
                icon={<Ticket className="w-5 h-5" />}
                title="No ticket data"
                description="Create tickets to see priority distribution."
              />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart
                  data={priorityData}
                  barSize={26}
                  margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Recent Tickets */}
          <Card className="xl:col-span-2" padding="none">
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
                  Recent Tickets
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest activity</p>
              </div>
              <Link href="/tickets">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  View all
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="px-5 pb-5 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-[52px] w-full" />
                ))}
              </div>
            ) : recentTickets.length === 0 ? (
              <EmptyState
                icon={<Ticket className="w-5 h-5" />}
                title="No tickets yet"
                description="Submit your first service request to get started."
                action={
                  canCreate && (
                    <Link href="/tickets/new">
                      <Button size="sm" leftIcon={<Plus className="w-3 h-3" />}>
                        New Ticket
                      </Button>
                    </Link>
                  )
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    {/* ID pill */}
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 w-8">
                      #{ticket.id}
                    </span>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-brand-700 transition-colors leading-snug">
                        {ticket.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                        {ticket.department}&nbsp;·&nbsp;{formatRelative(ticket.createdAt)}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* SLA Alerts */}
        {!isLoading && slaWarnings.length > 0 && (
          <Card padding="md">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">SLA Alerts</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {slaWarnings.length} ticket{slaWarnings.length > 1 ? 's' : ''} require attention
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {slaWarnings.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className={[
                    'flex items-center gap-4 px-4 py-3 rounded-lg border transition-all group',
                    ticket.escalationLevel === 'BREACHED'
                      ? 'border-red-100 bg-red-50/60 hover:border-red-200 hover:bg-red-50'
                      : 'border-amber-100 bg-amber-50/60 hover:border-amber-200 hover:bg-amber-50',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-slate-900">
                      #{ticket.id} · {ticket.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ticket.department}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <PriorityBadge priority={ticket.priority} />
                    <SlaIndicator
                      escalationLevel={ticket.escalationLevel}
                      responseBreached={ticket.responseBreached}
                      resolutionBreached={ticket.resolutionBreached}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

