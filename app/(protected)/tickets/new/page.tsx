'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Building2, Clock, Send, UserCheck } from 'lucide-react';
import { ticketService } from '@/services/ticket.service';
import { ApiError, TicketPriority } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/FormFields';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { cn, PRIORITIES, PRIORITY_DESCRIPTIONS, PRIORITY_LABELS, PRIORITY_TONE, TONE_SOFT, TONE_SOLID } from '@/utils';

// Must match the backend limits on ticket creation (CreateTicketRequest)
const TITLE_MAX = 255;
const DESCRIPTION_MAX = 16000;

export default function NewTicketPage() {
  const router = useRouter();
  const { success } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' as TicketPriority });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Give the ticket a short title.';
    if (!form.description.trim()) errs.description = 'Describe the problem or request.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    try {
      const ticket = await ticketService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });
      success('Ticket created', `Ticket #${ticket.id} has been submitted.`);
      router.push(`/tickets/${ticket.id}`);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setFieldErrors(apiErr.fields);
      // e.g. 409 when the account has no department or the priority has no active SLA policy
      else setFailure(apiErr.message || 'The ticket could not be created. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PageContainer className="max-w-[1100px]">
      <PageHeader
        title="New Ticket"
        subtitle="Describe what you need and we will route it to the right team."
        actions={
          <Link href="/tickets" className={buttonClasses('ghost', 'md')}>
            <ArrowLeft className="size-4" /> Back to tickets
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card padding="lg">
          {failure && (
            <Alert tone="red" title="Ticket not created" className="mb-5">
              {failure}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Input
              label="Title"
              placeholder="e.g. VPN disconnects every 20 minutes"
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              error={fieldErrors.title}
              hint={`A one-line summary helps engineers triage quickly · ${form.title.length}/${TITLE_MAX}`}
              disabled={isLoading}
              maxLength={TITLE_MAX}
            />

            <Textarea
              label="Description"
              placeholder={'What happened? What did you expect?\nInclude steps to reproduce, error messages and when it started.'}
              required
              rows={7}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              error={fieldErrors.description}
              disabled={isLoading}
              maxLength={DESCRIPTION_MAX}
              showCounter
            />

            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-fg">
                Priority <span className="text-red-fg" aria-hidden>*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PRIORITIES.map((p) => {
                  const selected = form.priority === p;
                  const tone = PRIORITY_TONE[p];
                  return (
                    <label
                      key={p}
                      className={cn(
                        'relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-[border-color,background-color,box-shadow] duration-150',
                        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                        selected ? 'border-accent bg-accent-soft/40 shadow-sm' : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2/60',
                        isLoading && 'pointer-events-none opacity-60'
                      )}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={selected}
                        onChange={() => setForm((f) => ({ ...f, priority: p }))}
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors', selected ? 'border-accent' : 'border-line-strong')} aria-hidden>
                        <span className={cn('size-2 rounded-full bg-accent transition-transform duration-200', selected ? 'scale-100' : 'scale-0')} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-fg">
                          <span className={cn('size-2 rounded-full', TONE_SOLID[tone])} aria-hidden />
                          {PRIORITY_LABELS[p]}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{PRIORITY_DESCRIPTIONS[p]}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.priority && <p className="mt-1.5 text-xs text-red-fg">{fieldErrors.priority}</p>}
            </fieldset>

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-xs text-fg-muted">
                <Building2 className="size-3.5 shrink-0" aria-hidden />
                Filed under your department: <span className="font-medium text-fg">{user?.department}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} leftIcon={<Send className="size-4" />} className="min-w-[150px]">
                  Submit Ticket
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-fg">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {[
                { icon: <Clock />, title: 'SLA clock starts', text: 'Response and resolution deadlines are set from the policy for the priority you choose.' },
                { icon: <UserCheck />, title: 'A manager assigns it', text: 'Your department’s manager routes the ticket to a support engineer.' },
                { icon: <Bell />, title: 'You stay informed', text: 'You are notified about status changes and new comments.' },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3 stagger" style={{ ['--i' as string]: i }}>
                  <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg border [&_svg]:size-3.5', TONE_SOFT.accent)} aria-hidden>
                    {step.icon}
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-fg">{step.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="bg-surface-2/60 shadow-none">
            <h2 className="text-[13px] font-semibold text-fg">Tips for a faster fix</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-fg-muted">
              <li>Mention the device, app or system affected.</li>
              <li>Paste the exact error message.</li>
              <li>Say how many people are affected.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
