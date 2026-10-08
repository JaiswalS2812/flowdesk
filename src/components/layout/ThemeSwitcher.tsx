'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Coffee, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, ThemePreference } from '@/contexts/ThemeContext';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/utils';

export const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'system', label: 'System', icon: <Monitor />, description: 'Follow your device setting' },
  { value: 'light', label: 'Light', icon: <Sun />, description: 'Bright and crisp' },
  { value: 'dark', label: 'Dark', icon: <Moon />, description: 'Low light, high focus' },
  { value: 'warm', label: 'Warm', icon: <Coffee />, description: 'Soft paper tones for long sessions' },
];

/**
 * The single global theme control: one compact button showing the current theme, opening a
 * small horizontal picker. Radix provides focus management, Escape and outside-click closing;
 * Left/Right arrows move between options as well as Up/Down.
 */
export function ThemeMenu({ align = 'end' }: { align?: 'start' | 'center' | 'end' }) {
  const { preference, theme, setPreference } = useTheme();
  const current = THEME_OPTIONS.find((o) => o.value === preference) ?? THEME_OPTIONS[0];
  const label = preference === 'system' ? `Theme: System (${theme === 'dark' ? 'Dark' : 'Light'})` : `Theme: ${current.label}`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    const index = items.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    // Opened with the mouse, focus starts on the menu itself: begin at the selected option
    if (index < 0) {
      (items.find((i) => i.getAttribute('data-state') === 'checked') ?? items[0])?.focus();
      return;
    }
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  };

  return (
    <DropdownMenu.Root modal={false}>
      <Tooltip content={label} side="bottom">
        <DropdownMenu.Trigger
          aria-label={`${label}. Change theme`}
          className={cn(
            'grid size-9 place-items-center rounded-lg border border-transparent text-fg-muted transition-[background-color,color,transform] duration-150 active:scale-95 cursor-pointer',
            'hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'data-[state=open]:border-line data-[state=open]:bg-surface-2 data-[state=open]:text-fg'
          )}
        >
          <span key={preference} className="animate-pop [&_svg]:size-[18px]" aria-hidden>
            {current.icon}
          </span>
        </DropdownMenu.Trigger>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          collisionPadding={8}
          onKeyDown={onKeyDown}
          className="popover-motion z-50 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
        >
          <DropdownMenu.Label className="px-1.5 pb-1.5 pt-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-fg-subtle">
            Theme
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={preference}
            onValueChange={(v) => setPreference(v as ThemePreference)}
            className="flex gap-1"
          >
            {THEME_OPTIONS.map((o) => (
              <DropdownMenu.RadioItem
                key={o.value}
                value={o.value}
                title={o.description}
                className={cn(
                  'relative flex w-[68px] cursor-pointer select-none flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-[11.5px] font-medium outline-none transition-colors',
                  'data-[highlighted]:bg-surface-2 data-[highlighted]:text-fg',
                  'data-[state=checked]:border-accent-line data-[state=checked]:bg-accent-soft data-[state=checked]:text-accent-soft-fg',
                  'data-[state=unchecked]:border-transparent data-[state=unchecked]:text-fg-muted'
                )}
              >
                <span className="[&_svg]:size-[18px]" aria-hidden>
                  {o.icon}
                </span>
                {o.label}
                <DropdownMenu.ItemIndicator className="absolute right-1 top-1">
                  <Check className="size-3" aria-hidden />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
