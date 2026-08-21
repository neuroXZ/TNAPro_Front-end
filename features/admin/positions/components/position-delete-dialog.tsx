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
import { Position } from "./columns"
import { useTranslations } from "next-intl"

interface PositionDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingPosition: Position | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function PositionDeleteDialog({
  open,
  onOpenChange,
  deletingPosition,
  selectedCount = 0,
  onConfirm,
}: PositionDeleteDialogProps) {
  const t = useTranslations('AdminPositionsPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingPosition
              ? tc('deleteSingleWarning', { name: deletingPosition.name })
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
