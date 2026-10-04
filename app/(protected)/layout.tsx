'use client';

import React from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AppLayout } from '@/components/layout/Sidebar';
import { Skeleton } from '@/components/ui/Card';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirect handled by useRequireAuth
  }

  return <AppLayout>{children}</AppLayout>;
}

