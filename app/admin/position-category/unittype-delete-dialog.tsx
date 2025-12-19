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
import { PositionCategory } from "./columns"

interface PositionCategoryDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingPositionCategory: PositionCategory | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function PositionCategoryDeleteDialog({
  open,
  onOpenChange,
  deletingPositionCategory,
  selectedCount = 0,
  onConfirm,
}: PositionCategoryDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingPositionCategory
              ? `This will permanently delete "${deletingPositionCategory.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected position categorys. This action cannot be undone.`}
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
