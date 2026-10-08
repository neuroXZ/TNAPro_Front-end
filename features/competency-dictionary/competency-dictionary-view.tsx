"use client"

import { Badge } from "@/components/ui/badge"
import { IconTarget } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { buildLevelRows, type DictionaryCompetency, type GlobalLevel } from "./types"

interface CompetencyDictionaryViewProps {
  competency: DictionaryCompetency
  levels: GlobalLevel[]
  /** Required level for the viewer's position — highlighted when given. */
  requiredLevel?: number | null
  /** Hide the name/code/cluster/definition block (e.g. inside a dialog that already titles it). */
  hideHeader?: boolean
  /** Hide the definition block when the surrounding UI already shows it. */
  hideDefinition?: boolean
  className?: string
}

/**
 * Read-only "dictionary page" for one competency: identity + definition,
 * then every proficiency level with its behavioural indicators (0..n each).
 */
export function CompetencyDictionaryView({
  competency,
  levels,
  requiredLevel,
  hideHeader = false,
  hideDefinition = false,
  className,
}: CompetencyDictionaryViewProps) {
  const t = useTranslations("CompetencyDictionary")
  const rows = buildLevelRows(levels, competency.levelIndicators ?? [])
  const clusterColor = competency.cluster?.color || undefined

  return (
    <div className={cn("space-y-6", className)}>
      {!hideHeader && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {competency.code && (
              <Badge variant="secondary" className="font-mono text-xs">
                {competency.code}
              </Badge>
            )}
            {competency.cluster && (
              <Badge
                variant="outline"
                className="text-xs"
                style={clusterColor ? { borderColor: clusterColor, color: clusterColor } : undefined}
              >
                {clusterColor && (
                  <span className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: clusterColor }} />
                )}
                {competency.cluster.name}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-semibold leading-tight">{competency.name}</h2>
        </div>
      )}

      {!hideDefinition && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("definition")}
          </h3>
          {competency.description ? (
            <p className="text-sm leading-relaxed whitespace-pre-line">{competency.description}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">{t("noDefinition")}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("proficiencyLevels")}
        </h3>
        <ol className="divide-y rounded-lg border">
          {rows.map((row) => {
            const isRequired = requiredLevel != null && Math.round(requiredLevel) === row.value
            return (
              <li
                key={row.value}
                className={cn(
                  "grid gap-3 p-4 sm:grid-cols-[10rem_1fr]",
                  isRequired && "bg-primary/5 ring-1 ring-inset ring-primary"
                )}
              >
                <div className="flex items-start gap-3 sm:flex-col sm:gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {row.value}
                    </span>
                    <div className="leading-tight">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("levelLabel", { value: row.value })}
                      </div>
                      {row.name && <div className="text-sm font-semibold uppercase">{row.name}</div>}
                    </div>
                  </div>
                  {isRequired && (
                    <Badge className="gap-1 text-[11px]">
                      <IconTarget className="size-3" />
                      {t("requiredLevel")}
                    </Badge>
                  )}
                </div>
                {row.indicators.length > 0 ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-primary">
                    {row.indicators.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="self-center text-sm italic text-muted-foreground">{t("noIndicators")}</p>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
