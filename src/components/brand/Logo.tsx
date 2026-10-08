import React from 'react';
import { cn } from '@/utils';

/**
 * FlowDesk mark: three stacked "lanes" that merge into one flow, a request moving from
 * intake to resolution. `animated` draws the strokes once (auth screens).
 */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  const stroke = animated ? { strokeDasharray: 40, ['--len' as string]: 40, animation: 'draw 0.9s var(--ease-out) both' } : undefined;
  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-accent text-accent-fg',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.18)]',
        animated && 'animate-pop',
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />
      <svg viewBox="0 0 24 24" fill="none" className="relative size-[62%]">
        <path d="M4 7h7.5c2.5 0 3.5 1.2 4.6 3.1L17 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" style={stroke} />
        <path d="M4 12h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" style={stroke && { ...stroke, animationDelay: '0.12s' }} />
        <path d="M4 17h7.5c2.5 0 3.5-1.2 4.6-3.1L17 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" opacity="0.7" style={stroke && { ...stroke, animationDelay: '0.24s' }} />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  markClassName,
  animated,
  subtitle,
}: {
  className?: string;
  markClassName?: string;
  animated?: boolean;
  subtitle?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('size-8', markClassName)} animated={animated} />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-fg">FlowDesk</span>
        {subtitle && <span className="mt-1 text-[10.5px] font-medium text-fg-subtle">{subtitle}</span>}
      </span>
    </span>
  );
}
