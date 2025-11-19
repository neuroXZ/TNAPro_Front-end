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
import { Position } from "./columns"

interface PositionDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingPosition: Position | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function PositionDeleteDialog({
  open,
  onOpenChange,
  deletingPosition,
  selectedCount = 0,
  onConfirm,
}: PositionDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingPosition
              ? `This will permanently delete "${deletingPosition.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected positions. This action cannot be undone.`}
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
