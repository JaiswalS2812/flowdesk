'use client';

import React, { useEffect, useId, useState } from 'react';
import { AlertCircle, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils';

// ─── Shared control styling ──────────────────────────────────────────────────

export const controlClasses = (invalid?: boolean) =>
  cn(
    'w-full rounded-lg border bg-surface text-sm text-fg shadow-xs',
    'placeholder:text-fg-subtle',
    'transition-[border-color,box-shadow,background-color] duration-150',
    'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-ring/40',
    'disabled:bg-surface-2 disabled:text-fg-subtle disabled:cursor-not-allowed disabled:shadow-none',
    'read-only:bg-surface-2',
    invalid ? 'border-red focus:border-red focus:ring-red/25' : 'border-line hover:border-line-strong'
  );

// ─── Field wrapper: label, hint, error, counter ─────────────────────────────

interface FieldProps {
  id: string;
  label?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  counter?: { value: number; max: number };
  className?: string;
  children: React.ReactNode;
}

export function Field({ id, label, required, hint, error, counter, className, children }: FieldProps) {
  const near = counter && counter.value > counter.max * 0.9;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-fg">
          {label}
          {required && (
            <span className="text-red-fg" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {(error || hint || counter) && (
        <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
          {/* Not a live region: forms move focus to the first invalid field (useFocusFirstError),
              which reads its label and this error once instead of announcing every error at once */}
          {error ? (
            <p id={`${id}-error`} className="flex items-start gap-1 text-red-fg">
              <AlertCircle className="size-3.5 shrink-0 mt-px" aria-hidden />
              {error}
            </p>
          ) : hint ? (
            <p id={`${id}-hint`} className="text-fg-subtle">
              {hint}
            </p>
          ) : (
            <span />
          )}
          {counter && (
            <span className={cn('tabular shrink-0', near ? 'text-amber-fg' : 'text-fg-subtle')} aria-hidden>
              {counter.value.toLocaleString()} / {counter.max.toLocaleString()}
            </span>
          )}
          {/* Screen readers hear the count only close to the limit, not on every keystroke */}
          {counter && (
            <span className="sr-only" aria-live="polite">
              {near ? `${(counter.max - counter.value).toLocaleString()} characters left` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// After a submit produces errors, focus the first invalid control so assistive technology reads
// its label and error. Pass the error object as set by the form: each new object refocuses.
export function useFocusFirstError(formRef: React.RefObject<HTMLFormElement | null>, errors: object) {
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [formRef, errors]);
}

function describedBy(id: string, error?: string, hint?: React.ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  fieldClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftAddon, rightAddon, className, fieldClassName, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field id={inputId} label={label} required={props.required} hint={hint} error={error} className={fieldClassName}>
      <div className="relative">
        {leftAddon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle [&_svg]:size-4">
            {leftAddon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={cn(controlClasses(!!error), 'h-10 px-3', leftAddon && 'pl-9', rightAddon && 'pr-10', className)}
          {...props}
        />
        {rightAddon && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightAddon}</div>}
      </div>
    </Field>
  );
});

// ─── Password input with visibility toggle ──────────────────────────────────

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightAddon'>>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        {...props}
        type={visible ? 'text' : 'password'}
        rightAddon={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            disabled={props.disabled}
            className="grid size-7 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
    );
  }
);

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  showCounter?: boolean;
  fieldClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, showCounter, className, fieldClassName, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const length = typeof props.value === 'string' ? props.value.length : 0;
  return (
    <Field
      id={inputId}
      label={label}
      required={props.required}
      hint={hint}
      error={error}
      className={fieldClassName}
      counter={showCounter && props.maxLength ? { value: length, max: props.maxLength } : undefined}
    >
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        className={cn(controlClasses(!!error), 'min-h-[96px] resize-y px-3 py-2.5 leading-relaxed', className)}
        {...props}
      />
    </Field>
  );
});

// ─── Select (native, so keyboard and screen readers behave as expected) ──────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  fieldClassName?: string;
  selectSize?: 'sm' | 'md';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className, fieldClassName, selectSize = 'md', id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field id={inputId} label={label} required={props.required} hint={hint} error={error} className={fieldClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={cn(
            controlClasses(!!error),
            'appearance-none cursor-pointer pl-3 pr-9',
            selectSize === 'sm' ? 'h-9' : 'h-10',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden
        />
      </div>
    </Field>
  );
});

// ─── Password requirements (mirrors the backend PasswordRules) ───────────────

export function passwordChecks(password: string, email: string) {
  const local = email.includes('@') ? email.slice(0, email.indexOf('@')).trim().toLowerCase() : '';
  return [
    { label: '10–100 characters', ok: password.length >= 10 && password.length <= 100 },
    { label: 'At least one letter and one number', ok: /[A-Za-z]/.test(password) && /[0-9]/.test(password) },
    {
      label: 'Does not contain your email name',
      ok: password.length > 0 && !(local.length >= 3 && password.toLowerCase().includes(local)),
    },
  ];
}

export function PasswordChecklist({ password, email }: { password: string; email: string }) {
  const checks = passwordChecks(password, email);
  const passed = checks.filter((c) => c.ok).length;
  const strength = password.length === 0 ? 0 : passed + (password.length >= 14 ? 1 : 0);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const tones = ['bg-line', 'bg-red', 'bg-amber', 'bg-teal', 'bg-green'];

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                strength >= step ? tones[strength] : 'bg-surface-3'
              )}
            />
          ))}
        </div>
        <span className="w-12 text-right text-[11px] font-medium text-fg-subtle">{labels[strength]}</span>
      </div>
      <ul className="grid gap-1 text-xs">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn('flex items-center gap-1.5 transition-colors', c.ok ? 'text-green-fg' : 'text-fg-subtle')}
          >
            <span
              className={cn(
                'grid size-3.5 place-items-center rounded-full border text-[9px] leading-none',
                c.ok ? 'border-green bg-green text-white' : 'border-line-strong'
              )}
              aria-hidden
            >
              {c.ok ? '✓' : ''}
            </span>
            {c.label}
            <span className="sr-only">{c.ok ? '(met)' : '(not met)'}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-fg-subtle">Common passwords are also rejected.</p>
    </div>
  );
}
