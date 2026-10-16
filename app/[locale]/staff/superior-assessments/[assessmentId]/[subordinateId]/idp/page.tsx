"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IdpView } from "@/components/idp/idp-view"
import { useSettings } from "@/hooks/use-settings"
import { staffAPI } from "@/lib/api"
import { IconArrowLeft, IconLock } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

// A superior's read-only view of a subordinate's IDP / result breakdown.
// Only reachable when the admin has turned on
// Setting.superiorCanViewSubordinateIdp; the backend independently checks
// the setting and that the caller is this staff member's assigned superior,
// and only counts SUBMITTED scores.
export default function SubordinateIdpPage() {
  const params = useParams()
  const assessmentId = params.assessmentId as string
  const subordinateId = params.subordinateId as string
  const t = useTranslations('StaffSubordinateIdpPage')
  const { settings, isLoading: isLoadingSettings } = useSettings()
  const [subordinateName, setSubordinateName] = useState<string>("")

  useEffect(() => {
    if (isLoadingSettings || !settings.superiorCanViewSubordinateIdp) return
    staffAPI
      .getById(subordinateId)
      .then((staff: { name?: string } | null) => setSubordinateName(staff?.name ?? ""))
      .catch(() => {
        // Title falls back to the generic wording.
      })
  }, [isLoadingSettings, settings.superiorCanViewSubordinateIdp, subordinateId])

  if (isLoadingSettings) return null

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
      <Link href="/staff/superior-assessments">
        <IconArrowLeft className="size-4 mr-1" />
        {t('back')}
      </Link>
    </Button>
  )

  if (!settings.superiorCanViewSubordinateIdp) {
    return (
      <div className="space-y-4">
        {backLink}
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

  return (
    <IdpView
      staffId={subordinateId}
      initialAssessmentId={assessmentId}
      title={subordinateName ? t('titleWithName', { name: subordinateName }) : t('title')}
      description={t('description')}
      generateDescription={t('generateCardDesc')}
      headerAction={backLink}
    />
  )
}
