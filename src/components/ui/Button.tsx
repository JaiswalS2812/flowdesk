import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'danger-soft';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg border-transparent shadow-sm hover:bg-accent-hover ' +
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.14),var(--elev-sm)]',
  secondary:
    'bg-surface text-fg border-line shadow-xs hover:bg-surface-2 hover:border-line-strong',
  ghost: 'bg-transparent text-fg-muted border-transparent hover:bg-surface-2 hover:text-fg',
  outline: 'bg-transparent text-accent-soft-fg border-accent-line hover:bg-accent-soft',
  danger: 'bg-red text-white border-transparent shadow-sm hover:brightness-95',
  'danger-soft': 'bg-transparent text-red-fg border-transparent hover:bg-red-bg',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
};

export const buttonClasses = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) =>
  cn(
    'relative inline-flex items-center justify-center whitespace-nowrap font-medium border select-none cursor-pointer',
    'transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 ease-out',
    'active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-canvas',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    VARIANTS[variant],
    SIZES[size],
    className
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, className, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {isLoading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});

// ─── Icon button ─────────────────────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // accessible name; icon-only buttons always need one
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'secondary';
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'ghost', active, className, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-lg border cursor-pointer',
        'transition-[background-color,border-color,color,transform] duration-150 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'size-8' : 'size-9',
        variant === 'secondary'
          ? 'bg-surface border-line text-fg-muted shadow-xs hover:text-fg hover:bg-surface-2'
          : 'bg-transparent border-transparent text-fg-muted hover:text-fg hover:bg-surface-2',
        active && 'bg-surface-2 text-fg border-line',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
