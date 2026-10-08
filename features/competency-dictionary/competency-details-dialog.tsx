"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CompetencyDictionaryView } from "./competency-dictionary-view"
import { useCompetencyDictionary } from "./use-competency-dictionary"

interface CompetencyDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competencyId: string | null | undefined
  /** Shown as the title until the dictionary has loaded. */
  fallbackName?: string
  /** Required level in the current context (e.g. a position's RCL) — highlighted. */
  requiredLevel?: number | null
  /** Short line under the title (e.g. the "reference only" note). */
  note?: ReactNode
  /** Context-specific block above the dictionary (mapping status, RCL, ...). */
  extra?: ReactNode
  footer?: ReactNode
}

/**
 * The one "competency details" display: code, cluster, name, definition and
 * every proficiency level with its indicators. Loads only while open.
 */
export function CompetencyDetailsDialog({
  open,
  onOpenChange,
  competencyId,
  fallbackName,
  requiredLevel,
  note,
  extra,
  footer,
}: CompetencyDetailsDialogProps) {
  const t = useTranslations("CompetencyDictionary")
  const { competency, levels, error } = useCompetencyDictionary(open ? competencyId : null)
  const clusterColor = competency?.cluster?.color || undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="space-y-2 text-left">
          {competency && (competency.code || competency.cluster) && (
            <div className="flex flex-wrap items-center gap-2">
              {competency.code && (
                <Badge variant="secondary" className="font-mono text-xs">{competency.code}</Badge>
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
          )}
          <DialogTitle className="text-xl">{competency?.name ?? fallbackName}</DialogTitle>
          {note && <DialogDescription className="flex items-start gap-1.5">{note}</DialogDescription>}
        </DialogHeader>

        {extra}

        {competency ? (
          <CompetencyDictionaryView competency={competency} levels={levels} requiredLevel={requiredLevel} hideHeader />
        ) : error ? (
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {footer && (
          <DialogFooter className="sticky -bottom-6 -mx-6 -mb-6 border-t bg-background px-6 py-4">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
