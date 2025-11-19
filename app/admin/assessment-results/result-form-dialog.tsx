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
import { Input } from "@/components/ui/input"
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

interface ResultFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result?: AssessmentResult | null
  onSubmit: (data: any) => Promise<void>
  assessments: Assessment[]
  positions: Position[]
  competencies: Competency[]
  assessors: Assessor[]
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
}: ResultFormDialogProps) {
  const [formData, setFormData] = useState({
    assessmentId: "",
    positionId: "",
    competencyId: "",
    assessorId: "",
    score: "",
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
      })
    } else if (open) {
      setFormData({
        assessmentId: "",
        positionId: "",
        competencyId: "",
        assessorId: "",
        score: "",
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
      <DialogContent className="sm:max-w-[500px]">
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
              <Label htmlFor="score">Score (0-5) *</Label>
              <Input
                id="score"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                placeholder="e.g., 4.5"
                required
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
