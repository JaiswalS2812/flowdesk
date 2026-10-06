'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { userService } from '@/services/user.service';
import { ApiError, UserResponse } from '@/types';
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
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/utils';
import { Users, UserX, UserCheck, RefreshCw } from 'lucide-react';

export default function UsersPage() {
  useRequireAuth({ allowedRoles: ['ADMIN'] });

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      error('Error', 'Could not load users. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const data = await userService.getAll();
        if (!cancelled) {
          setUsers(data);
        }
      } catch {
        if (!cancelled) {
          error('Error', 'Could not load users. Please refresh.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [error]);

  const replaceUser = (updated: UserResponse) =>
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

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

  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered user${users.length !== 1 ? 's' : ''} · ${activeCount} active`}
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

      <div className="px-6 lg:px-8 py-6">
        <Card padding="none">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No users found"
              description="Users will appear here after they register."
            />
          ) : (
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
                  <Tr key={user.id} className={user.active ? undefined : 'opacity-60'}>
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
                    <Td className="text-right">
                      {user.id === currentUser?.id ? (
                        <span className="text-xs text-slate-400">You</span>
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
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

