'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, RefreshCw, Search, UserCheck, Users, UserX, ShieldCheck } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { userService } from '@/services/user.service';
import { ApiError, PageResponse, Role, UserResponse } from '@/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer, PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormFields';
import { Avatar, SegmentedControl } from '@/components/ui/Controls';
import { Email } from '@/components/ui/Email';
import { Alert, EmptyState, ErrorState, SkeletonRows } from '@/components/ui/Feedback';
import { ConfirmDialog, Modal } from '@/components/ui/Dialog';
import { Pagination } from '@/components/ui/Pagination';
import { Table, Col, TableHead, TableBody, Th, Tr, Td } from '@/components/ui/Table';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { RoleBadge } from '@/components/tickets/Badges';
import { cn, formatDate, formatShortDate, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES } from '@/utils';

const PAGE_SIZE = 20;
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export default function UsersPage() {
  useRequireAuth({ allowedRoles: ['ADMIN'] });
  const { user: me } = useAuth();
  const { success, error } = useToast();

  const [result, setResult] = useState<PageResponse<UserResponse> | null>(null);
  const [counts, setCounts] = useState({ total: 0, active: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim());

  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [deactivating, setDeactivating] = useState<UserResponse | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Search, filtering and paging happen on the server (sorted by name)
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for the new request
    setIsLoading(true);
    Promise.all([
      userService.getPage({
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      }),
      userService.getPage({ size: 1 }),
      userService.getPage({ size: 1, active: true }),
    ])
      .then(([data, all, active]) => {
        if (cancelled) return;
        if (data.content.length === 0 && data.page > 0 && data.totalPages > 0) {
          setPage(data.totalPages - 1);
          return;
        }
        setResult(data);
        setCounts({ total: all.totalElements, active: active.totalElements });
        setLoadError(false);
      })
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, statusFilter, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  // Update the row in place, then refresh counts and the filtered list from the server
  const replaceUser = (updated: UserResponse) => {
    setResult((prev) => (prev ? { ...prev, content: prev.content.map((u) => (u.id === updated.id ? updated : u)) } : prev));
    refresh();
  };

  // Users are deactivated, never deleted: their tickets and history stay intact
  const confirmDeactivate = async () => {
    if (!deactivating) return;
    setBusyId(deactivating.id);
    setDeactivateError(null);
    try {
      replaceUser(await userService.deactivate(deactivating.id));
      success('User deactivated', `${deactivating.name} can no longer sign in.`);
      setDeactivating(null);
    } catch (err) {
      // e.g. open assigned tickets, own account or last admin (enforced by the backend)
      setDeactivateError((err as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  const reactivate = async (target: UserResponse) => {
    setBusyId(target.id);
    try {
      replaceUser(await userService.reactivate(target.id));
      success('User reactivated', `${target.name} can sign in again.`);
    } catch (err) {
      error('Could not reactivate user', (err as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  const users = result?.content ?? [];
  const inactive = counts.total - counts.active;
  const filtered = !!debouncedSearch || statusFilter !== 'ALL';

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        subtitle="Manage roles, departments and access. Users are deactivated, never deleted."
        actions={
          <Button variant="secondary" leftIcon={<RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />} onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Registered', value: counts.total, icon: <Users /> },
          { label: 'Active', value: counts.active, icon: <UserCheck /> },
          { label: 'Deactivated', value: inactive, icon: <UserX /> },
        ].map((s, i) => (
          <Card key={s.label} padding="sm" className="stagger flex items-center gap-3" style={{ ['--i' as string]: i }}>
            <span className="hidden size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted sm:grid [&_svg]:size-4" aria-hidden>
              {s.icon}
            </span>
            <div>
              <p className="text-[11.5px] text-fg-muted">{s.label}</p>
              <p className="text-xl font-semibold text-fg tabular">{result ? s.value : '–'}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name or email…"
          aria-label="Search users"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          leftAddon={<Search />}
          fieldClassName="sm:max-w-sm"
        />
        <SegmentedControl
          label="Filter by status"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Deactivated' },
          ]}
        />
      </div>

      <Card padding="none" className="@container overflow-hidden">
        {isLoading && !result ? (
          <SkeletonRows rows={6} />
        ) : loadError && !result ? (
          <ErrorState title="Users could not be loaded" onRetry={refresh} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No users found"
            description={filtered ? 'No users match your search or filter.' : 'Users appear here after they register.'}
          />
        ) : (
          <div className={cn('transition-opacity', isLoading && 'opacity-60')}>
            <div className="hidden @[1040px]:block">
              <Table minWidth={1036} caption="Users">
                {/* One explicit grid for header and rows: User flexes, every other column is fixed */}
                <colgroup>
                  <Col />
                  <Col width={156} />
                  <Col width={160} />
                  <Col width={124} />
                  <Col width={116} />
                  <Col width={220} />
                </colgroup>
                <TableHead>
                  <tr>
                    <Th>User</Th>
                    <Th>Role</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th>Joined</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <Tr key={u.id} muted={!u.active} highlight={u.id === me?.id}>
                      <Td>
                        <UserCell user={u} isMe={u.id === me?.id} />
                      </Td>
                      <Td><RoleBadge role={u.role} /></Td>
                      <Td className="wrap-anywhere">{u.department}</Td>
                      <Td><ActiveBadge user={u} /></Td>
                      <Td className="whitespace-nowrap text-fg-muted">
                        <Tooltip content={formatDate(u.createdAt)}>
                          <span tabIndex={0}>{formatShortDate(u.createdAt)}</span>
                        </Tooltip>
                      </Td>
                      <Td align="right">
                        <RowActions
                          user={u}
                          isMe={u.id === me?.id}
                          busy={busyId === u.id}
                          onEdit={() => setEditing(u)}
                          onDeactivate={() => {
                            setDeactivateError(null);
                            setDeactivating(u);
                          }}
                          onReactivate={() => reactivate(u)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Narrower containers: cards keep every field readable without horizontal scrolling */}
            <ul className="divide-y divide-line @[1040px]:hidden">
              {users.map((u) => (
                <li key={u.id} className={cn('px-4 py-4', u.id === me?.id && 'bg-accent-soft/30', !u.active && 'opacity-75')}>
                  <UserCell user={u} isMe={u.id === me?.id} />
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <RoleBadge role={u.role} />
                    <ActiveBadge user={u} />
                    <Badge tone="neutral">{u.department}</Badge>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <RowActions
                      user={u}
                      isMe={u.id === me?.id}
                      busy={busyId === u.id}
                      onEdit={() => setEditing(u)}
                      onDeactivate={() => {
                        setDeactivateError(null);
                        setDeactivating(u);
                      }}
                      onReactivate={() => reactivate(u)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result && users.length > 0 && (
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            totalElements={result.totalElements}
            size={result.size}
            itemLabel="users"
            onPageChange={setPage}
            disabled={isLoading}
          />
        )}
      </Card>

      {editing && (
        <EditUserModal
          user={editing}
          isMe={editing.id === me?.id}
          onClose={() => setEditing(null)}
          onSaved={(updated, role, dept) => {
            replaceUser(updated);
            setEditing(null);
            success('User updated', `${updated.name} is now ${ROLE_LABELS[role]} in ${dept}.`);
          }}
        />
      )}

      {deactivating && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeactivating(null)}
          title={`Deactivate ${deactivating.name}?`}
          description="They will be signed out immediately and won't be able to sign in. Their tickets, comments and history are kept, and you can reactivate them later."
          confirmLabel="Deactivate user"
          tone="danger"
          icon={<UserX />}
          isLoading={busyId === deactivating.id}
          onConfirm={confirmDeactivate}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/60 p-3">
              <Avatar name={deactivating.name} seed={deactivating.email} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-fg">{deactivating.email}</p>
                <p className="text-xs text-fg-muted">
                  {ROLE_LABELS[deactivating.role]} · {deactivating.department}
                </p>
              </div>
            </div>
            {deactivateError && (
              <Alert tone="red" title="Not deactivated">
                {deactivateError}
              </Alert>
            )}
          </div>
        </ConfirmDialog>
      )}
    </PageContainer>
  );
}

// ─── Row pieces ──────────────────────────────────────────────────────────────

function UserCell({ user, isMe }: { user: UserResponse; isMe: boolean }) {
  // Long names and emails wrap inside the flexible User column instead of widening the table
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={user.name} seed={user.email} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-medium leading-snug text-fg">
          <span className="wrap-anywhere">{user.name}</span>
          {isMe && <Badge tone="accent">You</Badge>}
        </p>
        <Email value={user.email} className="block text-xs leading-snug text-fg-muted" />
      </div>
    </div>
  );
}

function ActiveBadge({ user }: { user: UserResponse }) {
  return user.active ? (
    <Badge tone="green" dot>
      Active
    </Badge>
  ) : (
    <Tooltip content={user.deactivatedAt ? `Deactivated ${formatDate(user.deactivatedAt)}` : 'Deactivated'}>
      <span tabIndex={0}>
        <Badge tone="neutral" dot>
          Deactivated
        </Badge>
      </span>
    </Tooltip>
  );
}

function RowActions({
  user,
  isMe,
  busy,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  user: UserResponse;
  isMe: boolean;
  busy: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}) {
  if (!user.active) {
    return (
      <div className="flex justify-end gap-1">
        <Button variant="secondary" size="sm" isLoading={busy} leftIcon={<UserCheck className="size-3.5" />} onClick={onReactivate}>
          Reactivate
        </Button>
      </div>
    );
  }
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={onEdit} disabled={busy}>
        Edit
      </Button>
      {isMe ? (
        <Tooltip content="You can't deactivate your own account">
          <span tabIndex={0}>
            <Button variant="danger-soft" size="sm" leftIcon={<UserX className="size-3.5" />} disabled>
              Deactivate
            </Button>
          </span>
        </Tooltip>
      ) : (
        <Button variant="danger-soft" size="sm" leftIcon={<UserX className="size-3.5" />} onClick={onDeactivate} disabled={busy}>
          Deactivate
        </Button>
      )}
    </div>
  );
}

// ─── Edit modal ──────────────────────────────────────────────────────────────

function EditUserModal({
  user,
  isMe,
  onClose,
  onSaved,
}: {
  user: UserResponse;
  isMe: boolean;
  onClose: () => void;
  onSaved: (updated: UserResponse, role: Role, department: string) => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [department, setDepartment] = useState(user.department);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const unchanged = role === user.role && department.trim() === user.department;

  // The backend enforces admin-only access, the self / last-admin / open-ticket rules,
  // and notifies the user of the change
  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const dept = department.trim();
    if (dept.length < 2 || dept.length > 100) {
      setErrors({ department: 'Department must be between 2 and 100 characters.' });
      return;
    }
    setErrors({});
    setFailure(null);
    setSaving(true);
    try {
      onSaved(await userService.update(user.id, { role, department: dept }), role, dept);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setErrors(apiErr.fields);
      else setFailure(apiErr.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Edit ${user.name}`}
      description={user.email}
      icon={<ShieldCheck />}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => save()} isLoading={saving} disabled={unchanged}>
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4" noValidate>
        {failure && (
          <Alert tone="red" title="Changes not saved">
            {failure}
          </Alert>
        )}
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          error={errors.role}
          disabled={isMe || saving}
          hint={isMe ? 'You cannot change your own role.' : ROLE_DESCRIPTIONS[role]}
        />
        <Input
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          maxLength={100}
          error={errors.department}
          disabled={saving}
          hint="Managers and engineers work on tickets of their own department."
        />
        {user.role === 'SUPPORT_ENGINEER' && (
          <Alert tone="blue">Engineers with open or in-progress assigned tickets must have them reassigned before their role or department changes.</Alert>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
