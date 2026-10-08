"use client"

import { useEffect, useState } from "react"
import { settingAPI, type SelfResultVisibility } from "@/lib/api"

// DB-backed, per-client settings that any authenticated role may need to
// read (admin controls them via the Settings page; staff only reads them to
// decide what to show). Different from useFeatureFlags, which mirrors
// per-deployment env vars — these can change at runtime without a redeploy.
export interface AppSettings {
  hideIdpFromStaff: boolean
  selfResultVisibility: SelfResultVisibility
}

const DEFAULT_SETTINGS: AppSettings = {
  hideIdpFromStaff: false,
  selfResultVisibility: 'OFF',
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    settingAPI
      .getAll()
      .then((data: any[]) => {
        if (cancelled) return
        const row = data?.[0]
        setSettings({
          hideIdpFromStaff: row?.hideIdpFromStaff ?? false,
          selfResultVisibility: row?.selfResultVisibility ?? 'OFF',
        })
      })
      .catch(() => {
        // Keep DEFAULT_SETTINGS (IDP visible) if this fails.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { settings, isLoading }
}
