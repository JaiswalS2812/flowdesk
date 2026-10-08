'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}

const DURATION: Record<ToastType, number> = { success: 4500, info: 5000, warning: 7000, error: 8000 };
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }].slice(-MAX_VISIBLE));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, message) => toast({ type: 'success', title, message }),
      error: (title, message) => toast({ type: 'error', title, message }),
      warning: (title, message) => toast({ type: 'warning', title, message }),
      info: (title, message) => toast({ type: 'info', title, message }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Errors are announced assertively, everything else politely */}
      <div className="pointer-events-none fixed inset-x-4 bottom-[68px] z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-[76px]">
        <div aria-live="polite" className="contents">
          {toasts.filter((t) => t.type !== 'error').map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
        <div aria-live="assertive" className="contents">
          {toasts.filter((t) => t.type === 'error').map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="size-[18px] text-green" />,
  error: <XCircle className="size-[18px] text-red" />,
  warning: <AlertTriangle className="size-[18px] text-amber" />,
  info: <Info className="size-[18px] text-blue" />,
};

const BAR: Record<ToastType, string> = {
  success: 'bg-green',
  error: 'bg-red',
  warning: 'bg-amber',
  info: 'bg-blue',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DURATION[toast.type]);
  const started = useRef(0);

  // Auto-dismiss, paused while hovered or focused so it can be read
  useEffect(() => {
    if (paused) return;
    started.current = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto relative w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lg sm:w-[360px]',
        'animate-toast-in'
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="mt-px shrink-0" aria-hidden>
          {ICON[toast.type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-fg">{toast.title}</p>
          {toast.message && <p className="mt-0.5 text-xs leading-relaxed text-fg-muted wrap-anywhere">{toast.message}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="-mr-1 grid size-6 shrink-0 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <span
        className={cn('absolute bottom-0 left-0 h-0.5 origin-left', BAR[toast.type])}
        style={{
          width: '100%',
          animation: `toast-progress ${DURATION[toast.type]}ms linear forwards`,
          animationPlayState: paused ? 'paused' : 'running',
          opacity: 0.55,
        }}
        aria-hidden
      />
    </div>
  );
}
