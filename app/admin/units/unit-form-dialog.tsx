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
import { Unit } from "./columns"
import { unitTypeAPI } from "@/lib/api"

interface UnitFormData {
  name: string
  description?: string
  unitTypeId?: string
}

interface UnitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUnit: Unit | null
  onSubmit: (data: UnitFormData) => Promise<void>
}

interface UnitType {
  id: string
  name: string
}

export function UnitFormDialog({
  open,
  onOpenChange,
  editingUnit,
  onSubmit,
}: UnitFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [formData, setFormData] = useState<UnitFormData>({
    name: editingUnit?.name || "",
    description: editingUnit?.description || "",
    unitTypeId: editingUnit?.unitTypeId || "",
  })

  // Fetch unit types
  useEffect(() => {
    const fetchUnitTypes = async () => {
      try {
        const data = await unitTypeAPI.getAll()
        setUnitTypes(data)
      } catch (error) {
        console.error("Failed to fetch unit types:", error)
      }
    }
    if (open) {
      fetchUnitTypes()
    }
  }, [open])

  // Update form when editingUnit or open state changes
  useEffect(() => {
    if (editingUnit) {
      setFormData({
        name: editingUnit.name,
        description: editingUnit.description || "",
        unitTypeId: editingUnit.unitTypeId || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        unitTypeId: "",
      })
    }
  }, [editingUnit, open])

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
              {editingUnit ? "Edit Unit" : "Add New Unit"}
            </DialogTitle>
            <DialogDescription>
              {editingUnit
                ? "Update unit information"
                : "Add a new unit to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Unit Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter unit name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitTypeId">Unit Type</Label>
              <Select
                value={formData.unitTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, unitTypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map((unitType) => (
                    <SelectItem key={unitType.id} value={unitType.id}>
                      {unitType.name}
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
              {isSaving ? "Saving..." : editingUnit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { UnitFormData }
