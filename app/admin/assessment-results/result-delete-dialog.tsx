"use client"

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
import { AssessmentResult } from "./columns"

interface ResultDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingResult: AssessmentResult | null
  selectedCount: number
  onConfirm: () => void
}

export function ResultDeleteDialog({
  open,
  onOpenChange,
  deletingResult,
  selectedCount,
  onConfirm,
}: ResultDeleteDialogProps) {
  const getResultName = () => {
    if (deletingResult) {
      return `${deletingResult.assessment?.name || "Unknown"} - ${deletingResult.position?.name || "Unknown"} - ${deletingResult.competency?.name || "Unknown"}`
    }
    return `${selectedCount} assessment result(s)`
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <span className="font-semibold">{getResultName()}</span>.
            This action cannot be undone.
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
