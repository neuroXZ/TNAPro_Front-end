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
import { PositionCategory } from "./columns"

interface PositionCategoryFormData {
  name: string
  description?: string
}

interface PositionCategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPositionCategory: PositionCategory | null
  onSubmit: (data: PositionCategoryFormData) => Promise<void>
}

export function PositionCategoryFormDialog({
  open,
  onOpenChange,
  editingPositionCategory,
  onSubmit,
}: PositionCategoryFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<PositionCategoryFormData>({
    name: editingPositionCategory?.name || "",
    description: editingPositionCategory?.description || "",
  })

  // Update form when editingPositionCategory or open state changes
  useEffect(() => {
    if (editingPositionCategory) {
      setFormData({
        name: editingPositionCategory.name,
        description: editingPositionCategory.description || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
      })
    }
  }, [editingPositionCategory, open])

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
              {editingPositionCategory ? "Edit Position Category" : "Add New Position Category"}
            </DialogTitle>
            <DialogDescription>
              {editingPositionCategory
                ? "Update position category information"
                : "Add a new position category to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Position Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter position category name"
                required
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
              {isSaving ? "Saving..." : editingPositionCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { PositionCategoryFormData }
