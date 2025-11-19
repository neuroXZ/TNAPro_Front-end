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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingStaff
              ? `This will permanently delete ${deletingStaff.name} (${deletingStaff.orgId}). This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected staff. This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
