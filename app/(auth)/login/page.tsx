'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput, useFocusFirstError } from '@/components/ui/FormFields';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/types';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const { success } = useToast();
  const router = useRouter();
  const params = useSearchParams();

  // Registration sends the new user here with their email filled in
  const [form, setForm] = useState({ email: params.get('email') ?? '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, fieldErrors);
  const [failure, setFailure] = useState<string | null>(null);
  const [showResetInfo, setShowResetInfo] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Enter your password.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setFailure(null);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    try {
      await login(form.email.trim(), form.password);
      success('Welcome back', 'You are signed in.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setFieldErrors(apiErr.fields);
      // 401 for wrong credentials, 429 with a wait when sign-in is throttled
      else setFailure(apiErr.message || 'Invalid email or password.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Sign in</h1>
        <p className="mt-1.5 text-sm text-fg-muted">Welcome back. Enter your details to open your workspace.</p>
      </div>

      {failure && (
        <Alert tone="red" title="Sign in failed" className="mb-5 animate-enter">
          {failure}
        </Alert>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus={!form.email}
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          error={fieldErrors.email}
          disabled={isLoading}
          leftAddon={<Mail />}
        />

        <div>
          <PasswordInput
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            autoFocus={!!form.email}
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={fieldErrors.password}
            disabled={isLoading}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowResetInfo((v) => !v)}
              aria-expanded={showResetInfo}
              className="text-xs font-medium text-fg-muted transition-colors hover:text-fg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Forgot your password?
            </button>
          </div>
          {showResetInfo && (
            <p className="mt-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-fg-muted animate-enter">
              Password reset by email isn&apos;t available in this FlowDesk deployment, and administrators can&apos;t see
              passwords. Contact your FlowDesk administrator to regain access.
            </p>
          )}
        </div>

        <Button type="submit" size="lg" isLoading={isLoading} className="w-full" rightIcon={<ArrowRight className="size-4" />}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-fg-subtle">
        <span className="h-px flex-1 bg-line" />
        New to FlowDesk?
        <span className="h-px flex-1 bg-line" />
      </div>
      <Link
        href="/register"
        className="mt-4 flex h-10 w-full items-center justify-center rounded-lg border border-line bg-surface text-sm font-medium text-fg shadow-xs transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Create an account
      </Link>
    </div>
  );
}
