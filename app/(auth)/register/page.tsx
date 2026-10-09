'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Check, Mail, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Input, PasswordInput, PasswordChecklist, passwordChecks, useFocusFirstError } from '@/components/ui/FormFields';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/types';

export default function RegisterPage() {
  const { register } = useAuth();
  const { success } = useToast();

  const [form, setForm] = useState({ name: '', email: '', department: '', password: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, fieldErrors);
  const [failure, setFailure] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Mirrors the backend rules; the backend also rejects common passwords
  const validate = () => {
    const errs: Record<string, string> = {};
    const name = form.name.trim();
    const department = form.department.trim();
    if (name.length < 2 || name.length > 100) errs.name = 'Name must be between 2 and 100 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (department.length < 2 || department.length > 100) errs.department = 'Department must be between 2 and 100 characters.';
    const failed = passwordChecks(form.password, form.email.trim()).find((c) => !c.ok);
    if (failed) errs.password = `Password: ${failed.label.toLowerCase()}.`;
    if (!errs.password && form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
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
    setIsLoading(true);
    try {
      const email = form.email.trim();
      await register(form.name.trim(), email, form.password, form.department.trim());
      success('Account created', 'You can now sign in.');
      setRegistered(email);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setFieldErrors(apiErr.fields);
      else setFailure(apiErr.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="text-center">
        <div className="relative mx-auto mb-6 grid size-16 place-items-center">
          <span className="absolute inset-0 rounded-full bg-green opacity-20 animate-ping [animation-iteration-count:1]" aria-hidden />
          <span className="relative grid size-16 place-items-center rounded-full bg-green text-white shadow-lg animate-pop">
            <Check className="size-8" strokeWidth={2.5} />
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">You&apos;re all set</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">
          Your account <span className="font-medium text-fg">{registered}</span> was created as an Employee. An
          administrator can grant other roles when you need them.
        </p>
        <Link href={`/login?email=${encodeURIComponent(registered)}`} className={buttonClasses('primary', 'lg', 'mt-7 w-full')}>
          Continue to sign in
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Create your account</h1>
        <p className="mt-1.5 text-sm text-fg-muted">Join your team&apos;s FlowDesk workspace to raise and track requests.</p>
      </div>

      {failure && (
        <Alert tone="red" title="Registration failed" className="mb-5 animate-enter">
          {failure}
        </Alert>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          placeholder="Jane Smith"
          autoComplete="name"
          autoFocus
          required
          maxLength={100}
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name}
          disabled={isLoading}
          leftAddon={<UserRound />}
        />
        <Input
          label="Work email"
          type="email"
          placeholder="jane@company.com"
          autoComplete="email"
          required
          maxLength={150}
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
          disabled={isLoading}
          leftAddon={<Mail />}
        />
        <Input
          label="Department"
          placeholder="e.g. Finance, Engineering, HR"
          required
          maxLength={100}
          value={form.department}
          onChange={set('department')}
          error={fieldErrors.department}
          hint="Your tickets are filed under this department."
          disabled={isLoading}
          leftAddon={<Building2 />}
        />
        <div>
          <PasswordInput
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            required
            maxLength={100}
            value={form.password}
            onChange={set('password')}
            error={fieldErrors.password}
            disabled={isLoading}
          />
          {(form.password || fieldErrors.password) && <PasswordChecklist password={form.password} email={form.email} />}
        </div>
        <PasswordInput
          label="Confirm password"
          placeholder="Repeat the password"
          autoComplete="new-password"
          required
          maxLength={100}
          value={form.confirm}
          onChange={set('confirm')}
          error={fieldErrors.confirm}
          disabled={isLoading}
        />

        <Button type="submit" size="lg" isLoading={isLoading} className="w-full" rightIcon={<ArrowRight className="size-4" />}>
          Create account
        </Button>
        <p className="text-center text-xs leading-relaxed text-fg-subtle">
          New accounts start with the Employee role. Roles are managed by administrators.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent-soft-fg transition-colors hover:text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
