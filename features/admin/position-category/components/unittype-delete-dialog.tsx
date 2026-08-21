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
import { PositionCategory } from "./columns"

interface PositionCategoryDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingPositionCategory: PositionCategory | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function PositionCategoryDeleteDialog({
  open,
  onOpenChange,
  deletingPositionCategory,
  selectedCount = 0,
  onConfirm,
}: PositionCategoryDeleteDialogProps) {
  const t = useTranslations('AdminPositionCategoryPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingPositionCategory
              ? tc('deleteSingleWarning', { name: deletingPositionCategory.name })
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
