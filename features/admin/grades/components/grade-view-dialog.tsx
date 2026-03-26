import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Grade } from "./columns"

interface GradeViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grade: Grade | null
}

export function GradeViewDialog({
  open,
  onOpenChange,
  grade,
}: GradeViewDialogProps) {
  if (!grade) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Grade Details</DialogTitle>
          <DialogDescription>
            View detailed information about {grade.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Grade Name</Label>
            <p className="text-sm font-medium">{grade.name}</p>
          </div>
          {grade.level !== null && grade.level !== undefined && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Level</Label>
              <p className="text-sm font-medium">{grade.level}</p>
            </div>
          )}
          {grade.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{grade.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
