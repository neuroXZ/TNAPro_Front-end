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
import { Staff } from "./columns"
import { useTranslations } from "next-intl"

interface StaffDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingStaff: Staff | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function StaffDeleteDialog({
  open,
  onOpenChange,
  deletingStaff,
  selectedCount = 0,
  onConfirm,
}: StaffDeleteDialogProps) {
  const t = useTranslations('AdminStaffPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingStaff
              ? t('deleteWarningSingle', { name: deletingStaff.name, staffOrgId: deletingStaff.staffOrgId })
              : t('deleteWarningBulk', { count: selectedCount })}
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
