// Training Page Types
export interface RecommendedTrainingRecord {
  trainingId: string
  trainingName: string | null
  startDate: Date | null
  endDate: Date | null
  relatedCompetency: {
    competencyId: string
    competencyName: string | null
    clusterName: string | null
    requiredLevel: number
    weightedGap: number
  }
}

export interface RtnReportResponse {
  staffId: string
  staffName: string | null
  positionName: string | null
  assessmentId: string
  results: RecommendedTrainingRecord[]
  generatedAt: Date
}

export interface TrainingGroup {
  trainingId: string
  trainingName: string
  startDate: string
  endDate: string
  competencies: {
    competencyId: string
    competencyName: string
    clusterName: string
    requiredLevel: number
    weightedGap: number
  }[]
}

export type TrainingStatus = 'upcoming' | 'ongoing' | 'past'