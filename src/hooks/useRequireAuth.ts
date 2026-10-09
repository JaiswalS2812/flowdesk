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
 * `isAuthorized` is true only once the session is resolved and the role is allowed, so pages
 * can hold back their content (and its requests) until then.
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { allowedRoles } = options;
  const roleAllowed = !allowedRoles || (!!user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!roleAllowed) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, roleAllowed, router]);

  return { isLoading, user, isAuthenticated, isAuthorized: !isLoading && isAuthenticated && roleAllowed };
}
