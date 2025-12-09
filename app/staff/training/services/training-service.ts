import { api, assessmentAPI, rtnAPI, staffAPI, assessmentResultAPI } from "@/lib/api"
import { toast } from "sonner"
import { RecommendedTrainingRecord, RtnReportResponse, TrainingGroup, TrainingStatus } from "../types"
import { isBefore, isAfter } from "date-fns"

export class TrainingService {
  // Fetch recommended trainings from backend
  static async fetchRecommendedTrainings(userId: string) {
    console.log("=== DEBUGGING RECOMMENDED TRAINING ===")
    console.log("Staff user ID:", userId)

    // Get latest assessment
    const assessments = await assessmentAPI.getAll()
    console.log("All assessments:", assessments)
    
    if (!assessments || assessments.length === 0) {
      throw new Error("No assessment found. Please complete an assessment first.")
    }

    const latestAssessment = assessments.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
    
    console.log("Latest assessment:", latestAssessment)

    // Call backend API using rtnAPI
    console.log("Making RTN API call with:")
    console.log("- staffId:", userId)
    console.log("- assessmentId:", latestAssessment.id)
    
    let report: RtnReportResponse
    try {
      report = await rtnAPI.getReport({
        staffId: userId,
        assessmentId: latestAssessment.id
      })
      console.log("RTN API Response:", report)
    } catch (apiError: any) {
      console.log("RTN API call failed, details:", apiError)
      if (apiError.response?.status === 404) {
        throw apiError // Let the outer catch handle 404 specifically
      }
      throw apiError
    }
    
    console.log("Parsed RTN Report:", report)
    console.log("Number of training results:", report.results?.length || 0)
    
    if (report.results && report.results.length > 0) {
      console.log("First training result:", report.results[0])
      console.log("All competencies with gaps:")
      report.results.forEach((result: RecommendedTrainingRecord, index: number) => {
        console.log(`  ${index + 1}. ${result.relatedCompetency.competencyName} - Gap: ${result.relatedCompetency.weightedGap}`)
      })
    } else {
      console.log("⚠️ No training results found in response")
      
      // Manual gap calculation for debugging
      try {
        console.log("🔍 MANUAL GAP ANALYSIS:")
        await this.calculateCompetencyGaps(userId, latestAssessment.id)
      } catch (error) {
        console.error("Failed to calculate manual gaps:", error)
      }
    }
    
    console.log("=== END DEBUG RECOMMENDED TRAINING ===")
    
    return {
      report,
      assessmentId: latestAssessment.id
    }
  }

  // Group trainings to avoid duplicates
  static groupTrainingsByTrainingId(results: RecommendedTrainingRecord[]): TrainingGroup[] {
    const trainingMap = new Map<string, TrainingGroup>()
    
    results.forEach((item) => {
      const trainingId = item.trainingId
      const startDate = item.startDate ? new Date(item.startDate).toISOString() : new Date().toISOString()
      const endDate = item.endDate ? new Date(item.endDate).toISOString() : new Date().toISOString()
      
      if (trainingMap.has(trainingId)) {
        // Add competency to existing training
        trainingMap.get(trainingId)!.competencies.push({
          competencyId: item.relatedCompetency.competencyId,
          competencyName: item.relatedCompetency.competencyName || 'Unknown Competency',
          clusterName: item.relatedCompetency.clusterName || 'Unknown Cluster',
          requiredLevel: item.relatedCompetency.requiredLevel,
          weightedGap: item.relatedCompetency.weightedGap
        })
      } else {
        // Create new training entry
        trainingMap.set(trainingId, {
          trainingId: trainingId,
          trainingName: item.trainingName || 'Unknown Training',
          startDate: startDate,
          endDate: endDate,
          competencies: [{
            competencyId: item.relatedCompetency.competencyId,
            competencyName: item.relatedCompetency.competencyName || 'Unknown Competency',
            clusterName: item.relatedCompetency.clusterName || 'Unknown Cluster',
            requiredLevel: item.relatedCompetency.requiredLevel,
            weightedGap: item.relatedCompetency.weightedGap
          }]
        })
      }
    })
    
    return Array.from(trainingMap.values())
  }

  // Determine training status
  static getTrainingStatus(training: TrainingGroup): TrainingStatus {
    const now = new Date()
    const start = new Date(training.startDate)
    const end = new Date(training.endDate)

    if (isBefore(now, start)) return 'upcoming'
    if (isAfter(now, end)) return 'past'
    return 'ongoing'
  }

  // Filter trainings by status
  static filterTrainingsByStatus(trainings: TrainingGroup[], status: TrainingStatus): TrainingGroup[] {
    return trainings.filter(training => this.getTrainingStatus(training) === status)
  }

  // Export training report
  static async exportTrainingReport(userId: string, assessmentId: string) {
    if (!assessmentId || !userId) {
      toast.error("Missing required data for export")
      throw new Error("Missing required data for export")
    }
    
    const response = await rtnAPI.export({
      staffId: userId,
      assessmentId: assessmentId
    })
    
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `recommended_training_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    
    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 100)
    
    toast.success("Training report exported successfully")
  }

  // Manual competency gap calculation for debugging
  static async calculateCompetencyGaps(userId: string, assessmentId: string) {
    try {
      console.log("--- Manual Gap Calculation ---")
      
      // Get staff data with position competencies
      const staffData = await staffAPI.getById(userId)
      console.log("Staff data:", staffData)
      
      if (!staffData.position?.positionCompetencies) {
        console.log("❌ No position competencies found")
        return
      }

      // Get assessment details for weightages
      const assessmentDetails = await assessmentAPI.getById(assessmentId)
      console.log("Assessment details:", assessmentDetails)
      
      if (!assessmentDetails.weightageSelf || !assessmentDetails.weightageSuperior) {
        console.log("❌ Assessment weightages not configured")
        console.log("WeightageSelf:", assessmentDetails.weightageSelf)
        console.log("WeightageSuperior:", assessmentDetails.weightageSuperior)
        return
      }

      const W_SELF = assessmentDetails.weightageSelf / 100
      const W_SUPERIOR = assessmentDetails.weightageSuperior / 100
      console.log(`Weightages: Self=${W_SELF * 100}%, Superior=${W_SUPERIOR * 100}%`)

      // Get assessment results
      const assessmentResults = await assessmentResultAPI.getByAssessment(assessmentId)
      console.log("Assessment results:", assessmentResults)

      // Group results by competency and assessor type
      const resultsByCompetency: Record<string, { self?: number, superior?: number }> = {}
      
      assessmentResults.forEach((result: any) => {
        const competencyId = result.competencyId
        const assessorType = result.assessor?.type || 'unknown'
        const score = result.score

        if (!resultsByCompetency[competencyId]) {
          resultsByCompetency[competencyId] = {}
        }

        if (assessorType === 'self') {
          resultsByCompetency[competencyId].self = score
        } else if (assessorType === 'superior' || assessorType === 'supervisor') {
          resultsByCompetency[competencyId].superior = score
        }
      })

      console.log("Results by competency:", resultsByCompetency)

      // Calculate gaps
      const competenciesWithGaps: any[] = []
      
      staffData.position.positionCompetencies.forEach((pc: any) => {
        const competencyId = pc.competencyId
        const requiredLevel = pc.level
        const competencyName = pc.competency?.name
        const clusterName = pc.competency?.cluster?.name

        const scores = resultsByCompetency[competencyId]
        
        if (scores?.self !== undefined && scores?.superior !== undefined) {
          const weightedScore = (scores.self * W_SELF) + (scores.superior * W_SUPERIOR)
          const gap = requiredLevel - weightedScore

          console.log(`📊 ${competencyName} (${clusterName}):`)
          console.log(`   Required Level: ${requiredLevel}`)
          console.log(`   Self Score: ${scores.self}, Superior Score: ${scores.superior}`)
          console.log(`   Weighted Score: ${weightedScore.toFixed(2)}`)
          console.log(`   Gap: ${gap.toFixed(2)}`)
          
          if (gap > 1.5) {
            console.log(`   🔥 GAP > 1.5 - NEEDS TRAINING!`)
            competenciesWithGaps.push({
              competencyName,
              clusterName,
              requiredLevel,
              weightedScore: parseFloat(weightedScore.toFixed(2)),
              gap: parseFloat(gap.toFixed(2))
            })
          } else {
            console.log(`   ✅ Gap <= 1.5 - OK`)
          }
          console.log("")
        } else {
          console.log(`⚠️ ${competencyName}: Missing scores - Self: ${scores?.self}, Superior: ${scores?.superior}`)
        }
      })

      if (competenciesWithGaps.length > 0) {
        console.log("🎯 COMPETENCIES NEEDING TRAINING (Gap > 1.5):")
        competenciesWithGaps.forEach((comp, index) => {
          console.log(`${index + 1}. ${comp.competencyName} (${comp.clusterName})`)
          console.log(`   Required: ${comp.requiredLevel}, Gap: ${comp.gap}`)
        })
        console.log(`\nTotal competencies needing training: ${competenciesWithGaps.length}`)
        
        // Check training competency mappings
        await this.checkTrainingCompetencyMappings(competenciesWithGaps)
      } else {
        console.log("✅ No competencies have gaps > 1.5")
      }

    } catch (error) {
      console.error("Error in manual gap calculation:", error)
    }
  }

  // Check training competency mappings
  static async checkTrainingCompetencyMappings(competenciesWithGaps: any[]) {
    try {
      console.log("🔗 CHECKING TRAINING COMPETENCY MAPPINGS:")
      
      // Get all training competencies
      const trainingCompetencies = await api.get('/trainingcompetency')
      console.log("All training competencies:", trainingCompetencies.data)
      
      // Get all trainings
      const trainings = await api.get('/training')
      console.log("All trainings:", trainings.data)

      competenciesWithGaps.forEach((comp) => {
        console.log(`\n🎯 Checking training for: ${comp.competencyName}`)
        
        // Find training competencies for this competency
        const relatedTrainingComps = trainingCompetencies.data.filter(
          (tc: any) => tc.competency?.name === comp.competencyName
        )
        
        if (relatedTrainingComps.length > 0) {
          console.log(`   ✅ Found ${relatedTrainingComps.length} training(s):`)
          relatedTrainingComps.forEach((tc: any) => {
            const training = trainings.data.find((t: any) => t.id === tc.trainingId)
            console.log(`   - Training: ${training?.name || 'Unknown'}`)
            console.log(`   - Start: ${training?.startDate}, End: ${training?.endDate}`)
          })
        } else {
          console.log(`   ❌ No trainings found for ${comp.competencyName}`)
          console.log("   This competency needs training mapping!")
        }
      })
      
    } catch (error) {
      console.error("Error checking training mappings:", error)
    }
  }
}