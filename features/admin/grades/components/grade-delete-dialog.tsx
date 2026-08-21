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
import { Grade } from "./columns"
import { useTranslations } from "next-intl"

interface GradeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingGrade: Grade | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function GradeDeleteDialog({
  open,
  onOpenChange,
  deletingGrade,
  selectedCount = 0,
  onConfirm,
}: GradeDeleteDialogProps) {
  const t = useTranslations('AdminGradesPage')
  const tc = useTranslations('Common')
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingGrade
              ? tc('deleteSingleWarning', { name: deletingGrade.name })
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
