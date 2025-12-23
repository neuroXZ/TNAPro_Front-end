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
import { unitTypeAPI, unitAPI } from "@/lib/api"

interface UnitFormData {
  name: string
  description?: string
  unitTypeId?: string
  parentId?: string
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
  const [parentUnits, setParentUnits] = useState<Unit[]>([])
  const [formData, setFormData] = useState<UnitFormData>({
    name: editingUnit?.name || "",
    description: editingUnit?.description || "",
    unitTypeId: editingUnit?.unitTypeId || "",
    parentId: editingUnit?.parentId || "",
  })

  // Fetch unit types and parent units
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch unit types
        const unitTypesData = await unitTypeAPI.getAll()
        setUnitTypes(unitTypesData)
        
        // Fetch all units for parent selection
        const allUnits = await unitAPI.getAll()
        // Filter out current unit if editing (prevent self-reference)
        const availableParents = editingUnit 
          ? allUnits.filter((unit: Unit) => unit.id !== editingUnit.id)
          : allUnits
        setParentUnits(availableParents)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    if (open) {
      fetchData()
    }
  }, [open, editingUnit])

  // Update form when editingUnit or open state changes
  useEffect(() => {
    if (editingUnit) {
      setFormData({
        name: editingUnit.name,
        description: editingUnit.description || "",
        unitTypeId: editingUnit.unitTypeId || "",
        parentId: editingUnit.parentId || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        unitTypeId: "",
        parentId: "",
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
                value={formData.unitTypeId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, unitTypeId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Unit Type</SelectItem>
                  {unitTypes.map((unitType) => (
                    <SelectItem key={unitType.id} value={unitType.id}>
                      {unitType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parentId">Parent Unit</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent unit (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent Unit</SelectItem>
                  {parentUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                      {unit.unitType && ` (${unit.unitType.name})`}
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
