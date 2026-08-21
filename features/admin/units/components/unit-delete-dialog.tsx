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
import { Unit } from "./columns"
import { useTranslations } from "next-intl"

interface UnitDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingUnit: Unit | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function UnitDeleteDialog({
  open,
  onOpenChange,
  deletingUnit,
  selectedCount = 0,
  onConfirm,
}: UnitDeleteDialogProps) {
  const t = useTranslations('AdminUnitsPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingUnit
              ? tc('deleteSingleWarning', { name: deletingUnit.name })
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
