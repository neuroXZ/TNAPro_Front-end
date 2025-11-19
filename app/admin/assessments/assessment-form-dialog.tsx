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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Assessment {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  weightageSelf?: number
  weightageSuperior?: number
  weightagePeer?: number
}

interface AssessmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment?: Assessment | null
  onSubmit: (data: any) => Promise<void>
}

export function AssessmentFormDialog({
  open,
  onOpenChange,
  assessment,
  onSubmit,
}: AssessmentFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    weightageSelf: "",
    weightageSuperior: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Auto-calculate weightages to total 100%
  const handleWeightageChange = (field: "weightageSelf" | "weightageSuperior", value: string) => {
    const numValue = parseFloat(value) || 0
    
    if (field === "weightageSelf") {
      if (!usePeerAssessment) {
        // Without peer: auto-calculate superior
        const superior = Math.max(0, 100 - numValue)
        setFormData({
          ...formData,
          weightageSelf: value,
          weightageSuperior: superior.toString(),
        })
      } else {
        // With peer: keep superior, auto-calculate peer
        const superior = parseFloat(formData.weightageSuperior) || 0
        const peer = Math.max(0, 100 - numValue - superior)
        setFormData({
          ...formData,
          weightageSelf: value,
          weightagePeer: peer.toString(),
        })
      }
    } else if (field === "weightageSuperior") {
      if (!usePeerAssessment) {
        // Without peer: auto-calculate self
        const self = Math.max(0, 100 - numValue)
        setFormData({
          ...formData,
          weightageSuperior: value,
          weightageSelf: self.toString(),
        })
      } else {
        // With peer: keep self, auto-calculate peer
        const self = parseFloat(formData.weightageSelf) || 0
        const peer = Math.max(0, 100 - self - numValue)
        setFormData({
          ...formData,
          weightageSuperior: value,
          weightagePeer: peer.toString(),
        })
      }
    } else if (field === "weightagePeer" && usePeerAssessment) {
      // When peer changes, auto-calculate superior
      const self = parseFloat(formData.weightageSelf) || 0
      const superior = Math.max(0, 100 - self - numValue)
      setFormData({
        ...formData,
        weightagePeer: value,
        weightageSuperior: superior.toString(),
      })
    }
  }

  useEffect(() => {
    if (open && assessment) {
      // Check if values are already in percentage format (>1) or decimal format (0-1)
      const selfValue = assessment.weightageSelf 
        ? (assessment.weightageSelf > 1 ? assessment.weightageSelf : assessment.weightageSelf * 100).toString() 
        : ""
      const superiorValue = assessment.weightageSuperior 
        ? (assessment.weightageSuperior > 1 ? assessment.weightageSuperior : assessment.weightageSuperior * 100).toString() 
        : ""
      
      setFormData({
        name: assessment.name || "",
        description: assessment.description || "",
        startDate: assessment.startDate?.split("T")[0] || "",
        endDate: assessment.endDate?.split("T")[0] || "",
        weightageSelf: selfValue,
        weightageSuperior: superiorValue,
      })
    } else if (open) {
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        weightageSelf: "",
        weightageSuperior: "",
      })
    }
  }, [open, assessment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        weightageSelf: formData.weightageSelf ? parseFloat(formData.weightageSelf) / 100 : null,
        weightageSuperior: formData.weightageSuperior ? parseFloat(formData.weightageSuperior) / 100 : null,
        weightagePeer: null,
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
              {assessment ? "Edit Assessment" : "Add New Assessment"}
            </DialogTitle>
            <DialogDescription>
              {assessment ? "Update assessment campaign details" : "Create a new assessment campaign"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Assessment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q4 2025 Competency Assessment"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter assessment description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Weightage Configuration</Label>
              <p className="text-xs text-muted-foreground">
                Set the weight for each assessment type (should total 100%)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="weightageSelf">Self (%)</Label>
                  <Input
                    id="weightageSelf"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.weightageSelf}
                    onChange={(e) => handleWeightageChange("weightageSelf", e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weightageSuperior">Superior (%)</Label>
                  <Input
                    id="weightageSuperior"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.weightageSuperior}
                    onChange={(e) => handleWeightageChange("weightageSuperior", e.target.value)}
                    placeholder="70"
                  />
                </div>
              </div>
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
              {isSaving ? "Saving..." : assessment ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
