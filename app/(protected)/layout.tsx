'use client';

import React from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AppShell } from '@/components/layout/AppShell';
import { LogoMark } from '@/components/brand/Logo';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading || !isAuthenticated) {
    // While the stored session is read (or the redirect to /login happens)
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas" role="status" aria-label="Loading FlowDesk">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="size-11" animated />
          <div className="h-1 w-24 overflow-hidden rounded-full bg-surface-3">
            <div className="skeleton h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
