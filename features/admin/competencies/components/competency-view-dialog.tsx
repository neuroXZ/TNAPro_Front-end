import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Competency } from "./columns"

interface CompetencyViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
}

export function CompetencyViewDialog({
  open,
  onOpenChange,
  competency,
}: CompetencyViewDialogProps) {
  if (!competency) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Competency Details</DialogTitle>
          <DialogDescription>
            View detailed information about {competency.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Competency Name</Label>
            <p className="text-sm font-medium">{competency.name}</p>
          </div>
          {competency.cluster && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Cluster</Label>
              <p className="text-sm font-medium">{competency.cluster.name}</p>
            </div>
          )}
          {competency.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{competency.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
