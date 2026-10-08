"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { IconBook2, IconInfoCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CompetencyDetailsDialog } from "./competency-details-dialog"

interface CompetencyIndicatorsButtonProps {
  competencyId: string | undefined
  competencyName?: string
  /** From the competency list's `_count.levelIndicators`; nothing renders at 0. */
  indicatorCount?: number
  /** Viewer's required level (RCL) — highlighted in the dictionary. */
  requiredLevel?: number | null
  className?: string
}

/**
 * "View indicators" link that opens the competency's dictionary entry as a
 * reference while rating. Purely informational — it never touches the score
 * being entered.
 */
export function CompetencyIndicatorsButton({
  competencyId,
  competencyName,
  indicatorCount = 0,
  requiredLevel,
  className,
}: CompetencyIndicatorsButtonProps) {
  const t = useTranslations("CompetencyDictionary")
  const [open, setOpen] = useState(false)
  if (!competencyId || indicatorCount <= 0) return null

  return (
    <>
      <Button
        type="button"
        variant="link"
        size="sm"
        className={cn("h-auto gap-1 p-0 text-xs has-[>svg]:px-0", className)}
        onClick={() => setOpen(true)}
      >
        <IconBook2 className="size-3.5" />
        {t("viewIndicators")}
      </Button>
      <CompetencyDetailsDialog
        open={open}
        onOpenChange={setOpen}
        competencyId={competencyId}
        fallbackName={competencyName}
        requiredLevel={requiredLevel}
        note={
          <>
            <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
            {t("referenceShort")}
          </>
        }
      />
    </>
  )
}
