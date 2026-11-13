// How a position's competency mappings split between Global (org-wide) and
// unit-scoped rows, and how many competencies one staff member in that
// position is actually assessed on.
//
// Why this exists: with unit-scoped mappings (FEATURE_UNIT_SCOPED_COMPETENCY)
// a position's raw total adds up every unit's own functional list - e.g. 16
// Global + 344 unit-scoped = 360 for "Eksekutif" at Waqaf Annur - while each
// staff member only gets Global plus their own unit's list (16-39). The raw
// total alone made admins think staff had to answer 300+ competencies.
//
// The per-staff count mirrors the backend resolver
// (backend/src/utils/positionCompetencyResolution.util.ts): Global rows plus
// rows scoped to the staff's unit or any ancestor of it, one per competency.

export interface ScopeMappingRow {
  competencyId: string | null
  unitId?: string | null
}

export interface ScopeUnit {
  id: string
  parentId?: string | null
}

export interface ScopeSummary {
  /** Distinct competencies mapped org-wide (unitId null). */
  globalCount: number
  /** Distinct competencies mapped to at least one unit. */
  unitScopedCount: number
  /** Number of units that have their own mappings for this position. */
  unitCount: number
  /** Fewest / most competencies one staff member is assessed on, across every unit. */
  perStaffMin: number
  perStaffMax: number
}

/**
 * Returns null when the position has no unit-scoped rows: every staff member
 * then gets the same Global list, and the plain total already says it all.
 */
export function summarizePositionScopes(
  rows: ScopeMappingRow[],
  units: ScopeUnit[],
): ScopeSummary | null {
  const global = new Set<string>()
  const byUnit = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!row.competencyId) continue // orphaned row, counted nowhere else either
    if (!row.unitId) {
      global.add(row.competencyId)
      continue
    }
    let set = byUnit.get(row.unitId)
    if (!set) byUnit.set(row.unitId, (set = new Set()))
    set.add(row.competencyId)
  }
  if (byUnit.size === 0) return null

  const unitScoped = new Set<string>()
  byUnit.forEach((set) => set.forEach((id) => unitScoped.add(id)))

  const parentOf = new Map(units.map((u) => [u.id, u.parentId ?? null]))
  const effectiveCountFor = (unitId: string) => {
    const effective = new Set(global)
    const seen = new Set<string>()
    for (let id: string | null = unitId; id && !seen.has(id); id = parentOf.get(id) ?? null) {
      seen.add(id) // guards against a parent cycle in bad data
      byUnit.get(id)?.forEach((c) => effective.add(c))
    }
    return effective.size
  }
  // Every unit, not just the mapped ones: a staff member in a unit with no
  // mappings of its own (e.g. a department head above the sub-units) only
  // gets Global, and that is the real minimum. Falls back to the mapped
  // units if the unit list could not be loaded.
  const unitIds = units.length > 0 ? units.map((u) => u.id) : Array.from(byUnit.keys())
  const counts = unitIds.map(effectiveCountFor)

  return {
    globalCount: global.size,
    unitScopedCount: unitScoped.size,
    unitCount: byUnit.size,
    perStaffMin: Math.min(...counts),
    perStaffMax: Math.max(...counts),
  }
}
