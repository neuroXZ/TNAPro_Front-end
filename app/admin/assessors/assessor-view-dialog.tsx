import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Assessor } from "./columns"

interface AssessorViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessor: Assessor | null
}

export function AssessorViewDialog({
  open,
  onOpenChange,
  assessor,
}: AssessorViewDialogProps) {
  if (!assessor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assessor Assignment Details</DialogTitle>
          <DialogDescription>
            View detailed information about this assessor assignment
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {assessor.staff?.name && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Staff</Label>
              <p className="text-sm font-medium">{assessor.staff.name}</p>
            </div>
          )}
          {assessor.assessor?.name && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Assessor</Label>
              <p className="text-sm font-medium">{assessor.assessor.name}</p>
            </div>
          )}
          {assessor.type && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Type</Label>
              <p className="text-sm">{assessor.type}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
