'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  UserCheck,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  Archive,
  Clock,
  AlertOctagon,
  Shield,
  Building2,
  CheckCheck,
  Loader2,
  BellOff,
  ChevronRight,
} from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { NotificationResponse, NotificationType } from '@/types';
import { formatNotificationTime, cn, Tone, TONE_SOFT, plural } from '@/utils';
import { useToast } from '@/components/ui/Toast';
import { SegmentedControl } from '@/components/ui/Controls';
import { ErrorState } from '@/components/ui/Feedback';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ComponentType<{ className?: string }>; tone: Tone }> = {
  TICKET_ASSIGNED: { icon: UserCheck, tone: 'violet' },
  TICKET_STATUS_CHANGED: { icon: RefreshCw, tone: 'blue' },
  NEW_COMMENT: { icon: MessageSquare, tone: 'teal' },
  TICKET_RESOLVED: { icon: CheckCircle2, tone: 'green' },
  TICKET_CLOSED: { icon: Archive, tone: 'neutral' },
  SLA_WARNING: { icon: Clock, tone: 'amber' },
  SLA_BREACHED: { icon: AlertOctagon, tone: 'red' },
  USER_ROLE_CHANGED: { icon: Shield, tone: 'accent' },
  USER_DEPARTMENT_CHANGED: { icon: Building2, tone: 'blue' },
};

const DEFAULT_CONFIG = { icon: Bell, tone: 'neutral' as Tone };
const PAGE_SIZE = 20;
// Persistent notifications are polled (no WebSockets/SSE): the unread count refreshes every
// minute while the tab is visible, the list loads when the panel opens
const POLL_INTERVAL_MS = 60_000;

function targetOf(n: NotificationResponse): string | null {
  if (n.entityType === 'TICKET' && n.entityId) return `/tickets/${n.entityId}`;
  // Role/department changes concern the recipient's own account
  if (n.entityType === 'USER') return '/account';
  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const { info } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const lastCount = useRef<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Unread count on load, then every minute while the tab is visible
  useEffect(() => {
    let mounted = true;
    const refreshCount = () => {
      if (document.visibilityState !== 'visible') return;
      notificationService
        .getUnreadCount()
        .then((res) => {
          if (!mounted) return;
          // A gentle heads-up when the poll finds new notifications (not on first load)
          if (lastCount.current !== null && res.unreadCount > lastCount.current) {
            const added = res.unreadCount - lastCount.current;
            info(`${plural(added, 'new notification')}`, 'Open the bell to see what changed.');
          }
          lastCount.current = res.unreadCount;
          setUnreadCount(res.unreadCount);
        })
        .catch(() => {
          // The badge keeps its last value
        });
    };

    refreshCount();
    const timer = setInterval(refreshCount, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshCount);
    return () => {
      mounted = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshCount);
    };
  }, [info]);

  const setCount = (count: number) => {
    lastCount.current = count;
    setUnreadCount(count);
  };

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const [page, countRes] = await Promise.all([
        notificationService.getPage({ size: PAGE_SIZE }),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(page.content);
      setNextPage(page.page + 1 < page.totalPages ? page.page + 1 : null);
      lastCount.current = countRes.unreadCount;
      setUnreadCount(countRes.unreadCount);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOlder = async () => {
    if (nextPage === null || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await notificationService.getPage({ page: nextPage, size: PAGE_SIZE });
      // New notifications may have shifted the pages; skip any already shown
      setNotifications((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...page.content.filter((n) => !seen.has(n.id))];
      });
      setNextPage(page.page + 1 < page.totalPages ? page.page + 1 : null);
    } catch {
      // The button stays so the user can try again
    } finally {
      setIsLoadingMore(false);
    }
  };

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      setIsOpen(true);
      void loadNotifications();
    }
  };

  // Focus the panel when it opens; close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  const handleClick = async (n: NotificationResponse) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setCount(Math.max(0, unreadCount - 1));
      try {
        await notificationService.markAsRead(n.id);
      } catch {
        // Keeps the optimistic state; the next refresh corrects it
      }
    }
    const target = targetOf(n);
    close(false);
    if (target) router.push(target);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch {
      void loadNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const shown = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        className={cn(
          'relative grid size-9 place-items-center rounded-lg border transition-[background-color,border-color,color,transform] duration-150 active:scale-95 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isOpen ? 'border-line bg-surface-2 text-fg' : 'border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg'
        )}
      >
        <Bell className={cn('size-[18px]', unreadCount > 0 && !isOpen && 'origin-top motion-safe:animate-[bell_2.4s_ease-in-out_1]')} />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-canvas bg-red px-1 text-[10px] font-bold leading-none text-white tabular animate-pop"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-panel"
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label="Notifications"
          className={cn(
            'popover-motion fixed inset-x-3 top-[60px] z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-xl focus:outline-none',
            'sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[400px]'
          )}
          data-state="open"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-fg">Notifications</h2>
              {unreadCount > 0 && (
                <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-accent-soft-fg tabular">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent-soft-fg transition-colors hover:bg-accent-soft disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isMarkingAll ? <Loader2 className="size-3 animate-spin" /> : <CheckCheck className="size-3.5" />}
                Mark all as read
              </button>
            )}
          </div>

          <div className="border-b border-line px-4 py-2">
            <SegmentedControl
              label="Show notifications"
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread', count: unreadCount },
              ]}
            />
          </div>

          <div className="max-h-[min(440px,calc(100dvh-180px))] overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="space-y-1 p-2" aria-label="Loading notifications" role="status">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-2.5">
                    <div className="skeleton size-8 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-3/4 rounded" />
                      <div className="skeleton h-2.5 w-full rounded" />
                      <div className="skeleton h-2 w-1/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <ErrorState title="Unable to load notifications" description="Check your connection and try again." onRetry={loadNotifications} />
            ) : shown.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl border border-line bg-surface-2 text-fg-subtle">
                  {filter === 'unread' ? <CheckCheck className="size-5 text-green" /> : <BellOff className="size-5" />}
                </div>
                <p className="text-sm font-semibold text-fg">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-fg-muted">
                  {filter === 'unread' ? 'No unread notifications.' : 'Assignments, status changes and SLA alerts will appear here.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {shown.map((n) => {
                  const config = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
                  const Icon = config.icon;
                  const target = targetOf(n);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className={cn(
                          'group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
                          'focus-visible:outline-none focus-visible:bg-surface-2',
                          n.read ? 'hover:bg-surface-2' : 'bg-accent-soft/35 hover:bg-accent-soft/60'
                        )}
                      >
                        {!n.read && <span className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent" aria-hidden />}
                        <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border', TONE_SOFT[config.tone])}>
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-[13px] leading-snug', n.read ? 'font-medium text-fg-muted' : 'font-semibold text-fg')}>
                            {n.title}
                            {!n.read && <span className="sr-only"> (unread)</span>}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted line-clamp-2 wrap-anywhere">{n.message}</span>
                          <span className="mt-1 block text-[11px] text-fg-subtle">{formatNotificationTime(n.createdAt)}</span>
                        </span>
                        {target && (
                          <ChevronRight className="mt-2 size-4 shrink-0 text-fg-subtle opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!isLoading && !error && nextPage !== null && filter === 'all' && (
              <button
                type="button"
                onClick={loadOlder}
                disabled={isLoadingMore}
                className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 text-xs font-medium text-accent-soft-fg transition-colors hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoadingMore && <Loader2 className="size-3 animate-spin" />}
                Load older notifications
              </button>
            )}
          </div>
          <p className="border-t border-line bg-surface-2/60 px-4 py-2 text-[11px] text-fg-subtle">
            Unread count refreshes every minute while this tab is open.
          </p>
        </div>
      )}
    </div>
  );
}
