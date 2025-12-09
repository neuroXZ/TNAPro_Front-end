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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { IconCheck, IconX } from "@tabler/icons-react"
import { Assessor } from "./columns"
import { staffAPI } from "@/lib/api"

interface AssessorFormData {
  staffIds?: string[]
  assessorId?: string
  type?: string
}

interface AssessorFormDataSingle {
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
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false)
  const [formData, setFormData] = useState<AssessorFormData>({
    staffIds: editingAssessor ? [editingAssessor.staffId] : [],
    assessorId: editingAssessor?.assessorId,
    type: "superior",
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
        staffIds: [editingAssessor.staffId],
        assessorId: editingAssessor.assessorId,
        type: "superior",
      })
    } else {
      setFormData({
        staffIds: [],
        assessorId: undefined,
        type: "superior",
      })
    }
  }, [editingAssessor, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (editingAssessor) {
        // For editing, convert back to single staff format
        const singleFormData: AssessorFormDataSingle = {
          staffId: formData.staffIds?.[0],
          assessorId: formData.assessorId,
          type: formData.type,
        }
        await onSubmit(singleFormData as any)
      } else {
        // For creating new, handle multiple staff assignments
        if (formData.staffIds && formData.staffIds.length > 0) {
          for (const staffId of formData.staffIds) {
            const singleFormData: AssessorFormDataSingle = {
              staffId,
              assessorId: formData.assessorId,
              type: formData.type,
            }
            await onSubmit(singleFormData as any)
          }
        }
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStaffToggle = (staffId: string) => {
    const currentStaffIds = formData.staffIds || []
    const isSelected = currentStaffIds.includes(staffId)
    
    if (isSelected) {
      setFormData({
        ...formData,
        staffIds: currentStaffIds.filter(id => id !== staffId)
      })
    } else {
      setFormData({
        ...formData,
        staffIds: [...currentStaffIds, staffId]
      })
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
              <Label>Staff {editingAssessor ? "" : "(Multi-select)"}</Label>
              {editingAssessor ? (
                <Select
                  value={formData.staffIds?.[0] || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, staffIds: value ? [value] : [] })
                  }
                >
                  <SelectTrigger>
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
              ) : (
                <Popover open={staffPopoverOpen} onOpenChange={setStaffPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={staffPopoverOpen}
                      className="justify-between h-auto min-h-10"
                    >
                      <div className="flex flex-wrap gap-1">
                        {formData.staffIds && formData.staffIds.length > 0 ? (
                          formData.staffIds.map((staffId) => {
                            const staff = staffList.find(s => s.id === staffId)
                            return staff ? (
                              <Badge key={staffId} className="text-xs">
                                {staff.name}
                                <button
                                  type="button"
                                  className="ml-1 hover:bg-gray-300 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStaffToggle(staffId)
                                  }}
                                >
                                  <IconX className="size-3" />
                                </button>
                              </Badge>
                            ) : null
                          })
                        ) : (
                          <span className="text-muted-foreground">Select staff members...</span>
                        )}
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search staff..." />
                      <CommandList>
                        <CommandEmpty>No staff found.</CommandEmpty>
                        <CommandGroup>
                          {staffList.map((staff) => {
                            const isSelected = formData.staffIds?.includes(staff.id) || false
                            return (
                              <CommandItem
                                key={staff.id}
                                onSelect={() => handleStaffToggle(staff.id)}
                              >
                                <IconCheck
                                  className={`mr-2 size-4 ${
                                    isSelected ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {staff.name}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value="superior"
                disabled
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="superior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superior">superior</SelectItem>
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
              {isSaving ? "Saving..." : editingAssessor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { AssessorFormData }
