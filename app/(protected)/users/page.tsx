'use client';

import React, { Fragment, useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { userService } from '@/services/user.service';
import { ApiError, PageResponse, Role, UserResponse } from '@/types';
import { Pagination } from '@/components/ui/Pagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/Sidebar';
import {
  Badge,
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableHead,
  TableBody,
  Th,
  Tr,
  Td,
} from '@/components/ui/Card';
import { RoleBadge } from '@/components/tickets/Badges';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormFields';
import { useToast } from '@/components/ui/Toast';
import { formatDate, ROLE_LABELS } from '@/utils';
import { Users, UserX, UserCheck, RefreshCw, Pencil, Search } from 'lucide-react';

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All users' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Deactivated' },
];

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export default function UsersPage() {
  useRequireAuth({ allowedRoles: ['ADMIN'] });

  const [result, setResult] = useState<PageResponse<UserResponse> | null>(null);
  const [counts, setCounts] = useState({ total: 0, active: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<Role>('EMPLOYEE');
  const [editDepartment, setEditDepartment] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim());
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  // Search, filtering and paging happen on the server (sorted by name)
  useEffect(() => {
    let cancelled = false;

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
      })
      .catch(() => {
        if (!cancelled) error('Error', 'Could not load users. Please refresh.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, statusFilter, reloadKey, error]);

  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const users = result?.content ?? [];

  // Update the row in place, then refresh the counts (and the filtered list) from the server
  const replaceUser = (updated: UserResponse) => {
    setResult((prev) =>
      prev
        ? { ...prev, content: prev.content.map((u) => (u.id === updated.id ? updated : u)) }
        : prev
    );
    setReloadKey((k) => k + 1);
  };

  // Users are deactivated, never deleted: their tickets and history stay intact
  const handleDeactivate = async (target: UserResponse) => {
    if (
      !confirm(
        `Deactivate ${target.name}? They will be signed out and unable to log in. ` +
          'Their tickets, comments and history are kept, and they can be reactivated later.'
      )
    )
      return;
    setUpdatingId(target.id);
    try {
      replaceUser(await userService.deactivate(target.id));
      success('User deactivated', `${target.name} can no longer sign in.`);
    } catch (err) {
      error('Could not deactivate user', (err as ApiError).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReactivate = async (target: UserResponse) => {
    setUpdatingId(target.id);
    try {
      replaceUser(await userService.reactivate(target.id));
      success('User reactivated', `${target.name} can sign in again.`);
    } catch (err) {
      error('Could not reactivate user', (err as ApiError).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const startEdit = (target: UserResponse) => {
    setEditingId(target.id);
    setEditRole(target.role);
    setEditDepartment(target.department);
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  // Role and department changes; the backend enforces admin-only access and the
  // self / last-admin / open-ticket rules, and notifies the user
  const handleSaveEdit = async (target: UserResponse) => {
    const department = editDepartment.trim();
    if (department.length < 2 || department.length > 100) {
      setEditErrors({ department: 'Department must be between 2 and 100 characters.' });
      return;
    }
    setUpdatingId(target.id);
    try {
      replaceUser(await userService.update(target.id, { role: editRole, department }));
      setEditingId(null);
      success('User updated', `${target.name} is now ${ROLE_LABELS[editRole]} in ${department}.`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fields) setEditErrors(apiErr.fields);
      else error('Could not update user', apiErr.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${counts.total} registered user${counts.total !== 1 ? 's' : ''} · ${counts.active} active`}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users' },
        ]}
        action={
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchUsers}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-4">
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                aria-label="Search users"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                leftAddon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="sm:w-48">
              <Select
                aria-label="Filter by status"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </Card>

        <Card padding="none">
          {isLoading && !result ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No users found"
              description={
                debouncedSearch || statusFilter !== 'ALL'
                  ? 'No users match your search or filter.'
                  : 'Users will appear here after they register.'
              }
            />
          ) : (
            <>
            <Table>
              <TableHead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th className="hidden md:table-cell">Department</Th>
                  <Th className="hidden lg:table-cell">Joined</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <Fragment key={user.id}>
                  <Tr className={user.active ? undefined : 'opacity-60'}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                      </div>
                    </Td>
                    <Td className="text-slate-500 text-xs">{user.email}</Td>
                    <Td><RoleBadge role={user.role} /></Td>
                    <Td>
                      {user.active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-slate-100 text-slate-500 border-slate-200"
                          dot
                        >
                          Deactivated
                        </Badge>
                      )}
                    </Td>
                    <Td className="hidden md:table-cell text-slate-500 text-xs">
                      {user.department}
                    </Td>
                    <Td className="hidden lg:table-cell text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      {user.active && editingId !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(user)}
                          disabled={updatingId === user.id}
                          leftIcon={<Pencil className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                      )}
                      {user.id === currentUser?.id ? (
                        <span className="text-xs text-slate-400 ml-2">You</span>
                      ) : user.active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(user)}
                          isLoading={updatingId === user.id}
                          leftIcon={<UserX className="w-3.5 h-3.5" />}
                          className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivate(user)}
                          isLoading={updatingId === user.id}
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          Reactivate
                        </Button>
                      )}
                    </Td>
                  </Tr>
                  {editingId === user.id && (
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="sm:w-56">
                            <Select
                              label="Role"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as Role)}
                              options={ROLE_OPTIONS}
                              error={editErrors.role}
                              disabled={user.id === currentUser?.id || updatingId === user.id}
                              hint={user.id === currentUser?.id ? 'You cannot change your own role' : undefined}
                            />
                          </div>
                          <div className="sm:w-64">
                            <Input
                              label="Department"
                              value={editDepartment}
                              onChange={(e) => setEditDepartment(e.target.value)}
                              maxLength={100}
                              error={editErrors.department}
                              disabled={updatingId === user.id}
                            />
                          </div>
                          <div className="flex gap-2 sm:pt-6">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(user)}
                              isLoading={updatingId === user.id}
                            >
                              Save
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={updatingId === user.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
            {result && (
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

