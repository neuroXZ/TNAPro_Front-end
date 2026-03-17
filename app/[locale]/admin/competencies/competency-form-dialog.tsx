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
import { Competency } from "./columns"
import { clusterAPI } from "@/lib/api"

interface CompetencyFormData {
  name: string
  description?: string
  clusterId?: string
}

interface CompetencyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCompetency: Competency | null
  onSubmit: (data: CompetencyFormData) => Promise<void>
}

interface Cluster {
  id: string
  name: string
}

export function CompetencyFormDialog({
  open,
  onOpenChange,
  editingCompetency,
  onSubmit,
}: CompetencyFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [formData, setFormData] = useState<CompetencyFormData>({
    name: editingCompetency?.name || "",
    description: editingCompetency?.description || "",
    clusterId: editingCompetency?.clusterId || "",
  })

  // Fetch clusters
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const data = await clusterAPI.getAll()
        setClusters(data)
      } catch (error) {
        console.error("Failed to fetch clusters:", error)
      }
    }
    if (open) {
      fetchClusters()
    }
  }, [open])

  // Update form when editingCompetency or open state changes
  useEffect(() => {
    if (editingCompetency) {
      setFormData({
        name: editingCompetency.name,
        description: editingCompetency.description || "",
        clusterId: editingCompetency.clusterId || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        clusterId: "",
      })
    }
  }, [editingCompetency, open])

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
              {editingCompetency ? "Edit Competency" : "Add New Competency"}
            </DialogTitle>
            <DialogDescription>
              {editingCompetency
                ? "Update competency information"
                : "Add a new competency to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Competency Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter competency name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clusterId">Cluster</Label>
              <Select
                value={formData.clusterId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clusterId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cluster (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {cluster.name}
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
              {isSaving ? "Saving..." : editingCompetency ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { CompetencyFormData }
