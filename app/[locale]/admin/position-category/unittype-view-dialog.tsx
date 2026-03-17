import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PositionCategory } from "./columns"

interface PositionCategoryViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  positionCategory: PositionCategory | null
}

export function PositionCategoryViewDialog({
  open,
  onOpenChange,
  positionCategory,
}: PositionCategoryViewDialogProps) {
  if (!positionCategory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Position Category Details</DialogTitle>
          <DialogDescription>
            View detailed information about {positionCategory.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Position Category Name</Label>
            <p className="text-sm font-medium">{positionCategory.name}</p>
          </div>
          {positionCategory.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{positionCategory.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
