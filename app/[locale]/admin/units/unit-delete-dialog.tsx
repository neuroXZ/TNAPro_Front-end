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
import { Unit } from "./columns"

interface UnitDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingUnit: Unit | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function UnitDeleteDialog({
  open,
  onOpenChange,
  deletingUnit,
  selectedCount = 0,
  onConfirm,
}: UnitDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingUnit
              ? `This will permanently delete "${deletingUnit.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected units. This action cannot be undone.`}
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
