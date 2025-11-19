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
    createdAt: string
    updatedAt: string
  } | null
}

export function ResultViewDialog({
  open,
  onOpenChange,
  result,
}: ResultViewDialogProps) {
  if (!result) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
            <div className="text-2xl font-bold">{result.score?.toFixed(2) || "0.00"} / 5.00</div>
          </div>
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
