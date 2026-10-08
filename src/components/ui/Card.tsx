import React from 'react';
import { cn } from '@/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

export function Card({ padding = 'md', interactive, as: Tag = 'div', className, children, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-line bg-surface shadow-sm',
        interactive &&
          'transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-line-strong hover:shadow-md',
        PADDING[padding],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}

export function CardHeader({ title, subtitle, icon, action, className, as: Heading = 'h2' }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted [&_svg]:size-4">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <Heading className="text-sm font-semibold tracking-tight text-fg">{title}</Heading>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-line', className)} />;
}
