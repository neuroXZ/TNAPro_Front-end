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
import { Negeri } from "./columns"
import { useTranslations } from "next-intl"

interface NegeriDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingNegeri: Negeri | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function NegeriDeleteDialog({
  open,
  onOpenChange,
  deletingNegeri,
  selectedCount = 0,
  onConfirm,
}: NegeriDeleteDialogProps) {
  const t = useTranslations('AdminNegeriPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingNegeri
              ? tc('deleteSingleWarning', { name: deletingNegeri.name })
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
