'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import * as RadixDialog from '@radix-ui/react-dialog';
import { ChevronRight, LogOut, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Search, UserRound, LifeBuoy, X, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, ROLE_LABELS } from '@/utils';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui/Controls';
import { Kbd } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeMenu } from '@/components/layout/ThemeSwitcher';
import { Footer } from '@/components/layout/Footer';
import { breadcrumbsFor, isActive, navFor } from '@/components/layout/nav';
import { UserResponse } from '@/types';
import { useIsMac } from '@/hooks/useIsMac';

// Loaded on first use: neither is needed for the first paint of a page
const CommandPalette = dynamic(() => import('@/components/layout/CommandPalette').then((m) => m.CommandPalette), { ssr: false });
const Assistant = dynamic(() => import('@/components/assistant/Assistant').then((m) => m.Assistant), { ssr: false });

const SIDEBAR_KEY = 'flowdesk_sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);

  // The init script already applied the stored state to <html>; mirror it for labels/tooltips
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the pre-paint DOM state once
    setCollapsed(document.documentElement.getAttribute('data-sidebar') === 'collapsed');
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (next) document.documentElement.setAttribute('data-sidebar', 'collapsed');
      else document.documentElement.removeAttribute('data-sidebar');
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        // Not persisted
      }
      return next;
    });
  }, []);

  const openPalette = useCallback(() => {
    setPaletteLoaded(true);
    setPaletteOpen(true);
  }, []);

  // Ctrl/⌘ K opens the command menu; Ctrl/⌘ \ toggles the sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteLoaded(true);
        setPaletteOpen((o) => !o);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  // Close the mobile drawer on navigation
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-sidebar lg:flex',
          'w-[248px] collapsed:w-[68px] transition-[width] duration-300 ease-[var(--ease-out)]'
        )}
        aria-label="Sidebar"
      >
        <SidebarContent user={user} collapsed={collapsed} pathname={pathname} onToggle={toggleSidebar} onSearch={openPalette} />
      </aside>

      {/* Mobile drawer */}
      <RadixDialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="overlay-motion fixed inset-0 z-50 bg-overlay lg:hidden" />
          <RadixDialog.Content
            className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,86vw)] flex-col border-r border-line bg-sidebar shadow-xl animate-slide-in-left focus:outline-none lg:hidden"
            aria-describedby={undefined}
          >
            <RadixDialog.Title className="sr-only">Navigation</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label="Close navigation" size="sm" className="absolute right-3 top-3.5">
                <X className="size-4" />
              </IconButton>
            </RadixDialog.Close>
            <SidebarContent user={user} collapsed={false} pathname={pathname} mobile onSearch={() => { setMobileOpen(false); openPalette(); }} />
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar pathname={pathname} onMenu={() => setMobileOpen(true)} onSearch={openPalette} user={user} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <div key={pathname} className="animate-enter">
            {children}
          </div>
        </main>
        <Footer role={user?.role} />
      </div>

      {paletteLoaded && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}
      <Assistant />
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function SidebarContent({
  user,
  collapsed,
  pathname,
  onToggle,
  onSearch,
  mobile,
}: {
  user: UserResponse | null;
  collapsed: boolean;
  pathname: string;
  onToggle?: () => void;
  onSearch: () => void;
  mobile?: boolean;
}) {
  // On desktop the collapsed look is driven by the html attribute (no flash on load), so
  // `collapsed:` classes apply only when not rendering the mobile drawer
  const sections = navFor(user?.role);
  const mod = useIsMac() ? '⌘' : 'Ctrl'; // the shortcuts accept both Ctrl and ⌘

  return (
    <>
      <div className={cn('flex h-16 shrink-0 items-center gap-2 px-4', !mobile && 'collapsed:justify-center collapsed:px-0')}>
        <Link href="/dashboard" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="FlowDesk home">
          <span className={cn('inline-flex', !mobile && 'collapsed:hidden')}>
            <Logo subtitle="Service Management" />
          </span>
          <span className={cn('hidden', !mobile && 'collapsed:inline-flex')}>
            <LogoMark className="size-8" />
          </span>
        </Link>
      </div>

      <div className={cn('px-3 pb-2', !mobile && 'collapsed:px-2.5')}>
        <Tooltip content={<span>Search & commands <span className="opacity-60">{mod} K</span></span>} side="right" disabled={!collapsed || mobile}>
          <button
            type="button"
            onClick={onSearch}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-fg-subtle shadow-xs transition-colors hover:border-line-strong hover:text-fg-muted cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !mobile && 'collapsed:justify-center collapsed:px-0'
            )}
            aria-label="Search and commands"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className={cn('flex-1 text-left', !mobile && 'collapsed:hidden')}>Search…</span>
            <span className={cn('flex gap-0.5', !mobile && 'collapsed:hidden')} aria-hidden>
              <Kbd>{mod}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </Tooltip>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
        {sections.map((section, si) => (
          <div key={section.title} className={cn(si > 0 && 'mt-5')}>
            <p className={cn('mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-subtle', !mobile && 'collapsed:sr-only')}>
              {section.title}
            </p>
            {!mobile && si > 0 && <div className="mx-2 mb-2 hidden h-px bg-line collapsed:block" aria-hidden />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Tooltip content={item.label} side="right" disabled={!collapsed || mobile}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          !mobile && 'collapsed:justify-center collapsed:px-0',
                          active ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                        )}
                      >
                        {active && (
                          <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" aria-hidden />
                        )}
                        <Icon
                          className={cn(
                            'size-[17px] shrink-0 transition-transform duration-200 group-hover:scale-105',
                            active ? 'text-accent' : 'text-fg-subtle group-hover:text-fg-muted'
                          )}
                          aria-hidden
                        />
                        <span className={cn('truncate', !mobile && 'collapsed:sr-only')}>{item.label}</span>
                      </Link>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-line p-3', !mobile && 'collapsed:px-2.5')}>
        {user && <AccountMenu user={user} collapsed={collapsed && !mobile} mobile={mobile} />}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? `Expand sidebar (${mod} \\)` : `Collapse sidebar (${mod} \\)`}
            className={cn(
              'mt-1 flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring collapsed:justify-center collapsed:px-0'
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            <span className="collapsed:sr-only">Collapse</span>
          </button>
        )}
      </div>
    </>
  );
}

// ─── Account menu ────────────────────────────────────────────────────────────

function AccountMenu({
  user,
  collapsed,
  mobile,
  compact,
}: {
  user: UserResponse;
  collapsed?: boolean;
  mobile?: boolean;
  compact?: boolean;
}) {
  const { logout } = useAuth();
  return (
    <Menu>
      <MenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label={`Account menu for ${user.name}`}
          >
            <Avatar name={user.name} seed={user.email} size="md" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Account menu for ${user.name}`}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-surface-2 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-surface-2',
              !mobile && 'collapsed:justify-center collapsed:p-1'
            )}
          >
            <Avatar name={user.name} seed={user.email} size="md" />
            <span className={cn('min-w-0 flex-1', !mobile && 'collapsed:hidden')}>
              <span className="block truncate text-[13px] font-semibold text-fg">{user.name}</span>
              <span className="block truncate text-[11px] text-fg-subtle">
                {ROLE_LABELS[user.role]} · {user.department}
              </span>
            </span>
            <ChevronsUpDown className={cn('size-3.5 shrink-0 text-fg-subtle', !mobile && 'collapsed:hidden')} aria-hidden />
          </button>
        )}
      </MenuTrigger>
      <MenuContent align={compact ? 'end' : 'start'} side={compact ? 'bottom' : collapsed ? 'right' : 'top'} className="w-64">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <Avatar name={user.name} seed={user.email} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-fg">{user.name}</p>
            <p className="truncate text-xs text-fg-subtle">{user.email}</p>
          </div>
        </div>
        <MenuSeparator />
        <MenuItem asChild>
          <Link href="/account">
            <UserRound className="size-4 text-fg-subtle" aria-hidden />
            <span className="flex-1">Account & security</span>
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/help">
            <LifeBuoy className="size-4 text-fg-subtle" aria-hidden />
            <span className="flex-1">Help Center</span>
          </Link>
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<LogOut />} onSelect={logout} danger>
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function Topbar({
  pathname,
  onMenu,
  onSearch,
  user,
}: {
  pathname: string;
  onMenu: () => void;
  onSearch: () => void;
  user: UserResponse | null;
}) {
  const crumbs = breadcrumbsFor(pathname);
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/70">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <IconButton label="Open navigation" onClick={onMenu} className="-ml-1.5 lg:hidden">
          <MenuIcon className="size-[18px]" />
        </IconButton>
        <Link href="/dashboard" className="lg:hidden" aria-label="FlowDesk home">
          <LogoMark className="size-7" />
        </Link>

        <nav aria-label="Breadcrumb" className="ml-1 hidden min-w-0 flex-1 sm:block lg:ml-0">
          <ol className="flex items-center gap-1 text-[13px]">
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />}
                {crumb.href ? (
                  <Link href={crumb.href} className="truncate text-fg-muted transition-colors hover:text-fg">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn('truncate', i === crumbs.length - 1 ? 'font-medium text-fg' : 'text-fg-muted')} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex-1 sm:hidden" />

        <div className="flex items-center gap-1.5">
          <IconButton label="Search and commands" onClick={onSearch} className="lg:hidden">
            <Search className="size-[18px]" />
          </IconButton>
          <ThemeMenu />
          <NotificationBell />
          {user && (
            <div className="lg:hidden">
              <AccountMenu user={user} compact />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
