import type { TemplateCoverage, TemplateRuleInput } from "@/lib/api"

// Editor state for one cluster row. "NONE" = no rule for the cluster (the
// template leaves its mappings entirely to admin).
export type DraftCoverage = TemplateCoverage | "NONE"

export interface DraftRow {
  coverage: DraftCoverage
  isActive: boolean
  defaultLevel: number | null
  levels: Record<string, number | null> // categoryId -> level
}

export type Draft = Record<string, DraftRow> // clusterId -> row

export const emptyRow = (): DraftRow => ({ coverage: "NONE", isActive: true, defaultLevel: null, levels: {} })

export function draftFromRules(clusterIds: string[], rules: TemplateRuleInput[]): Draft {
  const draft: Draft = {}
  for (const id of clusterIds) {
    const rule = rules.find((r) => r.clusterId === id)
    draft[id] = rule
      ? {
          coverage: rule.coverage,
          isActive: rule.isActive !== false,
          defaultLevel: rule.defaultLevel ?? null,
          levels: Object.fromEntries(rule.levels.map((l) => [l.categoryId, l.level])),
        }
      : emptyRow()
  }
  return draft
}

export function rulesFromDraft(draft: Draft): TemplateRuleInput[] {
  return Object.entries(draft)
    .filter(([, row]) => row.coverage !== "NONE")
    .map(([clusterId, row]) => ({
      clusterId,
      coverage: row.coverage as TemplateCoverage,
      isActive: row.isActive,
      defaultLevel: row.coverage === "ALL_POSITIONS" ? row.defaultLevel : null,
      levels: Object.entries(row.levels)
        .filter((entry): entry is [string, number] => entry[1] !== null && entry[1] !== undefined)
        .map(([categoryId, level]) => ({ categoryId, level })),
    }))
}

/** Same comparison the backend would make: order-insensitive, drafts equal when they produce the same rules. */
export function sameRules(a: TemplateRuleInput[], b: TemplateRuleInput[]): boolean {
  const norm = (rules: TemplateRuleInput[]) =>
    JSON.stringify(
      [...rules]
        .sort((x, y) => x.clusterId.localeCompare(y.clusterId))
        // Explicit key order: rules from the server and from the editor build
        // their objects in different orders, and JSON.stringify keeps it.
        .map((r) => ({
          clusterId: r.clusterId,
          coverage: r.coverage,
          isActive: r.isActive !== false,
          defaultLevel: r.coverage === "ALL_POSITIONS" ? r.defaultLevel ?? null : null,
          levels: [...r.levels]
            .sort((x, y) => x.categoryId.localeCompare(y.categoryId))
            .map((l) => ({ categoryId: l.categoryId, level: l.level })),
        })),
    )
  return norm(a) === norm(b)
}

/** Client-side checks mirroring the backend's validateRules, so admin sees problems before previewing. */
export function draftProblems(draft: Draft): Record<string, "categoriesNeedLevel"> {
  const problems: Record<string, "categoriesNeedLevel"> = {}
  for (const [clusterId, row] of Object.entries(draft)) {
    if (row.coverage === "CATEGORIES" && !Object.values(row.levels).some((l) => l !== null && l !== undefined)) {
      problems[clusterId] = "categoriesNeedLevel"
    }
  }
  return problems
}
