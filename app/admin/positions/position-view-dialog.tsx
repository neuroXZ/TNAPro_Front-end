import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Position } from "./columns"

interface PositionViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: Position | null
}

export function PositionViewDialog({
  open,
  onOpenChange,
  position,
}: PositionViewDialogProps) {
  if (!position) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Position Details</DialogTitle>
          <DialogDescription>
            View detailed information about {position.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Position Name</Label>
            <p className="text-sm font-medium">{position.name}</p>
          </div>
          {position.grade?.name && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Grade</Label>
              <p className="text-sm font-medium">{position.grade.name}</p>
            </div>
          )}
          {position.category?.name && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Category</Label>
              <p className="text-sm font-medium">{position.category.name}</p>
            </div>
          )}
          {position.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{position.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
