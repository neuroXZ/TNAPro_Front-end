// Client-side mirror of backend/src/utils/positionCompetencyResolution.util.ts,
// for pages that load every PositionCompetency row once (GET /positioncompetency)
// and need the row that applies to one staff member. Pages that handle a single
// staff member should call GET /positioncompetency/effective instead.
//
// Rule (same as getEffectiveForPosition): only org-wide rows and rows scoped to
// the staff member's own unit or one of its ancestors apply; the nearest unit
// wins, then the org-wide row. A row scoped to any other unit never applies.

type UnitLike = { id: string; parentId?: string | null }
type MappingLike = { positionId?: string | null; competencyId?: string | null; unitId?: string | null }

/** Builds a lookup that returns a unit's chain, nearest-first: [unit, parent, ..., root]. */
export function buildAncestorLookup(units: UnitLike[]): (unitId: string | null | undefined) => string[] {
  const parentOf = new Map(units.map((u) => [u.id, u.parentId ?? null]))
  const cache = new Map<string, string[]>()
  return (unitId) => {
    if (!unitId) return []
    const hit = cache.get(unitId)
    if (hit) return hit
    const chain: string[] = []
    for (let id: string | null = unitId; id && !chain.includes(id); id = parentOf.get(id) ?? null) chain.push(id)
    cache.set(unitId, chain)
    return chain
  }
}

/** The mapping row that applies, or undefined when the staff member isn't required to have it. */
export function resolveForStaffUnit<T extends MappingLike>(
  mappings: T[],
  positionId: string | null | undefined,
  competencyId: string,
  ancestorIds: string[],
): T | undefined {
  let best: T | undefined
  let bestRank = Infinity
  for (const m of mappings) {
    if (m.positionId !== positionId || m.competencyId !== competencyId) continue
    const rank = m.unitId ? ancestorIds.indexOf(m.unitId) : ancestorIds.length
    if (rank === -1) continue // scoped to a unit outside this staff member's chain
    if (rank < bestRank) {
      best = m
      bestRank = rank
    }
  }
  return best
}
