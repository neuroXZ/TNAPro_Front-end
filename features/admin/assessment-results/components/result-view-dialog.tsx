"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Level {
  id: string
  name: string
  value: number
}

interface ResultViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: {
    assessment?: { name: string }
    position?: { name: string }
    competency?: { name: string }
    assessor?: {
      staff?: { name: string }
      assessor?: { name: string }
      type: string
    }
    score: number
    status: string
    remark?: string
    createdAt: string
    updatedAt: string
  } | null
  levels: Level[]
}

export function ResultViewDialog({
  open,
  onOpenChange,
  result,
  levels,
}: ResultViewDialogProps) {
  if (!result) return null

  // Highest admin-defined Level value — the score's scale is whatever levels
  // are currently configured, not a fixed number (see Level module).
  const maxLevel = levels.length > 0 ? Math.max(...levels.map((l) => l.value ?? 0)) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Assessment Result Details</DialogTitle>
          <DialogDescription>
            View assessment result information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Assessment</div>
            <div className="text-sm">{result.assessment?.name || "-"}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Position</div>
            <div className="text-sm">{result.position?.name || "-"}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Competency</div>
            <div className="text-sm">{result.competency?.name || "-"}</div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Assessor</div>
            <div className="text-sm">
              {result.assessor?.assessor?.name || result.assessor?.staff?.name || "-"}
              {result.assessor?.type && (
                <span className="ml-2 text-muted-foreground">
                  ({result.assessor.type})
                </span>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Score</div>
            <div className="text-2xl font-bold">
              {result.status === 'SUBMITTED' ? (result.score?.toFixed(2) || "0.00") : "N/A"}
              {maxLevel !== null && ` / ${maxLevel.toFixed(2)}`}
            </div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Status</div>
            <div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                result.status === 'SUBMITTED' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }`}>
                {result.status || 'DRAFT'}
              </span>
            </div>
          </div>
          {result.remark && (
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Remark</div>
              <div className="text-sm whitespace-pre-wrap rounded-md border bg-muted/50 p-3">
                {result.remark}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Created At</div>
              <div className="text-sm">
                {new Date(result.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-muted-foreground">Updated At</div>
              <div className="text-sm">
                {new Date(result.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
