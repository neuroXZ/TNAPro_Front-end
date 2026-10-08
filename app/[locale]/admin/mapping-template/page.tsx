"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { IconAlertTriangle, IconBulb, IconEye, IconRefresh } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { levelAPI, mappingTemplateAPI, type MappingTemplateState, type TemplateExclusion } from "@/lib/api"
import { TemplateMatrix, type LevelOption } from "@/features/admin/mapping-template/template-matrix"
import { TemplatePreviewDialog } from "@/features/admin/mapping-template/template-preview-dialog"
import { TemplateExclusions } from "@/features/admin/mapping-template/template-exclusions"
import { draftFromRules, draftProblems, rulesFromDraft, sameRules, type Draft } from "@/features/admin/mapping-template/draft"

// Base mapping template (docs/MAPPING_TEMPLATE_PLAN.md §7): one rule per
// cluster, previewed and applied as a whole. Nothing changes for the client
// until an admin presses Apply.
export default function MappingTemplatePage() {
  const t = useTranslations("AdminMappingTemplatePage")
  const [state, setState] = useState<MappingTemplateState | null>(null)
  const [exclusions, setExclusions] = useState<TemplateExclusion[]>([])
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [startedFresh, setStartedFresh] = useState(false)

  const load = async () => {
    try {
      setIsLoading(true)
      const [s, ex, levels] = await Promise.all([mappingTemplateAPI.get(), mappingTemplateAPI.exclusions(), levelAPI.getAll()])
      setState(s)
      setExclusions(ex)
      setDraft(draftFromRules(s.clusters.map((c) => c.id), s.rules))
      // One option per level value; some deployments have two names per value.
      const byValue = new Map<number, string[]>()
      for (const l of levels as { value: number | null; name: string | null }[]) {
        if (l.value === null || l.value === undefined) continue
        byValue.set(l.value, [...(byValue.get(l.value) ?? []), l.name ?? ""])
      }
      setLevelOptions([...byValue.entries()].sort((a, b) => a[0] - b[0]).map(([value, names]) => ({ value, label: `${value} · ${names.filter(Boolean).join(" / ")}` })))
    } catch (error) {
      console.error(error)
      toast.error(t("fetchError"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rules = useMemo(() => (draft ? rulesFromDraft(draft) : []), [draft])
  const problems = useMemo(() => (draft ? draftProblems(draft) : {}), [draft])
  const hasSavedTemplate = (state?.rules.length ?? 0) > 0
  const isDirty = state ? !sameRules(rules, state.rules) : false

  const applySuggestion = async () => {
    if (!state) return
    try {
      setIsSuggesting(true)
      const { suggestions } = await mappingTemplateAPI.suggest()
      const suggested = suggestions.map((s) => s.rule).filter((r): r is NonNullable<typeof r> => !!r)
      setDraft(draftFromRules(state.clusters.map((c) => c.id), suggested))
      setStartedFresh(true)
      toast.success(t("suggestionLoaded"))
    } catch (error) {
      console.error(error)
      toast.error(t("suggestError"))
    } finally {
      setIsSuggesting(false)
    }
  }

  if (isLoading || !state || !draft) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // ALL_POSITIONS rules can't level positions without a category unless a default level is set.
  const allRulesWithoutDefault = rules.filter((r) => r.isActive !== false && r.coverage === "ALL_POSITIONS" && r.defaultLevel == null)
  const showNoCategoryWarning = state.positionsWithoutCategory.length > 0 && allRulesWithoutDefault.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t("title")}</h1>
          <p className="max-w-3xl text-muted-foreground">{t("subtitle")}</p>
        </div>
        {hasSavedTemplate && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{t("statTemplateRows", { count: state.stats.templateRows })}</Badge>
            <Badge variant="outline">{t("statExclusions", { count: state.stats.exclusions })}</Badge>
          </div>
        )}
      </div>

      {!hasSavedTemplate && !startedFresh && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBulb className="size-5" />
              {t("emptyTitle")}
            </CardTitle>
            <CardDescription>{t("emptyDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={applySuggestion} disabled={isSuggesting}>
              {isSuggesting ? t("suggesting") : t("useSuggestion")}
            </Button>
            <Button variant="outline" onClick={() => setStartedFresh(true)}>
              {t("startBlank")}
            </Button>
          </CardContent>
        </Card>
      )}

      {(hasSavedTemplate || startedFresh) && (
        <>
          {showNoCategoryWarning && (
            <Alert>
              <IconAlertTriangle className="size-4" />
              <AlertTitle>{t("noCategoryTitle", { count: state.positionsWithoutCategory.length })}</AlertTitle>
              <AlertDescription>
                <p>{t("noCategoryDescription")}</p>
                <p className="mt-1 text-xs">{state.positionsWithoutCategory.slice(0, 15).map((p) => p.name).join(", ")}{state.positionsWithoutCategory.length > 15 ? " …" : ""}</p>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{t("matrixTitle")}</CardTitle>
                  <CardDescription>{t("matrixDescription")}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasSavedTemplate && (
                    <Button variant="outline" size="sm" className="h-auto min-h-8 whitespace-normal text-left" onClick={applySuggestion} disabled={isSuggesting}>
                      <IconBulb className="mr-2 size-4" />
                      {t("useSuggestion")}
                    </Button>
                  )}
                  {isDirty && (
                    <Button variant="outline" size="sm" onClick={() => setDraft(draftFromRules(state.clusters.map((c) => c.id), state.rules))}>
                      <IconRefresh className="mr-2 size-4" />
                      {t("discardChanges")}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setPreviewOpen(true)} disabled={Object.keys(problems).length > 0 || (!isDirty && hasSavedTemplate)}>
                    <IconEye className="mr-2 size-4" />
                    {t("previewButton")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TemplateMatrix
                clusters={state.clusters}
                categories={state.categories}
                levelOptions={levelOptions}
                draft={draft}
                problems={problems}
                onChange={(clusterId, row) => setDraft({ ...draft, [clusterId]: row })}
              />
              {!isDirty && hasSavedTemplate && <p className="mt-3 text-xs text-muted-foreground">{t("upToDate")}</p>}
            </CardContent>
          </Card>

          <TemplateExclusions exclusions={exclusions} onChanged={load} />
        </>
      )}

      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        rules={rules}
        defaultAdopt={!hasSavedTemplate}
        onApplied={(r) => {
          toast.success(t("applied", { create: r.summary.create, updateLevel: r.summary.updateLevel, adopt: r.summary.adopt, remove: r.summary.remove }))
          setStartedFresh(false)
          load()
        }}
      />
    </div>
  )
}
