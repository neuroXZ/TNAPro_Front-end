import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Competency {
  id: string
  name: string
  description?: string
  cluster?: {
    name: string
    color?: string
  }
}

interface PositionCompetency {
  id: string
  level: number
}

interface CompetencyViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
  positionCompetency?: PositionCompetency | null
}

export function CompetencyViewDialog({
  open,
  onOpenChange,
  competency,
  positionCompetency,
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
              <div className="flex items-center gap-2">
                {competency.cluster.color && (
                  <div
                    className="size-4 rounded"
                    style={{ backgroundColor: competency.cluster.color }}
                  />
                )}
                <p className="text-sm font-medium">{competency.cluster.name}</p>
              </div>
            </div>
          )}
          {positionCompetency && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Required Level</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-base">
                  {positionCompetency.level}
                </Badge>
                <span className="text-sm text-muted-foreground">out of 5</span>
              </div>
            </div>
          )}
          {competency.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{competency.description}</p>
            </div>
          )}
          {!positionCompetency && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                This competency has not been added to this position yet.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
