'use client';

import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn, Tone } from '@/utils';
import { Button } from '@/components/ui/Button';

// Radix handles focus trapping, Escape, scroll locking and restoring focus on close

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconTone?: Tone;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  // Prevent closing by outside click / Escape while a request is in flight
  busy?: boolean;
}

const ICON_TONE: Partial<Record<Tone, string>> = {
  red: 'bg-red-bg text-red-fg border-red-line',
  amber: 'bg-amber-bg text-amber-fg border-amber-line',
  accent: 'bg-accent-soft text-accent-soft-fg border-accent-line',
  green: 'bg-green-bg text-green-fg border-green-line',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  iconTone = 'accent',
  children,
  footer,
  size = 'md',
  busy,
}: ModalProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="overlay-motion fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]" />
        <RadixDialog.Content
          className={cn(
            'dialog-motion fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
            'max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl',
            'focus:outline-none',
            size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
          )}
          onEscapeKeyDown={(e) => busy && e.preventDefault()}
          onPointerDownOutside={(e) => busy && e.preventDefault()}
        >
          <div className="flex items-start gap-3.5 px-5 pt-5">
            {icon && (
              <div
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-xl border [&_svg]:size-5',
                  ICON_TONE[iconTone] ?? ICON_TONE.accent
                )}
                aria-hidden
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <RadixDialog.Title className="text-base font-semibold tracking-tight text-fg">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 cursor-pointer"
              aria-label="Close"
              disabled={busy}
            >
              <X className="size-4" />
            </RadixDialog.Close>
          </div>
          {children && <div className="px-5 pt-4">{children}</div>}
          {footer && (
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-3.5 sm:flex-row sm:justify-end rounded-b-2xl">
              {footer}
            </div>
          )}
          {!footer && <div className="h-5" />}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// ─── Confirmation dialog ─────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  icon,
  isLoading,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={icon}
      iconTone={tone === 'danger' ? 'red' : 'accent'}
      size="sm"
      busy={isLoading}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
