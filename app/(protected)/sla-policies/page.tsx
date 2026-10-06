'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { slaPolicyService } from '@/services/sla-policy.service';
import { ApiError, SlaPolicyResponse, UpdateSlaPolicyRequest } from '@/types';
import { PageHeader } from '@/components/layout/Sidebar';
import {
  Card,
  Skeleton,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormFields';
import { useToast } from '@/components/ui/Toast';
import { Shield, Clock, CheckCircle2, XCircle, Pencil, X, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/utils';

// ─── Priority display helpers ─────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; color: string; badgeClass: string }> = {
  LOW: {
    label: 'Low',
    color: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  HIGH: {
    label: 'High',
    color: 'text-orange-600',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  CRITICAL: {
    label: 'Critical',
    color: 'text-red-600',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

interface EditFormProps {
  policy: SlaPolicyResponse;
  onSave: (id: number, data: UpdateSlaPolicyRequest) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function EditForm({ policy, onSave, onCancel, isSaving }: EditFormProps) {
  const [responseTime, setResponseTime] = useState(String(policy.responseTimeMinutes));
  const [resolutionTime, setResolutionTime] = useState(String(policy.resolutionTimeMinutes));
  const [errors, setErrors] = useState<{ response?: string; resolution?: string }>({});

  const validate = (): boolean => {
    const errs: { response?: string; resolution?: string } = {};
    const rt = Number(responseTime);
    const res = Number(resolutionTime);
    if (!responseTime || isNaN(rt) || rt < 1) errs.response = 'Must be at least 1 minute';
    if (!resolutionTime || isNaN(res) || res < 1) errs.resolution = 'Must be at least 1 minute';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(policy.id, {
      responseTimeMinutes: Number(responseTime),
      resolutionTimeMinutes: Number(resolutionTime),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Response Time (minutes)
          </label>
          <Input
            type="number"
            min={1}
            value={responseTime}
            onChange={(e) => setResponseTime(e.target.value)}
            placeholder="e.g. 60"
          />
          {errors.response && (
            <p className="text-xs text-red-600 mt-1">{errors.response}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Resolution Time (minutes)
          </label>
          <Input
            type="number"
            min={1}
            value={resolutionTime}
            onChange={(e) => setResolutionTime(e.target.value)}
            placeholder="e.g. 240"
          />
          {errors.resolution && (
            <p className="text-xs text-red-600 mt-1">{errors.resolution}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<X className="w-3.5 h-3.5" />}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          leftIcon={<Save className="w-3.5 h-3.5" />}
          isLoading={isSaving}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// ─── Policy Card ──────────────────────────────────────────────────────────────

interface PolicyCardProps {
  policy: SlaPolicyResponse;
  onEdit: (id: number) => void;
  onSave: (id: number, data: UpdateSlaPolicyRequest) => Promise<void>;
  onCancelEdit: () => void;
  isEditing: boolean;
  isSaving: boolean;
}

function PolicyCard({ policy, onEdit, onSave, onCancelEdit, isEditing, isSaving }: PolicyCardProps) {
  const cfg = PRIORITY_CONFIG[policy.priority] ?? PRIORITY_CONFIG.LOW;

  return (
    <Card className="p-5 flex flex-col gap-4 border-slate-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
              policy.priority === 'CRITICAL'
                ? 'bg-red-50'
                : policy.priority === 'HIGH'
                ? 'bg-orange-50'
                : policy.priority === 'MEDIUM'
                ? 'bg-amber-50'
                : 'bg-slate-100'
            )}
          >
            <Shield
              className={cn(
                'w-4.5 h-4.5',
                cfg.color
              )}
            />
          </div>
          <div>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                cfg.badgeClass
              )}
            >
              {cfg.label} Priority
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {policy.active ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
              <XCircle className="w-3 h-3" />
              Inactive
            </span>
          )}
          {!isEditing && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pencil className="w-3.5 h-3.5" />}
              onClick={() => onEdit(policy.id)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* SLA times — shown when not editing */}
      {!isEditing && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Response SLA
            </div>
            <span className="text-xl font-bold text-slate-900 mt-0.5">
              {formatMinutes(policy.responseTimeMinutes)}
            </span>
            <span className="text-xs text-slate-400">{policy.responseTimeMinutes} minutes</span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Resolution SLA
            </div>
            <span className="text-xl font-bold text-slate-900 mt-0.5">
              {formatMinutes(policy.resolutionTimeMinutes)}
            </span>
            <span className="text-xs text-slate-400">{policy.resolutionTimeMinutes} minutes</span>
          </div>
        </div>
      )}

      {/* Edit form — shown when editing */}
      {isEditing && (
        <EditForm
          policy={policy}
          onSave={onSave}
          onCancel={onCancelEdit}
          isSaving={isSaving}
        />
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SlaPoliciesPage() {
  useRequireAuth({ allowedRoles: ['ADMIN'] });

  const [policies, setPolicies] = useState<SlaPolicyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const { success, error } = useToast();

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await slaPolicyService.getAll();
      setPolicies(data);
    } catch {
      error('Failed to load SLA policies', 'Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await slaPolicyService.getAll();
        if (!cancelled) {
          setPolicies(data);
        }
      } catch {
        if (!cancelled) {
          error('Failed to load SLA policies', 'Please check your connection and try again.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [error]);

  const handleSave = async (id: number, data: UpdateSlaPolicyRequest) => {
    setSavingId(id);
    try {
      const updated = await slaPolicyService.update(id, data);
      setPolicies((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      success('SLA policy updated', `${updated.priority} priority policy has been saved.`);
    } catch (err: unknown) {
      // API errors are plain objects ({ status, message, fields }), not Error instances
      const apiErr = err as ApiError;
      const details = apiErr.fields ? Object.values(apiErr.fields).join(' ') : '';
      const msg =
        [apiErr.message, details].filter(Boolean).join(': ') ||
        'Failed to update SLA policy. Please try again.';
      error('Update failed', msg);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="animate-fade-in pb-12">
      <PageHeader
        title="SLA Policies"
        subtitle="Manage response and resolution time targets for each ticket priority"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'SLA Policies' },
        ]}
        action={
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
            onClick={fetchPolicies}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        }
      />

      <div className="px-6 lg:px-8 py-6">
        {/* Info banner */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            SLA policies define the maximum time allowed for response and resolution per ticket priority.
            Changes apply to new tickets only — existing ticket deadlines are preserved.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-5 border-slate-200">
                <div className="space-y-3">
                  <Skeleton className="h-8 w-32" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onEdit={(id) => setEditingId(id)}
                onSave={handleSave}
                onCancelEdit={() => setEditingId(null)}
                isEditing={editingId === policy.id}
                isSaving={savingId === policy.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

