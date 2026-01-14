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
import { Grade } from "./columns"

interface GradeFormData {
  name: string
  description?: string
  level?: number
}

interface GradeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingGrade: Grade | null
  onSubmit: (data: GradeFormData) => Promise<void>
}

export function GradeFormDialog({
  open,
  onOpenChange,
  editingGrade,
  onSubmit,
}: GradeFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<GradeFormData>({
    name: editingGrade?.name || "",
    description: editingGrade?.description || "",
    level: editingGrade?.level,
  })

  // Update form when editingGrade or open state changes
  useEffect(() => {
    if (editingGrade) {
      setFormData({
        name: editingGrade.name,
        description: editingGrade.description || "",
        level: editingGrade.level,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        level: undefined,
      })
    }
  }, [editingGrade, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? "Edit Grade" : "Add New Grade"}
            </DialogTitle>
            <DialogDescription>
              {editingGrade
                ? "Update grade information"
                : "Add a new grade to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Grade Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter grade name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="number"
                min={0}
                max={10}
                value={formData.level ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Enter level (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description (optional)"
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
              {isSaving ? "Saving..." : editingGrade ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { GradeFormData }
