import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslations } from "next-intl"
import type { PositionCompetencyDeleteImpact } from "@/lib/api"
import { MappingRemovalImpact } from "./mapping-removal-impact"

interface Competency {
  id: string
  name: string
}

interface CompetencyDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
  onConfirm: () => Promise<void>
  // Base mapping template: explains that removing a template mapping excludes it.
  notice?: string | null
  // Results already recorded against this mapping (warning only, never blocks).
  impact?: PositionCompetencyDeleteImpact | null
  impactLoading?: boolean
}

export function CompetencyDeleteDialog({
  open,
  onOpenChange,
  competency,
  onConfirm,
  notice,
  impact = null,
  impactLoading = false,
}: CompetencyDeleteDialogProps) {
  const t = useTranslations('AdminPositionCompetenciesDetailPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('removeCompetencyWarning', { name: competency?.name ?? '' })}
          </AlertDialogDescription>
          {notice && <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{notice}</p>}
          <MappingRemovalImpact impact={impact} loading={impactLoading} />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={impactLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {tc('remove')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
