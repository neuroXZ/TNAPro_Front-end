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
import { UnitType } from "./columns"
import { useTranslations } from "next-intl"

interface UnitTypeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingUnitType: UnitType | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function UnitTypeDeleteDialog({
  open,
  onOpenChange,
  deletingUnitType,
  selectedCount = 0,
  onConfirm,
}: UnitTypeDeleteDialogProps) {
  const t = useTranslations('AdminUnitTypePage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingUnitType
              ? tc('deleteSingleWarning', { name: deletingUnitType.name })
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
