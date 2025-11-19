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
import { Mail } from "./columns"

interface MailFormData {
  name: string
  subject?: string
  body?: string
}

interface MailFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingMail: Mail | null
  onSubmit: (data: MailFormData) => Promise<void>
}

export function MailFormDialog({
  open,
  onOpenChange,
  editingMail,
  onSubmit,
}: MailFormDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<MailFormData>({
    name: editingMail?.name || "",
    subject: editingMail?.subject || "",
    body: editingMail?.body || "",
  })

  // Update form when editingMail or open state changes
  useEffect(() => {
    if (editingMail) {
      setFormData({
        name: editingMail.name,
        subject: editingMail.subject || "",
        body: editingMail.body || "",
      })
    } else {
      setFormData({
        name: "",
        subject: "",
        body: "",
      })
    }
  }, [editingMail, open])

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
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingMail ? "Edit Mail Template" : "Add New Mail Template"}
            </DialogTitle>
            <DialogDescription>
              {editingMail
                ? "Update mail template information"
                : "Add a new mail template to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter template name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Enter email subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Body</Label>
              <textarea
                id="body"
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                placeholder="Enter email body content"
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
              {isSaving ? "Saving..." : editingMail ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { MailFormData }
