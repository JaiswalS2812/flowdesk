'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  Check,
  Clock,
  ImageIcon,
  Info,
  KeyRound,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { ApiError, Role } from '@/types';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PasswordInput, PasswordChecklist, passwordChecks } from '@/components/ui/FormFields';
import { Avatar } from '@/components/ui/Controls';
import { Email } from '@/components/ui/Email';
import { Alert } from '@/components/ui/Feedback';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { RoleBadge } from '@/components/tickets/Badges';
import { cn, formatShortDate, ROLE_DESCRIPTIONS } from '@/utils';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

// What each role can do (mirrors the backend authorization rules)
const PERMISSIONS: Record<Role, string[]> = {
  EMPLOYEE: ['Create tickets for your department', 'View and comment on tickets you created', 'Receive updates on your tickets'],
  SUPPORT_ENGINEER: ['View tickets assigned to you', 'Move assigned tickets through the workflow', 'Receive SLA warnings for your tickets'],
  MANAGER: ['View every ticket in your department', 'Assign tickets to your department’s engineers', 'Change ticket status and receive SLA alerts'],
  ADMIN: ['View and manage every ticket', 'Manage users, roles and departments', 'Configure SLA policies and review the audit log'],
};

const SESSION_FACTS = [
  { icon: <Timer />, title: 'One-hour sessions', text: 'After an hour you are asked to sign in again.' },
  { icon: <KeyRound />, title: 'Password changes sign out everywhere', text: 'Every existing session, on every device, ends immediately.' },
  { icon: <ShieldAlert />, title: 'Sign-in protection', text: 'Repeated failed sign-ins are temporarily blocked.' },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, clearSession, logout } = useAuth();
  const { success } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Mirrors the backend policy; the backend also rejects common passwords
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = 'Enter your current password.';
    const failed = passwordChecks(form.newPassword, user?.email ?? '').find((c) => !c.ok);
    if (failed) errs.newPassword = `New password: ${failed.label.toLowerCase()}.`;
    else if (form.newPassword === form.currentPassword) errs.newPassword = 'New password must be different from the current password.';
    if (form.confirmPassword !== form.newPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setIsSaving(true);
    try {
      await authService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      // Every existing session, including this one, is now signed out
      clearSession();
      success('Password changed', 'Sign in again with your new password.');
      router.replace('/login');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setFieldErrors(apiErr.fields);
      else setFailure(apiErr.message);
      setIsSaving(false);
    }
  };

  const update = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  if (!user) return null;

  return (
    <PageContainer className="max-w-[1120px]">
      <PageHeader title="Account" subtitle="Your profile, permissions and sign-in security." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        {/* Left: identity, capabilities, profile media */}
        <div className="space-y-6">
          {/* Profile summary */}
          <Card padding="none" className="overflow-hidden">
            <ProfileCover className="h-32 sm:h-36" />
            <div className="px-6 pb-6">
              {/* The avatar overlaps the cover boundary; its own layer keeps it above the positioned cover */}
              <div className="relative z-10 -mt-11 w-fit sm:-mt-12">
                <Avatar name={user.name} seed={user.email} className="size-[84px] text-2xl shadow-md ring-4 ring-surface sm:size-[92px]" />
              </div>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-fg wrap-anywhere">{user.name}</h2>
                  <Email value={user.email} className="mt-0.5 block text-[13px] text-fg-muted" />
                </div>
                <RoleBadge role={user.role} size="md" />
              </div>

              <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-[13px] sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[11.5px] text-fg-subtle">Department</dt>
                    <dd className="font-medium text-fg wrap-anywhere">{user.department}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
                  <div>
                    <dt className="text-[11.5px] text-fg-subtle">Member since</dt>
                    <dd className="font-medium text-fg">{formatShortDate(user.createdAt)}</dd>
                  </div>
                </div>
              </dl>
              <p className="mt-5 flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-fg-muted">
                <Info className="size-3.5 shrink-0" aria-hidden />
                Role and department are managed by an administrator.
              </p>
            </div>
          </Card>

          {/* Permissions */}
          <Card padding="lg">
            <CardHeader title="What you can do" subtitle={ROLE_DESCRIPTIONS[user.role]} icon={<ShieldCheck />} className="mb-5" />
            <ul className="space-y-3">
              {PERMISSIONS[user.role].map((p) => (
                <li key={p} className="flex items-start gap-3 text-[13.5px] leading-snug text-fg">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full border border-green-line bg-green-bg text-green-fg" aria-hidden>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-xs text-fg-subtle">
              Need different access? Ask your FlowDesk administrator to update your role.
            </p>
          </Card>

          {/* Profile media: integration-ready only; the backend has no image upload or storage yet */}
          <Card padding="lg">
            <CardHeader
              title="Profile & Branding"
              subtitle="Images that represent you across FlowDesk"
              icon={<ImageIcon />}
              action={<Badge tone="neutral">Not available yet</Badge>}
              className="mb-5"
            />
            <div className="divide-y divide-line rounded-xl border border-line">
              <MediaRow
                preview={<Avatar name={user.name} seed={user.email} className="size-12 text-sm" />}
                title="Profile picture"
                text="Your initials are shown next to your tickets, comments and activity."
              />
              <MediaRow
                preview={<ProfileCover compact className="h-12 w-24 rounded-lg border border-line" />}
                title="Cover image"
                text="The default FlowDesk cover is shown on your profile."
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-fg-subtle">
              Custom pictures and covers need image storage on the server, which this FlowDesk deployment does not have
              yet, so nothing can be uploaded here.
            </p>
          </Card>
        </div>

        {/* Right: security */}
        <div className="space-y-6">
          {/* Password */}
          <Card padding="lg">
            <CardHeader
              title="Change password"
              subtitle="Choose a strong password you don't use anywhere else."
              icon={<KeyRound />}
              className="mb-6"
            />
            {failure && (
              <Alert tone="red" title="Password not changed" className="mb-5">
                {failure}
              </Alert>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <PasswordInput
                label="Current password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={update('currentPassword')}
                error={fieldErrors.currentPassword}
                disabled={isSaving}
              />
              <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle" aria-hidden>
                New password
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="space-y-5">
                <div>
                  <PasswordInput
                    label="New password"
                    autoComplete="new-password"
                    value={form.newPassword}
                    onChange={update('newPassword')}
                    error={fieldErrors.newPassword}
                    maxLength={100}
                    disabled={isSaving}
                  />
                  <div className="mt-2 rounded-lg border border-line bg-surface-2/60 px-3 pb-3 pt-1">
                    <PasswordChecklist password={form.newPassword} email={user.email} />
                  </div>
                </div>
                <PasswordInput
                  label="Confirm new password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  error={fieldErrors.confirmPassword}
                  maxLength={100}
                  disabled={isSaving}
                />
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-fg-subtle">You&apos;ll be signed out on every device.</p>
                <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto sm:min-w-[170px]">
                  Change password
                </Button>
              </div>
            </form>
          </Card>

          {/* Session */}
          <Card padding="lg">
            <CardHeader title="Session" subtitle="How sign-in works for your account" icon={<Clock />} className="mb-5" />
            <div className="flex items-center gap-3 rounded-xl border border-green-line bg-green-bg/50 px-4 py-3">
              <span className="relative flex size-2.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex size-full rounded-full bg-green opacity-50 motion-safe:animate-ping [animation-iteration-count:3]" />
                <span className="relative inline-flex size-2.5 rounded-full bg-green" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-fg">Signed in on this device</p>
                <Email value={user.email} className="block text-xs text-fg-muted" />
              </div>
            </div>
            <ul className="mt-5 space-y-4">
              {SESSION_FACTS.map((row) => (
                <li key={row.title} className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted [&_svg]:size-4" aria-hidden>
                    {row.icon}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-fg">{row.title}</p>
                    <p className="text-xs leading-relaxed text-fg-muted">{row.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end border-t border-line pt-5">
              <Button variant="secondary" leftIcon={<LogOut className="size-4" />} onClick={logout} className="w-full sm:w-auto">
                Sign out of this device
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

// Default cover in the FlowDesk visual language (users cannot upload their own yet)
function ProfileCover({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-accent-soft via-surface-2 to-violet-bg', className)} aria-hidden>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--line-strong) 1px, transparent 0)',
          backgroundSize: compact ? '8px 8px' : '18px 18px',
          maskImage: 'linear-gradient(105deg, transparent 15%, black 70%)',
        }}
      />
      {!compact && (
        <svg viewBox="0 0 240 120" fill="none" className="absolute right-6 top-1/2 h-[64%] -translate-y-1/2 text-accent opacity-[0.12]">
          <path d="M10 30h110c35 0 50 18 66 46l14 24" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
          <path d="M10 60h220" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
          <path d="M10 90h110c35 0 50-18 66-46" stroke="currentColor" strokeWidth="14" strokeLinecap="round" opacity="0.6" />
        </svg>
      )}
    </div>
  );
}

function MediaRow({ preview, title, text }: { preview: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
      <div className="shrink-0">{preview}</div>
      <div className="min-w-[140px] flex-1">
        <p className="text-[13px] font-medium text-fg">{title}</p>
        <p className="text-xs leading-relaxed text-fg-muted">{text}</p>
      </div>
      <Tooltip content="Uploading is not available in this deployment yet">
        <span tabIndex={0} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Button variant="secondary" size="sm" leftIcon={<Upload className="size-3.5" />} disabled aria-label={`Upload ${title.toLowerCase()} (not available yet)`}>
            Upload
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
