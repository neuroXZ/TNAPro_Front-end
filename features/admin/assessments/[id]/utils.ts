import { formatGapRatioPercent } from "@/lib/gap-ratio"

export const getScoreColor = (score?: number) => {
  if (!score) return "text-muted-foreground"
  if (score >= 4) return "text-green-600 font-semibold"
  if (score >= 3) return "text-yellow-600 font-semibold"
  return "text-red-600 font-semibold"
}

// "Complete" normally means both self and superior have submitted scores —
// with superiorOnlyAssessment on, self is never collected, so completeness
// depends on superior alone.
export const isResultComplete = (
  scores: { self?: number; superior?: number },
  superiorOnly: boolean
) => (superiorOnly ? scores.superior !== undefined : scores.self !== undefined && scores.superior !== undefined)

export const getGapColor = (gap?: number) => {
  if (gap === undefined) return "text-muted-foreground"
  if (gap >= 1.5) return "text-red-600 font-semibold"
  if (gap >= 1.0) return "text-orange-600 font-semibold"
  if (gap > 0) return "text-yellow-600 font-semibold"
  return "text-green-600 font-semibold"
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
  averageGapRatioPercent: string
}

export const calculateAverages = (matrix: any, floorNegative: boolean = false, superiorOnly: boolean = false): CompetencyAverage[] => {
  const aggregatedData = new Map<string, {
    totalScore: number
    totalGap: number
    staffCount: number
    competencyName: string
    clusterName: string
    clusterColor?: string
    totalRequiredLevel: number
    staffIds: Set<string>
  }>()

  // Aggregate data from all completed staff
  Object.keys(matrix).forEach((staffId) => {
    const staffData = matrix[staffId]
    
    Object.keys(staffData.competencies).forEach((competencyId) => {
      const compData = staffData.competencies[competencyId]
      
      // Only include completed results — see isResultComplete
      if (isResultComplete(compData.scores, superiorOnly)) {
        if (!aggregatedData.has(competencyId)) {
          aggregatedData.set(competencyId, {
            totalScore: 0,
            totalGap: 0,
            staffCount: 0,
            competencyName: compData.competency.name,
            clusterName: compData.competency.cluster?.name || 'N/A',
            clusterColor: compData.competency.cluster?.color,
            totalRequiredLevel: 0,
            staffIds: new Set<string>()
          })
        }

        const agg = aggregatedData.get(competencyId)!
        
        // Only count each staff once per competency
        if (!agg.staffIds.has(staffId)) {
          agg.staffIds.add(staffId)
          agg.staffCount += 1
          agg.totalRequiredLevel += compData.requiredLevel || 0
        }
        
        agg.totalScore += compData.finalScore || 0
        agg.totalGap += compData.gap || 0
      }
    })
  })

  // Calculate final averages
  const results: CompetencyAverage[] = []
  aggregatedData.forEach((agg, compId) => {
    if (agg.staffCount > 0) {
      results.push({
        competencyId: compId,
        competencyName: agg.competencyName,
        clusterName: agg.clusterName,
        clusterColor: agg.clusterColor,
        staffCount: agg.staffCount,
        averageRequiredLevel: parseFloat((agg.totalRequiredLevel / agg.staffCount).toFixed(2)),
        averageScore: parseFloat((agg.totalScore / agg.staffCount).toFixed(2)),
        averageGap: parseFloat((agg.totalGap / agg.staffCount).toFixed(2)),
        // Weighted average (sum of gaps ÷ sum of RCLs), same reasoning as
        // the backend's CgaOverall/CompetencyReport averageGapRatio.
        averageGapRatioPercent: formatGapRatioPercent(agg.totalGap, agg.totalRequiredLevel, floorNegative),
      })
    }
  })

  // Sort by cluster name, then competency name
  return results.sort((a, b) => {
    const clusterCompare = (a.clusterName ?? "").localeCompare(b.clusterName ?? "")
    if (clusterCompare !== 0) return clusterCompare
    return (a.competencyName ?? "").localeCompare(b.competencyName ?? "")
  })
}