// Competency dictionary — shared by the admin dictionary page and the
// staff/assessor reference views. Reference material only: assessment
// scoring keeps using the global Level list.

export interface DictionaryIndicator {
  id?: string
  level: number
  sortOrder?: number
  text: string
}

export interface DictionaryCompetency {
  id: string
  name: string
  code?: string | null
  description?: string | null
  cluster?: { id: string; name: string; color?: string | null } | null
  levelIndicators: DictionaryIndicator[]
}

export interface GlobalLevel {
  id?: string
  name?: string | null
  value?: number | null
  description?: string | null
}

export interface DictionaryLevelRow {
  value: number
  name: string | null
  description: string | null
  indicators: string[]
  /** False for a level that only exists because saved indicators use it (removed from the Level master). */
  inMaster: boolean
}

const DEFAULT_LEVEL_COUNT = 5

/**
 * One row per proficiency level, labelled from the deployment's global Level
 * master (matched by Level.value). Falls back to 1..5 when no levels are
 * configured, and still shows any indicator whose level isn't in the master
 * so nothing entered is silently hidden. Level values below 1 (e.g. a
 * "0 = No Knowledge" rung) are skipped — there is nothing to describe there,
 * and the API only accepts indicator levels of 1 and above.
 */
export function buildLevelRows(
  levels: GlobalLevel[],
  indicators: DictionaryIndicator[]
): DictionaryLevelRow[] {
  const byValue = new Map<number, DictionaryLevelRow>()

  const configured = levels
    .filter((l): l is GlobalLevel & { value: number } => typeof l.value === "number" && l.value >= 1)
    .sort((a, b) => a.value - b.value)

  if (configured.length > 0) {
    for (const l of configured) {
      if (byValue.has(l.value)) continue // duplicate value in the master: first wins
      byValue.set(l.value, {
        value: l.value,
        name: l.name ?? null,
        description: l.description ?? null,
        indicators: [],
        inMaster: true,
      })
    }
  } else {
    for (let v = 1; v <= DEFAULT_LEVEL_COUNT; v++) {
      byValue.set(v, { value: v, name: null, description: null, indicators: [], inMaster: true })
    }
  }

  const sorted = [...indicators].sort(
    (a, b) => a.level - b.level || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  for (const ind of sorted) {
    let row = byValue.get(ind.level)
    if (!row) {
      row = { value: ind.level, name: null, description: null, indicators: [], inMaster: false }
      byValue.set(ind.level, row)
    }
    row.indicators.push(ind.text)
  }

  return [...byValue.values()].sort((a, b) => a.value - b.value)
}
