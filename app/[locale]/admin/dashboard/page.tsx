"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  staffAPI, 
  assessmentAPI, 
  assessmentResultAPI, 
  assessorAPI,
  positionAPI,
  unitAPI,
  competencyAPI
} from "@/lib/api"
import { 
  IconUsers, 
  IconClipboardCheck, 
  IconTrendingUp, 
  IconAlertCircle,
  IconBuilding,
  IconBriefcase,
  IconTarget,
  IconClock,
  IconInfoCircle
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DashboardStats {
  totalStaff: number
  activeAssessments: number
  pendingEvaluations: number
  totalPositions: number
  totalUnits: number
  averageScore: number
  overdueAssessments: number
}

export default function AdminDashboard() {
  const t = useTranslations('AdminDashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    activeAssessments: 0,
    pendingEvaluations: 0,
    totalPositions: 0,
    totalUnits: 0,
    averageScore: 0,
    overdueAssessments: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)

      const [
        staffData,
        assessmentData,
        assessmentResults,
        assessorsData,
        positionsData,
        unitsData
      ] = await Promise.all([
        staffAPI.getAll(),
        assessmentAPI.getAll(),
        assessmentResultAPI.getAll(),
        assessorAPI.getAll(),
        positionAPI.getAll(),
        unitAPI.getAll()
      ])

      // Calculate active assessments (within date range)
      const currentDate = new Date()
      const activeAssessments = assessmentData.filter((assessment: any) => {
        const startDate = new Date(assessment.startDate)
        const endDate = new Date(assessment.endDate)
        return currentDate >= startDate && currentDate <= endDate
      })

      // Calculate overdue assessments
      const overdueAssessments = assessmentData.filter((assessment: any) => {
        const endDate = new Date(assessment.endDate)
        return currentDate > endDate
      })

      // Calculate pending evaluations (assessments with partial results)
      const staffWithResults = new Set(assessmentResults.map((result: any) => result.assessorId))
      const totalAssessors = assessorsData.length
      const pendingEvaluations = Math.max(0, totalAssessors - staffWithResults.size)

      // Calculate average score - only from submitted assessments
      const validScores = assessmentResults.filter((result: any) => 
        result.score !== null && result.score !== undefined && result.score > 0 && result.status === 'SUBMITTED'
      )
      const averageScore = validScores.length > 0
        ? validScores.reduce((sum: number, result: any) => sum + result.score, 0) / validScores.length
        : 0

      setStats({
        totalStaff: staffData.length,
        activeAssessments: activeAssessments.length,
        pendingEvaluations,
        totalPositions: positionsData.length,
        totalUnits: unitsData.length,
        averageScore: Math.round(averageScore * 100) / 100,
        overdueAssessments: overdueAssessments.length
      })

    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitleFull')}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('totalStaff')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t('totalStaff')}</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>{t('totalStaffInfo')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('totalStaffInfoFull')}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {t('totalStaffSub')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('activeAssessments')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t('activeAssessments')}</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>{t('activeAssessmentsInfo')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('activeAssessmentsInfoFull')}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <IconClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {t('activeAssessmentsSub')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('pendingEvaluations')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t('pendingEvaluations')}</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>{t('pendingEvaluationsInfo')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('pendingEvaluationsInfoFull')}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              {t('pendingEvaluationsSub')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('totalPositions')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t('totalPositions')}</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>{t('totalPositionsInfo')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('totalPositionsInfoFull')}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              {t('totalPositionsSub')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('totalUnits')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t('totalUnits')}</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>{t('totalUnitsInfo')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('totalUnitsInfoFull')}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              {t('totalUnitsSub')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('averageScore')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t('averageScore')}</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>{t('averageScoreInfo')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('averageScoreInfoFull')}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <IconTarget className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.averageScore}</div>
            <p className="text-xs text-muted-foreground">
              {t('averageScoreSub')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{t('overdueAssessments')}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t('overdueAssessments')}</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>{t('overdueAssessmentsInfo')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('overdueAssessmentsInfoFull')}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {t('overdueAssessmentsSub')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables Preview */}
      <DataTablesPreview />

      {/* Status Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('systemStatus')}</CardTitle>
            <CardDescription>{t('systemStatusDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('activeAssessments')}</span>
              <Badge variant={stats.activeAssessments > 0 ? "default" : "secondary"}>
                {stats.activeAssessments > 0 ? t('running') : t('noneActive')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('overdueItemsLabel')}</span>
              <Badge variant={stats.overdueAssessments === 0 ? "default" : "destructive"}>
                {stats.overdueAssessments === 0 ? t('allCurrent') : t('overdueCount', { count: stats.overdueAssessments })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('quickActions')}</CardTitle>
            <CardDescription>{t('quickActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-muted text-sm">
              {t('createAssessment')}
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted text-sm">
              {t('importStaff')}
            </button>
            <Link href="/admin/analytics/executive-summary" className="block w-full text-left p-2 rounded hover:bg-muted text-sm">
              {t('generateReports')}
            </Link>
            <button className="w-full text-left p-2 rounded hover:bg-muted text-sm">
              {t('systemSettings')}
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('recentActivity')}</CardTitle>
            <CardDescription>{t('recentActivityDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• {t('newRegistrations')}</div>
              <div>• {t('pendingApprovals', { count: stats.pendingEvaluations })}</div>
              <div>• {stats.overdueAssessments > 0 ? t('systemAlertsCount', { count: stats.overdueAssessments }) : t('systemAlertsNone')}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Data Tables Preview Component
function DataTablesPreview() {
  const t = useTranslations('AdminDashboard')
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([])
  const [lowPerformingAreas, setLowPerformingAreas] = useState<any[]>([])
  const [staffWithoutPositions, setStaffWithoutPositions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPreviewData()
  }, [])

  const fetchPreviewData = async () => {
    try {
      const [
        assessments,
        assessmentResults,
        staffData,
        competenciesData
      ] = await Promise.all([
        assessmentAPI.getAll(),
        assessmentResultAPI.getAll(),
        staffAPI.getAll(),
        competencyAPI.getAll()
      ])

      // Upcoming Assessment Deadlines (next 7 days)
      const currentDate = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(currentDate.getDate() + 7)
      
      const upcoming = assessments
        .filter((assessment: any) => {
          const endDate = new Date(assessment.endDate)
          return endDate >= currentDate && endDate <= nextWeek
        })
        .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        .slice(0, 5)

      setUpcomingDeadlines(upcoming)

      // Low Performing Areas (competencies with average score < 3) - only from submitted assessments
      const competencyScores: Record<string, number[]> = {}
      
      assessmentResults.forEach((result: any) => {
        if (result.score && result.score > 0 && result.status === 'SUBMITTED') {
          if (!competencyScores[result.competencyId]) {
            competencyScores[result.competencyId] = []
          }
          competencyScores[result.competencyId].push(result.score)
        }
      })

      const lowPerforming = Object.entries(competencyScores)
        .map(([competencyId, scores]) => {
          const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
          const competency = competenciesData.find((c: any) => c.id === competencyId)
          return {
            id: competencyId,
            name: competency?.name || 'Unknown',
            code: competency?.code || 'N/A',
            averageScore: Math.round(average * 100) / 100,
            assessmentCount: scores.length
          }
        })
        .filter(item => item.averageScore < 3)
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 5)

      setLowPerformingAreas(lowPerforming)

      // Staff Without Positions
      const unassigned = staffData
        .filter((staff: any) => !staff.positionId)
        .slice(0, 5)

      setStaffWithoutPositions(unassigned)

    } catch (error) {
      console.error("Failed to fetch preview data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-3 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Upcoming Assessment Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconClock className="h-4 w-4" />
            {t('upcomingDeadlines')}
          </CardTitle>
          <CardDescription>{t('upcomingDeadlinesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noUpcomingDeadlines')}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((assessment: any) => {
                const endDate = new Date(assessment.endDate)
                const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={assessment.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{assessment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('endsLabel')} {endDate.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={daysLeft <= 2 ? "destructive" : daysLeft <= 5 ? "secondary" : "outline"}>
                      {t('daysLeft', { count: daysLeft })}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Performing Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconAlertCircle className="h-4 w-4" />
            {t('lowPerformingAreas')}
          </CardTitle>
          <CardDescription>{t('lowPerformingAreasDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {lowPerformingAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noLowPerforming')}
            </p>
          ) : (
            <div className="space-y-3">
              {lowPerformingAreas.map((competency: any) => (
                <div key={competency.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{competency.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {competency.code} • {t('assessmentCount', { count: competency.assessmentCount })}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {competency.averageScore}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Without Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconUsers className="h-4 w-4" />
            {t('unassignedStaff')}
          </CardTitle>
          <CardDescription>{t('unassignedStaffDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {staffWithoutPositions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('allAssigned')}
            </p>
          ) : (
            <div className="space-y-3">
              {staffWithoutPositions.map((staff: any) => (
                <div key={staff.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('idLabel')} {staff.orgId || staff.id}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {t('unassigned')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}