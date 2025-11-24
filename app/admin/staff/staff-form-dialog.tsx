import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { positionAPI, unitAPI, staffAPI } from "@/lib/api"
import { Staff } from "./columns"

interface StaffFormData {
  staffOrgId: string
  name: string
  email: string
  image?: string
  gender?: string
  password?: string
  positionId?: string
  unitId?: string
  supervisorId?: string
}

interface StaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingStaff: Staff | null
  onSubmit: (data: StaffFormData) => Promise<void>
}

interface Position {
  id: string
  name: string
}

interface Unit {
  id: string
  name: string
}

export function StaffFormDialog({
  open,
  onOpenChange,
  editingStaff,
  onSubmit,
}: StaffFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [formData, setFormData] = useState<StaffFormData>({
    staffOrgId: editingStaff?.staffOrgId || "",
    name: editingStaff?.name || "",
    email: editingStaff?.email || "",
    image: editingStaff?.image || "",
    gender: editingStaff?.gender || "",
    password: "",
    positionId: editingStaff?.positionId || "",
    unitId: editingStaff?.unitId || "",
    supervisorId: editingStaff?.supervisorId || "",
  })

  // Fetch positions, units on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsData, unitsData] = await Promise.all([
          positionAPI.getAll(),
          unitAPI.getAll(),
        ])
        setPositions(positionsData)
        setUnits(unitsData)
      } catch (error) {
        console.error("Failed to fetch form data:", error)
      }
    }
    fetchData()
  }, [])

  // Update form when editingStaff or open state changes
  useEffect(() => {
    if (editingStaff) {
      setFormData({
        staffOrgId: editingStaff.staffOrgId,
        name: editingStaff.name,
        email: editingStaff.email || "",
        image: editingStaff.image || "",
        gender: editingStaff.gender || "",
        password: "",
        positionId: editingStaff.positionId || "",
        unitId: editingStaff.unitId || "",
        supervisorId: editingStaff.supervisorId || "",
      })
    } else {
      setFormData({
        staffOrgId: "",
        name: "",
        email: "",
        image: "",
        gender: "",
        password: "",
        positionId: "",
        unitId: "",
        supervisorId: "",
      })
    }
  }, [editingStaff, open])

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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Staff" : "Add New Staff"}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "Update staff member information"
                : "Add a new staff member to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staffOrgId">Staff ID *</Label>
                <Input
                  id="staffOrgId"
                  value={formData.staffOrgId}
                  onChange={(e) =>
                    setFormData({ ...formData, staffOrgId: e.target.value })
                  }
                  placeholder="e.g., STF001"
                  required
                  disabled={!!editingStaff}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password {!editingStaff && "*"}
                  {editingStaff && " (leave blank to keep current)"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter password"
                    required={!editingStaff}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <IconEyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <IconEye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://example.com/avatar.jpg (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default avatar based on gender
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="positionId">Position</Label>
              <Select
                value={formData.positionId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, positionId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position (optional)" />
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
              <Label htmlFor="unitId">Unit</Label>
              <Select
                value={formData.unitId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, unitId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSaving ? "Saving..." : editingStaff ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  )
}

export type { StaffFormData }
