import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { CompetencyDetailsDialog } from "@/features/competency-dictionary/competency-details-dialog"

interface Competency {
  id: string
  name: string
  description?: string
  cluster?: {
    name: string
    color?: string
  }
}

interface PositionCompetency {
  id: string
  level: number
}

interface CompetencyViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
  positionCompetency?: PositionCompetency | null
}

/** Competency details (full dictionary) plus this position's required level. */
export function CompetencyViewDialog({
  open,
  onOpenChange,
  competency,
  positionCompetency,
}: CompetencyViewDialogProps) {
  const t = useTranslations('AdminPositionCompetenciesDetailPage')

  return (
    <CompetencyDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      competencyId={competency?.id}
      fallbackName={competency?.name}
      requiredLevel={positionCompetency?.level}
      extra={
        positionCompetency ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('requiredLevelViewLabel')}</span>
            <Badge variant="default" className="text-base">
              {positionCompetency.level}
            </Badge>
            <span className="text-muted-foreground">{t('outOfFive')}</span>
          </div>
        ) : (
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">{t('notAddedYet')}</p>
          </div>
        )
      }
    />
  )
}
