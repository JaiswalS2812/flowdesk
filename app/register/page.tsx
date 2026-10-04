'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormFields';
import { ApiError } from '@/types';
import { Eye, EyeOff, Zap, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.';
    if (!form.department || form.department.length < 2)
      errs.department = 'Department must be at least 2 characters.';
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
    setIsLoading(true);
    try {
      await register(form.name, form.email, form.password, form.department);
      success('Account created!', 'You can now sign in with your credentials.');
      setRegistered(true);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.fields) {
        setFieldErrors(apiErr.fields);
      } else {
        error('Registration failed', apiErr.message || 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-white/[0.97] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">FlowDesk</span>
            </div>
            <h1 className="text-white text-xl font-bold">Create your account</h1>
            <p className="text-brand-200 text-sm mt-1">
              Join your team on FlowDesk
            </p>
          </div>

          {registered ? (
            <div className="px-8 py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Registration successful!
              </h2>
              <p className="text-sm text-slate-500">
                Your account has been created. An administrator may need to
                assign you a role before you can access all features.
              </p>
              <Button
                onClick={() => router.push('/login')}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5" noValidate>
              <Input
                label="Full name"
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={fieldErrors.name}
                disabled={isLoading}
              />

              <Input
                label="Work email"
                type="email"
                placeholder="jane@company.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                error={fieldErrors.email}
                disabled={isLoading}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                error={fieldErrors.password}
                disabled={isLoading}
                hint="Must be at least 8 characters"
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
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

              <Input
                label="Department"
                type="text"
                placeholder="e.g. Engineering, HR, Finance"
                required
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                error={fieldErrors.department}
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Create account
              </Button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-brand-600 font-medium hover:text-brand-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          © {new Date().getFullYear()} FlowDesk. Enterprise Edition.
        </p>
      </div>
    </div>
  );
}

