'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { ticketService } from '@/services/ticket.service';
import { userService } from '@/services/user.service';

import {
  TicketResponse,
  CommentResponse,
  TicketStatus,
  UserResponse,
  ApiError,
} from '@/types';

import { PageHeader } from '@/components/layout/Sidebar';
import {
  Card,
  CardHeader,
  Skeleton,
  Divider,
  EmptyState,
} from '@/components/ui/Card';
import {
  StatusBadge,
  PriorityBadge,
  SlaIndicator,
} from '@/components/tickets/Badges';
import { Button } from '@/components/ui/Button';
import { Textarea, Select } from '@/components/ui/FormFields';
import { useToast } from '@/components/ui/Toast';
import {
  formatDate,
  formatDeadlineCountdown,
  formatRelative,
  cn,
} from '@/utils';

import {
  Clock,
  User,
  Building,
  MessageSquare,
  AlertTriangle,
  Send,
  Users,
} from 'lucide-react';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// ─── Detail field helper ──────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      {icon && (
        <span className="text-slate-300 mt-0.5 shrink-0">
          {icon}
        </span>
      )}

      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 shrink-0 w-24">
          {label}
        </span>

        <div className="text-sm text-slate-800 text-right min-w-0 flex-1 flex justify-end">
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Comment ──────────────────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: CommentResponse }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
        {comment.authorEmail.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-700">
            {comment.authorEmail}
          </span>

          <span className="text-xs text-slate-400">
            {formatRelative(comment.createdAt)}
          </span>
        </div>

        <div className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100 whitespace-pre-wrap">
          {comment.content}
        </div>
      </div>
    </div>
  );
}

// ─── SLA Timeline Cell ────────────────────────────────────────────────────────

function DeadlineCell({
  label,
  deadline,
  breached,
}: {
  label: string;
  deadline: string | null;
  breached: boolean;
}) {
  if (!deadline) return null;

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 flex-1 min-w-[160px]',
        breached
          ? 'border-red-200 bg-red-50'
          : 'border-slate-100 bg-slate-50'
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
        {label}
      </p>

      <p
        className={cn(
          'text-sm font-semibold',
          breached ? 'text-red-700' : 'text-slate-800'
        )}
      >
        {breached
          ? '⚠ Breached'
          : formatDeadlineCountdown(deadline)}
      </p>

      <p className="text-xs text-slate-400 mt-0.5">
        {formatDate(deadline)}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);

  const { user } = useAuth();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [newStatus, setNewStatus] =
    useState<TicketStatus>('OPEN');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [assignTo, setAssignTo] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const canManage =
    user?.role === 'SUPPORT_ENGINEER' ||
    user?.role === 'MANAGER' ||
    user?.role === 'ADMIN';

  const canAssign =
    user?.role === 'MANAGER' ||
    user?.role === 'ADMIN';

  // ─── Load ticket details ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const loadTicket = async () => {
      try {
        const [t, c] = await Promise.all([
          ticketService.getById(ticketId),
          ticketService.getComments(ticketId),
        ]);

        if (cancelled) return;

        setTicket(t);
        setNewStatus(t.status);
        setComments(c);

        if (canAssign) {
          const engineers =
            await userService.getSupportEngineers();

          if (cancelled) return;

          setUsers(engineers);
        }
      } catch {
        if (cancelled) return;

        toastError(
          'Error',
          'Could not load ticket details.'
        );

        router.push('/tickets');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTicket();

    return () => {
      cancelled = true;
    };
  }, [ticketId, canAssign, toastError, router]);

  // ─── Add comment ───────────────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const c = await ticketService.addComment(ticketId, {
        content: commentText.trim(),
      });

      setComments((prev) => [...prev, c]);
      setCommentText('');

      success('Comment added');
    } catch (err: unknown) {
      toastError(
        'Error',
        (err as ApiError).message
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // ─── Update status ─────────────────────────────────────────────────────────

  const handleUpdateStatus = async () => {
    if (!ticket || newStatus === ticket.status) return;

    setIsUpdatingStatus(true);

    try {
      const updated =
        await ticketService.updateStatus(ticketId, {
          status: newStatus,
        });

      setTicket(updated);

      success(
        'Status updated',
        `Ticket is now ${newStatus.replace('_', ' ')}`
      );
    } catch (err: unknown) {
      toastError(
        'Error',
        (err as ApiError).message
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ─── Assign ticket ─────────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!assignTo.trim()) return;

    setIsAssigning(true);

    try {
      const updated = await ticketService.assign(ticketId, {
        assignedTo: assignTo,
      });

      setTicket(updated);

      success(
        'Ticket assigned',
        `Assigned to ${assignTo}`
      );

      setAssignTo('');
    } catch (err: unknown) {
      toastError(
        'Error',
        (err as ApiError).message
      );
    } finally {
      setIsAssigning(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Loading ticket..." />

        <div className="px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  // ─── Page ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`#${ticket.id} · ${ticket.title}`}
        subtitle={`${ticket.department} · Submitted ${formatRelative(
          ticket.createdAt
        )}`}
        breadcrumb={[
          {
            label: 'Dashboard',
            href: '/dashboard',
          },
          {
            label: 'Tickets',
            href: '/tickets',
          },
          {
            label: `#${ticket.id}`,
          },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        }
      />

      <div className="px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Main column ───────────────────────────────────────────────────── */}

        <div className="lg:col-span-7 space-y-6">

          {/* Description */}

          <Card>
            <CardHeader title="Description" />

            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </Card>

          {/* Comments */}

          <Card>
            <CardHeader
              title="Comments"
              subtitle={`${comments.length} comment${
                comments.length !== 1 ? 's' : ''
              }`}
              action={
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {comments.length}
                </span>
              }
            />

            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <EmptyState
                  icon={
                    <MessageSquare className="w-5 h-5" />
                  }
                  title="No comments yet"
                  description="Be the first to add a comment or update."
                />
              ) : (
                comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                  />
                ))
              )}
            </div>

            <Divider className="mb-4" />

            <div className="space-y-3">
              <Textarea
                placeholder="Add a comment, update, or question..."
                value={commentText}
                onChange={(e) =>
                  setCommentText(e.target.value)
                }
                rows={3}
                disabled={isSubmittingComment}
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  isLoading={isSubmittingComment}
                  disabled={!commentText.trim()}
                  leftIcon={
                    <Send className="w-4 h-4" />
                  }
                  size="md"
                >
                  Post Comment
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Sidebar column ────────────────────────────────────────────────── */}

        <div className="lg:col-span-5 space-y-6">

          {/* Details */}

          <Card>
            <CardHeader title="Details" />

            <div>
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="Created by"
                value={
                  <span
                    className="font-medium text-slate-900 text-right whitespace-nowrap min-w-0"
                    title={ticket.createdBy}
                  >
                    {ticket.createdBy}
                  </span>
                }
              />

              <DetailRow
                icon={<Users className="w-4 h-4" />}
                label="Assigned to"
                value={
                  ticket.assignedTo ? (
                    <span
                      className="font-medium text-slate-900 text-right whitespace-nowrap min-w-0"
                      title={ticket.assignedTo}
                    >
                      {ticket.assignedTo}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">
                      Unassigned
                    </span>
                  )
                }
              />

              <DetailRow
                icon={<Building className="w-4 h-4" />}
                label="Department"
                value={ticket.department}
              />

              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Created"
                value={formatDate(ticket.createdAt)}
              />

              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Updated"
                value={formatDate(ticket.updatedAt)}
              />

              {ticket.resolvedAt && (
                <DetailRow
                  label="Resolved"
                  value={formatDate(ticket.resolvedAt)}
                />
              )}
            </div>
          </Card>

          {/* SLA */}

          <Card>
            <CardHeader
              title="SLA Status"
              action={
                <SlaIndicator
                  escalationLevel={
                    ticket.escalationLevel
                  }
                  responseBreached={
                    ticket.responseBreached
                  }
                  resolutionBreached={
                    ticket.resolutionBreached
                  }
                />
              }
            />

            <div className="flex flex-wrap gap-3">
              <DeadlineCell
                label="Response Deadline"
                deadline={ticket.responseDeadline}
                breached={ticket.responseBreached}
              />

              <DeadlineCell
                label="Resolution Deadline"
                deadline={ticket.resolutionDeadline}
                breached={ticket.resolutionBreached}
              />
            </div>

            {ticket.respondedAt && (
              <p className="text-xs text-slate-400 mt-3">
                First responded:{' '}
                {formatDate(ticket.respondedAt)}
              </p>
            )}

            {ticket.escalationLevel !== 'NONE' && (
              <div
                className={cn(
                  'mt-3 flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2',
                  ticket.escalationLevel === 'BREACHED'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />

                {ticket.escalationLevel === 'BREACHED'
                  ? 'This ticket has breached its SLA deadline and requires immediate attention.'
                  : 'This ticket is approaching its SLA deadline.'}
              </div>
            )}
          </Card>

          {/* Status Update */}

          {canManage && (
            <Card>
              <CardHeader title="Update Status" />

              <div className="space-y-3">
                <Select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(
                      e.target.value as TicketStatus
                    )
                  }
                  options={STATUS_OPTIONS}
                  disabled={isUpdatingStatus}
                />

                <Button
                  onClick={handleUpdateStatus}
                  isLoading={isUpdatingStatus}
                  disabled={newStatus === ticket.status}
                  variant="primary"
                  size="md"
                  className="w-full"
                >
                  Update Status
                </Button>
              </div>
            </Card>
          )}

          {/* Assignment */}

          {canAssign && (
            <Card>
              <CardHeader
                title="Assign Ticket"
                subtitle="Assign to a support engineer"
              />

              <div className="space-y-3">
                {users.length > 0 ? (
                  <>
                    <Select
                      value={assignTo}
                      onChange={(e) =>
                        setAssignTo(e.target.value)
                      }
                      placeholder="Select engineer..."
                      options={users.map((u) => ({
                        value: u.email,
                        label: `${u.name} (${u.email})`,
                      }))}
                      disabled={isAssigning}
                    />

                    <Button
                      onClick={handleAssign}
                      isLoading={isAssigning}
                      disabled={!assignTo}
                      variant="secondary"
                      size="md"
                      className="w-full"
                    >
                      Assign
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">
                    No support engineers available.
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}