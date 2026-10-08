'use client';

import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/utils';

export const TooltipProvider = RadixTooltip.Provider;

// Tooltips supplement visible labels or aria-labels; they never carry the only description
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  disabled,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
  className?: string;
}) {
  if (disabled) return children;
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            'popover-motion z-[60] max-w-xs rounded-md bg-fg px-2.5 py-1.5 text-xs font-medium leading-snug text-fg-inverse shadow-md',
            className
          )}
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
