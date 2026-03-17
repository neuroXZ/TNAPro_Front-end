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
import { Position } from "./columns"
import { gradeAPI, positionCategoryAPI } from "@/lib/api"

interface PositionFormData {
  name: string
  description?: string
  gradeId?: string
  categoryId?: string
}

interface PositionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPosition: Position | null
  onSubmit: (data: PositionFormData) => Promise<void>
}

export function PositionFormDialog({
  open,
  onOpenChange,
  editingPosition,
  onSubmit,
}: PositionFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [grades, setGrades] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState<PositionFormData>({
    name: editingPosition?.name || "",
    description: editingPosition?.description || "",
    gradeId: editingPosition?.gradeId,
    categoryId: editingPosition?.categoryId,
  })

  // Fetch grades on mount
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await gradeAPI.getAll()
        setGrades(data)
      } catch (error) {
        console.error("Failed to fetch grades:", error)
      }
    }
    fetchGrades()
  }, [])

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await positionCategoryAPI.getAll()
        setCategories(data)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        setCategories([])
      }
    }
    fetchCategories()
  }, [])

  // Update form when editingPosition or open state changes
  useEffect(() => {
    if (editingPosition) {
      setFormData({
        name: editingPosition.name,
        description: editingPosition.description || "",
        gradeId: editingPosition.gradeId,
        categoryId: editingPosition.categoryId,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        gradeId: undefined,
        categoryId: undefined,
      })
    }
  }, [editingPosition, open])

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
              {editingPosition ? "Edit Position" : "Add New Position"}
            </DialogTitle>
            <DialogDescription>
              {editingPosition
                ? "Update position information"
                : "Add a new position to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Position Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter position name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gradeId">Grade</Label>
              <Select
                value={formData.gradeId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, gradeId: value })
                }
              >
                <SelectTrigger id="gradeId">
                  <SelectValue placeholder="Select grade (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Position Category</Label>
              <Select
                value={formData.categoryId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSaving ? "Saving..." : editingPosition ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { PositionFormData }
