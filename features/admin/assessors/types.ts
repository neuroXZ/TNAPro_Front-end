// Shapes returned by GET /assessor/staff/:staffId and PUT .../superiors.

export interface StaffAssessorRow {
  id: string
  type: "self" | "superior" | "peer" | null
  assessorId: string | null
  assessor: { id: string; name: string | null; staffOrgId: string | null } | null
  /** Results already given through this row. > 0 means it can't be removed. */
  resultCount: number
}

export interface StaffAssessors {
  staffId: string
  hasSelf: boolean
  superiors: StaffAssessorRow[]
  peers: StaffAssessorRow[]
}

export interface SetSuperiorsResult extends StaffAssessors {
  added: number
  removed: number
  kept: StaffAssessorRow[]
  selfCreated: boolean
}

/** A staff member as offered in the assessor picker. */
export interface AssessorOption {
  id: string
  name: string
  staffOrgId?: string | null
  /** Shown under the name so two people with the same name can be told apart. */
  detail?: string | null
}

/** Ids of superiors in `rows` who already rated (cannot be removed). */
export function lockedAssessorIds(rows: StaffAssessorRow[]): string[] {
  return rows.filter((r) => r.resultCount > 0 && r.assessorId).map((r) => r.assessorId as string)
}

/** Ids of the superior assessors in `rows`, de-duplicated, in order. */
export function superiorIds(rows: StaffAssessorRow[]): string[] {
  return [...new Set(rows.map((r) => r.assessorId).filter((id): id is string => !!id))]
}
