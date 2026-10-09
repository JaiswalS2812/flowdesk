'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Timer, Workflow, BellRing } from 'lucide-react';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { ThemeMenu } from '@/components/layout/ThemeSwitcher';

const HIGHLIGHTS = [
  { icon: Workflow, title: 'Enforced workflow', text: 'Open → In Progress → Resolved → Closed, with role-based assignment.' },
  { icon: Timer, title: 'SLA tracking', text: 'Priority-based deadlines with automatic warning and breach escalation.' },
  { icon: BellRing, title: 'Notifications', text: 'Assignments, status changes, comments and SLA alerts in one place.' },
  { icon: ShieldCheck, title: 'Secure by design', text: 'JWT sessions, server-side role checks and a complete audit trail.' },
];

// The brand panel stays mounted while moving between sign-in and sign-up; only the form transitions
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] max-w-[640px] flex-col justify-between overflow-hidden border-r border-line bg-surface px-12 py-10 lg:flex">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-32 -top-32 size-[420px] rounded-full bg-accent opacity-[0.10] blur-3xl" />
          <div className="absolute -bottom-40 right-[-120px] size-[380px] rounded-full bg-violet opacity-[0.08] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, var(--line) 1px, transparent 0)',
              backgroundSize: '22px 22px',
              maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
            }}
          />
        </div>

        <div className="relative animate-enter">
          <Logo animated markClassName="size-9" />
        </div>

        <div className="relative">
          <p className="text-[34px] font-semibold leading-[1.15] tracking-tight text-fg animate-enter" style={{ animationDelay: '80ms' }}>
            Every request,
            <br />
            <span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">tracked to resolution.</span>
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted animate-enter" style={{ animationDelay: '140ms' }}>
            FlowDesk gives internal support teams one place to raise, route and resolve service requests, with SLAs
            that escalate on their own.
          </p>

          <ProductPreview />

          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="stagger" style={{ ['--i' as string]: i + 4 }}>
                <div className="flex items-center gap-2 text-[13px] font-semibold text-fg">
                  <span className="grid size-6 place-items-center rounded-md bg-accent-soft text-accent-soft-fg">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  {title}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-fg-subtle">© {new Date().getFullYear()} FlowDesk · Service management for internal teams</p>
      </aside>

      {/* Form area */}
      <main className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <span className="lg:hidden">
            <Logo animated />
          </span>
          <span className="hidden lg:block" />
          <ThemeMenu />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
          <div key={pathname} className="w-full max-w-[400px] animate-enter">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

// Decorative product illustration (not live data)
function ProductPreview() {
  return (
    <div className="relative mt-10 h-[148px] animate-enter" style={{ animationDelay: '220ms' }} aria-hidden>
      <div className="absolute left-6 right-10 top-0 h-[120px] rotate-[-2deg] rounded-xl border border-line bg-surface-2 shadow-md" />
      <div className="absolute inset-x-0 top-3 rounded-xl border border-line bg-surface p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <LogoMark className="size-5" />
          <span className="font-mono text-[11px] text-fg-subtle">#1042</span>
          <span className="text-[13px] font-medium text-fg">VPN disconnects every 20 minutes</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="rounded-md border border-amber-line bg-amber-bg px-1.5 py-0.5 text-[10.5px] font-medium text-amber-fg">In Progress</span>
          <span className="rounded-md border border-orange-line bg-orange-bg px-1.5 py-0.5 text-[10.5px] font-medium text-orange-fg">High</span>
          <span className="ml-auto text-[10.5px] font-medium text-green-fg">SLA on track</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-[46%] rounded-full bg-gradient-to-r from-green to-teal" />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-fg-subtle">
          <span>Created 1h 50m ago</span>
          <span>2h 10m to resolution target</span>
        </div>
      </div>
    </div>
  );
}
