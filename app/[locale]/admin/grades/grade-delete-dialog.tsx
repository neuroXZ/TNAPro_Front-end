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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingGrade
              ? `This will permanently delete "${deletingGrade.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected grades. This action cannot be undone.`}
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
