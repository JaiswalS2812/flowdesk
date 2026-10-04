import React from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Premium SaaS button styles — strong contrast, refined states
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: [
    'bg-brand-600 text-white border-brand-600',
    'hover:bg-brand-700 hover:border-brand-700',
    'active:bg-brand-800 active:scale-[0.98]',
    'shadow-sm',
    'disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none',
  ].join(' '),

  secondary: [
    'bg-white text-slate-700 border-slate-200',
    'hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900',
    'active:bg-slate-100 active:scale-[0.98]',
    'shadow-sm',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' '),

  outline: [
    'bg-transparent text-brand-600 border-brand-300',
    'hover:bg-brand-50 hover:border-brand-500',
    'active:bg-brand-100 active:scale-[0.98]',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' '),

  ghost: [
    'bg-transparent text-slate-600 border-transparent',
    'hover:bg-slate-100 hover:text-slate-900',
    'active:bg-slate-200 active:scale-[0.98]',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' '),

  danger: [
    'bg-red-600 text-white border-red-600',
    'hover:bg-red-700 hover:border-red-700',
    'active:bg-red-800 active:scale-[0.98]',
    'shadow-sm',
    'disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none',
  ].join(' '),
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-5 text-sm gap-2 rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium border',
        'transition-all duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

