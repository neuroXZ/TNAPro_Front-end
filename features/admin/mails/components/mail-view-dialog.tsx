import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Mail Type</Label>
              {mail.mailType ? (
                <Badge variant="outline" className="w-fit">
                  {mail.mailType.replace(/_/g, ' ')}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Send Trigger</Label>
              {mail.sendTrigger ? (
                <Badge className="w-fit bg-amber-300 text-black">
                  {mail.sendTrigger.replace(/_/g, ' ')}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Days Offset</Label>
              <p className="text-sm font-medium">
                {mail.daysOffset !== null && mail.daysOffset !== undefined ? mail.daysOffset : '-'}
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Status</Label>
              <Badge variant={mail.isActive ? "default" : "secondary"} className="w-fit">
                {mail.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
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
              <div 
                className="text-sm rounded-md border p-3 bg-muted/50 max-h-40 overflow-y-auto prose-mail-body"
                dangerouslySetInnerHTML={{ __html: mail.body }}
              />
            </div>
          )}

          {mail.templateVariables && Object.keys(mail.templateVariables).length > 0 && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Template Variables</Label>
              <div className="text-xs rounded-md border p-3 bg-muted/50 max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(mail.templateVariables, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t pt-4">
            <div className="grid gap-1">
              <Label className="text-muted-foreground text-xs">Created At</Label>
              <p>{new Date(mail.createdAt).toLocaleDateString('en-MY', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div className="grid gap-1">
              <Label className="text-muted-foreground text-xs">Updated At</Label>
              <p>{new Date(mail.updatedAt).toLocaleDateString('en-MY', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric', 
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
