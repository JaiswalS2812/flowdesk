'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { UserResponse } from '@/types';
import { authService } from '@/services/auth.service';
import { getToken, setToken, removeToken } from '@/lib/api-client';

interface AuthContextValue {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    department: string
  ) => Promise<void>;
  logout: () => void;
  // Ends this browser's session without a server call (e.g. after a password change)
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount (client-only hydration to prevent Next.js SSR hydration mismatches)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Legitimate client-only hydration from localStorage to prevent SSR hydration mismatches */
    const stored = getToken();
    const storedUser = localStorage.getItem('flowdesk_user');
    if (stored && storedUser) {
      try {
        setTokenState(stored);
        setUser(JSON.parse(storedUser));
      } catch {
        removeToken();
        localStorage.removeItem('flowdesk_user');
      }
    }
    setIsLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */

    // The stored profile may be stale (an admin may have changed the role or department)
    if (stored && storedUser) {
      authService
        .me()
        .then((fresh) => {
          localStorage.setItem('flowdesk_user', JSON.stringify(fresh));
          setUser(fresh);
        })
        .catch(() => {
          // A 401 signs the user out in the API client; other errors keep the stored profile
        });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setToken(response.token);
    localStorage.setItem('flowdesk_user', JSON.stringify(response.user));
    setTokenState(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      department: string
    ) => {
      // Registration doesn't auto-login; user must log in manually after
      await authService.register({ name, email, password, department });
    },
    []
  );

  const clearSession = useCallback(() => {
    removeToken();
    localStorage.removeItem('flowdesk_user');
    setTokenState(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    window.location.href = '/login';
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

