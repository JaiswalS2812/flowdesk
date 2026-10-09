'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BellRing, BookOpen, ChevronDown, Compass, KeyRound, LifeBuoy, Search, Settings2, SquarePen, Timer, Workflow, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMac } from '@/hooks/useIsMac';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/FormFields';
import { Kbd } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { buttonClasses } from '@/components/ui/Button';
import { CAN_CREATE_TICKETS } from '@/components/layout/nav';
import { HELP_ARTICLES, HELP_CATEGORIES, HelpCategory, searchHelp } from '@/content/help';
import { cn } from '@/utils';

const CATEGORY_ICON: Record<HelpCategory, React.ReactNode> = {
  'getting-started': <Compass />,
  tickets: <Workflow />,
  sla: <Timer />,
  notifications: <BellRing />,
  account: <KeyRound />,
  admin: <Settings2 />,
};

export default function HelpPage() {
  const { user } = useAuth();
  const isMac = useIsMac();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const canCreate = !!user && CAN_CREATE_TICKETS.includes(user.role);

  // Deep links from the assistant and command menu: /help#article-id
  useEffect(() => {
    const open = () => {
      const id = window.location.hash.slice(1);
      if (!id || !HELP_ARTICLES.some((a) => a.id === id)) return;
      setOpenId(id);
      setCategory(null);
      setQuery('');
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);

  const articles = useMemo(() => {
    if (query.trim().length > 1) return searchHelp(query, 20);
    return category ? HELP_ARTICLES.filter((a) => a.category === category) : HELP_ARTICLES;
  }, [query, category]);

  const searching = query.trim().length > 1;
  const grouped = HELP_CATEGORIES.map((c) => ({ ...c, items: articles.filter((a) => a.category === c.id) })).filter((c) => c.items.length);

  return (
    <PageContainer className="max-w-[1100px]">
      <PageHeader title="Help Center" subtitle="How FlowDesk works, for every role." />

      <Card padding="lg" className="relative mb-6 overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-accent opacity-[0.08] blur-3xl" aria-hidden />
        <div className="relative max-w-xl">
          <h2 className="text-lg font-semibold tracking-tight text-fg">What do you need help with?</h2>
          <p className="mt-1 text-[13px] text-fg-muted">
            Search the guides below, or press <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd> <Kbd>K</Kbd> anywhere to jump to a ticket or page.
          </p>
          <Input
            aria-label="Search help articles"
            placeholder="e.g. SLA breach, assign a ticket, change password"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftAddon={<Search />}
            fieldClassName="mt-4"
            rightAddon={
              query ? (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg cursor-pointer">
                  <X className="size-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>
      </Card>

      {!searching && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map((c, i) => {
            const active = category === c.id;
            const count = HELP_ARTICLES.filter((a) => a.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(active ? null : c.id)}
                aria-pressed={active}
                className={cn(
                  'stagger group flex items-start gap-3 rounded-xl border bg-surface p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 cursor-pointer',
                  'hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong'
                )}
                style={{ ['--i' as string]: i }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent-line bg-accent-soft text-accent-soft-fg [&_svg]:size-4" aria-hidden>
                  {CATEGORY_ICON[c.id]}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-fg">{c.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{c.description}</span>
                  <span className="mt-1.5 block text-[11px] text-fg-subtle">{count} article{count === 1 ? '' : 's'}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {grouped.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<BookOpen />}
            title="No articles match your search"
            description={canCreate ? 'Try other words, or create a ticket and the support team will help.' : 'Try other words, or ask your manager.'}
            action={canCreate ? <Link href="/tickets/new" className={buttonClasses('primary', 'sm')}><SquarePen className="size-3.5" /> Create a ticket</Link> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.id} aria-labelledby={`cat-${group.id}`}>
              <h2 id={`cat-${group.id}`} className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-fg-subtle [&_svg]:size-4">
                {CATEGORY_ICON[group.id]}
                {group.title}
              </h2>
              <Card padding="none" className="divide-y divide-line overflow-hidden">
                {group.items.map((a) => (
                  <details
                    key={a.id}
                    id={a.id}
                    open={openId === a.id || undefined}
                    onToggle={(e) => {
                      const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                      if (isOpen) setOpenId(a.id);
                      else if (openId === a.id) setOpenId(null);
                    }}
                    className="group scroll-mt-24"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14px] font-medium text-fg transition-colors hover:bg-surface-2/60 focus-visible:outline-none focus-visible:bg-surface-2 [&::-webkit-details-marker]:hidden">
                      {a.question}
                      <ChevronDown className="size-4 shrink-0 text-fg-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="space-y-2 px-5 pb-5 text-[13.5px] leading-relaxed text-fg-muted animate-enter">
                      {a.answer.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                      {a.link && (!a.link.href.startsWith('/tickets/new') || canCreate) && (
                        <Link href={a.link.href} className="inline-block pt-1 text-[13px] font-medium text-accent-soft-fg hover:underline">
                          {a.link.label} →
                        </Link>
                      )}
                    </div>
                  </details>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      <Card className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent-line bg-accent-soft text-accent-soft-fg" aria-hidden>
          <LifeBuoy className="size-5" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-fg">Still need help?</h2>
          <p className="mt-0.5 text-[13px] text-fg-muted">
            {canCreate
              ? 'Create a ticket: your department’s manager routes it to a support engineer. You can also ask the FlowDesk Assistant in the corner.'
              : 'Ask the FlowDesk Assistant in the corner, or contact your manager.'}
          </p>
        </div>
        {canCreate && (
          <Link href="/tickets/new" className={buttonClasses('primary', 'md')}>
            <SquarePen className="size-4" />
            Create a ticket
          </Link>
        )}
      </Card>
    </PageContainer>
  );
}
