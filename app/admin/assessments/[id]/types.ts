export interface Assessment {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  weightageSelf?: number
  weightageSuperior?: number
}

export interface Position {
  id: string
  name: string
}

export interface Competency {
  id: string
  name: string
  cluster?: {
    name: string
    color?: string
  }
}

export interface Staff {
  id: string
  name: string
  orgId?: string
  positionId?: string
}

export interface Assessor {
  id: string
  staffId: string
  assessmentId: string
  assessorId: string
  type: string
  staff?: Staff
}

export interface AssessmentResult {
  id: string
  assessmentId: string
  positionId: string
  competencyId: string
  assessorId: string
  score: number
  position?: Position
  competency?: Competency
  assessor?: Assessor
}

export interface CompetencyData {
  competency: Competency
  requiredLevel?: number
  scores: {
    self?: number
    superior?: number
  }
  resultIds: {
    self?: string
    superior?: string
  }
  finalScore?: number
  gap?: number
}

export interface StaffCompetencyMatrix {
  [staffId: string]: {
    staff: Staff
    position: Position
    competencies: {
      [competencyId: string]: CompetencyData
    }
  }
}

export interface StaffMemberWithResults {
  id: string
  name: string
  orgId?: string
  positionId?: string
  positionName: string
  hasResults: boolean
}

export interface CompetencyAverage {
  competencyId: string
  competencyName: string
  clusterName: string
  clusterColor?: string
  staffCount: number
  averageRequiredLevel: number
  averageScore: number
  averageGap: number
}
