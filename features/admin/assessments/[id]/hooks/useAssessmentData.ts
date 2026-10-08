import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  assessmentAPI,
  assessmentResultAPI,
  positionAPI,
  competencyAPI,
  staffAPI,
  assessorAPI,
  positionCompetencyAPI,
  settingAPI,
  unitAPI,
} from "@/lib/api"
import { formatGapRatioPercent } from "@/lib/gap-ratio"
import { buildAncestorLookup, resolveForStaffUnit } from "@/lib/position-competency-resolution"
import type {
  Assessment,
  AssessmentResult,
  Position,
  Competency,
  Staff,
  Assessor,
  StaffCompetencyMatrix,
  StaffMemberWithResults,
} from "../types"

export function useAssessmentData(assessmentId: string) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [assessors, setAssessors] = useState<Assessor[]>([])
  const [positionCompetencies, setPositionCompetencies] = useState<any[]>([])
  const [units, setUnits] = useState<{ id: string; parentId?: string | null }[]>([])
  const [gapRatioFloorNegative, setGapRatioFloorNegative] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [assessmentId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [
        assessmentData,
        resultsData,
        positionsData,
        competenciesData,
        staffData,
        assessorsData,
        positionCompetenciesData,
        settingsData,
        unitsData,
      ] = await Promise.all([
        assessmentAPI.getById(assessmentId),
        assessmentResultAPI.getByAssessment(assessmentId),
        positionAPI.getAll(),
        competencyAPI.getAll(),
        staffAPI.getAll(),
        assessorAPI.getAll(),
        positionCompetencyAPI.getAll(),
        settingAPI.getAll(),
        unitAPI.getAll(),
      ])

      setAssessment(assessmentData)
      setResults(resultsData)
      setPositions(positionsData)
      setCompetencies(competenciesData)
      setStaff(staffData)
      setPositionCompetencies(positionCompetenciesData)
      setAssessors(assessorsData)
      setUnits(unitsData)
      setGapRatioFloorNegative(settingsData?.[0]?.gapRatioFloorNegative ?? false)
    } catch (error) {
      toast.error("Failed to fetch data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const buildMatrix = (): StaffCompetencyMatrix => {
    const matrix: StaffCompetencyMatrix = {}
    const ancestorsOf = buildAncestorLookup(units)

    results.forEach((result) => {
      const assessor = assessors.find((a) => a.id === result.assessorId)

      if (!assessor) return

      const staffId = assessor.staffId
      const competencyId = result.competencyId
      const assessorType = assessor.type?.toLowerCase()

      if (!matrix[staffId]) {
        const staffMember = staff.find((s) => s.id === staffId)
        const position = positions.find((p) => p.id === result.positionId)
        if (!staffMember || !position) return

        matrix[staffId] = {
          staff: staffMember,
          position,
          competencies: {},
        }
      }

      if (!matrix[staffId].competencies[competencyId]) {
        const competency = competencies.find((c) => c.id === competencyId)
        if (!competency) return

        // A position can have an org-wide row plus unit-scoped rows for the
        // same competency: pick the one for this staff member's unit.
        const positionComp = resolveForStaffUnit(
          positionCompetencies,
          result.positionId,
          competencyId,
          ancestorsOf(matrix[staffId].staff.unitId),
        )
        const requiredLevel = positionComp?.level || 0

        matrix[staffId].competencies[competencyId] = {
          competency,
          requiredLevel,
          scores: {},
          resultIds: {},
        }
      }

      // Assign score and result ID based on assessor type - only if status is SUBMITTED
      if (assessorType === "self") {
        matrix[staffId].competencies[competencyId].scores.self = result.status === 'SUBMITTED' ? result.score : undefined
        matrix[staffId].competencies[competencyId].resultIds.self = result.id
      } else if (assessorType === "superior") {
        matrix[staffId].competencies[competencyId].scores.superior = result.status === 'SUBMITTED' ? result.score : undefined
        matrix[staffId].competencies[competencyId].resultIds.superior = result.id
      }
    })

    // Calculate final scores and gaps
    Object.keys(matrix).forEach((staffId) => {
      Object.keys(matrix[staffId].competencies).forEach((competencyId) => {
        const { scores, requiredLevel } = matrix[staffId].competencies[competencyId]
        const selfScore = scores.self || 0
        const superiorScore = scores.superior || 0

        const weightageSelf = assessment?.weightageSelf || 0
        const weightageSuperior = assessment?.weightageSuperior || 0

        const finalScore = selfScore * weightageSelf + superiorScore * weightageSuperior

        const selfGap = (requiredLevel! - selfScore) * weightageSelf
        const superiorGap = (requiredLevel! - superiorScore) * weightageSuperior
        const totalGap = Math.round((selfGap + superiorGap) * 100) / 100

        matrix[staffId].competencies[competencyId].finalScore = finalScore
        matrix[staffId].competencies[competencyId].gap = totalGap
        matrix[staffId].competencies[competencyId].gapRatioPercent = formatGapRatioPercent(
          totalGap,
          requiredLevel || 0,
          gapRatioFloorNegative,
        )
      })
    })

    return matrix
  }

  const getAllStaffWithResults = (matrix: StaffCompetencyMatrix): StaffMemberWithResults[] => {
    return staff
      .map((staffMember) => {
        const hasResults = !!matrix[staffMember.id]
        const position = positions.find((p) => p.id === staffMember.positionId)

        return {
          id: staffMember.id,
          name: staffMember.name,
          orgId: staffMember.orgId,
          positionId: staffMember.positionId,
          positionName: position?.name || "No Position",
          hasResults,
        }
      })
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
  }

  return {
    assessment,
    results,
    positions,
    competencies,
    staff,
    assessors,
    positionCompetencies,
    gapRatioFloorNegative,
    isLoading,
    buildMatrix,
    getAllStaffWithResults,
    refreshData: fetchData,
  }
}
