import { useTranslations } from "next-intl"
import { IconAlertTriangle } from "@tabler/icons-react"
import type { PositionCompetencyDeleteImpact } from "@/lib/api"

type T = ReturnType<typeof useTranslations>

/**
 * What removing a position-competency mapping does to results already recorded,
 * as plain sentences. Shared by the single-remove dialog and the bulk confirm().
 * Empty when nothing recorded is affected.
 */
export function mappingRemovalImpactLines(t: T, impact: PositionCompetencyDeleteImpact | null): string[] {
  if (!impact || impact.results === 0) return []
  const lines = [
    t("impactSummary", {
      results: impact.results,
      staff: impact.staff,
      submitted: impact.submittedResults,
      cycles: impact.assessments.join(", ") || "-",
    }),
  ]
  if (impact.removed > 0) lines.push(t("impactRemoved", { count: impact.removed }))
  if (impact.levelChanged > 0) lines.push(t("impactLevelChanged", { count: impact.levelChanged }))
  lines.push(t("impactAdvice"))
  return lines
}

export function MappingRemovalImpact({
  impact,
  loading,
}: {
  impact: PositionCompetencyDeleteImpact | null
  loading: boolean
}) {
  const t = useTranslations("AdminPositionCompetenciesDetailPage")
  if (loading) return <p className="text-sm text-muted-foreground">{t("impactChecking")}</p>
  const lines = mappingRemovalImpactLines(t, impact)
  if (lines.length === 0) return null
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <p className="mb-1 flex items-center gap-2 font-medium">
        <IconAlertTriangle className="size-4 shrink-0" />
        {t("impactTitle")}
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
