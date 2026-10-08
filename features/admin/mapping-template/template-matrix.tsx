"use client"

import { useTranslations } from "next-intl"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MappingTemplateState } from "@/lib/api"
import type { Draft, DraftCoverage, DraftRow } from "./draft"

export interface LevelOption {
  value: number
  label: string
}

const NO_LEVEL = "__none__"

interface TemplateMatrixProps {
  clusters: MappingTemplateState["clusters"]
  categories: MappingTemplateState["categories"]
  levelOptions: LevelOption[]
  draft: Draft
  problems: Record<string, string>
  onChange: (clusterId: string, row: DraftRow) => void
}

export function TemplateMatrix({ clusters, categories, levelOptions, draft, problems, onChange }: TemplateMatrixProps) {
  const t = useTranslations("AdminMappingTemplatePage")

  const levelSelect = (value: number | null, onValue: (v: number | null) => void, disabled: boolean, ariaLabel: string) => (
    <Select
      value={value === null || value === undefined ? NO_LEVEL : String(value)}
      onValueChange={(v) => onValue(v === NO_LEVEL ? null : Number(v))}
      disabled={disabled}
    >
      <SelectTrigger className="w-[132px]" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_LEVEL}>{t("noLevel")}</SelectItem>
        {levelOptions.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">{t("colCluster")}</TableHead>
            <TableHead className="min-w-[220px]">{t("colCoverage")}</TableHead>
            {categories.map((c) => (
              <TableHead key={c.id} className="min-w-[140px]">
                {c.name}
                <span className="block text-xs font-normal text-muted-foreground">
                  {t("positionCount", { count: c._count.Position })}
                </span>
              </TableHead>
            ))}
            <TableHead className="min-w-[140px]">
              {t("colDefaultLevel")}
              <span className="block text-xs font-normal text-muted-foreground">{t("colDefaultLevelHint")}</span>
            </TableHead>
            <TableHead>{t("colActive")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clusters.map((cluster) => {
            const row = draft[cluster.id]
            if (!row) return null
            const none = row.coverage === "NONE"
            const set = (patch: Partial<DraftRow>) => onChange(cluster.id, { ...row, ...patch })
            return (
              <TableRow key={cluster.id} className={none ? "text-muted-foreground" : undefined}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {cluster.color && <span className="size-3 shrink-0 rounded" style={{ backgroundColor: cluster.color }} />}
                    <span className="font-medium">{cluster.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("competencyCount", { count: cluster._count.Competency })}</span>
                </TableCell>
                <TableCell>
                  <Select value={row.coverage} onValueChange={(v) => set({ coverage: v as DraftCoverage })}>
                    <SelectTrigger className="w-[210px]" aria-label={t("colCoverage")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">{t("coverageNone")}</SelectItem>
                      <SelectItem value="ALL_POSITIONS">{t("coverageAll")}</SelectItem>
                      <SelectItem value="CATEGORIES">{t("coverageCategories")}</SelectItem>
                      <SelectItem value="MANUAL">{t("coverageManual")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 max-w-[210px] whitespace-normal text-xs text-muted-foreground">
                    {t(`coverageHint_${row.coverage}`)}
                  </p>
                  {problems[cluster.id] && <p className="mt-1 max-w-[210px] whitespace-normal text-xs text-destructive">{t(`problem_${problems[cluster.id]}`)}</p>}
                </TableCell>
                {categories.map((c) => (
                  <TableCell key={c.id}>
                    {levelSelect(
                      row.levels[c.id] ?? null,
                      (v) => set({ levels: { ...row.levels, [c.id]: v } }),
                      none,
                      `${cluster.name} · ${c.name}`,
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {row.coverage === "ALL_POSITIONS"
                    ? levelSelect(row.defaultLevel, (v) => set({ defaultLevel: v }), false, `${cluster.name} · ${t("colDefaultLevel")}`)
                    : <span className="text-xs text-muted-foreground">–</span>}
                </TableCell>
                <TableCell>
                  <Switch checked={row.isActive} onCheckedChange={(v) => set({ isActive: v })} disabled={none} aria-label={t("colActive")} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
