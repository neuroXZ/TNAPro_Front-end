"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { IconAlertTriangle } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { mappingTemplateAPI, type TemplatePlanResult, type TemplateRuleInput } from "@/lib/api"

const LIST_LIMIT = 50

interface TemplatePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rules: TemplateRuleInput[]
  // First apply on a client with existing mappings: adopt by default.
  defaultAdopt: boolean
  onApplied: (result: TemplatePlanResult) => void
}

type SectionKey = "create" | "updateLevel" | "adopt" | "remove" | "manualOverrides" | "excluded" | "noLevel"

export function TemplatePreviewDialog({ open, onOpenChange, rules, defaultAdopt, onApplied }: TemplatePreviewDialogProps) {
  const t = useTranslations("AdminMappingTemplatePage")
  const tc = useTranslations("Common")
  const [adopt, setAdopt] = useState(defaultAdopt)
  const [result, setResult] = useState<TemplatePlanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [expanded, setExpanded] = useState<SectionKey | null>(null)

  useEffect(() => {
    if (open) setAdopt(defaultAdopt)
  }, [open, defaultAdopt])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setIsLoading(true)
    mappingTemplateAPI
      .preview(rules, adopt)
      .then((r) => !cancelled && setResult(r))
      .catch((error) => {
        console.error(error)
        toast.error(error?.response?.data?.error ?? t("previewError"))
        if (!cancelled) onOpenChange(false)
      })
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [open, adopt, rules])

  const handleApply = async () => {
    try {
      setIsApplying(true)
      const applied = await mappingTemplateAPI.apply(rules, adopt)
      onApplied(applied)
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.error ?? t("applyError"))
    } finally {
      setIsApplying(false)
    }
  }

  const s = result?.summary
  const writes = s ? s.create + s.updateLevel + s.adopt + s.remove : 0
  const name = (map: Record<string, { name: string | null }> | undefined, id: string) => map?.[id]?.name ?? "—"

  const rowsFor = (key: SectionKey): string[] => {
    if (!result) return []
    const p = result.plan
    const pos = (id: string) => name(result.positions, id)
    const comp = (id: string) => name(result.competencies, id)
    switch (key) {
      case "create": return p.create.map((r) => `${pos(r.positionId)} · ${comp(r.competencyId)} → ${r.level}`)
      case "updateLevel": return p.updateLevel.map((r) => `${pos(r.positionId)} · ${comp(r.competencyId)}: ${r.from ?? "–"} → ${r.to}`)
      case "adopt": return p.adopt.map((r) => `${pos(r.positionId)} · ${comp(r.competencyId)} (${r.level})`)
      case "remove": return p.remove.map((r) => `${pos(r.positionId)} · ${comp(r.competencyId)} (${r.level ?? "–"})`)
      case "manualOverrides": return p.manualOverrides.map((r) => `${pos(r.positionId)} · ${comp(r.competencyId)}: ${r.level ?? "–"} (${t("templateLevelShort", { level: r.templateLevel })})`)
      case "excluded": return p.excluded.map((r) => `${pos(r.positionId)} · ${comp(r.competencyId)}`)
      case "noLevel": return [...new Set(p.noLevel.map((r) => pos(r.positionId)))]
    }
  }

  const sections: { key: SectionKey; tone: "add" | "change" | "remove" | "keep" | "warn" }[] = [
    { key: "create", tone: "add" },
    { key: "updateLevel", tone: "change" },
    { key: "adopt", tone: "change" },
    { key: "remove", tone: "remove" },
    { key: "manualOverrides", tone: "keep" },
    { key: "excluded", tone: "keep" },
    { key: "noLevel", tone: "warn" },
  ]
  const toneClass = { add: "text-green-700 dark:text-green-400", change: "text-blue-700 dark:text-blue-400", remove: "text-destructive", keep: "text-muted-foreground", warn: "text-amber-700 dark:text-amber-400" }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("previewTitle")}</DialogTitle>
          <DialogDescription>{t("previewDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md border p-3">
          <Checkbox id="adopt" checked={adopt} onCheckedChange={(v) => setAdopt(v === true)} />
          <div className="grid gap-1">
            <Label htmlFor="adopt">{t("adoptLabel")}</Label>
            <p className="text-xs text-muted-foreground">{t("adoptHint")}</p>
          </div>
        </div>

        {isLoading || !s ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {s.remove > 0 && (
              <Alert variant="destructive">
                <IconAlertTriangle className="size-4" />
                <AlertDescription>{t("removeWarning", { count: s.remove })}</AlertDescription>
              </Alert>
            )}
            {writes === 0 && <p className="rounded-md bg-muted p-3 text-sm">{t("noChanges")}</p>}
            {sections.map(({ key, tone }) => {
              const n = s[key]
              if (!n) return null
              const rows = expanded === key ? rowsFor(key) : []
              return (
                <div key={key} className="rounded-md border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-muted/50"
                    onClick={() => setExpanded(expanded === key ? null : key)}
                    aria-expanded={expanded === key}
                  >
                    <span>
                      <span className={`font-semibold ${toneClass[tone]}`}>{n}</span> {t(`section_${key}`)}
                      <span className="block text-xs text-muted-foreground">{t(`sectionHint_${key}`)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{expanded === key ? t("hideDetails") : t("showDetails")}</span>
                  </button>
                  {expanded === key && (
                    <ul className="max-h-60 space-y-1 overflow-y-auto border-t p-3 text-xs">
                      {rows.slice(0, LIST_LIMIT).map((r, i) => <li key={i}>{r}</li>)}
                      {rows.length > LIST_LIMIT && <li className="text-muted-foreground">{t("andMore", { count: rows.length - LIST_LIMIT })}</li>}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleApply} disabled={isLoading || isApplying || !s}>
            {isApplying ? t("applying") : t("applyButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
