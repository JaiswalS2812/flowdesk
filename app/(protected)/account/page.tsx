'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/types';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { RoleBadge } from '@/components/tickets/Badges';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormFields';
import { useToast } from '@/components/ui/Toast';
import { KeyRound, UserRound } from 'lucide-react';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function AccountPage() {
  const router = useRouter();
  const { user, clearSession } = useAuth();
  const { success, error } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Mirrors the backend policy; the backend also rejects common passwords and the email name
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = 'Enter your current password.';
    if (form.newPassword.length < 10 || form.newPassword.length > 100)
      errs.newPassword = 'Password must be between 10 and 100 characters.';
    else if (!/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword))
      errs.newPassword = 'Password must contain at least one letter and one number.';
    else if (form.newPassword === form.currentPassword)
      errs.newPassword = 'New password must be different from the current password.';
    if (form.confirmPassword !== form.newPassword)
      errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setIsSaving(true);
    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      // Every existing session, including this one, is now signed out
      clearSession();
      success('Password changed', 'Sign in again with your new password.');
      router.replace('/login');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setFieldErrors(apiErr.fields);
      else error('Could not change password', apiErr.message);
      setIsSaving(false);
    }
  };

  const update = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Account"
        subtitle="Your profile and sign-in settings"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Account' },
        ]}
      />

      <div className="px-6 lg:px-8 py-6 max-w-2xl space-y-5">
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <UserRound className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
              <p className="text-xs text-slate-500">Role and department are managed by an administrator</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900 mt-0.5">{user?.name}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900 mt-0.5 truncate">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Role</dt>
              <dd className="mt-1">{user && <RoleBadge role={user.role} />}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Department</dt>
              <dd className="font-medium text-slate-900 mt-0.5">{user?.department}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
              <p className="text-xs text-slate-500">
                You will be signed out everywhere and need to sign in again
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={update('currentPassword')}
              error={fieldErrors.currentPassword}
              disabled={isSaving}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={update('newPassword')}
              error={fieldErrors.newPassword}
              hint="At least 10 characters, with a letter and a number"
              maxLength={100}
              disabled={isSaving}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={fieldErrors.confirmPassword}
              maxLength={100}
              disabled={isSaving}
            />
            <div className="pt-2 border-t border-slate-100">
              <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto sm:min-w-[160px]">
                Change password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
