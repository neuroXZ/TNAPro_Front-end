import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Mail } from "./columns"

interface MailViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mail: Mail | null
}

export function MailViewDialog({
  open,
  onOpenChange,
  mail,
}: MailViewDialogProps) {
  if (!mail) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Mail Template Details</DialogTitle>
          <DialogDescription>
            View detailed information about {mail.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Template Name</Label>
            <p className="text-sm font-medium">{mail.name}</p>
          </div>
          {mail.subject && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Subject</Label>
              <p className="text-sm font-medium">{mail.subject}</p>
            </div>
          )}
          {mail.body && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Body</Label>
              <div className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-muted/50">
                {mail.body}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
