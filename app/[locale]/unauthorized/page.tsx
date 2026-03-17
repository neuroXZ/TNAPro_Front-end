'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { IconLock, IconArrowLeft } from '@tabler/icons-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <IconLock className="size-16 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">403 - Unauthorized</h1>
          <p className="text-muted-foreground text-lg">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="gap-2"
          >
            <IconArrowLeft className="size-4" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push('/login')}
          >
            Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
