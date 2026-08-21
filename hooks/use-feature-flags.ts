"use client"

import { useEffect, useState } from "react"
import { featuresAPI, type FeatureFlags } from "@/lib/api/features"

// Hidden by default — if the flags endpoint hasn't resolved yet (or fails),
// every optional feature stays off rather than briefly flashing on.
const DEFAULT_FLAGS: FeatureFlags = { zonNegeri: false }

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    featuresAPI
      .getAll()
      .then((data) => {
        if (!cancelled) setFlags(data)
      })
      .catch(() => {
        // Keep DEFAULT_FLAGS (everything hidden) if this fails.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { flags, isLoading }
}
