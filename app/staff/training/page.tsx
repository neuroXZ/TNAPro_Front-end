"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

// Import types and components
import { TrainingGroup, TrainingStatus, RtnReportResponse } from "./types"
import { LoadingState, ErrorState, TrainingContent } from "./components"
import { TrainingService } from "./services"

export default function MyTraining() {
  // ===== STATE MANAGEMENT =====
  const { user } = useAuth()
  const [trainings, setTrainings] = useState<TrainingGroup[]>([])
  const [rtnReport, setRtnReport] = useState<RtnReportResponse | null>(null)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState<TrainingStatus>('ongoing')
  const [error, setError] = useState<string | null>(null)

  // ===== EFFECTS =====
  useEffect(() => {
    if (user?.id) {
      fetchRecommendedTrainings()
    }
  }, [user])

  // ===== MAIN DATA FETCHING =====
  const fetchRecommendedTrainings = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { report, assessmentId } = await TrainingService.fetchRecommendedTrainings(user!.id)
      
      setSelectedAssessmentId(assessmentId)
      setRtnReport(report)

      // Group trainings to avoid duplicates
      const trainingGroups = TrainingService.groupTrainingsByTrainingId(report.results)
      setTrainings(trainingGroups)
      
    } catch (error: any) {
      handleFetchError(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ===== ERROR HANDLING =====
  const handleFetchError = (error: any) => {
    console.error("Error fetching recommended trainings:", error)
    console.log("Error response:", error.response?.data)
    console.log("Error status:", error.response?.status)
    console.log("Error message:", error.message)
    
    if (error.response?.status === 404) {
      const message = error.response?.data?.message || ""
      console.log("404 Error message from backend:", message)
      
      if (message.includes("No training recommendations found") || message.includes("gap > 1.5")) {
        console.log("⚠️ Backend says no training recommendations (gap <= 1.5)")
        setError("Excellent! No training recommendations needed. Your competency levels are meeting requirements.")
        setTrainings([])
      } else {
        console.log("⚠️ 404 - Recommended Training endpoint not available in Railway deployment")
        setError("Recommended Training feature is currently unavailable. This feature may not be deployed to the current server yet.")
        toast.error("Feature temporarily unavailable")
      }
    } else if (error.response?.status === 400) {
      setError("Invalid request. Please try again.")
      toast.error("Invalid request parameters")
    } else if (error.response?.status === 500) {
      const serverError = error.response?.data?.error || "Server error"
      console.log("500 Server error details:", error.response?.data)
      setError(`Server error: ${serverError}`)
      toast.error("Server error occurred")
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      setError("Unable to connect to server. Please check your internet connection.")
      toast.error("Connection error")
    } else {
      console.log("Unknown error details:", error.response?.data)
      const errorMessage = error.response?.data?.error || error.message || "Failed to load training recommendations"
      setError(`Error: ${errorMessage}`)
      toast.error(errorMessage)
    }
  }

  // ===== EXPORT HANDLING =====
  const handleExport = async () => {
    if (!selectedAssessmentId || !user?.id) {
      toast.error("Missing required data for export")
      return
    }
    
    try {
      setIsExporting(true)
      await TrainingService.exportTrainingReport(user.id, selectedAssessmentId)
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error("Failed to export training report")
    } finally {
      setIsExporting(false)
    }
  }

  // ===== UTILITY FUNCTIONS =====
  const getTrainingStatus = (training: TrainingGroup): TrainingStatus => {
    return TrainingService.getTrainingStatus(training)
  }

  const filterTrainingsByStatus = (status: TrainingStatus) => {
    return TrainingService.filterTrainingsByStatus(trainings, status)
  }

  // ===== COMPUTED VALUES =====
  const upcomingCount = filterTrainingsByStatus('upcoming').length
  const ongoingCount = filterTrainingsByStatus('ongoing').length
  const pastCount = filterTrainingsByStatus('past').length
  const isSuccessMessage = error?.includes("meeting requirements") || false

  // ===== RENDER STATES =====
  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <ErrorState 
        error={error} 
        isSuccessMessage={isSuccessMessage}
        onRetry={fetchRecommendedTrainings}
      />
    )
  }

  // ===== MAIN RENDER =====
  return (
    <TrainingContent
      trainings={trainings}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      upcomingCount={upcomingCount}
      ongoingCount={ongoingCount}
      pastCount={pastCount}
      isExporting={isExporting}
      onExport={handleExport}
      getTrainingStatus={getTrainingStatus}
      filterTrainingsByStatus={filterTrainingsByStatus}
    />
  )
}