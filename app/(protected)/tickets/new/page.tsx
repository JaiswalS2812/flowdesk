'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ticketService } from '@/services/ticket.service';
import { TicketPriority } from '@/types';
import { ApiError } from '@/types';
import { PageHeader } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/FormFields';
import { useToast } from '@/components/ui/Toast';
import { Ticket } from 'lucide-react';

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Low — General inquiry, no urgency' },
  { value: 'MEDIUM', label: 'Medium — Some impact, can wait' },
  { value: 'HIGH', label: 'High — Significant business impact' },
  { value: 'CRITICAL', label: 'Critical — Severe / blocking' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TicketPriority,
    department: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.department.trim()) errs.department = 'Department is required.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setIsLoading(true);
    try {
      const ticket = await ticketService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        department: form.department.trim(),
      });
      success('Ticket created!', `Ticket #${ticket.id} has been submitted.`);
      router.push(`/tickets/${ticket.id}`);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setFieldErrors(apiErr.fields);
      else error('Failed to create ticket', apiErr.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="New Ticket"
        subtitle="Submit a service request to the appropriate team"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tickets', href: '/tickets' },
          { label: 'New Ticket' },
        ]}
      />

      <div className="px-6 lg:px-8 py-6 max-w-2xl">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Ticket Details</h2>
              <p className="text-xs text-slate-500">Fill in the information below to submit your request</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Title"
              placeholder="Brief summary of the issue"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              error={fieldErrors.title}
              disabled={isLoading}
            />

            <Textarea
              label="Description"
              placeholder="Describe the issue in detail. Include any relevant context, steps to reproduce, or screenshots references..."
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              error={fieldErrors.description}
              disabled={isLoading}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Priority"
                required
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
                options={PRIORITY_OPTIONS}
                error={fieldErrors.priority}
                disabled={isLoading}
              />

              <Input
                label="Department"
                placeholder="e.g. Engineering, HR, Finance"
                required
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                error={fieldErrors.department}
                disabled={isLoading}
                hint="Which department should handle this?"
              />
            </div>

            {/* Priority guide */}
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 mb-2">Priority Guide</p>
              <p>🟢 <span className="font-medium">Low</span> — General inquiry, no business impact</p>
              <p>🔵 <span className="font-medium">Medium</span> — Some impact, normal SLA applies</p>
              <p>🟠 <span className="font-medium">High</span> — Business operations affected</p>
              <p>🔴 <span className="font-medium">Critical</span> — Severe outage / blocking all work</p>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="flex-1 sm:flex-none sm:min-w-[140px]"
              >
                Submit Ticket
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

