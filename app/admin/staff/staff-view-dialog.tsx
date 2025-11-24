import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Staff } from "./columns"

interface StaffViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: Staff | null
}

export function StaffViewDialog({
  open,
  onOpenChange,
  staff,
}: StaffViewDialogProps) {
  if (!staff) return null

  const getAvatarImage = () => {
    if (staff.image) return staff.image
    if (staff.gender?.toLowerCase() === 'female') return '/female-avatar.svg'
    return '/male-avatar.svg'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Staff Details</DialogTitle>
          <DialogDescription>
            View detailed information about {staff.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center">
            <img
              src={getAvatarImage()}
              alt={staff.name}
              className="size-24 rounded-full object-cover border-2 border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Staff ID</Label>
            <p className="text-sm font-medium">{staff.staffOrgId}</p>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Full Name</Label>
            <p className="text-sm font-medium">{staff.name}</p>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{staff.email || "-"}</p>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Gender</Label>
            <p className="text-sm font-medium capitalize">{staff.gender || "-"}</p>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Position</Label>
            <p className="text-sm font-medium">
              {staff.position?.name || "-"}
            </p>
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Unit</Label>
            <p className="text-sm font-medium">{staff.unit?.name || "-"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
