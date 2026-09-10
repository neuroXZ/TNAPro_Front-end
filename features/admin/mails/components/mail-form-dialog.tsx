import { useState, useEffect, useRef } from "react"
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
import { Switch } from "@/components/ui/switch"
import { WysiwygEditor, type WysiwygEditorHandle } from "@/components/ui/wysiwyg-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconInfoCircle } from "@tabler/icons-react"
import { mailAPI } from "@/lib/api"
import { Mail } from "./columns"

interface MailFormData {
  name: string
  subject: string
  body: string
  mailType: 'ASSESSMENT_REMINDER' | 'PASSWORD_RESET' | 'WELCOME_STAFF' | 'GENERAL_ANNOUNCEMENT'
  sendTrigger: 'MANUAL' | 'RELATIVE_TO_ASSESSMENT_END' | 'RELATIVE_TO_ASSESSMENT_START'
  daysOffset?: number
  templateVariables?: Record<string, any>
  isActive?: boolean
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
  const [variables, setVariables] = useState<Array<{ key: string; description: string }>>([])
  const [templateNote, setTemplateNote] = useState("")
  const [activeField, setActiveField] = useState<'subject' | 'body'>('body')
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const bodyEditorRef = useRef<WysiwygEditorHandle>(null)
  const [formData, setFormData] = useState<MailFormData>({
    name: editingMail?.name || "",
    subject: editingMail?.subject || "",
    body: editingMail?.body || "",
    mailType: editingMail?.mailType || 'ASSESSMENT_REMINDER',
    sendTrigger: editingMail?.sendTrigger || 'RELATIVE_TO_ASSESSMENT_END',
    daysOffset: editingMail?.daysOffset || undefined,
    templateVariables: editingMail?.templateVariables || undefined,
    isActive: editingMail?.isActive ?? true,
  })

  // Update form when editingMail or open state changes
  useEffect(() => {
    if (editingMail) {
      setFormData({
        name: editingMail.name,
        subject: editingMail.subject || "",
        body: editingMail.body || "",
        mailType: editingMail.mailType || 'ASSESSMENT_REMINDER',
        sendTrigger: editingMail.sendTrigger || 'RELATIVE_TO_ASSESSMENT_END',
        daysOffset: editingMail.daysOffset || undefined,
        templateVariables: editingMail.templateVariables || undefined,
        isActive: editingMail.isActive,
      })
    } else {
      setFormData({
        name: "",
        subject: "",
        body: "",
        mailType: 'ASSESSMENT_REMINDER',
        sendTrigger: 'RELATIVE_TO_ASSESSMENT_END',
        daysOffset: undefined,
        templateVariables: undefined,
        isActive: true,
      })
    }
  }, [editingMail, open])

  // Refresh the available placeholder list whenever the selected mail type
  // changes — each MailType has its own variable set (see Mail.service.ts).
  useEffect(() => {
    if (!open || !formData.mailType) {
      return
    }
    let cancelled = false
    mailAPI.getTemplateVariables(formData.mailType)
      .then((response) => {
        if (!cancelled) {
          setVariables(response.variables)
          setTemplateNote(response.note || "")
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVariables([])
          setTemplateNote("")
        }
      })
    return () => {
      cancelled = true
    }
  }, [formData.mailType, open])

  const handleInsertVariable = (key: string) => {
    if (activeField === 'subject' && subjectInputRef.current) {
      const input = subjectInputRef.current
      const start = input.selectionStart ?? formData.subject.length
      const end = input.selectionEnd ?? formData.subject.length
      const newSubject = formData.subject.slice(0, start) + key + formData.subject.slice(end)
      setFormData((prev) => ({ ...prev, subject: newSubject }))
      requestAnimationFrame(() => {
        input.focus()
        const cursor = start + key.length
        input.setSelectionRange(cursor, cursor)
      })
    } else {
      bodyEditorRef.current?.insertText(key)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Helper function to strip HTML and check if content is empty
    const stripHtml = (html: string) => {
      const temp = document.createElement('div')
      temp.innerHTML = html
      return temp.textContent || temp.innerText || ''
    }
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Template name is required')
      return
    }
    
    if (!formData.subject.trim()) {
      alert('Subject is required')
      return
    }
    
    // Check if body has actual content (not just HTML tags)
    const bodyText = stripHtml(formData.body).trim()
    if (!bodyText) {
      alert('Body content is required')
      return
    }

    // Sending only ever substitutes the placeholders this mail type
    // declares (see TEMPLATE_VARIABLES in Mail.service.ts) - anything else
    // typed in (e.g. copy-pasted {{assessment.name}} into a General
    // Announcement template) is left as literal, unreplaced text in the
    // sent email. Catch that here instead of finding out from a client.
    const extractPlaceholders = (text: string): string[] => {
      const matches = text.match(/\{\{\s*[\w.]+\s*\}\}/g) || []
      return matches.map((m) => `{{${m.replace(/[{}\s]/g, '')}}}`)
    }
    const supportedKeys = new Set(variables.map((v) => v.key))
    const usedPlaceholders = new Set([
      ...extractPlaceholders(formData.subject),
      ...extractPlaceholders(bodyText),
    ])
    const unsupported = Array.from(usedPlaceholders).filter((p) => !supportedKeys.has(p))
    if (unsupported.length > 0) {
      alert(
        `This template uses placeholder(s) not supported by mail type "${formData.mailType}": ${unsupported.join(', ')}.\n\n` +
        `They will NOT be replaced when sent - recipients will see the literal "{{...}}" text.\n\n` +
        `Supported placeholders for this mail type: ${variables.map((v) => v.key).join(', ') || '(none)'}.`
      )
      return
    }

    setIsSaving(true)

    try {
      // Ensure we send proper data structure with fallbacks
      const submitData = {
        ...formData,
        subject: formData.subject || 'Untitled',
        body: formData.body || '<p></p>',
        mailType: formData.mailType || 'SYSTEM_NOTIFICATION',
        sendTrigger: formData.sendTrigger || 'MANUAL',
        isActive: formData.isActive ?? true
      }

      console.log('Submitting mail data:', submitData)
      await onSubmit(submitData)
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
      alert('Failed to save mail template. Please check console for details.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto">
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
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                ref={subjectInputRef}
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                onFocus={() => setActiveField('subject')}
                placeholder="Enter email subject"
                required
              />
            </div>

            {templateNote && (
              <Alert>
                <IconInfoCircle className="size-4" />
                <AlertDescription>{templateNote}</AlertDescription>
              </Alert>
            )}

            {variables.length > 0 && (
              <div className="grid gap-2">
                <Label>Available Placeholders</Label>
                <div className="rounded-md border divide-y">
                  {variables.map((variable) => (
                    <div
                      key={variable.key}
                      className="flex items-start gap-3 p-2.5"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 font-mono text-xs"
                        onClick={() => handleInsertVariable(variable.key)}
                      >
                        {variable.key}
                      </Button>
                      <p className="text-xs text-muted-foreground pt-1">
                        {variable.description}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click a placeholder to insert it into the {activeField === 'subject' ? 'Subject' : 'Body'} field at the cursor.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="body">Body *</Label>
              <WysiwygEditor
                ref={bodyEditorRef}
                value={formData.body || ""}
                onChange={(value) =>
                  setFormData({ ...formData, body: value || "" })
                }
                onFocus={() => setActiveField('body')}
                placeholder="Enter email body content..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">


              <div className="grid gap-2">
                <Label htmlFor="sendTrigger">Send Trigger</Label>
                <Select
                  value={formData.sendTrigger}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sendTrigger: value as any })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select send trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="RELATIVE_TO_ASSESSMENT_END">Relative to Assessment End</SelectItem>
                    <SelectItem value="RELATIVE_TO_ASSESSMENT_START">Relative to Assessment Start</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mailType">Mail Type</Label>
                <Select
                  value={formData.mailType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mailType: value as any })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mail type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSESSMENT_REMINDER">Assessment Reminder</SelectItem>
                    <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
                    <SelectItem value="WELCOME_STAFF">Welcome Staff</SelectItem>
                    <SelectItem value="GENERAL_ANNOUNCEMENT">General Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 w-full">
                <Label htmlFor="daysOffset">Days Offset</Label>
                <Input
                  id="daysOffset"
                  type="number"
                  min={0}
                  value={formData.daysOffset || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, daysOffset: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Enter days offset (optional)"
                />
              </div>
              <div className="flex items-center space-x-2 pt-5">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
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
