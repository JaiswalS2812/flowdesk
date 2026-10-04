'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { userService } from '@/services/user.service';
import { UserResponse } from '@/types';
import { PageHeader } from '@/components/layout/Sidebar';
import {
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
import { Users, Trash2, RefreshCw } from 'lucide-react';

export default function UsersPage() {
  useRequireAuth({ allowedRoles: ['ADMIN', 'MANAGER'] });

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { success, error } = useToast();

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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.'))
      return;
    setDeletingId(id);
    try {
      await userService.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      success('User deleted', 'The user account has been removed.');
    } catch {
      error('Error', 'Could not delete user. They may have active tickets.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered user${users.length !== 1 ? 's' : ''}`}
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
                  <Th className="hidden md:table-cell">Department</Th>
                  <Th className="hidden lg:table-cell">Joined</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <Tr key={user.id}>
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
                    <Td className="hidden md:table-cell text-slate-500 text-xs">
                      {user.department}
                    </Td>
                    <Td className="hidden lg:table-cell text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </Td>
                    <Td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        isLoading={deletingId === user.id}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        Remove
                      </Button>
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

