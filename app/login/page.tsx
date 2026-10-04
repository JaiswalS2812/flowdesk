'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormFields';
import { ApiError } from '@/types';
import { Eye, EyeOff, LayoutDashboard, Ticket, ShieldCheck } from 'lucide-react';

// ─── Feature pill ─────────────────────────────────────────────────────────────

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <span className="text-slate-400 shrink-0">{icon}</span>
      {text}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      success('Welcome back!', 'Signed in successfully.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setFieldErrors(apiErr.fields);
      else error('Sign in failed', apiErr.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[46%] flex-col justify-between bg-slate-900 px-12 py-12 relative overflow-hidden">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Brand mark */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs tracking-tight">FD</span>
          </div>
          <span className="text-white font-semibold text-base tracking-tight">FlowDesk</span>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-white leading-snug tracking-tight">
              Service requests,
              <br />
              <span className="text-slate-400">resolved faster.</span>
            </h1>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-xs">
              FlowDesk gives your team a single place to manage IT tickets, track SLAs, and keep every request moving.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <FeatureItem
              icon={<LayoutDashboard className="w-4 h-4" />}
              text="Role-aware dashboards for every team member"
            />
            <FeatureItem
              icon={<Ticket className="w-4 h-4" />}
              text="Full ticket lifecycle with priority and SLA tracking"
            />
            <FeatureItem
              icon={<ShieldCheck className="w-4 h-4" />}
              text="Secure JWT authentication with role-based access"
            />
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} FlowDesk · Enterprise Edition
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[#f7f8fa] px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile brand (shown only on small screens) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">FD</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight">FlowDesk</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Enter your credentials to access your workspace
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={fieldErrors.email}
                disabled={isLoading}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                error={fieldErrors.password}
                disabled={isLoading}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-1"
              >
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

