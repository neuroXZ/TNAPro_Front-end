import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Level } from "./columns"

interface LevelViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  level: Level | null
}

export function LevelViewDialog({
  open,
  onOpenChange,
  level,
}: LevelViewDialogProps) {
  if (!level) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Level Details</DialogTitle>
          <DialogDescription>
            View detailed information about {level.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Level Name</Label>
            <p className="text-sm font-medium">{level.name}</p>
          </div>
          {level.value !== null && level.value !== undefined && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Value</Label>
              <p className="text-sm font-medium">{level.value}</p>
            </div>
          )}
          {level.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{level.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
