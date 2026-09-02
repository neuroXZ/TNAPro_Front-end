"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { assessmentAPI, assessmentResultAPI, assessorAPI, positionCompetencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconCalendar, IconClipboardCheck, IconFileText, IconCheck, IconPencil } from "@tabler/icons-react"
import { format } from "date-fns"
import { FeatureRoute } from "@/components/route/feature-route"

interface Assessment {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  weightageSelf: number
  weightageSuperior: number
  weightagePeer: number
  createdAt: string
  updatedAt: string
}

interface AssessmentWithStatus extends Assessment {
  totalCompetencies: number
  completedCompetencies: number
  status: "completed" | "pending" | "not-started"
  averageScore: number
  selfScore: number
  superiorScore: number
  hasDraftResults: boolean
  hasSubmittedResults: boolean
}

export default function MyAssessments() {
  return (
    <FeatureRoute feature="superiorOnlyAssessment" negate redirectTo="/staff/dashboard">
      <MyAssessmentsContent />
    </FeatureRoute>
  )
}

function MyAssessmentsContent() {
  const t = useTranslations('StaffAssessmentsPage')
  const [assessments, setAssessments] = useState<AssessmentWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [positionId, setPositionId] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    console.log("Stored user:", storedUser)
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        console.log("Parsed user data:", userData)
        console.log("User ID:", userData.id)
        console.log("Position ID:", userData.positionId)
        setUserId(userData.id)
        setPositionId(userData.positionId || null)
        if (userData.id) {
          fetchAssessments(userData.id, userData.positionId || null, userData.unitId ?? null)
        } else {
          console.warn("Missing user ID")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
        setIsLoading(false)
      }
    } else {
      console.warn("No user data in localStorage")
      setIsLoading(false)
    }
  }, [])

  const fetchAssessments = async (staffId: string, positionId: string | null, unitId: string | null = null) => {
    try {
      setIsLoading(true)
      console.log("Fetching assessments for staffId:", staffId, "positionId:", positionId)

      const [allAssessments, allResults, allAssessors] = await Promise.all([
        assessmentAPI.getAll(),
        assessmentResultAPI.getAll(),
        assessorAPI.getAll(),
      ])

      // Fetch position competencies only if positionId exists
      let positionCompetencies: any[] = []
      if (positionId) {
        positionCompetencies = await positionCompetencyAPI.getEffective(positionId, unitId)
      }

      console.log("All assessments:", allAssessments)
      console.log("All results:", allResults)
      console.log("All assessors:", allAssessors)
      console.log("Position competencies:", positionCompetencies)

      // Get user's assessor records
      const userAssessors = allAssessors.filter((a: any) => a.staffId === staffId)
      const userAssessorIds = userAssessors.map((a: any) => a.id)
      console.log("User assessors:", userAssessors)
      console.log("User assessor IDs:", userAssessorIds)

      // Process each assessment
      const processedAssessments: AssessmentWithStatus[] = allAssessments.map((assessment: Assessment) => {
        // Get results for this assessment and user
        const assessmentResults = allResults.filter((r: any) => 
          r.assessmentId === assessment.id && userAssessorIds.includes(r.assessorId)
        )

        // Group results by competency and track status
        const competencyScores: Record<string, {
          self?: number
          superior?: number
          peer?: number
        }> = {}
        
        // Track draft and submitted status separately
        let hasDraftResults = false
        let hasSubmittedResults = false
        let submittedSelfCount = 0
        let draftSelfCount = 0

        assessmentResults.forEach((result: any) => {
          const competencyId = result.competencyId
          const assessor = allAssessors.find((a: any) => a.id === result.assessorId)
          const type = assessor?.type?.toLowerCase()

          if (!competencyScores[competencyId]) {
            competencyScores[competencyId] = {}
          }

          // Check for draft or submitted status
          if (type === 'self' && result.score !== null && result.score !== undefined) {
            if (result.status === 'DRAFT') {
              hasDraftResults = true
              draftSelfCount++
            } else if (result.status === 'SUBMITTED') {
              hasSubmittedResults = true
              submittedSelfCount++
            }
          }

          // Only use scores if status is SUBMITTED
          if (type && result.score !== null && result.score !== undefined && result.status === 'SUBMITTED') {
            competencyScores[competencyId][type as 'self' | 'superior' | 'peer'] = result.score
          }
        })

        // Calculate scores
        let totalSelfScore = 0
        let totalSuperiorScore = 0
        let selfCount = 0
        let superiorCount = 0

        Object.values(competencyScores).forEach(scores => {
          if (scores.self !== undefined) {
            totalSelfScore += scores.self
            selfCount++
          }
          if (scores.superior !== undefined) {
            totalSuperiorScore += scores.superior
            superiorCount++
          }
        })

        const avgSelf = selfCount > 0 ? totalSelfScore / selfCount : 0
        const avgSuperior = superiorCount > 0 ? totalSuperiorScore / superiorCount : 0

        const weightageSelf = assessment.weightageSelf || 0
        const weightageSuperior = assessment.weightageSuperior || 0

        const weightedAverage = (avgSelf * weightageSelf) + (avgSuperior * weightageSuperior)

        // Determine status
        const totalCompetencies = positionCompetencies.length
        const completedCompetencies = Object.keys(competencyScores).length

        let status: "completed" | "pending" | "not-started" = "not-started"
        if (completedCompetencies >= totalCompetencies) {
          status = "completed"
        } else if (completedCompetencies > 0) {
          status = "pending"
        }

        return {
          ...assessment,
          totalCompetencies,
          completedCompetencies,
          status,
          averageScore: weightedAverage,
          selfScore: avgSelf,
          superiorScore: avgSuperior,
          hasDraftResults,
          hasSubmittedResults,
        }
      })

      // Sort by startDate (latest first)
      processedAssessments.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
        return dateB - dateA // Descending order (latest first)
      })

      console.log("Processed assessments:", processedAssessments)
      setAssessments(processedAssessments)
    } catch (error) {
      console.error("Failed to fetch assessments:", error)
      toast.error(t('loadAssessmentsFailedToast'))
    } finally {
      setIsLoading(false)
    }
  }

  // Filter assessments
  const completedAssessments = assessments.filter(a => a.status === "completed")
  
  // Filter pending assessments (only those that are available/open for answering)
  const pendingAssessments = assessments.filter(a => {
    const currentDate = new Date()
    const startDate = new Date(a.startDate)
    const endDate = new Date(a.endDate)
    currentDate.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    
    // Only show pending/not-started assessments that are within the assessment period
    return (a.status === "pending" || a.status === "not-started") && 
           currentDate >= startDate && currentDate <= endDate
  })
  
  // Filter expired assessments (past end date)
  const expiredAssessments = assessments.filter(a => {
    const currentDate = new Date()
    const endDate = new Date(a.endDate)
    currentDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    return currentDate > endDate && a.status !== "completed"
  })

  // Calculate overall averages
  const overallAverage = assessments.filter(a => a.averageScore > 0).length > 0
    ? assessments.filter(a => a.averageScore > 0).reduce((sum, a) => sum + a.averageScore, 0) / assessments.filter(a => a.averageScore > 0).length
    : 0

  const overallSelf = assessments.filter(a => a.selfScore > 0).length > 0
    ? assessments.filter(a => a.selfScore > 0).reduce((sum, a) => sum + a.selfScore, 0) / assessments.filter(a => a.selfScore > 0).length
    : 0

  const overallSuperior = assessments.filter(a => a.superiorScore > 0).length > 0
    ? assessments.filter(a => a.superiorScore > 0).reduce((sum, a) => sum + a.superiorScore, 0) / assessments.filter(a => a.superiorScore > 0).length
    : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">{t('loading')}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {t('notLoggedIn')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overallAverage > 0 ? overallAverage.toFixed(2) : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall assessment average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Self Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overallSelf > 0 ? overallSelf.toFixed(2) : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your self-assessment score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Superior Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overallSuperior > 0 ? overallSuperior.toFixed(2) : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assessment from supervisor
            </p>
          </CardContent>
        </Card>
      </div> */}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('tabAll')}</TabsTrigger>
          <TabsTrigger value="completed">{t('tabCompleted')}</TabsTrigger>
          <TabsTrigger value="pending">{t('tabPending')}</TabsTrigger>
          <TabsTrigger value="expired">{t('tabExpired')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('cardAllTitle')}</CardTitle>
                  <CardDescription>
                    {t('cardAllDesc')}
                  </CardDescription>
                </div>
                <Badge variant="outline">{t('totalBadge', { count: assessments.length })}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('emptyAll')}
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('cardCompletedTitle')}</CardTitle>
                  <CardDescription>
                    {t('cardCompletedDesc')}
                  </CardDescription>
                </div>
                <Badge variant="outline">{t('totalBadge', { count: completedAssessments.length })}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {completedAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('emptyCompleted')}
                </div>
              ) : (
                <div className="space-y-3">
                  {completedAssessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('cardPendingTitle')}</CardTitle>
                  <CardDescription>
                    {t('cardPendingDesc')}
                  </CardDescription>
                </div>
                <Badge variant="outline">{t('totalBadge', { count: pendingAssessments.length })}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('emptyPending')}
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAssessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('cardExpiredTitle')}</CardTitle>
                  <CardDescription>
                    {t('cardExpiredDesc')}
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="text-white">{t('totalBadge', { count: expiredAssessments.length })}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {expiredAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('emptyExpired')}
                </div>
              ) : (
                <div className="space-y-3">
                  {expiredAssessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AssessmentCard({ assessment }: { assessment: AssessmentWithStatus }) {
  const t = useTranslations('StaffAssessmentsPage')
  const handleStartAssessment = (assessmentId: string) => {
    // Navigate to assessment detail/form page
    window.location.href = `/staff/assessments/${assessmentId}`
  }

  const getDateBasedStatus = () => {
    const currentDate = new Date()
    const startDate = new Date(assessment.startDate)
    const endDate = new Date(assessment.endDate)
    
    // Remove time component for accurate date comparison
    currentDate.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    
    if (currentDate < startDate) {
      return { status: t('statusComingSoon'), variant: "secondary" as const, className: "bg-yellow-500 text-white hover:bg-yellow-900" }
    } else if (currentDate >= startDate && currentDate <= endDate) {
      return { status: t('statusOpen'), variant: "default" as const, className: "bg-green-500 text-white hover:bg-green-600" }
    } else {
      // Check if completed or expired
      if (assessment.status === "completed") {
        return { status: t('statusCompleted'), variant: "outline" as const, className: "bg-blue-500 text-white hover:bg-blue-600" }
      } else {
        return { status: t('statusExpired'), variant: "destructive" as const, className: "bg-red-500 text-white hover:bg-red-600" }
      }
    }
  }

  const getSelfAssessmentStatus = () => {
    // Return object with different status types
    return {
      hasDraft: assessment.hasDraftResults,
      hasSubmitted: assessment.hasSubmittedResults,
      hasAnyResults: assessment.hasDraftResults || assessment.hasSubmittedResults
    }
  }

  const dateStatus = getDateBasedStatus()
  const selfAssessmentStatus = getSelfAssessmentStatus()

  // Determine button text and styling
  const getButtonConfig = () => {
    if (dateStatus.status !== t('statusOpen')) {
      return {
        text: t('btnClose'),
        variant: "outline" as const,
        className: "",
        icon: <IconFileText className="size-4 mr-1" />,
        disabled: true
      }
    }

    if (selfAssessmentStatus.hasSubmitted) {
      return {
        text: t('btnSubmitted'),
        variant: "outline" as const,
        className: "bg-green-50 border-green-500 text-green-700 hover:bg-green-100",
        icon: <IconCheck className="size-4 mr-1" />,
        disabled: false
      }
    }

    if (selfAssessmentStatus.hasDraft) {
      return {
        text: t('btnSaveDraft'),
        variant: "outline" as const,
        className: "bg-yellow-50 border-yellow-500 text-yellow-700 hover:bg-yellow-100",
        icon: <IconPencil className="size-4 mr-1" />,
        disabled: false
      }
    }

    return {
      text: t('btnStart'),
      variant: "default" as const,
      className: "",
      icon: <IconFileText className="size-4 mr-1" />,
      disabled: false
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg">{assessment.name}</h3>
              <Badge variant={dateStatus.variant} className={dateStatus.className}>
                {dateStatus.status}
              </Badge>
            </div>
            {assessment.description && (
              <p className="text-sm text-muted-foreground mb-2">{assessment.description}</p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconCalendar className="size-4" />
                <span className="text-xs sm:text-sm">
                  {assessment.startDate && format(new Date(assessment.startDate), "dd MMM yyyy")}
                  {" - "}
                  {assessment.endDate && format(new Date(assessment.endDate), "dd MMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <IconClipboardCheck className="size-4" />
                <span className="text-xs sm:text-sm">
                  {t('competenciesLabel', { completed: assessment.completedCompetencies, total: assessment.totalCompetencies })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="grid grid-cols-3 gap-4 flex-1">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('scoreAverage')}</p>
              <p className="text-lg font-semibold">
                {assessment.averageScore > 0 ? assessment.averageScore.toFixed(2) : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('scoreSelf')}</p>
              <p className="text-lg font-semibold">
                {assessment.selfScore > 0 ? assessment.selfScore.toFixed(2) : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('scoreSuperior')}</p>
              <p className="text-lg font-semibold">
                {assessment.superiorScore > 0 ? assessment.superiorScore.toFixed(2) : "-"}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => {
              if (dateStatus.status === t('statusOpen')) {
                handleStartAssessment(assessment.id)
              }
            }}
            variant={buttonConfig.variant}
            className={`w-full sm:w-auto ${buttonConfig.className}`}
            disabled={buttonConfig.disabled}
          >
            {buttonConfig.icon}
            {buttonConfig.text}
          </Button>
        </div>
      </div>
    </div>
  )
}