"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconTarget, IconBuilding } from "@tabler/icons-react"

interface PositionCompetency {
  id: string
  positionId: string
  competencyId: string
  level?: number  // RCL (Required Competency Level)
  position: {
    id: string
    name: string
  }
  competency: {
    id: string
    name: string
    code: string
    description?: string
    cluster: {
      id: string
      name: string
      color?: string
    }
  }
}

interface CompetencyDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: PositionCompetency | null
}

export function CompetencyDetailDialog({
  open,
  onOpenChange,
  competency
}: CompetencyDetailDialogProps) {
  if (!competency) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconTarget className="size-5 text-primary" />
            {competency.competency.name}
          </DialogTitle>
          <DialogDescription>
            Competency details and requirements
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {competency.competency.code}
              </Badge>
              <Badge 
                variant="outline" 
                className="text-sm"
                style={{ 
                  borderColor: competency.competency.cluster?.color,
                  color: competency.competency.cluster?.color 
                }}
              >
                <div 
                  className="size-2 rounded-full mr-1"
                  style={{ backgroundColor: competency.competency.cluster?.color }}
                />
                {competency.competency.cluster?.name}
              </Badge>
            </div>
            
            {competency.competency.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm leading-relaxed">
                  {competency.competency.description}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Required Level */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Required Competency Level (RCL)</h4>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary">
                  {competency.level !== undefined && competency.level !== null ? competency.level : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">
                  out of 5
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Position Requirement</h4>
              <div className="flex items-center gap-2">
                <IconBuilding className="size-4 text-muted-foreground" />
                <span className="text-sm">{competency.position.name}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Competency Level Guide */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Competency Level Guide</h4>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>Level 1</span>
                <span className="text-muted-foreground">Basic / Awareness</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>Level 2</span>
                <span className="text-muted-foreground">Limited / Working Knowledge</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>Level 3</span>
                <span className="text-muted-foreground">Proficient / Skilled</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>Level 4</span>
                <span className="text-muted-foreground">Advanced / Expert</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>Level 5</span>
                <span className="text-muted-foreground">Mastery / Authority</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}