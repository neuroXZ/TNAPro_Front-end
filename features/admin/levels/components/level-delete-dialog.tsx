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
import { Level } from "./columns"
import { useTranslations } from "next-intl"

interface LevelDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingLevel: Level | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function LevelDeleteDialog({
  open,
  onOpenChange,
  deletingLevel,
  selectedCount = 0,
  onConfirm,
}: LevelDeleteDialogProps) {
  const t = useTranslations('AdminLevelsPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingLevel
              ? tc('deleteSingleWarning', { name: deletingLevel.name })
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
