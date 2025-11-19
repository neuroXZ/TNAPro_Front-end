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
import { Level } from "./columns"

interface LevelDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingLevel: Level | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function LevelDeleteDialog({
  open,
  onOpenChange,
  deletingLevel,
  selectedCount = 0,
  onConfirm,
}: LevelDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingLevel
              ? `This will permanently delete "${deletingLevel.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected levels. This action cannot be undone.`}
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
