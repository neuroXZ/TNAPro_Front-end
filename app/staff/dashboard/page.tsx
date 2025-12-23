"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent } from "@/components/ui/mobile-card"
import { MobileGrid, MobileContainer } from "@/components/ui/mobile-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconUser,
  IconBriefcase,
  IconTarget,
  IconTrophy,
  IconClipboardCheck,
  IconArrowRight,
  IconCalendar,
  IconAlertCircle,
  IconChecks
} from "@tabler/icons-react"
import { useAuth } from "@/lib/auth-context"
import { staffAPI, assessmentAPI, trainingAPI, idpAPI, rtnAPI } from "@/lib/api"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useIsMobile } from "@/hooks/use-mobile"

interface DashboardStats {
  totalCompetencies: number
  completedAssessments: number
  pendingAssessments: number
  trainingAttended: number
  upcomingTraining: number
}

interface Assessment {
  id: string
  name: string
  startDate: string
  endDate: string
  description?: string
}

interface Training {
  id: string
  name: string
  startDate: string
  endDate: string
  description?: string
}

interface RecommendedTrainingRecord {
  trainingId: string
  trainingName: string | null
  startDate: string | null
  endDate: string | null
  competencyId: string
  competencyName: string | null
  requiredLevel: number | null
  selfScore: number | null
  superiorScore: number | null
  averageScore: number | null
  gap: number | null
}

interface RTNReportResponse {
  staffId: string
  staffName: string | null
  positionName: string | null
  assessmentId: string
  results: RecommendedTrainingRecord[]
  generatedAt: string
}

interface IdpSummary {
  hasIdp: boolean
  totalCompetencies: number
  competenciesNeedingTraining: number
  averageGap: number
  lastGenerated?: string
}

export default function StaffDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [stats, setStats] = useState<DashboardStats>({
    totalCompetencies: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    trainingAttended: 0,
    upcomingTraining: 0
  })
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [recommendedTrainings, setRecommendedTrainings] = useState<RecommendedTrainingRecord[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('')
  const [idpSummary, setIdpSummary] = useState<IdpSummary>({
    hasIdp: false,
    totalCompetencies: 0,
    competenciesNeedingTraining: 0,
    averageGap: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch assessments
      const assessmentsData = await assessmentAPI.getAll()
      setAssessments(assessmentsData)

      // Fetch trainings
      const trainingsData = await trainingAPI.getAll()
      setTrainings(trainingsData)

      // Set latest assessment for recommended training
      if (assessmentsData.length > 0) {
        const latestAssessment = assessmentsData.sort((a: Assessment, b: Assessment) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )[0]
        setSelectedAssessmentId(latestAssessment.id)
        
        // Fetch recommended training
        if (user?.id) {
          try {
            const rtnReport: RTNReportResponse = await rtnAPI.getReport({ 
              staffId: user.id, 
              assessmentId: latestAssessment.id
            })
            setRecommendedTrainings(rtnReport.results || [])
          } catch (error) {
            console.log('No recommended training available:', error)
            setRecommendedTrainings([])
          }
        }
      }

      // Try to fetch latest IDP if available
      if (user?.id && assessmentsData.length > 0) {
        try {
          const latestAssessment = assessmentsData[0]
          const idpData = await idpAPI.generate({
            staffId: user.id,
            assessmentId: latestAssessment.id
          })

          if (idpData.data) {
            const analysis = idpData.data.competencyAnalysis
            setIdpSummary({
              hasIdp: true,
              totalCompetencies: analysis.length,
              competenciesNeedingTraining: analysis.filter((c: any) => c.developmentStrategies.training).length,
              averageGap: analysis.reduce((sum: number, c: any) => sum + c.gap, 0) / analysis.length,
              lastGenerated: idpData.data.generatedAt
            })
          }
        } catch (error) {
          // IDP not available yet, keep default values
          console.log("IDP not available:", error)
        }
      }

      // Calculate stats
      const now = new Date()
      const pendingAssessments = assessmentsData.filter((a: Assessment) =>
        new Date(a.endDate) > now
      )
      const completedAssessments = assessmentsData.filter((a: Assessment) =>
        new Date(a.endDate) <= now
      )
      const upcomingTraining = trainingsData.filter((t: Training) =>
        new Date(t.startDate) > now
      )

      setStats({
        totalCompetencies: 0, // Will be updated when we have competency API
        completedAssessments: completedAssessments.length,
        pendingAssessments: pendingAssessments.length,
        trainingAttended: trainingsData.length - upcomingTraining.length,
        upcomingTraining: upcomingTraining.length
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAssessmentStatus = (assessment: Assessment) => {
    const now = new Date()
    const startDate = new Date(assessment.startDate)
    const endDate = new Date(assessment.endDate)

    if (now < startDate) return { label: "Upcoming", color: "bg-blue-500" }
    if (now > endDate) return { label: "Completed", color: "bg-green-500" }
    return { label: "Active", color: "bg-orange-500" }
  }

  const pendingAssessments = assessments.filter(a => {
    const now = new Date()
    const endDate = new Date(a.endDate)
    return endDate > now
  }).slice(0, 3)

  const upcomingTrainings = trainings.filter(t => {
    const now = new Date()
    const startDate = new Date(t.startDate)
    return startDate > now
  }).slice(0, 3)

  // Get recommended training status
  const getRecommendedTrainingStatus = (record: RecommendedTrainingRecord) => {
    if (!record.startDate || !record.endDate) return "Recommended"
    
    const now = new Date()
    const start = new Date(record.startDate)
    const end = new Date(record.endDate)
    
    if (now < start) return "Upcoming"
    if (now > end) return "Closed"
    return "Ongoing"
  }

  // Group recommended trainings by training name to avoid duplicates
  const uniqueRecommendedTrainings = recommendedTrainings.reduce((acc: RecommendedTrainingRecord[], current) => {
    const existingTraining = acc.find(item => item.trainingId === current.trainingId)
    if (!existingTraining) {
      acc.push(current)
    }
    return acc
  }, []).slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name || 'Staff'}! Here's your overview.
        </p>
      </div>

      {/* Stats Cards */}
      <MobileGrid cols={{ mobile: 2, tablet: 2, desktop: 4 }} gap="md">
        <MobileCard>
          <MobileCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <MobileCardTitle>
              {isMobile ? "Pending" : "Pending Assessments"}
            </MobileCardTitle>
            <IconClipboardCheck className={`text-orange-500 ${isMobile ? 'size-3' : 'size-4'}`} />
          </MobileCardHeader>
          <MobileCardContent>
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.pendingAssessments}</div>
            <p className={`text-muted-foreground ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {isMobile ? "To complete" : "Assessments to complete"}
            </p>
          </MobileCardContent>
        </MobileCard>

        <MobileCard>
          <MobileCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <MobileCardTitle>
              {isMobile ? "Completed" : "Completed Assessments"}
            </MobileCardTitle>
            <IconChecks className={`text-green-500 ${isMobile ? 'size-3' : 'size-4'}`} />
          </MobileCardHeader>
          <MobileCardContent>
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.completedAssessments}</div>
            <p className={`text-muted-foreground ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {isMobile ? "Done" : "Total completed"}
            </p>
          </MobileCardContent>
        </MobileCard>

        <MobileCard>
          <MobileCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <MobileCardTitle>
              {isMobile ? "Training" : "Training Sessions"}
            </MobileCardTitle>
            <IconBriefcase className={`text-blue-500 ${isMobile ? 'size-3' : 'size-4'}`} />
          </MobileCardHeader>
          <MobileCardContent>
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.trainingAttended}</div>
            <p className={`text-muted-foreground ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {isMobile ? "Attended" : "Training attended"}
            </p>
          </MobileCardContent>
        </MobileCard>

        <MobileCard>
          <MobileCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <MobileCardTitle>
              {isMobile ? "Upcoming" : "Upcoming Training"}
            </MobileCardTitle>
            <IconCalendar className={`text-purple-500 ${isMobile ? 'size-3' : 'size-4'}`} />
          </MobileCardHeader>
          <MobileCardContent>
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{stats.upcomingTraining}</div>
            <p className={`text-muted-foreground ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {isMobile ? "Scheduled" : "Training scheduled"}
            </p>
          </MobileCardContent>
        </MobileCard>
      </MobileGrid>

      {/* Main Content Grid */}
      <div className="grid gap-4">
        {/* My IDP Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Individual Development Plan (IDP)</CardTitle>
                <CardDescription>
                  Your competency gaps and development strategies
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/staff/idp')}
              >
                View Full IDP
                <IconArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            ) : idpSummary.hasIdp ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Competencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{idpSummary.totalCompetencies}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Needs Training</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {idpSummary.competenciesNeedingTraining}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Average Gap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {idpSummary.averageGap.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {idpSummary.lastGenerated && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Generated: {format(new Date(idpSummary.lastGenerated), "dd MMM yyyy HH:mm")}
                    </p>
                    <Button 
                      onClick={() => router.push('/staff/idp')}
                      size="sm"
                    >
                      <IconTarget className="size-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconTarget className="size-16 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium mb-1">No IDP Generated Yet</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Generate your Individual Development Plan to identify competency gaps and get personalized development strategies
                </p>
                <Button 
                  onClick={() => router.push('/staff/idp')}
                >
                  <IconTarget className="size-4 mr-2" />
                  Generate IDP
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessments and Training Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Assessments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Assessments</CardTitle>
                <CardDescription>
                  Assessments that need your attention
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/staff/assessments')}
              >
                View All
                <IconArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : pendingAssessments.length > 0 ? (
              <div className="space-y-3">
                {pendingAssessments.map((assessment) => {
                  const status = getAssessmentStatus(assessment)
                  return (
                    <div
                      key={assessment.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/staff/assessments/${assessment.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{assessment.name}</h4>
                          <Badge className={`bg-green-100 text-green-800 text-xs`}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(assessment.endDate), "dd MMM yyyy")}
                        </p>
                      </div>
                      <IconArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <IconChecks className="size-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pending assessments
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Upcoming Training */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recommended Training</CardTitle>
                <CardDescription>
                  Training recommendations based on your assessment
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/staff/training')}
              >
                View All
                <IconArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : uniqueRecommendedTrainings.length > 0 ? (
              <div className="space-y-3">
                {uniqueRecommendedTrainings.map((training) => (
                  <div
                    key={training.trainingId}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm gap-2 flex">{training.trainingName || 'Unknown Training'}
                        <Badge 
                          variant={getRecommendedTrainingStatus(training) === 'Upcoming' ? 'default' : 
                                  getRecommendedTrainingStatus(training) === 'Ongoing' ? 'secondary' : 
                                  getRecommendedTrainingStatus(training) === 'Closed' ? 'destructive' : 'outline'}
                          className={`text-xs ${
                            getRecommendedTrainingStatus(training) === 'Ongoing' ? 'text-green-800 bg-green-100 ' : 
                            getRecommendedTrainingStatus(training) === 'Closed' ? 'text-red-800 bg-red-100 ' : ''
                          }`}
                        >
                          {getRecommendedTrainingStatus(training)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {training.startDate && training.endDate && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(training.startDate), "dd MMM")} - {format(new Date(training.endDate), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <IconTarget className="size-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IconTarget className="size-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No recommended training available
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete your assessment to get personalized recommendations
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}