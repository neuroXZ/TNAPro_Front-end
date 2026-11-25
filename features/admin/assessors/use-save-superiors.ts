"use client"

import { useCallback } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { assessorAPI } from "@/lib/api"
import type { SetSuperiorsResult } from "./types"

/**
 * Saves a staff member's superior assessors and tells the admin what
 * happened in plain words (kept because they already rated, self row
 * created). Shared by the Staff form and Assessor Management.
 */
export function useSaveSuperiors() {
  const t = useTranslations("AssessorPicker")

  return useCallback(
    async (staffId: string, assessorIds: string[], opts: { quiet?: boolean } = {}): Promise<SetSuperiorsResult> => {
      const result: SetSuperiorsResult = await assessorAPI.setSuperiors(staffId, assessorIds)
      if (result.kept.length > 0) {
        const names = result.kept.map((r) => r.assessor?.name ?? "—").join(", ")
        toast.warning(t("keptWarning", { names }), { duration: 10000 })
      }
      if (!opts.quiet && result.selfCreated) {
        toast.info(t("selfCreated"))
      }
      return result
    },
    [t],
  )
}

/** Translated message for an assessor API error (409 codes from the backend). */
export function assessorErrorMessage(err: unknown, t: (key: string) => string): string {
  const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
  if (code === "ASSESSOR_HAS_RESULTS") return t("errorHasResults")
  if (code === "ASSESSOR_DUPLICATE") return t("errorDuplicate")
  return code || t("errorSave")
}
