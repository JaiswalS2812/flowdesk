import React from 'react';
import { cn } from '@/utils';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-7',
};

export function Card({
  children,
  className,
  hover = false,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm shadow-slate-100',
        hover && [
          'transition-all duration-200 cursor-pointer',
          'hover:shadow-md hover:shadow-slate-200 hover:border-slate-300',
          'hover:-translate-y-px',
        ].join(' '),
        PADDING[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Card Header ──────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div>
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  icon,
  iconBg = 'bg-slate-50',
  className,
  isLoading = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm shadow-slate-100 p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-slate-500 leading-none uppercase tracking-widest">
          {label}
        </p>
        {icon && (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="skeleton h-8 w-14 mt-1" />
      ) : (
        <p className="text-3xl font-semibold text-slate-900 tracking-tight animate-count">
          {value}
        </p>
      )}
      {delta && !isLoading && (
        <p
          className={cn(
            'text-xs mt-2 font-medium',
            deltaPositive ? 'text-emerald-600' : 'text-red-500'
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ children, className, dot, dotColor }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border',
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor || 'bg-current')} />
      )}
      {children}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

// ─── Table primitives ─────────────────────────────────────────────────────────

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead className={cn('border-b border-slate-100 bg-slate-50/60', className)}>
      {children}
    </thead>
  );
}

export function Th({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        'px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
        onClick && 'cursor-pointer select-none hover:text-slate-700 transition-colors',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-100',
        onClick && 'hover:bg-slate-50 cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn('px-4 py-3.5 text-slate-700 text-sm', className)}>{children}</td>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-slate-100', className)} />;
}

