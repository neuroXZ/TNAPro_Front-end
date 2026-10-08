import { useState, useEffect, useMemo } from "react"
import axios from "axios"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Competency } from "./columns"
import { clusterAPI, competencyAPI, levelAPI } from "@/lib/api"
import { useTranslations } from "next-intl"
import {
  LevelIndicatorEditor,
  draftFromIndicators,
  indicatorsFromDraft,
  type IndicatorDraft,
} from "@/features/competency-dictionary/level-indicator-editor"
import { buildLevelRows, type DictionaryCompetency, type GlobalLevel } from "@/features/competency-dictionary/types"

interface CompetencyFormData {
  name: string
  // Empty -> null so clearing the field actually clears it server-side
  // (an undefined key would be dropped from the JSON body).
  code?: string | null
  description?: string
  clusterId?: string
  // Full dictionary, saved atomically with the details. Omitted when the
  // existing indicators couldn't be loaded, so they're left untouched.
  indicators?: { level: number; text: string }[]
}

interface CompetencyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCompetency: Competency | null
  onSubmit: (data: CompetencyFormData) => Promise<void>
}

interface Cluster {
  id: string
  name: string
}

type IndicatorLoadState = "loading" | "ready" | "error"

/**
 * One modal for creating/editing a competency: details (name, code, cluster,
 * definition) plus every level's indicators.
 */
export function CompetencyFormDialog({
  open,
  onOpenChange,
  editingCompetency,
  onSubmit,
}: CompetencyFormDialogProps) {
  const t = useTranslations('AdminCompetenciesPage')
  const td = useTranslations('CompetencyDictionary')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [levels, setLevels] = useState<GlobalLevel[]>([])
  const [draft, setDraft] = useState<IndicatorDraft>({})
  const [indicatorState, setIndicatorState] = useState<IndicatorLoadState>("loading")
  const [formData, setFormData] = useState<CompetencyFormData>({
    name: "",
    code: "",
    description: "",
    clusterId: "",
  })

  // Reset the details from the competency being edited (or blank) on open.
  useEffect(() => {
    if (!open) return
    setFormData({
      name: editingCompetency?.name || "",
      code: editingCompetency?.code || "",
      description: editingCompetency?.description || "",
      clusterId: editingCompetency?.clusterId || "",
    })
  }, [editingCompetency, open])

  // Clusters + level labels, and the existing indicators when editing.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    clusterAPI.getAll().then((data) => !cancelled && setClusters(data)).catch((error) => {
      console.error("Failed to fetch clusters:", error)
    })
    levelAPI.getAll().then((data) => !cancelled && setLevels(data ?? [])).catch((error) => {
      console.error("Failed to fetch levels:", error)
    })

    setDraft({})
    if (!editingCompetency) {
      setIndicatorState("ready")
    } else {
      setIndicatorState("loading")
      competencyAPI
        .getDictionary<DictionaryCompetency>(editingCompetency.id)
        .then((dictionary) => {
          if (cancelled) return
          setDraft(draftFromIndicators(dictionary.levelIndicators ?? []))
          setIndicatorState("ready")
        })
        .catch((error) => {
          console.error("Failed to fetch indicators:", error)
          if (!cancelled) setIndicatorState("error")
        })
    }
    return () => {
      cancelled = true
    }
  }, [editingCompetency, open])

  const levelRows = useMemo(() => buildLevelRows(levels, indicatorsFromDraft(draft)), [levels, draft])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSubmit({
        ...formData,
        code: formData.code?.trim() || null,
        ...(indicatorState === "ready" ? { indicators: indicatorsFromDraft(draft) } : {}),
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined
      toast.error(message || td("saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>
              {editingCompetency ? tc('editEntity', { entity: t('entityNameSingularCap') }) : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingCompetency
                ? t('formUpdateDescription')
                : t('formAddDescription')}
            </DialogDescription>
          </DialogHeader>

          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {td("detailsSection")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="name">{t('nameFieldLabel')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t('namePlaceholder')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">{t('codeLabel')}</Label>
                <Input
                  id="code"
                  value={formData.code ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder={t('codePlaceholder')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clusterId">{t('clusterLabel')}</Label>
                <Select
                  value={formData.clusterId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clusterId: value })
                  }
                >
                  <SelectTrigger id="clusterId" className="w-full">
                    <SelectValue placeholder={t('clusterPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="description">{td('definition')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={tc('enterDescriptionOptional')}
                  className="min-h-20"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {td("proficiencyLevels")}
              </h3>
              <p className="text-xs text-muted-foreground">{td("editHint")}</p>
            </div>
            {indicatorState === "loading" ? (
              <Skeleton className="h-64 w-full" />
            ) : indicatorState === "error" ? (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                {td("indicatorsLoadError")}
              </p>
            ) : (
              <LevelIndicatorEditor rows={levelRows} draft={draft} onChange={setDraft} disabled={isSaving} />
            )}
          </section>

          <DialogFooter className="sticky -bottom-6 -mx-6 -mb-6 border-t bg-background px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || indicatorState === "loading"}>
              {isSaving ? tc('saving') : editingCompetency ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { CompetencyFormData }
