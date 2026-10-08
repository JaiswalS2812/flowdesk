import React from 'react';
import { cn, Tone, TONE_SOFT, TONE_SOLID } from '@/utils';

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export function Badge({ tone = 'neutral', children, dot, icon, size = 'sm', className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border font-medium leading-none',
        size === 'sm' ? 'h-[22px] px-2 text-[11.5px]' : 'h-7 px-2.5 text-xs',
        TONE_SOFT[tone],
        className
      )}
    >
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', TONE_SOLID[tone])} aria-hidden />}
      {icon && <span className="shrink-0 [&_svg]:size-3.5" aria-hidden>{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function StatusDot({ tone, pulse, className }: { tone: Tone; pulse?: boolean; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2 shrink-0 rounded-full', TONE_SOLID[tone], pulse && 'animate-pulse-ring', className)}
      aria-hidden
    />
  );
}

// Keyboard hint, e.g. <Kbd>⌘K</Kbd>
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface-2 px-1 font-sans text-[10.5px] font-medium text-fg-subtle',
        className
      )}
    >
      {children}
    </kbd>
  );
}
