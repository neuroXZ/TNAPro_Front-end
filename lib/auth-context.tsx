'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from './api';

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

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, userType: 'staff' | 'admin') => {
    try {
      const response = await authAPI.login({ username, password, userType });
      
      // Save token and user data
      const { token: authToken, user: userData } = response;
      
      localStorage.setItem('token', authToken);
      
      // If staff, fetch full data to get positionId and unitId
      if (userData.userType === 'staff' && userData.id) {
        try {
          const { staffAPI } = await import('./api');
          const fullStaffData = await staffAPI.getById(userData.id);
          
          // Merge data - use full staff data which includes positionId, unitId
          const mergedData = {
            ...userData,
            positionId: fullStaffData.positionId || null,
            unitId: fullStaffData.unitId || null,
            position: fullStaffData.position || userData.position,
            unit: fullStaffData.unit || userData.unit,
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
      
      // Redirect based on userType
      if (userData.userType === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/staff/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
