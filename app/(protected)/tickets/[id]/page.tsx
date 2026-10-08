'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Archive,
  Copy,
  Lock,
  MessageSquare,
  Play,
  Send,
  SearchX,
  ShieldAlert,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService } from '@/services/ticket.service';
import { userService } from '@/services/user.service';
import { ApiError, CommentResponse, TicketResponse, TicketStatus, UserResponse } from '@/types';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/FormFields';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Email } from '@/components/ui/Email';
import { Avatar } from '@/components/ui/Controls';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge, PriorityBadge, SlaIndicator } from '@/components/tickets/Badges';
import {
  cn,
  formatDate,
  formatDuration,
  formatRelative,
  STATUS_LABELS,
  TONE_SOFT,
  TONE_SOLID,
  TONE_TEXT,
  Tone,
} from '@/utils';

const COMMENT_MAX = 2000;

// The workflow actions the backend accepts from each status
const ACTIONS: Record<TicketStatus, { to: TicketStatus; label: string; icon: React.ReactNode; variant: 'primary' | 'secondary' | 'danger-soft'; confirm?: boolean }[]> = {
  OPEN: [
    { to: 'IN_PROGRESS', label: 'Start progress', icon: <Play className="size-4" />, variant: 'primary' },
    { to: 'CANCELLED', label: 'Cancel ticket', icon: <Ban className="size-4" />, variant: 'danger-soft', confirm: true },
  ],
  IN_PROGRESS: [
    { to: 'RESOLVED', label: 'Mark resolved', icon: <CheckCircle2 className="size-4" />, variant: 'primary' },
    { to: 'CANCELLED', label: 'Cancel ticket', icon: <Ban className="size-4" />, variant: 'danger-soft', confirm: true },
  ],
  RESOLVED: [{ to: 'CLOSED', label: 'Close ticket', icon: <Archive className="size-4" />, variant: 'primary', confirm: true }],
  CLOSED: [],
  CANCELLED: [],
};

type LoadState = 'loading' | 'ready' | 'forbidden' | 'missing' | 'error';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [engineers, setEngineers] = useState<UserResponse[] | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [reload, setReload] = useState(0);

  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<TicketStatus | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [justChanged, setJustChanged] = useState(false);

  // UI mirrors the backend rules (TicketService); the server enforces them on every request
  const sameDept = !!ticket && user?.department === ticket.department;
  const canUpdateStatus =
    !!ticket &&
    !!user &&
    (user.role === 'ADMIN' || (user.role === 'MANAGER' && sameDept) || (user.role === 'SUPPORT_ENGINEER' && ticket.assignedTo === user.email));
  const isFinal = ticket?.status === 'CLOSED' || ticket?.status === 'CANCELLED';
  const canAssign = !!ticket && !!user && !isFinal && (user.role === 'ADMIN' || (user.role === 'MANAGER' && sameDept));

  useEffect(() => {
    if (!Number.isFinite(ticketId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- invalid route parameter
      setState('missing');
      return;
    }
    let cancelled = false;
    Promise.all([ticketService.getById(ticketId), ticketService.getComments(ticketId)])
      .then(([t, c]) => {
        if (cancelled) return;
        setTicket(t);
        setComments(c);
        setState('ready');
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        setState(err.status === 403 ? 'forbidden' : err.status === 404 || err.status === 400 ? 'missing' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId, reload]);

  // Engineers for the assignment picker (managers: their department; admins: everyone)
  useEffect(() => {
    if (!canAssign || engineers) return;
    let cancelled = false;
    userService
      .getSupportEngineers()
      .then((list) => !cancelled && setEngineers(list))
      .catch(() => !cancelled && setEngineers([]));
    return () => {
      cancelled = true;
    };
  }, [canAssign, engineers]);

  const flash = () => {
    setJustChanged(true);
    window.setTimeout(() => setJustChanged(false), 900);
  };

  const changeStatus = async (to: TicketStatus) => {
    if (!ticket) return;
    setPendingStatus(to);
    try {
      const updated = await ticketService.updateStatus(ticket.id, { status: to });
      setTicket(updated);
      setConfirmStatus(null);
      flash();
      success('Status updated', `Ticket is now ${STATUS_LABELS[to]}.`);
    } catch (err) {
      setConfirmStatus(null);
      toastError('Status not changed', (err as ApiError).message);
    } finally {
      setPendingStatus(null);
    }
  };

  const assign = async () => {
    if (!ticket || !assignTo) return;
    setIsAssigning(true);
    try {
      const updated = await ticketService.assign(ticket.id, { assignedTo: assignTo });
      setTicket(updated);
      success('Ticket assigned', `Assigned to ${assignTo}`);
      setAssignTo('');
      flash();
    } catch (err) {
      toastError('Assignment failed', (err as ApiError).message);
    } finally {
      setIsAssigning(false);
    }
  };

  const postComment = async () => {
    const content = commentText.trim();
    if (!content || !ticket) return;
    setIsPosting(true);
    try {
      const c = await ticketService.addComment(ticket.id, { content });
      setComments((prev) => [...prev, c]);
      setCommentText('');
      success('Comment posted');
    } catch (err) {
      toastError('Comment not posted', (err as ApiError).message);
    } finally {
      setIsPosting(false);
    }
  };

  const copyLink = useCallback(() => {
    void navigator.clipboard?.writeText(window.location.href).then(() => success('Link copied'));
  }, [success]);

  if (state === 'loading') return <DetailSkeleton />;
  if (state !== 'ready' || !ticket) {
    return (
      <PageContainer>
        <Card padding="none">
          {state === 'forbidden' ? (
            <EmptyState
              icon={<Lock />}
              title="You don't have access to this ticket"
              description="Tickets are visible to their creator, the assigned engineer, managers of the department and admins."
              action={<Link href="/tickets" className={buttonClasses('secondary', 'sm')}><ArrowLeft className="size-3.5" /> Back to tickets</Link>}
            />
          ) : state === 'missing' ? (
            <EmptyState
              icon={<SearchX />}
              title={`Ticket #${id} doesn't exist`}
              description="It may have been mistyped. Search for it from the tickets list."
              action={<Link href="/tickets" className={buttonClasses('secondary', 'sm')}><ArrowLeft className="size-3.5" /> Back to tickets</Link>}
            />
          ) : (
            <ErrorState title="Ticket could not be loaded" onRetry={() => { setState('loading'); setReload((r) => r + 1); }} />
          )}
        </Card>
      </PageContainer>
    );
  }

  const actions = ACTIONS[ticket.status];
  const needsEngineer = (to: TicketStatus) => (to === 'IN_PROGRESS' || to === 'RESOLVED') && !ticket.assignedTo;
  const confirming = confirmStatus ? actions.find((a) => a.to === confirmStatus) : null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <Tooltip content="Copy link to this ticket">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[11.5px] text-fg-muted transition-colors hover:text-fg cursor-pointer"
              >
                #{ticket.id}
                <Copy className="size-3" aria-hidden />
              </button>
            </Tooltip>
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" aria-hidden /> {ticket.department}
            </span>
            <span aria-hidden>·</span>
            <span>Opened {formatRelative(ticket.createdAt)}</span>
          </div>
        }
        title={ticket.title}
        meta={
          <div className={cn('flex flex-wrap items-center gap-2 rounded-lg transition-shadow duration-500', justChanged && 'ring-4 ring-accent-soft')}>
            <StatusBadge status={ticket.status} size="md" />
            <PriorityBadge priority={ticket.priority} size="md" />
            <SlaIndicator status={ticket.status} escalationLevel={ticket.escalationLevel} responseBreached={ticket.responseBreached} resolutionBreached={ticket.resolutionBreached} />
          </div>
        }
        actions={
          canUpdateStatus && actions.length > 0 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Workflow actions">
              {[...actions].reverse().map((a) => {
                const blocked = needsEngineer(a.to);
                const button = (
                  <Button
                    key={a.to}
                    variant={a.variant === 'danger-soft' ? 'secondary' : a.variant}
                    className={a.variant === 'danger-soft' ? 'text-red-fg hover:bg-red-bg hover:border-red-line' : undefined}
                    leftIcon={a.icon}
                    isLoading={pendingStatus === a.to && !a.confirm}
                    disabled={!!pendingStatus || blocked}
                    onClick={() => (a.confirm ? setConfirmStatus(a.to) : changeStatus(a.to))}
                  >
                    {a.label}
                  </Button>
                );
                return blocked ? (
                  <Tooltip key={a.to} content="Assign a support engineer first">
                    <span tabIndex={0}>{button}</span>
                  </Tooltip>
                ) : (
                  button
                );
              })}
            </div>
          ) : undefined
        }
      />

      <WorkflowStepper status={ticket.status} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Description" />
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-fg wrap-anywhere">{ticket.description}</p>
          </Card>

          <Card padding="none">
            <div className="p-5 pb-0">
              <CardHeader
                title="Conversation"
                subtitle={`${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
                icon={<MessageSquare />}
              />
            </div>
            {comments.length === 0 ? (
              <EmptyState compact icon={<MessageSquare />} title="No comments yet" description="Updates and questions about this ticket will appear here." />
            ) : (
              <ol className="space-y-5 px-5 pb-2">
                {comments.map((c) => {
                  const mine = c.authorEmail === user?.email;
                  return (
                    <li key={c.id} className="flex gap-3 animate-enter">
                      <Avatar name={c.authorEmail} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
                          <Email value={c.authorEmail} className="text-[13px] font-semibold text-fg" />
                          {mine && <span className="rounded bg-accent-soft px-1 text-[10.5px] font-medium text-accent-soft-fg">You</span>}
                          {c.authorEmail === ticket.createdBy && <span className="text-[11px] text-fg-subtle">Requester</span>}
                          {c.authorEmail === ticket.assignedTo && <span className="text-[11px] text-fg-subtle">Assignee</span>}
                          <Tooltip content={formatDate(c.createdAt)}>
                            <time dateTime={c.createdAt} className="text-[11.5px] text-fg-subtle" tabIndex={0}>
                              {formatRelative(c.createdAt)}
                            </time>
                          </Tooltip>
                        </div>
                        <div className={cn('rounded-xl rounded-tl-sm border px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap wrap-anywhere', mine ? 'border-accent-line bg-accent-soft/40 text-fg' : 'border-line bg-surface-2/60 text-fg')}>
                          {c.content}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <form
              className="border-t border-line bg-surface-2/40 p-4 sm:p-5"
              onSubmit={(e) => {
                e.preventDefault();
                void postComment();
              }}
            >
              <div className="flex gap-3">
                {user && <Avatar name={user.name} seed={user.email} size="md" className="hidden sm:inline-grid" />}
                <div className="min-w-0 flex-1">
                  <Textarea
                    aria-label="Add a comment"
                    placeholder={isFinal ? 'Add a final note…' : 'Add an update or ask a question…'}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        void postComment();
                      }
                    }}
                    rows={3}
                    maxLength={COMMENT_MAX}
                    showCounter
                    disabled={isPosting}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="hidden text-[11px] text-fg-subtle sm:inline">Ctrl + Enter to post</span>
                    <Button type="submit" isLoading={isPosting} disabled={!commentText.trim()} leftIcon={<Send className="size-4" />} className="ml-auto">
                      Post comment
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <SlaCard ticket={ticket} />

          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-3.5 text-[13px]">
              <DetailRow label="Requester" icon={<UserRound />}>
                <Person email={ticket.createdBy} />
              </DetailRow>
              <DetailRow label="Assignee" icon={<UserPlus />}>
                {ticket.assignedTo ? <Person email={ticket.assignedTo} /> : <span className="text-fg-subtle">Not assigned yet</span>}
              </DetailRow>
              <DetailRow label="Department" icon={<Building2 />}>
                {ticket.department}
              </DetailRow>
              <DetailRow label="Created" icon={<CalendarClock />}>
                {formatDate(ticket.createdAt)}
              </DetailRow>
              <DetailRow label="Last updated" icon={<Clock />}>
                {formatDate(ticket.updatedAt)}
              </DetailRow>
            </dl>
          </Card>

          {canAssign && (
            <Card>
              <CardHeader
                title={ticket.assignedTo ? 'Reassign ticket' : 'Assign ticket'}
                subtitle={user?.role === 'MANAGER' ? `Support engineers in ${ticket.department}` : 'Active support engineers'}
                icon={<UserPlus />}
              />
              {engineers === null ? (
                <Skeleton className="h-10 rounded-lg" />
              ) : engineers.length === 0 ? (
                <Alert tone="amber">No active support engineers are available to assign.</Alert>
              ) : (
                <div className="space-y-2.5">
                  <Select
                    aria-label="Support engineer"
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    placeholder="Choose an engineer…"
                    options={engineers.map((u) => ({
                      value: u.email,
                      label: `${u.name} (${u.email})${u.email === ticket.assignedTo ? ' · current' : ''}`,
                      disabled: u.email === ticket.assignedTo,
                    }))}
                    disabled={isAssigning}
                  />
                  <Button onClick={assign} isLoading={isAssigning} disabled={!assignTo} variant="secondary" className="w-full">
                    {ticket.assignedTo ? 'Reassign' : 'Assign'}
                  </Button>
                </div>
              )}
            </Card>
          )}

          <Lifecycle ticket={ticket} />
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirmStatus(null)}
          title={confirming.to === 'CANCELLED' ? `Cancel ticket #${ticket.id}?` : `Close ticket #${ticket.id}?`}
          description={
            confirming.to === 'CANCELLED'
              ? 'The ticket will be withdrawn and excluded from SLA tracking. Cancelled tickets cannot be reopened.'
              : 'Closing confirms the resolution. Closed tickets are final and cannot be reopened.'
          }
          confirmLabel={confirming.label}
          tone={confirming.to === 'CANCELLED' ? 'danger' : 'default'}
          icon={confirming.to === 'CANCELLED' ? <Ban /> : <Archive />}
          isLoading={pendingStatus === confirming.to}
          onConfirm={() => changeStatus(confirming.to)}
        />
      )}
    </PageContainer>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function DetailRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="flex w-28 shrink-0 items-center gap-2 text-fg-muted [&_svg]:size-3.5 [&_svg]:text-fg-subtle">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-fg wrap-anywhere">{children}</dd>
    </div>
  );
}

function Person({ email }: { email: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={email} size="sm" />
      <Email value={email} className="min-w-0 font-medium" />
    </span>
  );
}

function WorkflowStepper({ status }: { status: TicketStatus }) {
  const steps: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const cancelled = status === 'CANCELLED';
  const current = steps.indexOf(status);
  return (
    <Card padding="none" className="overflow-x-auto">
      <ol className="flex min-w-[520px] items-center px-5 py-4" aria-label="Workflow progress">
        {steps.map((step, i) => {
          const done = !cancelled && i < current;
          const active = !cancelled && i === current;
          return (
            <li key={step} className="flex flex-1 items-center last:flex-none" aria-current={active ? 'step' : undefined}>
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'grid size-7 place-items-center rounded-full border-2 text-xs font-semibold transition-all duration-500',
                    done && 'border-accent bg-accent text-accent-fg',
                    active && 'border-accent bg-accent-soft text-accent-soft-fg shadow-[0_0_0_4px_var(--accent-soft)]',
                    !done && !active && 'border-line-strong bg-surface text-fg-subtle'
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn('whitespace-nowrap text-[13px] font-medium', active ? 'text-fg' : done ? 'text-fg-muted' : 'text-fg-subtle')}>
                  {STATUS_LABELS[step]}
                </span>
              </span>
              {i < steps.length - 1 && (
                <span className="mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
                  <span className={cn('block h-full origin-left bg-accent transition-transform duration-700', done ? 'scale-x-100' : 'scale-x-0')} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <p className={cn('flex items-center gap-2 border-t px-5 py-2.5 text-[13px] font-medium', TONE_SOFT.rose)}>
          <Ban className="size-4" aria-hidden /> This ticket was cancelled and is no longer part of the workflow.
        </p>
      )}
    </Card>
  );
}

// Live SLA meters (deadlines are fixed at creation; this only visualises them)
function SlaCard({ ticket }: { ticket: TicketResponse }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const cancelled = ticket.status === 'CANCELLED';
  return (
    <Card>
      <CardHeader title="Service level" subtitle={cancelled ? 'Not tracked for cancelled tickets' : 'Deadlines set when the ticket was created'} icon={<ShieldAlert />} />
      <div className="space-y-5">
        <SlaMeter label="First response" created={ticket.createdAt} deadline={ticket.responseDeadline} completedAt={ticket.respondedAt} breached={ticket.responseBreached} now={now} cancelled={cancelled} doneVerb="Responded" />
        <SlaMeter label="Resolution" created={ticket.createdAt} deadline={ticket.resolutionDeadline} completedAt={ticket.resolvedAt} breached={ticket.resolutionBreached} now={now} cancelled={cancelled} doneVerb="Resolved" />
      </div>
      {!cancelled && ticket.escalationLevel === 'WARNING' && !ticket.responseBreached && !ticket.resolutionBreached && (
        <Alert tone="amber" className="mt-4">This ticket is in the last 20% of its resolution window.</Alert>
      )}
    </Card>
  );
}

function SlaMeter({
  label,
  created,
  deadline,
  completedAt,
  breached,
  now,
  cancelled,
  doneVerb,
}: {
  label: string;
  created: string;
  deadline: string | null;
  completedAt: string | null;
  breached: boolean;
  now: number;
  cancelled: boolean;
  doneVerb: string;
}) {
  const memo = useMemo(() => {
    if (!deadline) return null;
    const start = new Date(created).getTime();
    const end = new Date(deadline).getTime();
    const done = completedAt ? new Date(completedAt).getTime() : null;
    const at = done ?? now;
    const progress = Math.min(1, Math.max(0, (at - start) / Math.max(1, end - start)));
    return { end, done, progress, remaining: end - now };
  }, [created, deadline, completedAt, now]);

  if (!memo) return null;
  let tone: Tone = 'green';
  let status: string;
  if (cancelled) {
    tone = 'neutral';
    status = 'Not tracked';
  } else if (memo.done !== null) {
    tone = breached ? 'red' : 'green';
    status = breached ? `${doneVerb} ${formatDuration(memo.done - memo.end)} late` : `${doneVerb} on time`;
  } else if (memo.remaining < 0 || breached) {
    tone = 'red';
    status = `Overdue by ${formatDuration(-memo.remaining)}`;
  } else {
    tone = memo.progress >= 0.8 ? 'amber' : 'green';
    status = `${formatDuration(memo.remaining)} left`;
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-fg">{label}</span>
        <span className={cn('text-xs font-semibold', tone === 'neutral' ? 'text-fg-subtle' : TONE_TEXT[tone])}>{status}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-label={`${label} time used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(memo.progress * 100)}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-700', TONE_SOLID[tone])} style={{ width: `${Math.max(3, memo.progress * 100)}%` }} />
      </div>
      <p className="mt-1.5 text-[11.5px] text-fg-subtle">Due {formatDate(deadline)}</p>
    </div>
  );
}

// Lifecycle derived from the ticket's own timestamps
function Lifecycle({ ticket }: { ticket: TicketResponse }) {
  const events: { label: string; detail?: string; at?: string | null; tone: Tone; icon: React.ReactNode }[] = [
    { label: 'Created', detail: `by ${ticket.createdBy}`, at: ticket.createdAt, tone: 'blue', icon: <CircleDot /> },
  ];
  if (ticket.assignedTo) events.push({ label: 'Assigned', detail: `to ${ticket.assignedTo}`, tone: 'violet', icon: <UserPlus /> });
  if (ticket.respondedAt) events.push({ label: 'Work started', detail: 'First response recorded', at: ticket.respondedAt, tone: 'amber', icon: <Play /> });
  if (ticket.resolvedAt && ticket.status !== 'CANCELLED') events.push({ label: 'Resolved', at: ticket.resolvedAt, tone: 'green', icon: <CheckCircle2 /> });
  if (ticket.status === 'CLOSED') events.push({ label: 'Closed', at: ticket.updatedAt, tone: 'neutral', icon: <Archive /> });
  if (ticket.status === 'CANCELLED') events.push({ label: 'Cancelled', at: ticket.updatedAt, tone: 'rose', icon: <Ban /> });

  return (
    <Card>
      <CardHeader title="Lifecycle" subtitle="From the ticket's recorded timestamps" />
      <ol className="relative space-y-4">
        <span className="absolute bottom-3 left-[13px] top-3 w-px bg-line" aria-hidden />
        {events.map((e, i) => (
          <li key={e.label} className="relative flex gap-3 stagger" style={{ ['--i' as string]: i }}>
            <span className={cn('relative z-10 grid size-7 shrink-0 place-items-center rounded-full border [&_svg]:size-3.5', TONE_SOFT[e.tone])} aria-hidden>
              {e.icon}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] font-medium text-fg">{e.label}</p>
              {e.detail && <p className="text-xs text-fg-muted wrap-anywhere">{e.detail}</p>}
              {e.at && (
                <p className="text-[11.5px] text-fg-subtle">
                  <time dateTime={e.at}>{formatDate(e.at)}</time>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-3">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-8 w-2/3 rounded-md" />
        <Skeleton className="h-6 w-64 rounded" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}
