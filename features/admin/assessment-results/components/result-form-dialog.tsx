"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AssessmentResult {
  id: string
  assessmentId: string
  positionId: string
  competencyId: string
  assessorId: string
  score: number
  status: string
  remark?: string
}

interface Assessment {
  id: string
  name: string
}

interface Position {
  id: string
  name: string
}

interface Competency {
  id: string
  name: string
}

interface Assessor {
  id: string
  staff?: { name: string }
  assessor?: { name: string }
  type: string
}

interface Level {
  id: string
  name: string
  value: number
}

interface ResultFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result?: AssessmentResult | null
  onSubmit: (data: any) => Promise<void>
  assessments: Assessment[]
  positions: Position[]
  competencies: Competency[]
  assessors: Assessor[]
  levels: Level[]
}

export function ResultFormDialog({
  open,
  onOpenChange,
  result,
  onSubmit,
  assessments,
  positions,
  competencies,
  assessors,
  levels,
}: ResultFormDialogProps) {
  const sortedLevels = [...levels].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))
  const [formData, setFormData] = useState({
    assessmentId: "",
    positionId: "",
    competencyId: "",
    assessorId: "",
    score: "",
    status: "DRAFT",
    remark: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && result) {
      setFormData({
        assessmentId: result.assessmentId || "",
        positionId: result.positionId || "",
        competencyId: result.competencyId || "",
        assessorId: result.assessorId || "",
        score: result.score?.toString() || "",
        status: result.status || "DRAFT",
        remark: result.remark || "",
      })
    } else if (open) {
      setFormData({
        assessmentId: "",
        positionId: "",
        competencyId: "",
        assessorId: "",
        score: "",
        status: "DRAFT",
        remark: "",
      })
    }
  }, [open, result])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSubmit({
        assessmentId: formData.assessmentId || null,
        positionId: formData.positionId || null,
        competencyId: formData.competencyId || null,
        assessorId: formData.assessorId || null,
        score: formData.score ? parseFloat(formData.score) : null,
        status: formData.status || "DRAFT",
        remark: formData.remark || null,
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {result ? "Edit Assessment Result" : "Add New Assessment Result"}
            </DialogTitle>
            <DialogDescription>
              {result ? "Update assessment result details" : "Create a new assessment result"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="assessmentId">Assessment *</Label>
              <Select
                value={formData.assessmentId}
                onValueChange={(value) => setFormData({ ...formData, assessmentId: value })}
                required
              >
                <SelectTrigger id="assessmentId">
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="positionId">Position *</Label>
              <Select
                value={formData.positionId}
                onValueChange={(value) => setFormData({ ...formData, positionId: value })}
                required
              >
                <SelectTrigger id="positionId">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="competencyId">Competency *</Label>
              <Select
                value={formData.competencyId}
                onValueChange={(value) => setFormData({ ...formData, competencyId: value })}
                required
              >
                <SelectTrigger id="competencyId">
                  <SelectValue placeholder="Select competency" />
                </SelectTrigger>
                <SelectContent>
                  {competencies.map((competency) => (
                    <SelectItem key={competency.id} value={competency.id}>
                      {competency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assessorId">Assessor *</Label>
              <Select
                value={formData.assessorId}
                onValueChange={(value) => setFormData({ ...formData, assessorId: value })}
                required
              >
                <SelectTrigger id="assessorId">
                  <SelectValue placeholder="Select assessor" />
                </SelectTrigger>
                <SelectContent>
                  {assessors.map((assessor) => (
                    <SelectItem key={assessor.id} value={assessor.id}>
                      {assessor.assessor?.name || assessor.staff?.name || "Unknown"} ({assessor.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="score">Score *</Label>
              <Select
                value={formData.score}
                onValueChange={(value) => setFormData({ ...formData, score: value })}
                required
              >
                <SelectTrigger id="score">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {sortedLevels.map((level) => (
                    <SelectItem key={level.id} value={level.value.toString()}>
                      {level.value} - {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remark">Remark</Label>
              <textarea
                id="remark"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="Enter remark (optional)"
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : result ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
