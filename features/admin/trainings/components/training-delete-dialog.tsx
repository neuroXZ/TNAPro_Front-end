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
import { Training } from "./columns"
import { useTranslations } from "next-intl"

interface TrainingDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingTraining: Training | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function TrainingDeleteDialog({
  open,
  onOpenChange,
  deletingTraining,
  selectedCount = 0,
  onConfirm,
}: TrainingDeleteDialogProps) {
  const t = useTranslations('AdminTrainingsPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingTraining
              ? tc('deleteSingleWarning', { name: deletingTraining.name })
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
