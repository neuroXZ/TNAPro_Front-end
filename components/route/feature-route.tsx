"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import type { FeatureFlags } from "@/lib/api/features"

// Guards a whole admin page behind a feature flag, so a client whose
// deployment doesn't have the feature enabled can't reach it just by typing
// the URL directly (nav already hides the link — see admin-sidebar.tsx).
export function FeatureRoute({
  feature,
  children,
}: {
  feature: keyof FeatureFlags
  children: React.ReactNode
}) {
  const { flags, isLoading } = useFeatureFlags()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !flags[feature]) {
      router.push("/admin/dashboard")
    }
  }, [isLoading, flags, feature, router])

  if (isLoading || !flags[feature]) {
    return null
  }

  return <>{children}</>
}
