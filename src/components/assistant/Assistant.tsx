'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ChevronRight, Info, RotateCcw, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, plural } from '@/utils';
import { LogoMark } from '@/components/brand/Logo';
import { StatusBadge, PriorityBadge, SlaIndicator } from '@/components/tickets/Badges';
import { CAN_CREATE_TICKETS } from '@/components/layout/nav';
import { Tooltip } from '@/components/ui/Tooltip';
import { answer, AssistantBlock, SUGGESTIONS } from '@/components/assistant/engine';
import { announcePanelOpen, onOtherPanelOpen } from '@/lib/panels';

interface Message {
  id: number;
  from: 'user' | 'assistant';
  text?: string;
  blocks?: AssistantBlock[];
}

let nextId = 1;

// Ctrl+Shift+Space (⌘+Shift+Space on macOS): not used by browsers, and unlike Ctrl+Space it
// does not collide with common input-method switching
function isShortcut(e: KeyboardEvent) {
  return (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && (e.code === 'Space' || e.key === ' ');
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes((el as HTMLInputElement).type));
}

export function Assistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const canCreate = !!user && CAN_CREATE_TICKETS.includes(user.role);
  const shortcutLabel = isMac ? '⌘ ⇧ Space' : 'Ctrl Shift Space';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- platform is only known in the browser
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  // Global shortcut: opens the assistant, or focuses it when already open. Ignored while the
  // user is typing in another field, so it never interrupts text entry.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isShortcut(e)) return;
      const inAssistant = panelRef.current?.contains(e.target as Node);
      if (isTypingTarget(e.target) && !inAssistant) return;
      e.preventDefault();
      if (!open) setOpen(true);
      else inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // While the page scrolls, the launcher shrinks to its icon so it covers as little as possible
  useEffect(() => {
    let timer = 0;
    const onScroll = () => {
      setCompact(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setCompact(false), 900);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  // On phones this panel and the notifications panel would overlap: only one stays open
  useEffect(() => onOtherPanelOpen('assistant', () => setOpen(false)), []);

  useEffect(() => {
    if (!open) return;
    announcePanelOpen('assistant');
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages((m) => [...m, { id: nextId++, from: 'user', text }]);
    setThinking(true);
    try {
      const reply = await answer(text, user?.role, canCreate);
      setMessages((m) => [...m, { id: nextId++, from: 'assistant', blocks: reply.blocks }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: nextId++, from: 'assistant', blocks: [{ kind: 'text', text: 'Something went wrong while loading that. Please try again.' }] },
      ]);
    } finally {
      setThinking(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Tooltip content={<span>FlowDesk Assistant <span className="opacity-60">· {shortcutLabel}</span></span>} side="left" disabled={open}>
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="flowdesk-assistant"
          aria-keyshortcuts={isMac ? 'Meta+Shift+Space' : 'Control+Shift+Space'}
          aria-label={open ? 'Close FlowDesk Assistant' : `Need a hand? Open FlowDesk Assistant (${shortcutLabel})`}
          className={cn(
            'fixed bottom-4 right-4 z-40 flex h-11 items-center gap-2 rounded-full border border-line bg-surface/95 p-1.5 text-[13px] font-medium text-fg shadow-lg backdrop-blur sm:bottom-5 sm:right-5 cursor-pointer',
            'transition-[transform,box-shadow,padding,opacity] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            !open && !compact && 'sm:pr-4',
            compact && !open && 'opacity-90'
          )}
        >
          <span className="relative">
            <LogoMark className="size-8" />
            {!open && <Sparkles className="absolute -right-1 -top-1 size-3.5 text-amber" aria-hidden />}
          </span>
          {!open && (
            <span
              className={cn(
                'hidden overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 sm:inline',
                compact ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
              )}
              aria-hidden
            >
              Need a hand?
            </span>
          )}
          {open && <X className="mx-1.5 size-4 text-fg-muted" aria-hidden />}
        </button>
      </Tooltip>

      {open && (
        <section
          ref={panelRef}
          id="flowdesk-assistant"
          role="dialog"
          aria-label="FlowDesk Assistant"
          className={cn(
            'fixed inset-x-3 bottom-[72px] z-40 flex max-h-[min(640px,calc(100dvh-96px))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl animate-slide-up',
            'sm:inset-x-auto sm:bottom-[76px] sm:right-5 sm:w-[400px]'
          )}
        >
          <header className="flex items-center gap-3 border-b border-line bg-gradient-to-b from-accent-soft/60 to-transparent px-4 py-3">
            <LogoMark className="size-9" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-fg">FlowDesk Assistant</h2>
              <p className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                <span className="size-1.5 rounded-full bg-green" aria-hidden />
                Guided help from your workspace data
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="grid size-8 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-8 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="animate-enter">
                <p className="text-sm font-semibold text-fg">Hi {user.name.split(' ')[0]}, how can I help?</p>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                  I can look up your tickets, flag SLA risks, summarise your workload and explain how FlowDesk works.
                </p>
                <div className="mt-4 grid gap-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      style={{ ['--i' as string]: i }}
                      className="stagger group flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-left text-[13px] text-fg-muted transition-colors hover:border-accent-line hover:bg-accent-soft/40 hover:text-fg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {s}
                      <ChevronRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </button>
                  ))}
                </div>
                <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-fg-subtle">
                  <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                  Answers come from your FlowDesk tickets (only what your role can see) and the Help Center. This assistant
                  follows fixed rules and does not use AI. Open it anytime with {shortcutLabel}.
                </p>
              </div>
            )}

            {messages.map((m) =>
              m.from === 'user' ? (
                <div key={m.id} className="flex justify-end animate-enter">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[13px] text-accent-fg wrap-anywhere">{m.text}</p>
                </div>
              ) : (
                <div key={m.id} className="flex gap-2.5 animate-enter">
                  <LogoMark className="mt-0.5 size-6" />
                  <div className="min-w-0 flex-1 space-y-2">
                    {m.blocks?.map((b, i) => <Block key={i} block={b} onNavigate={() => setOpen(false)} />)}
                  </div>
                </div>
              )
            )}

            {thinking && (
              <div className="flex items-center gap-2.5" role="status" aria-label="Looking that up">
                <LogoMark className="size-6" />
                <span className="flex gap-1 rounded-2xl bg-surface-2 px-3 py-2.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1.5 rounded-full bg-fg-subtle" style={{ animation: `bounce-dot 1s ${i * 0.15}s infinite` }} />
                  ))}
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
            className="border-t border-line p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-line bg-surface-2/60 p-1.5 transition-colors focus-within:border-accent focus-within:bg-surface">
              <label htmlFor="assistant-input" className="sr-only">
                Ask the assistant
              </label>
              <textarea
                id="assistant-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={300}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void ask(input);
                  }
                }}
                placeholder="Ask about a ticket, SLAs or how things work…"
                className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-fg outline-none placeholder:text-fg-subtle"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg transition-[opacity,transform] hover:bg-accent-hover active:scale-95 disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Send"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

function Block({ block, onNavigate }: { block: AssistantBlock; onNavigate: () => void }) {
  switch (block.kind) {
    case 'text':
      return <p className="rounded-2xl rounded-tl-md bg-surface-2 px-3.5 py-2 text-[13px] leading-relaxed text-fg">{block.text}</p>;
    case 'ticket':
    case 'tickets': {
      const tickets = block.kind === 'ticket' ? [block.ticket] : block.tickets;
      return (
        <div className="overflow-hidden rounded-xl border border-line">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              onClick={onNavigate}
              className="block border-b border-line px-3 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                <span className="font-mono text-[11px] text-fg-subtle">#{t.id}</span>
                <span className="truncate">{t.title}</span>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                <SlaIndicator compact status={t.status} escalationLevel={t.escalationLevel} responseBreached={t.responseBreached} resolutionBreached={t.resolutionBreached} />
              </div>
              {block.kind === 'ticket' && (
                <p className="mt-1.5 text-[11.5px] text-fg-muted wrap-anywhere">
                  {t.department} · {t.assignedTo ? `Assigned to ${t.assignedTo}` : 'Not assigned yet'}
                </p>
              )}
            </Link>
          ))}
          {block.kind === 'tickets' && block.viewAllHref && block.total > tickets.length && (
            <Link href={block.viewAllHref} onClick={onNavigate} className="block bg-surface-2/60 px-3 py-2 text-xs font-medium text-accent-soft-fg hover:bg-surface-2">
              View all {plural(block.total, 'ticket')} →
            </Link>
          )}
        </div>
      );
    }
    case 'summary': {
      const s = block.summary;
      const items = [
        ['Open', s.open],
        ['In progress', s.inProgress],
        ['Resolved', s.resolved],
        ['Closed', s.closed],
        ['At risk', s.atRisk],
        ['SLA breached', s.breached],
      ] as const;
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-surface px-2.5 py-2">
              <p className="text-[10.5px] text-fg-subtle">{label}</p>
              <p className="text-base font-semibold text-fg tabular">{value}</p>
            </div>
          ))}
        </div>
      );
    }
    case 'help':
      return (
        <div className="space-y-2">
          {block.articles.map((a) => (
            <div key={a.id} className="rounded-2xl rounded-tl-md bg-surface-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-fg">
              <p className="font-semibold">{a.question}</p>
              {a.answer.map((p, i) => (
                <p key={i} className="mt-1 text-fg-muted">
                  {p}
                </p>
              ))}
              <Link href={`/help#${a.id}`} onClick={onNavigate} className="mt-1.5 inline-block text-xs font-medium text-accent-soft-fg hover:underline">
                Read in Help Center →
              </Link>
            </div>
          ))}
        </div>
      );
    case 'actions':
      return (
        <div className="flex flex-wrap gap-1.5">
          {block.actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={onNavigate}
              className="rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-medium text-accent-soft-fg transition-colors hover:bg-accent hover:text-accent-fg"
            >
              {a.label}
            </Link>
          ))}
        </div>
      );
  }
}
