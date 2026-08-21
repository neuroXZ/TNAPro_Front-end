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
import { Zon } from "./columns"
import { useTranslations } from "next-intl"

interface ZonDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingZon: Zon | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function ZonDeleteDialog({
  open,
  onOpenChange,
  deletingZon,
  selectedCount = 0,
  onConfirm,
}: ZonDeleteDialogProps) {
  const t = useTranslations('AdminZonPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingZon
              ? tc('deleteSingleWarning', { name: deletingZon.name })
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
