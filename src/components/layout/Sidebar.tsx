'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils';
import { ROLE_LABELS } from '@/utils';
import {
  LayoutDashboard,
  Ticket,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  Activity,
  Menu,
  X,
  Shield,
  KeyRound,
} from 'lucide-react';
import { Role } from '@/types';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: <Ticket className="w-4 h-4" />,
  },
  {
    label: 'New Ticket',
    href: '/tickets/new',
    icon: <Plus className="w-4 h-4" />,
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: <Users className="w-4 h-4" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Activity',
    href: '/activity',
    icon: <Activity className="w-4 h-4" />,
    roles: ['ADMIN'],
  },
  {
    label: 'SLA Policies',
    href: '/sla-policies',
    icon: <Shield className="w-4 h-4" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Account',
    href: '/account',
    icon: <KeyRound className="w-4 h-4" />,
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-slate-100',
          collapsed && 'justify-center px-3'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-slate-900 text-sm">FlowDesk</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Service Management</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  'shrink-0',
                  isActive ? 'text-brand-600' : 'text-slate-400'
                )}
              >
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn('border-t border-slate-100 p-3', collapsed && 'px-2')}>
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium',
            'text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors hidden lg:flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center text-slate-600"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 relative',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-slate-200 transition-all duration-300 relative shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// ─── App Layout wrapper ───────────────────────────────────────────────────────

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="px-6 lg:px-8 pt-8 pb-6 border-b border-slate-100 bg-white/60 backdrop-blur-sm">
      {breadcrumb && (
        <nav className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-slate-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-600">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {action}
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}

