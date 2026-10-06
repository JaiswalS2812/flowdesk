'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/services/notification.service';
import { NotificationResponse, NotificationType } from '@/types';
import { formatNotificationTime, cn } from '@/utils';
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
  Building,
  CheckCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  TICKET_ASSIGNED: {
    icon: UserCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  TICKET_STATUS_CHANGED: {
    icon: RefreshCw,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
  },
  NEW_COMMENT: {
    icon: MessageSquare,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  TICKET_RESOLVED: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  TICKET_CLOSED: {
    icon: Archive,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  SLA_WARNING: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  SLA_BREACHED: {
    icon: AlertOctagon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  USER_ROLE_CHANGED: {
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  USER_DEPARTMENT_CHANGED: {
    icon: Building,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
};

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 60_000;

const DEFAULT_CONFIG: TypeConfig = {
  icon: Bell,
  color: 'text-slate-600',
  bgColor: 'bg-slate-100',
};

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Unread count on load, then every minute while the tab is visible
  useEffect(() => {
    let mounted = true;
    const refreshCount = () => {
      if (document.visibilityState !== 'visible') return;
      notificationService
        .getUnreadCount()
        .then((res) => {
          if (mounted) {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => {
          // The badge simply keeps its last value
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
  }, []);

  // The newest page of notifications and the unread count, when opened
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [page, countRes] = await Promise.all([
        notificationService.getPage({ size: PAGE_SIZE }),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(page.content);
      setNextPage(page.page + 1 < page.totalPages ? page.page + 1 : null);
      setUnreadCount(countRes.unreadCount);
    } catch {
      setError('Unable to load notifications');
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

  // Popover toggle
  const toggleDropdown = () => {
    if (!isOpen) {
      setIsOpen(true);
      void loadNotifications();
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif: NotificationResponse) => {
    if (!notif.read) {
      // Optimistic local update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationService.markAsRead(notif.id);
      } catch {
        // Silently preserve local state
      }
    }

    setIsOpen(false);

    if (notif.entityType === 'TICKET' && notif.entityId) {
      router.push(`/tickets/${notif.entityId}`);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistic local update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch {
      // Re-sync on failure
      void loadNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={isOpen}
        className={cn(
          'relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-150',
          isOpen
            ? 'bg-slate-100 border-slate-300 text-slate-900'
            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm animate-fade-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="region"
          aria-label="Notifications popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Mark all as read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              // Loading Skeleton State
              <div className="p-3 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-slate-100 animate-pulse rounded" />
                      <div className="h-2.5 w-full bg-slate-100 animate-pulse rounded" />
                      <div className="h-2 w-1/3 bg-slate-100 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error State
              <div className="py-8 px-4 text-center">
                <AlertCircle className="w-7 h-7 text-red-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">{error}</p>
                <button
                  type="button"
                  onClick={loadNotifications}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              // Empty State
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto mb-2.5 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800">You&apos;re all caught up</p>
                <p className="text-xs text-slate-500 mt-1">New notifications will appear here.</p>
              </div>
            ) : (
              // Notification List
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
                const Icon = config.icon;

                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'w-full text-left p-3.5 flex items-start gap-3 transition-colors duration-150 cursor-pointer',
                      !notif.read
                        ? 'bg-brand-50/40 hover:bg-brand-50/70'
                        : 'bg-white hover:bg-slate-50/80'
                    )}
                  >
                    {/* Type Icon */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        config.bgColor
                      )}
                    >
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-xs truncate',
                            !notif.read
                              ? 'font-semibold text-slate-900'
                              : 'font-medium text-slate-700'
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span
                            className="w-2 h-2 rounded-full bg-brand-600 shrink-0"
                            title="Unread"
                          />
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-xs mt-0.5 line-clamp-2 leading-relaxed',
                          !notif.read ? 'text-slate-600' : 'text-slate-500'
                        )}
                      >
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatNotificationTime(notif.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
            {!isLoading && !error && nextPage !== null && (
              <button
                type="button"
                onClick={loadOlder}
                disabled={isLoadingMore}
                className="w-full py-2.5 text-xs font-medium text-brand-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
                Load older notifications
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
