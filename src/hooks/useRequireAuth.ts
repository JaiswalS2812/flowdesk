'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';

interface UseRequireAuthOptions {
  allowedRoles?: Role[];
}

/**
 * Redirects to /login if not authenticated.
 * If allowedRoles is provided, also redirects to /dashboard if role not allowed.
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (
      options.allowedRoles &&
      user &&
      !options.allowedRoles.includes(user.role)
    ) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router, options.allowedRoles]);

  return { isLoading, user, isAuthenticated };
}

