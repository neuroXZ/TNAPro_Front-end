"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconMail, IconAlertCircle, IconCheck, IconClock } from "@tabler/icons-react"
import { toast } from "sonner"
import { staffAPI } from "@/lib/api"
import { useTranslations } from "next-intl"

interface StaffNotifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffIds: string[]
}

interface NotifyResult {
  sent: number
  failed: Array<{ staffId: string; name: string | null; reason: string }>
  quotaExceeded?: boolean
  // Emails are queued and drained in the background at the rate the mail
  // provider allows, so on a large blast most recipients come back as
  // pending rather than sent. Optional so this keeps working against a
  // backend that predates the mail queue.
  pending?: number
}

export function StaffNotifyDialog({
  open,
  onOpenChange,
  staffIds,
}: StaffNotifyDialogProps) {
  const t = useTranslations('AdminStaffPage')
  const tc = useTranslations('Common')
  const [title, setTitle] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<NotifyResult | null>(null)

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error(t('notifyTitleRequired'))
      return
    }

    try {
      setIsSending(true)
      const response = await staffAPI.sendNotification(staffIds, title.trim(), window.location.origin)
      setResult(response.data)

      const pending = response.data.pending ?? 0

      if (response.data.failed.length === 0 && pending > 0) {
        // Nothing failed, but the send isn't finished either — keep the
        // dialog open so the admin reads why, instead of closing on a
        // "success" that hid several hundred unsent emails.
        toast.success(t('notifyQueued', { count: pending }))
      } else if (response.data.failed.length === 0) {
        toast.success(t('notifySuccess', { count: response.data.sent }))
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        toast.warning(
          t('notifyPartial', { sent: response.data.sent, failed: response.data.failed.length })
        )
      }
    } catch (error: unknown) {
      console.error('Send notification error:', error)
      const message = error instanceof Error ? error.message : ''
      toast.error(message || t('notifyError'))
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setResult(null)
    setIsSending(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('notifyDialogTitle', { count: staffIds.length })}</DialogTitle>
          <DialogDescription>
            {t('notifyDialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notify-title">{t('notifyTitleLabel')}</Label>
            <Input
              id="notify-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('notifyTitlePlaceholder')}
              disabled={isSending}
            />
          </div>

          {result && (
            <div className="space-y-3">
              <div className={(result.pending ?? 0) > 0 ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3"}>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                    <IconCheck className="size-5" />
                    {result.sent}
                  </div>
                  <div className="text-xs text-green-600">{tc('successful')}</div>
                </div>
                {(result.pending ?? 0) > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600">
                      <IconClock className="size-5" />
                      {result.pending}
                    </div>
                    <div className="text-xs text-blue-600">{tc('queued')}</div>
                  </div>
                )}
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                    <IconAlertCircle className="size-5" />
                    {result.failed.length}
                  </div>
                  <div className="text-xs text-red-600">{tc('failedCount')}</div>
                </div>
              </div>

              {(result.pending ?? 0) > 0 && (
                <Alert>
                  <IconClock className="size-4" />
                  <AlertDescription>
                    {t('notifyQueuedNote', { count: result.pending ?? 0 })}
                  </AlertDescription>
                </Alert>
              )}

              {result.quotaExceeded && (
                <Alert variant="destructive">
                  <IconAlertCircle className="size-4" />
                  <AlertDescription>{t('notifyQuotaExceeded')}</AlertDescription>
                </Alert>
              )}

              {result.failed.length > 0 && (
                <Alert variant="destructive">
                  <IconAlertCircle className="size-4" />
                  <AlertDescription>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {result.failed.map((failure, index) => (
                        <div key={index} className="text-sm">
                          {failure.name || failure.staffId}: {failure.reason}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSend}
              disabled={!title.trim() || isSending}
            >
              <IconMail className="mr-2 size-4" />
              {isSending ? t('notifySending') : t('notifySendButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
