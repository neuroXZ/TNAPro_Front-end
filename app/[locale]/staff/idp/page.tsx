"use client"

import { Card, CardContent } from "@/components/ui/card"
import { IdpView } from "@/components/idp/idp-view"
import { useAuth } from "@/providers/auth-provider"
import { useSettings } from "@/hooks/use-settings"
import { IconLock } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

export default function MyIdpPage() {
  const { user } = useAuth()
  const t = useTranslations('StaffIdpPage')
  const { settings, isLoading: isLoadingSettings } = useSettings()

  if (isLoadingSettings) return null

  if (settings.hideIdpFromStaff) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <IconLock className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{t('disabledTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('disabledDesc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <IdpView staffId={user?.id} title={t('title')} description={t('description')} />
}
