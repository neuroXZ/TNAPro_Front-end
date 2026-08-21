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
import { Competency } from "./columns"
import { useTranslations } from "next-intl"

interface CompetencyDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingCompetency: Competency | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function CompetencyDeleteDialog({
  open,
  onOpenChange,
  deletingCompetency,
  selectedCount = 0,
  onConfirm,
}: CompetencyDeleteDialogProps) {
  const t = useTranslations('AdminCompetenciesPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingCompetency
              ? tc('deleteSingleWarning', { name: deletingCompetency.name })
              : tc('deleteBulkWarning', { count: selectedCount, entity: t('entityNamePlural') })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
