"use client"

import { useState } from "react"
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
import { Combobox } from "@/components/ui/combobox"
import { useSaveSuperiors, assessorErrorMessage } from "../use-save-superiors"
import type { AssessorOption } from "../types"

export interface BulkTarget {
  id: string
  name: string
  /** Superior assessor ids the staff member already has. */
  currentIds: string[]
}

interface BulkAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targets: BulkTarget[]
  options: AssessorOption[]
  onDone: () => void
}

/**
 * Adds one assessor to several staff at once. Additive only: existing
 * Penilai stay, nobody is removed (so no results can be affected).
 */
export function BulkAssignDialog({ open, onOpenChange, targets, options, onDone }: BulkAssignDialogProps) {
  const t = useTranslations("AdminAssessorsPage")
  const tp = useTranslations("AssessorPicker")
  const tc = useTranslations("Common")
  const saveSuperiors = useSaveSuperiors()
  const [assessorId, setAssessorId] = useState("")
  const [saving, setSaving] = useState(false)

  // Start empty next time it opens.
  const handleOpenChange = (next: boolean) => {
    if (!next) setAssessorId("")
    onOpenChange(next)
  }

  const handleSave = async () => {
    if (!assessorId) return
    setSaving(true)
    let added = 0
    let skipped = 0
    const failed: string[] = []
    for (const target of targets) {
      if (target.id === assessorId || target.currentIds.includes(assessorId)) {
        skipped++
        continue
      }
      try {
        await saveSuperiors(target.id, [...target.currentIds, assessorId], { quiet: true })
        added++
      } catch (err) {
        console.error(assessorErrorMessage(err, tp))
        failed.push(target.name)
      }
    }
    setSaving(false)
    if (added > 0) toast.success(t("bulkDone", { added, skipped }))
    else if (failed.length === 0) toast.info(t("bulkNothing"))
    if (failed.length > 0) toast.error(t("bulkFailed", { names: failed.join(", ") }))
    onDone()
    handleOpenChange(false)
  }

  const assessorName = options.find((o) => o.id === assessorId)?.name
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("bulkTitle")}</DialogTitle>
          <DialogDescription>{t("bulkDescription", { count: targets.length })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label>{tp("fieldLabel")}</Label>
          <Combobox
            options={[...options]
              .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
              .map((o) => ({ value: o.id, label: o.staffOrgId ? `${o.name} (${o.staffOrgId})` : o.name }))}
            value={assessorId}
            onChange={setAssessorId}
            placeholder={tp("placeholderOne")}
            searchPlaceholder={tp("search")}
            emptyText={tp("noResults")}
          />
          {assessorName && (
            <p className="text-xs text-muted-foreground">{t("bulkPreview", { name: assessorName, count: targets.length })}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            {tc("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !assessorId}>
            {saving ? tc("saving") : t("bulkConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
