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
import { Competency } from "./columns"

interface CompetencyDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingCompetency: Competency | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function CompetencyDeleteDialog({
  open,
  onOpenChange,
  deletingCompetency,
  selectedCount = 0,
  onConfirm,
}: CompetencyDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingCompetency
              ? `This will permanently delete "${deletingCompetency.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected competencies. This action cannot be undone.`}
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
