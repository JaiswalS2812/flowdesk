'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Info, Pencil, RefreshCw, ShieldCheck, ShieldOff, Timer } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { slaPolicyService } from '@/services/sla-policy.service';
import { ApiError, Role, SlaPolicyResponse } from '@/types';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormFields';
import { Switch } from '@/components/ui/Controls';
import { Alert, ErrorState, RefreshErrorAlert, Skeleton } from '@/components/ui/Feedback';
import { ConfirmDialog, Modal } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { PriorityBadge } from '@/components/tickets/Badges';
import { cn, formatMinutes, PRIORITY_LABELS, PRIORITY_TONE, TONE_SOFT, TONE_SOLID, Tone } from '@/utils';

const ADMIN_ONLY: Role[] = ['ADMIN'];

// Nothing renders (and nothing is requested) until the session is resolved as an admin's
export default function SlaPoliciesPage() {
  const { isAuthorized } = useRequireAuth({ allowedRoles: ADMIN_ONLY });
  return isAuthorized ? <SlaPoliciesView /> : null;
}

function SlaPoliciesView() {
  const { success, error } = useToast();

  const [policies, setPolicies] = useState<SlaPolicyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<SlaPolicyResponse | null>(null);
  const [toggling, setToggling] = useState<SlaPolicyResponse | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for the new request
    setIsLoading(true);
    slaPolicyService
      .getAll()
      .then((data) => {
        if (cancelled) return;
        setPolicies(data);
        setLoadError(false);
      })
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const replace = (updated: SlaPolicyResponse) => setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const toggle = async (policy: SlaPolicyResponse) => {
    setBusyId(policy.id);
    try {
      const updated = await slaPolicyService.toggle(policy.id);
      replace(updated);
      setToggling(null);
      success(
        updated.active ? 'Policy activated' : 'Policy deactivated',
        `${PRIORITY_LABELS[updated.priority]} priority tickets ${updated.active ? 'can be created again' : 'cannot be created while it is inactive'}.`
      );
    } catch (err) {
      setToggling(null);
      error('Policy not changed', (err as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  const maxResolution = Math.max(1, ...policies.map((p) => p.resolutionTimeMinutes));

  return (
    <PageContainer>
      <PageHeader
        title="SLA Policies"
        subtitle="Response and resolution targets for each ticket priority."
        actions={
          <Button variant="secondary" leftIcon={<RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />} onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <Alert tone="blue" className="mb-6" title="How changes apply">
        Deadlines are fixed when a ticket is created, so edits apply to new tickets only; existing deadlines and SLA
        history are never recalculated. While a policy is inactive, new tickets of that priority cannot be created.
      </Alert>

      {loadError && policies.length > 0 && (
        <RefreshErrorAlert
          className="mb-4"
          description="The policies below are from an earlier request and may be out of date."
          onRetry={refresh}
          retrying={isLoading}
        />
      )}

      {loadError && policies.length === 0 ? (
        <Card padding="none">
          <ErrorState title="SLA policies could not be loaded" onRetry={refresh} />
        </Card>
      ) : isLoading && policies.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[214px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {policies.map((p, i) => (
            <PolicyCard
              key={p.id}
              index={i}
              policy={p}
              maxResolution={maxResolution}
              busy={busyId === p.id}
              onEdit={() => setEditing(p)}
              onToggle={() => (p.active ? setToggling(p) : toggle(p))}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditPolicyModal
          policy={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            replace(updated);
            setEditing(null);
            success('SLA policy updated', `${PRIORITY_LABELS[updated.priority]} priority targets saved. They apply to new tickets.`);
          }}
        />
      )}

      {toggling && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setToggling(null)}
          title={`Deactivate the ${PRIORITY_LABELS[toggling.priority]} policy?`}
          description={`While it is inactive, nobody can create ${PRIORITY_LABELS[toggling.priority].toLowerCase()} priority tickets. Existing tickets keep their deadlines. You can reactivate it at any time.`}
          confirmLabel="Deactivate policy"
          tone="danger"
          icon={<ShieldOff />}
          isLoading={busyId === toggling.id}
          onConfirm={() => toggle(toggling)}
        />
      )}
    </PageContainer>
  );
}

function PolicyCard({
  policy,
  maxResolution,
  busy,
  onEdit,
  onToggle,
  index,
}: {
  policy: SlaPolicyResponse;
  maxResolution: number;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  index: number;
}) {
  const tone = PRIORITY_TONE[policy.priority];
  return (
    <Card className={cn('stagger relative overflow-hidden', !policy.active && 'bg-surface-2/50')} style={{ ['--i' as string]: index }}>
      <span className={cn('absolute inset-y-0 left-0 w-1', TONE_SOLID[tone], !policy.active && 'opacity-30')} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn('grid size-10 place-items-center rounded-xl border', TONE_SOFT[tone])} aria-hidden>
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-fg">{PRIORITY_LABELS[policy.priority]} Priority</h2>
            <div className="mt-1 flex items-center gap-1.5">
              <PriorityBadge priority={policy.priority} />
              {policy.active ? (
                <Badge tone="green" dot>Active</Badge>
              ) : (
                <Badge tone="neutral" dot>Inactive</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={policy.active} onChange={onToggle} disabled={busy} label={`${PRIORITY_LABELS[policy.priority]} policy active`} />
        </div>
      </div>

      <dl className={cn('mt-5 grid grid-cols-2 gap-3', !policy.active && 'opacity-70')}>
        <Target icon={<Timer />} label="First response" minutes={policy.responseTimeMinutes} max={maxResolution} tone={tone} />
        <Target icon={<Clock />} label="Resolution" minutes={policy.resolutionTimeMinutes} max={maxResolution} tone={tone} />
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
          <Info className="size-3.5" aria-hidden />
          Warning in the last 20% of the resolution window
        </p>
        <Button variant="secondary" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={onEdit} aria-label={`Edit ${PRIORITY_LABELS[policy.priority]} Priority policy`}>
          Edit
        </Button>
      </div>
    </Card>
  );
}

function Target({ icon, label, minutes, max, tone }: { icon: React.ReactNode; label: string; minutes: number; max: number; tone: Tone }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-[11.5px] font-medium text-fg-muted [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd>
        <span className="mt-1 block text-xl font-semibold tracking-tight text-fg tabular">{formatMinutes(minutes)}</span>
        <span className="block text-[11px] text-fg-subtle tabular">{minutes.toLocaleString()} minutes</span>
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
          <span className={cn('block h-full rounded-full', TONE_SOLID[tone])} style={{ width: `${Math.max(4, (minutes / max) * 100)}%` }} />
        </span>
      </dd>
    </div>
  );
}

function EditPolicyModal({
  policy,
  onClose,
  onSaved,
}: {
  policy: SlaPolicyResponse;
  onClose: () => void;
  onSaved: (updated: SlaPolicyResponse) => void;
}) {
  const [response, setResponse] = useState(String(policy.responseTimeMinutes));
  const [resolution, setResolution] = useState(String(policy.resolutionTimeMinutes));
  const [errors, setErrors] = useState<{ response?: string; resolution?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const r = Number(response);
  const res = Number(resolution);
  const valid = (n: number) => Number.isInteger(n) && n >= 1;

  // Same limits as the backend (@Min(1)); a response target above the resolution target is
  // allowed but unusual, so it only warns
  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const errs: typeof errors = {};
    if (!valid(r)) errs.response = 'Enter a whole number of minutes (at least 1).';
    if (!valid(res)) errs.resolution = 'Enter a whole number of minutes (at least 1).';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setFailure(null);
    setSaving(true);
    try {
      onSaved(await slaPolicyService.update(policy.id, { responseTimeMinutes: r, resolutionTimeMinutes: res }));
    } catch (err) {
      const apiErr = err as ApiError;
      setFailure([apiErr.message, apiErr.fields ? Object.values(apiErr.fields).join(' ') : ''].filter(Boolean).join(': '));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Edit ${PRIORITY_LABELS[policy.priority]} priority targets`}
      description="Applies to tickets created after you save."
      icon={<ShieldCheck />}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => save()} isLoading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4" noValidate>
        {failure && (
          <Alert tone="red" title="Not saved">
            {failure}
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Response time (minutes)"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            error={errors.response}
            hint={valid(r) ? `= ${formatMinutes(r)}` : undefined}
            disabled={saving}
          />
          <Input
            label="Resolution time (minutes)"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            error={errors.resolution}
            hint={valid(res) ? `= ${formatMinutes(res)}` : undefined}
            disabled={saving}
          />
        </div>
        {valid(r) && valid(res) && r > res && (
          <Alert tone="amber">The response target is longer than the resolution target.</Alert>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
