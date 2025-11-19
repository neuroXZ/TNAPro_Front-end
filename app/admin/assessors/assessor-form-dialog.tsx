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
import { Assessor } from "./columns"
import { staffAPI } from "@/lib/api"

interface AssessorFormData {
  staffId?: string
  assessorId?: string
  type?: string
}

interface AssessorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAssessor: Assessor | null
  onSubmit: (data: AssessorFormData) => Promise<void>
}

export function AssessorFormDialog({
  open,
  onOpenChange,
  editingAssessor,
  onSubmit,
}: AssessorFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [formData, setFormData] = useState<AssessorFormData>({
    staffId: editingAssessor?.staffId,
    assessorId: editingAssessor?.assessorId,
    type: editingAssessor?.type || "",
  })

  // Fetch staff list on mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await staffAPI.getAll()
        setStaffList(data)
      } catch (error) {
        console.error("Failed to fetch staff:", error)
      }
    }
    fetchStaff()
  }, [])

  // Update form when editingAssessor or open state changes
  useEffect(() => {
    if (editingAssessor) {
      setFormData({
        staffId: editingAssessor.staffId,
        assessorId: editingAssessor.assessorId,
        type: editingAssessor.type || "",
      })
    } else {
      setFormData({
        staffId: undefined,
        assessorId: undefined,
        type: "",
      })
    }
  }, [editingAssessor, open])

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
              {editingAssessor ? "Edit Assessor" : "Add New Assessor"}
            </DialogTitle>
            <DialogDescription>
              {editingAssessor
                ? "Update assessor assignment"
                : "Add a new assessor assignment to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staffId">Staff</Label>
              <Select
                value={formData.staffId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, staffId: value })
                }
              >
                <SelectTrigger id="staffId">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assessorId">Assessor</Label>
              <Select
                value={formData.assessorId || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, assessorId: value })
                }
              >
                <SelectTrigger id="assessorId">
                  <SelectValue placeholder="Select assessor" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                placeholder="Enter type (e.g., Self, Peer, Superior)"
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
              {isSaving ? "Saving..." : editingAssessor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { AssessorFormData }
