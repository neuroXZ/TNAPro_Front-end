import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Unit } from "./columns"

interface UnitViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
}

export function UnitViewDialog({
  open,
  onOpenChange,
  unit,
}: UnitViewDialogProps) {
  if (!unit) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unit Details</DialogTitle>
          <DialogDescription>
            View detailed information about {unit.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Unit Name</Label>
            <p className="text-sm font-medium">{unit.name}</p>
          </div>
          {unit.unitType && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Unit Type</Label>
              <p className="text-sm font-medium">{unit.unitType.name}</p>
            </div>
          )}
          {unit.parent && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Parent Unit</Label>
              <p className="text-sm font-medium">{unit.parent.name}</p>
            </div>
          )}
          {unit.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{unit.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
