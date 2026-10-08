'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CalendarDays, Check, Clock, KeyRound, LogOut, Mail, Palette, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { authService } from '@/services/auth.service';
import { ApiError, Role } from '@/types';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PasswordInput, PasswordChecklist, passwordChecks } from '@/components/ui/FormFields';
import { Avatar } from '@/components/ui/Controls';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { RoleBadge } from '@/components/tickets/Badges';
import { THEME_OPTIONS } from '@/components/layout/ThemeSwitcher';
import { cn, formatShortDate, ROLE_DESCRIPTIONS } from '@/utils';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

// What each role can do (mirrors the backend authorization rules)
const PERMISSIONS: Record<Role, string[]> = {
  EMPLOYEE: ['Create tickets for your department', 'View and comment on tickets you created', 'Receive updates on your tickets'],
  SUPPORT_ENGINEER: ['View tickets assigned to you', 'Move assigned tickets through the workflow', 'Receive SLA warnings for your tickets'],
  MANAGER: ['View every ticket in your department', 'Assign tickets to your department’s engineers', 'Change ticket status and receive SLA alerts'],
  ADMIN: ['View and manage every ticket', 'Manage users, roles and departments', 'Configure SLA policies and review the audit log'],
};

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
    <PageContainer className="max-w-[1100px]">
      <PageHeader title="Account" subtitle="Your profile, appearance and sign-in security." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          {/* Profile */}
          <Card padding="none" className="overflow-hidden">
            <div className="relative h-20 bg-gradient-to-r from-accent-soft via-surface-2 to-violet-bg" aria-hidden />
            <div className="px-5 pb-5">
              <div className="-mt-9 flex items-end justify-between gap-3">
                <Avatar name={user.name} seed={user.email} size="xl" className="ring-4 ring-surface" />
                <RoleBadge role={user.role} size="md" />
              </div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-fg">{user.name}</h2>
              <dl className="mt-3 space-y-2 text-[13px]">
                <div className="flex items-center gap-2.5 text-fg-muted">
                  <dt className="sr-only">Email</dt>
                  <Mail className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                  <dd className="min-w-0 wrap-anywhere text-fg">{user.email}</dd>
                </div>
                <div className="flex items-center gap-2.5 text-fg-muted">
                  <dt className="sr-only">Department</dt>
                  <Building2 className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                  <dd className="text-fg">{user.department}</dd>
                </div>
                <div className="flex items-center gap-2.5 text-fg-muted">
                  <dt className="sr-only">Member since</dt>
                  <CalendarDays className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                  <dd>Member since {formatShortDate(user.createdAt)}</dd>
                </div>
              </dl>
              <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-fg-muted">
                Role and department are managed by an administrator.
              </p>
            </div>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader title="What you can do" subtitle={ROLE_DESCRIPTIONS[user.role]} icon={<ShieldCheck />} />
            <ul className="space-y-2">
              {PERMISSIONS[user.role].map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[13px] text-fg">
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-green-bg text-green-fg" aria-hidden>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader title="Appearance" subtitle="Saved on this device" icon={<Palette />} />
            <ThemeCards />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Password */}
          <Card padding="lg">
            <CardHeader title="Change password" subtitle="You will be signed out everywhere and need to sign in again." icon={<KeyRound />} />
            {failure && (
              <Alert tone="red" title="Password not changed" className="mb-4">
                {failure}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <PasswordInput
                label="Current password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={update('currentPassword')}
                error={fieldErrors.currentPassword}
                disabled={isSaving}
              />
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
                <PasswordChecklist password={form.newPassword} email={user.email} />
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
              <div className="flex justify-end border-t border-line pt-4">
                <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto sm:min-w-[170px]">
                  Change password
                </Button>
              </div>
            </form>
          </Card>

          {/* Session */}
          <Card>
            <CardHeader title="Session" icon={<Clock />} />
            <ul className="space-y-2 text-[13px] leading-relaxed text-fg-muted">
              <li>Sessions last one hour; after that you are asked to sign in again.</li>
              <li>Changing your password signs out every session, on every device.</li>
              <li>Repeated failed sign-ins are temporarily blocked to protect your account.</li>
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <Badge tone="green" dot>Signed in</Badge>
              <Button variant="secondary" size="sm" leftIcon={<LogOut className="size-3.5" />} onClick={logout}>
                Sign out of this device
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function ThemeCards() {
  const { preference, setPreference } = useTheme();
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Theme">
      {THEME_OPTIONS.map((t) => {
        const selected = preference === t.value;
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={selected}
            onClick={() => setPreference(t.value)}
            className={cn(
              'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'border-accent bg-accent-soft/40' : 'border-line hover:border-line-strong hover:bg-surface-2'
            )}
          >
            <span className={cn('mt-0.5 [&_svg]:size-4', selected ? 'text-accent' : 'text-fg-subtle')} aria-hidden>
              {t.icon}
            </span>
            <span>
              <span className="block text-[13px] font-medium text-fg">{t.label}</span>
              <span className="block text-[11.5px] leading-snug text-fg-muted">{t.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
