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
import { UnitType } from "./columns"

interface UnitTypeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingUnitType: UnitType | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function UnitTypeDeleteDialog({
  open,
  onOpenChange,
  deletingUnitType,
  selectedCount = 0,
  onConfirm,
}: UnitTypeDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingUnitType
              ? `This will permanently delete "${deletingUnitType.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected unit types. This action cannot be undone.`}
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
