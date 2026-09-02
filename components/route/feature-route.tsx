"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import type { FeatureFlags } from "@/lib/api/features"

// Guards a whole page behind a feature flag, so a client whose deployment
// doesn't have the feature enabled (or, with `negate`, does have it enabled
// — e.g. superiorOnlyAssessment hiding self-assessment) can't reach it just
// by typing the URL directly (nav already hides the link — see
// admin-sidebar.tsx / staff-sidebar.tsx).
export function FeatureRoute({
  feature,
  negate = false,
  redirectTo = "/admin/dashboard",
  children,
}: {
  feature: keyof FeatureFlags
  negate?: boolean
  redirectTo?: string
  children: React.ReactNode
}) {
  const { flags, isLoading } = useFeatureFlags()
  const router = useRouter()
  const blocked = negate ? flags[feature] : !flags[feature]

  useEffect(() => {
    if (!isLoading && blocked) {
      router.push(redirectTo)
    }
  }, [isLoading, blocked, redirectTo, router])

  if (isLoading || blocked) {
    return null
  }

  return <>{children}</>
}
