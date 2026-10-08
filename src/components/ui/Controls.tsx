'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn, initials, avatarTone, TONE_SOFT } from '@/utils';

// ─── Segmented control (radio group) ─────────────────────────────────────────

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  iconOnly,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between options, like a native radio group
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5', className)}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={iconOnly ? opt.label : undefined}
            title={iconOnly ? opt.label : undefined}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'sm' ? 'h-7 text-xs' : 'h-8 text-[13px]',
              iconOnly ? (size === 'sm' ? 'w-7' : 'w-8') : 'px-3',
              active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
            )}
          >
            {opt.icon && <span className="[&_svg]:size-3.5" aria-hidden>{opt.icon}</span>}
            {!iconOnly && opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  'rounded px-1 text-[10.5px] tabular',
                  active ? 'bg-accent-soft text-accent-soft-fg' : 'bg-surface-3 text-fg-subtle'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Switch ──────────────────────────────────────────────────────────────────

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'border-transparent bg-green' : 'border-line-strong bg-surface-3'
      )}
    >
      <span
        className={cn(
          'inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-spring)]',
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
}

// ─── Avatar (initials, stable colour per person) ─────────────────────────────

export function Avatar({
  name,
  seed,
  size = 'md',
  className,
}: {
  name: string;
  seed?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    xs: 'size-5 text-[9px]',
    sm: 'size-6 text-[10px]',
    md: 'size-8 text-[11px]',
    lg: 'size-10 text-sm',
    xl: 'size-14 text-lg',
  };
  return (
    <span
      className={cn(
        'inline-grid shrink-0 select-none place-items-center rounded-full border font-semibold tracking-tight',
        TONE_SOFT[avatarTone(seed ?? name)],
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

// ─── Animated number (counts up once on mount / change) ─────────────────────

export function AnimatedNumber({ value, duration = 700, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = from.current;
    if (reduce || start === value) {
      from.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={cn('tabular', className)} aria-label={String(value)}>
      <span aria-hidden>{display.toLocaleString()}</span>
    </span>
  );
}
