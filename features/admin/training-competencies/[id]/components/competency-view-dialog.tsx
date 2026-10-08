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

interface TrainingCompetency {
  id: string
}

interface CompetencyViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
  trainingCompetency?: TrainingCompetency | null
}

/** Competency details (full dictionary) plus whether it's linked to this training. */
export function CompetencyViewDialog({
  open,
  onOpenChange,
  competency,
  trainingCompetency,
}: CompetencyViewDialogProps) {
  const t = useTranslations('AdminTrainingCompetenciesDetailPage')

  return (
    <CompetencyDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      competencyId={competency?.id}
      fallbackName={competency?.name}
      extra={
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('statusLabel')}</span>
            {trainingCompetency ? (
              <Badge variant="default">{t('addedToTraining')}</Badge>
            ) : (
              <Badge variant="outline">{t('badgeNotAdded')}</Badge>
            )}
          </div>
          {!trainingCompetency && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">{t('notAddedYet')}</p>
            </div>
          )}
        </div>
      }
    />
  )
}
