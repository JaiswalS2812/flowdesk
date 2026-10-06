"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ticketService } from "@/services/ticket.service";
import {
  PageResponse,
  TicketResponse,
  TicketStatus,
  TicketPriority,
} from "@/types";
import { PageHeader } from "@/components/layout/Sidebar";
import {
  Card,
  EmptyState,
  Skeleton,
} from "@/components/ui/Card";
import {
  StatusBadge,
  PriorityBadge,
  SlaIndicator,
} from "@/components/tickets/Badges";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatRelative, cn } from "@/utils";
import {
  Plus,
  Search,
  Ticket,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type SortKey = "id" | "title" | "status" | "priority" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const STATUS_FILTER_OPTIONS: { label: string; value: TicketStatus | "ALL" }[] =
  [
    { label: "All Statuses", value: "ALL" },
    { label: "Open", value: "OPEN" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Closed", value: "CLOSED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

const PRIORITY_FILTER_OPTIONS: {
  label: string;
  value: TicketPriority | "ALL";
}[] = [
  { label: "All Priorities", value: "ALL" },
  { label: "Critical", value: "CRITICAL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

function SortIcon({
  field,
  sortKey,
  sortDir,
}: {
  field: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (field !== sortKey) return <span className="text-slate-300 ml-1">↕</span>;
  return sortDir === "asc" ? (
    <ChevronUp className="inline w-3 h-3 ml-1 text-brand-600" />
  ) : (
    <ChevronDown className="inline w-3 h-3 ml-1 text-brand-600" />
  );
}

export default function TicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<PageResponse<TicketResponse> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">(
    "ALL",
  );
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim());

  // Filtering, sorting and paging happen on the server
  useEffect(() => {
    let cancelled = false;

    ticketService
      .getPage({
        page,
        size: PAGE_SIZE,
        sort: sortKey,
        direction: sortDir,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        priority: priorityFilter === "ALL" ? undefined : priorityFilter,
        search: debouncedSearch || undefined,
      })
      .then((data) => {
        if (cancelled) return;
        // A page past the end (the list shrank) falls back to the last page
        if (data.content.length === 0 && data.page > 0 && data.totalPages > 0) {
          setPage(data.totalPages - 1);
          return;
        }
        setResult(data);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, sortKey, sortDir, statusFilter, priorityFilter, debouncedSearch, reloadKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const tickets = result?.content ?? [];
  const total = result?.totalElements ?? 0;
  const isFiltered =
    !!debouncedSearch || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const canCreate =
    user?.role === "EMPLOYEE" ||
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";

  const thClass = (key: SortKey) =>
    cn(
      "cursor-pointer select-none hover:text-slate-700 transition-colors whitespace-nowrap",
      sortKey === key && "text-brand-700",
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tickets"
        subtitle={`${total} ticket${total !== 1 ? "s" : ""} found`}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tickets" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={refresh}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            {canCreate && (
              <Link href="/tickets/new">
                <Button leftIcon={<Plus className="w-4 h-4" />} size="md">
                  New Ticket
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-4">
        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search tickets"
                leftAddon={<Search className="w-4 h-4" />}
              />
            </div>

            <select
              value={statusFilter}
              aria-label="Filter by status"
              onChange={(e) => {
                setStatusFilter(e.target.value as TicketStatus | "ALL");
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              aria-label="Filter by priority"
              onChange={(e) => {
                setPriorityFilter(e.target.value as TicketPriority | "ALL");
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {PRIORITY_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Table */}
        <Card padding="none">
          {isLoading && !result ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : loadError && !result ? (
            <EmptyState
              icon={<Ticket className="w-6 h-6" />}
              title="Tickets could not be loaded"
              description="Check your connection and try again."
              action={
                <Button size="sm" variant="secondary" onClick={refresh}>
                  Try again
                </Button>
              }
            />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<Ticket className="w-6 h-6" />}
              title={
                isFiltered ? "No tickets match your filters" : "No tickets yet"
              }
              description={
                isFiltered
                  ? "Try adjusting your search or filters."
                  : "Submit your first service request to get started."
              }
              action={
                canCreate && (
                  <Link href="/tickets/new">
                    <Button
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      New Ticket
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th
                      className={cn(
                        "w-[70px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                        thClass("id"),
                      )}
                      onClick={() => handleSort("id")}
                    >
                      #
                      <SortIcon
                        field="id"
                        sortKey={sortKey}
                        sortDir={sortDir}
                      />
                    </th>

                    <th
                      className={cn(
                        "w-[30%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                        thClass("title"),
                      )}
                      onClick={() => handleSort("title")}
                    >
                      Title
                      <SortIcon
                        field="title"
                        sortKey={sortKey}
                        sortDir={sortDir}
                      />
                    </th>

                    <th
                      className={cn(
                        "w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell",
                        thClass("status"),
                      )}
                      onClick={() => handleSort("status")}
                    >
                      Status
                      <SortIcon
                        field="status"
                        sortKey={sortKey}
                        sortDir={sortDir}
                      />
                    </th>

                    <th
                      className={cn(
                        "w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell",
                        thClass("priority"),
                      )}
                      onClick={() => handleSort("priority")}
                    >
                      Priority
                      <SortIcon
                        field="priority"
                        sortKey={sortKey}
                        sortDir={sortDir}
                      />
                    </th>

                    <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                      Department
                    </th>

                    <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell">
                      Assigned To
                    </th>

                    <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">
                      SLA
                    </th>

                    <th
                      className={cn(
                        "w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell",
                        thClass("createdAt"),
                      )}
                      onClick={() => handleSort("createdAt")}
                    >
                      Created
                      <SortIcon
                        field="createdAt"
                        sortKey={sortKey}
                        sortDir={sortDir}
                      />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4 font-mono text-xs text-slate-400">
                        #{ticket.id}
                      </td>

                      <td className="px-4 py-4 min-w-0">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="block truncate font-medium text-slate-900 hover:text-brand-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={ticket.title}
                        >
                          {ticket.title}
                        </Link>
                      </td>

                      <td className="px-4 py-4 hidden sm:table-cell">
                        <StatusBadge status={ticket.status} />
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      <td className="px-4 py-4 hidden lg:table-cell text-xs text-slate-500 truncate">
                        {ticket.department}
                      </td>

                      <td className="px-4 py-4 hidden xl:table-cell text-xs text-slate-500 truncate">
                        {ticket.assignedTo ?? (
                          <span className="text-slate-300">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-4 hidden lg:table-cell">
                        <SlaIndicator
                          escalationLevel={ticket.escalationLevel}
                          responseBreached={ticket.responseBreached}
                          resolutionBreached={ticket.resolutionBreached}
                          compact
                        />
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell text-xs text-slate-400 whitespace-nowrap">
                        {formatRelative(ticket.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result && tickets.length > 0 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              totalElements={result.totalElements}
              size={result.size}
              itemLabel="tickets"
              onPageChange={setPage}
              disabled={isLoading}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
