'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import * as RadixDialog from '@radix-ui/react-dialog';
import { ArrowRight, BookOpen, Hash, Loader2, LogOut, Search, Ticket as TicketIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ticketService } from '@/services/ticket.service';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { TicketResponse } from '@/types';
import { navFor } from '@/components/layout/nav';
import { THEME_OPTIONS } from '@/components/layout/ThemeSwitcher';
import { StatusBadge } from '@/components/tickets/Badges';
import { Kbd } from '@/components/ui/Badge';
import { searchHelp, HELP_ARTICLES } from '@/content/help';

const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-fg outline-none transition-colors data-[selected=true]:bg-surface-2 aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';
const groupClass =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-subtle';

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setPreference } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TicketResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const debounced = useDebouncedValue(query.trim(), 250);

  // Ticket search uses the regular API: the server returns only tickets this user may see
  const term = debounced.replace(/^#/, '');
  const searchable = open && term.length >= 2;
  useEffect(() => {
    if (!searchable) return;
    let cancelled = false;
    ticketService
      .getPage({ search: term, size: 6 })
      .then((page) => !cancelled && setResults(page.content))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setSearching(false));
    return () => {
      cancelled = true;
    };
  }, [term, searchable]);
  // Results are shown only while the current query is searchable
  const shownResults = searchable ? results : [];

  const go = (href: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(href);
  };

  const ticketNumber = /^#?\d{1,9}$/.test(query.trim()) ? query.trim().replace('#', '') : null;
  const helpMatches = query.trim().length > 2 ? searchHelp(query, 3) : HELP_ARTICLES.slice(0, 0);
  const sections = navFor(user?.role);

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="overlay-motion fixed inset-0 z-[60] bg-overlay backdrop-blur-[2px]" />
        <RadixDialog.Content
          className="fixed left-1/2 top-[12vh] z-[60] w-[calc(100vw-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl animate-pop focus:outline-none"
          aria-describedby={undefined}
        >
          <RadixDialog.Title className="sr-only">Search and commands</RadixDialog.Title>
          <Command label="Search and commands" shouldFilter loop className="flex flex-col">
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              {searching && searchable ? <Loader2 className="size-4 animate-spin text-fg-subtle" /> : <Search className="size-4 text-fg-subtle" />}
              <Command.Input
                value={query}
                onValueChange={(v) => {
                  setQuery(v);
                  if (v.trim().replace(/^#/, '').length >= 2) setSearching(true);
                }}
                placeholder="Search tickets, pages and help…  try #12"
                className="h-12 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-subtle"
              />
              <Kbd>Esc</Kbd>
            </div>

            <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain p-2">
              <Command.Empty className="px-3 py-10 text-center text-[13px] text-fg-muted">
                {searching && searchable ? 'Searching…' : 'No matches. Try a ticket number like #12 or a word from its title.'}
              </Command.Empty>

              {ticketNumber && (
                <Command.Group heading="Ticket" className={groupClass} forceMount>
                  <Command.Item value={`open ticket ${ticketNumber} #${ticketNumber}`} onSelect={() => go(`/tickets/${ticketNumber}`)} className={itemClass} forceMount>
                    <Hash className="text-fg-subtle" />
                    Open ticket #{ticketNumber}
                    <ArrowRight className="ml-auto text-fg-subtle" />
                  </Command.Item>
                </Command.Group>
              )}

              {shownResults.length > 0 && (
                <Command.Group heading="Tickets" className={groupClass} forceMount>
                  {shownResults.map((t) => (
                    <Command.Item
                      key={t.id}
                      value={`ticket ${t.id} ${t.title} ${query}`}
                      onSelect={() => go(`/tickets/${t.id}`)}
                      className={itemClass}
                      forceMount
                    >
                      <TicketIcon className="text-fg-subtle" />
                      <span className="font-mono text-xs text-fg-subtle">#{t.id}</span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <StatusBadge status={t.status} />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {sections.map((section) => (
                <Command.Group key={section.title} heading={section.title} className={groupClass}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item key={item.href} value={`${item.label} ${item.description}`} onSelect={() => go(item.href)} className={itemClass}>
                        <Icon className="text-fg-subtle" />
                        <span className="flex-1">{item.label}</span>
                        <span className="hidden text-xs text-fg-subtle sm:inline">{item.description}</span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}

              {helpMatches.length > 0 && (
                <Command.Group heading="Help" className={groupClass} forceMount>
                  {helpMatches.map((a) => (
                    <Command.Item key={a.id} value={`help ${a.question} ${query}`} onSelect={() => go(`/help#${a.id}`)} className={itemClass} forceMount>
                      <BookOpen className="text-fg-subtle" />
                      <span className="flex-1 truncate">{a.question}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Theme" className={groupClass}>
                {THEME_OPTIONS.map((t) => (
                  <Command.Item
                    key={t.value}
                    value={`theme ${t.label} ${t.description}`}
                    onSelect={() => {
                      setPreference(t.value);
                      onOpenChange(false);
                    }}
                    className={itemClass}
                  >
                    <span className="text-fg-subtle">{t.icon}</span>
                    <span className="flex-1">{t.label} theme</span>
                    <span className="hidden text-xs text-fg-subtle sm:inline">{t.description}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Session" className={groupClass}>
                <Command.Item value="sign out log out logout" onSelect={logout} className={itemClass}>
                  <LogOut className="text-fg-subtle" />
                  Sign out
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="flex items-center gap-3 border-t border-line bg-surface-2/60 px-4 py-2 text-[11px] text-fg-subtle">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
              <span className="ml-auto hidden sm:inline">Results respect your role</span>
            </div>
          </Command>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
