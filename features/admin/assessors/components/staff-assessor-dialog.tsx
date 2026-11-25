"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { assessorAPI } from "@/lib/api"
import { AssessorMultiPicker } from "./assessor-multi-picker"
import { useSaveSuperiors, assessorErrorMessage } from "../use-save-superiors"
import { lockedAssessorIds, superiorIds, type AssessorOption, type StaffAssessors } from "../types"

export interface DialogStaff {
  id: string
  name: string
  staffOrgId?: string | null
  detail?: string | null
  supervisor?: { id: string; name: string } | null
}

interface StaffAssessorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: DialogStaff | null
  options: AssessorOption[]
  onSaved: () => void
}

/** Edit one staff member's Penilai (superior assessors). */
export function StaffAssessorDialog({ open, onOpenChange, staff, options, onSaved }: StaffAssessorDialogProps) {
  const t = useTranslations("AdminAssessorsPage")
  const tp = useTranslations("AssessorPicker")
  const tc = useTranslations("Common")
  const saveSuperiors = useSaveSuperiors()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [value, setValue] = useState<string[]>([])
  const [locked, setLocked] = useState<string[]>([])
  const [hasSelf, setHasSelf] = useState(true)

  useEffect(() => {
    if (!open || !staff) return
    let cancelled = false
    setLoading(true)
    assessorAPI.getForStaff(staff.id)
      .then((data: StaffAssessors) => {
        if (cancelled) return
        setValue(superiorIds(data.superiors))
        setLocked(lockedAssessorIds(data.superiors))
        setHasSelf(data.hasSelf)
      })
      .catch((err) => toast.error(assessorErrorMessage(err, tp)))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, staff, tp])

  const handleSave = async () => {
    if (!staff) return
    setSaving(true)
    try {
      await saveSuperiors(staff.id, value)
      toast.success(t("saveSuccess", { name: staff.name }))
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(assessorErrorMessage(err, tp))
    } finally {
      setSaving(false)
    }
  }

  const supervisor = staff?.supervisor
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{staff?.name}</span>
            {staff?.staffOrgId ? ` (${staff.staffOrgId})` : ""}
            {staff?.detail ? <span className="block text-xs">{staff.detail}</span> : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Label htmlFor="dialog-superiors">{tp("fieldLabel")}</Label>
          {loading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <AssessorMultiPicker
              id="dialog-superiors"
              options={options}
              value={value}
              onChange={setValue}
              lockedIds={locked}
              excludeId={staff?.id}
            />
          )}
          {!loading && supervisor && !value.includes(supervisor.id) && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto justify-start p-0 text-xs"
              onClick={() => setValue([...value, supervisor.id])}
            >
              {tp("addReportsTo", { name: supervisor.name })}
            </Button>
          )}
          {!loading && !hasSelf && (
            <p className="text-xs text-amber-700 dark:text-amber-400">{t("noSelfNote")}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {tc("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? tc("saving") : tp("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
