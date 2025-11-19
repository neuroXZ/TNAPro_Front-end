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
import { Assessor } from "./columns"

interface AssessorDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingAssessor: Assessor | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function AssessorDeleteDialog({
  open,
  onOpenChange,
  deletingAssessor,
  selectedCount = 0,
  onConfirm,
}: AssessorDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingAssessor
              ? `This will permanently delete this assessor assignment. This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected assessor assignments. This action cannot be undone.`}
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
