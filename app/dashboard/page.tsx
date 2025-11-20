'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from "@/components/protected-route"

export default function Page() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on user type
      if (user.userType === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.userType === 'staff') {
        router.push('/staff/dashboard');
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
