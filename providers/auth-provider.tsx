'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import { toast } from 'sonner';
import { authAPI, invalidateApiCache } from '@/lib/api';

// Set just before this tab reloads because another tab switched the login, so
// the reloaded page can say why it moved. sessionStorage is per tab.
const SESSION_SWITCHED_FLAG = 'authSessionSwitched';

// Who a stored user is, for "is this still the same person?" checks.
function identityOf(rawUser: string | null): string | null {
  if (!rawUser) return null;
  try {
    const u = JSON.parse(rawUser);
    return u?.id ? `${u.userType ?? ''}:${u.id}` : null;
  } catch {
    return null;
  }
}

export class LoginError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'LoginError';
  }
}

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string, userType: 'staff' | 'admin') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const t = useTranslations('RouteGuard');
  // The person this tab is currently showing pages for ("admin:<id>").
  const identityRef = useRef<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      identityRef.current = identityOf(storedUser);
    }
    setIsLoading(false);

    try {
      if (sessionStorage.getItem(SESSION_SWITCHED_FLAG)) {
        sessionStorage.removeItem(SESSION_SWITCHED_FLAG);
        toast.info(t('sessionSwitched'));
      }
    } catch {
      // sessionStorage unavailable: skip the notice, the redirect already happened.
    }
  }, [t]);

  // The token lives in localStorage, which every tab of this site shares. If
  // another tab logs in as someone else (e.g. a demo switching from admin to a
  // staff account), this tab keeps showing the old person's pages while its
  // requests now carry the new token, so admin reports fail with 403. Follow
  // the change instead: reload into the right dashboard, or the login page
  // after a logout elsewhere.
  useEffect(() => {
    const syncWithStorage = () => {
      const current = identityRef.current;
      if (!current) return; // this tab isn't logged in (e.g. it is the login page)

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const next = storedToken ? identityOf(storedUser) : null;

      if (next === current) {
        // Same person signed in again elsewhere: just use the newer token.
        if (storedToken) setToken(storedToken);
        return;
      }

      identityRef.current = next;
      invalidateApiCache();
      if (next) {
        try {
          sessionStorage.setItem(SESSION_SWITCHED_FLAG, '1');
        } catch {
          // ignore
        }
      }
      // Full page load (not router.push) so no page keeps the old person's data.
      const target = !next
        ? '/login'
        : next.startsWith('admin:') ? '/admin/dashboard' : '/staff/dashboard';
      window.location.assign(target);
    };

    // Fires in every OTHER tab when localStorage changes. During a login the
    // token is written before the user, so the token event can still see the
    // previous user; the user event that follows completes the switch.
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'token' || e.key === 'user') syncWithStorage();
    };
    // A page restored by the Back button from the browser's page cache missed
    // any change made while it was frozen, including a login in this same tab.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) syncWithStorage();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  const login = async (username: string, password: string, userType: 'staff' | 'admin') => {
    try {
      const response = await authAPI.login({ username, password, userType });
      
      // Save token and user data
      const { token: authToken, user: userData } = response;

      // GET responses are now scoped to the caller (e.g. /assessmentresult),
      // so never let one user's cached data be served to the next login.
      invalidateApiCache();
      localStorage.setItem('token', authToken);

      // If staff, fetch full data to get positionId and unitId
      if (userData.userType === 'staff' && userData.id) {
        try {
          const { staffAPI } = await import('@/lib/api');
          const fullStaffData = await staffAPI.getById(userData.id);
          
          // Merge data - use full staff data which includes positionId, unitId, gender, image
          const mergedData = {
            ...userData,
            positionId: fullStaffData.positionId || null,
            unitId: fullStaffData.unitId || null,
            position: fullStaffData.position || userData.position,
            unit: fullStaffData.unit || userData.unit,
            gender: fullStaffData.gender || userData.gender,
            image: fullStaffData.image || userData.image,
          };
          
          localStorage.setItem('user', JSON.stringify(mergedData));
          setUser(mergedData);
        } catch (error) {
          console.error('Failed to fetch full staff data:', error);
          // Fallback to original userData
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
      } else {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      
      setToken(authToken);
      identityRef.current = identityOf(localStorage.getItem('user'));

      // Redirect based on userType
      if (userData.userType === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/staff/dashboard');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string } | undefined;
        // Keep the HTTP status (undefined = no response, i.e. server unreachable)
        // so the login form can show a translated message for each case.
        throw new LoginError(data?.error || data?.message || 'Login failed', error.response?.status);
      }
      if (error instanceof Error) {
        throw new Error(error.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    invalidateApiCache();
    identityRef.current = null;
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
