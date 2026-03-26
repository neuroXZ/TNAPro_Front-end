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
import { Training } from "./columns"

interface TrainingDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingTraining: Training | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function TrainingDeleteDialog({
  open,
  onOpenChange,
  deletingTraining,
  selectedCount = 0,
  onConfirm,
}: TrainingDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingTraining
              ? `This will permanently delete "${deletingTraining.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected trainings. This action cannot be undone.`}
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
