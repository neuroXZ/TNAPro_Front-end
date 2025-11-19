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
import { Cluster } from "./columns"

interface ClusterFormData {
  name: string
  description?: string
  level?: number
  color?: string
}

interface ClusterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCluster: Cluster | null
  onSubmit: (data: ClusterFormData) => Promise<void>
}

export function ClusterFormDialog({
  open,
  onOpenChange,
  editingCluster,
  onSubmit,
}: ClusterFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ClusterFormData>({
    name: editingCluster?.name || "",
    description: editingCluster?.description || "",
    level: editingCluster?.level,
    color: editingCluster?.color || "",
  })

  // Update form when editingCluster or open state changes
  useEffect(() => {
    if (editingCluster) {
      setFormData({
        name: editingCluster.name,
        description: editingCluster.description || "",
        level: editingCluster.level,
        color: editingCluster.color || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        level: undefined,
        color: "",
      })
    }
  }, [editingCluster, open])

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
              {editingCluster ? "Edit Cluster" : "Add New Cluster"}
            </DialogTitle>
            <DialogDescription>
              {editingCluster
                ? "Update cluster information"
                : "Add a new competency cluster to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Cluster Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter cluster name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="number"
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
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color || "#000000"}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="Enter color code (e.g., #FF5733)"
                  className="flex-1"
                />
              </div>
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
              {isSaving ? "Saving..." : editingCluster ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { ClusterFormData }
