import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { UnitType } from "./columns"

interface UnitTypeViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unitType: UnitType | null
}

export function UnitTypeViewDialog({
  open,
  onOpenChange,
  unitType,
}: UnitTypeViewDialogProps) {
  if (!unitType) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unit Type Details</DialogTitle>
          <DialogDescription>
            View detailed information about {unitType.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Unit Type Name</Label>
            <p className="text-sm font-medium">{unitType.name}</p>
          </div>
          {unitType.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{unitType.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
