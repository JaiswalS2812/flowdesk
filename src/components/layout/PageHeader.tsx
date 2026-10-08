import React from 'react';
import { cn } from '@/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

// Page title row; breadcrumbs live in the top bar
export function PageHeader({ title, subtitle, eyebrow, actions, meta, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-enter', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-fg sm:text-2xl wrap-anywhere">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

// Standard page container width and padding
export function PageContainer({ children, className, narrow }: { children: React.ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8', narrow ? 'max-w-3xl' : 'max-w-[1400px]', className)}>
      {children}
    </div>
  );
}
