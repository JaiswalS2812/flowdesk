'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils';

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuContent({
  children,
  align = 'end',
  side = 'bottom',
  className,
  sideOffset = 6,
}: {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  sideOffset?: number;
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          'popover-motion z-50 min-w-[220px] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg',
          className
        )}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function MenuItem({
  children,
  icon,
  onSelect,
  danger,
  shortcut,
  disabled,
  asChild,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onSelect?: (event: Event) => void;
  danger?: boolean;
  shortcut?: React.ReactNode;
  disabled?: boolean;
  asChild?: boolean;
}) {
  const classes = cn(
    'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] outline-none transition-colors',
    'data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    danger ? 'text-red-fg data-[highlighted]:bg-red-bg' : 'text-fg'
  );
  if (asChild) {
    return (
      <DropdownMenu.Item asChild onSelect={onSelect} disabled={disabled} className={classes}>
        {children}
      </DropdownMenu.Item>
    );
  }
  return (
    <DropdownMenu.Item onSelect={onSelect} disabled={disabled} className={classes}>
      {icon && <span className={cn('shrink-0 [&_svg]:size-4', danger ? '' : 'text-fg-subtle')}>{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut}
    </DropdownMenu.Item>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Label className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
      {children}
    </DropdownMenu.Label>
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-line" />;
}
