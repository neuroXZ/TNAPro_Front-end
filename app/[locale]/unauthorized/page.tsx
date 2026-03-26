'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { IconLock, IconArrowLeft } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export default function UnauthorizedPage() {
  const router = useRouter();
  const t = useTranslations('UnauthorizedPage');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <IconLock className="size-16 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('message')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="gap-2"
          >
            <IconArrowLeft className="size-4" />
            {t('goBack')}
          </Button>
          <Button
            onClick={() => router.push('/login')}
          >
            {t('returnToLogin')}
          </Button>
        </div>
      </div>
    </div>
  );
}
