"use client"

import { useEffect, useState } from "react"
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

      // Calculate average score
      const validScores = assessmentResults.filter((result: any) => 
        result.score !== null && result.score !== undefined && result.score > 0
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
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your TNAPro system
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
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your TNAPro system performance and key metrics
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Total Staff</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>Total number of registered employees in the system.</p>
                      <p className="text-xs text-muted-foreground">
                        This includes all staff members who have been added to the TNAPro system, regardless of their position assignment status.
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
              Registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Active Assessments</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>Number of assessments currently within their assessment period.</p>
                      <p className="text-xs text-muted-foreground">
                        These are assessments where the current date falls between the start date and end date, meaning staff can actively participate in them.
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
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Pending Evaluations</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>Number of assessors who haven't completed their evaluations yet.</p>
                      <p className="text-xs text-muted-foreground">
                        This includes self-assessments, superior evaluations, and peer reviews that are still incomplete. Requires follow-up action.
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
              Awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Total Positions</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>Total number of job positions configured in the system.</p>
                      <p className="text-xs text-muted-foreground">
                        Each position has specific competency requirements. Staff members are assigned to positions to determine their required competencies for assessment.
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
              Available positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Total Units</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>Total number of organizational units in your company structure.</p>
                      <p className="text-xs text-muted-foreground">
                        Units represent departments, divisions, or teams. Staff members belong to units for organizational hierarchy and reporting purposes.
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
              Organizational units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Average Score</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>System-wide average competency score across all completed assessments.</p>
                      <p className="text-xs text-muted-foreground">
                        Calculated from all valid assessment scores. Helps track overall competency performance and identify areas for organizational improvement.
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
              System-wide average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Overdue Assessments</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:bg-muted rounded-full p-1 transition-colors">
                    <IconInfoCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Overdue Assessments</DialogTitle>
                    <DialogDescription className="space-y-2">
                      <p>Number of assessments that have passed their end date.</p>
                      <p className="text-xs text-muted-foreground">
                        These assessments are no longer accepting submissions. Consider extending deadlines or following up on incomplete assessments.
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
              Past deadline
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
            <CardTitle className="text-lg">System Status</CardTitle>
            <CardDescription>Current system health indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Assessments</span>
              <Badge variant={stats.activeAssessments > 0 ? "default" : "secondary"}>
                {stats.activeAssessments > 0 ? "Running" : "None Active"}
              </Badge>
            </div>
            {/* <div className="flex items-center justify-between">
              <span className="text-sm">Completion Rate</span>
              <Badge variant={stats.completionRate >= 75 ? "default" : stats.completionRate >= 50 ? "secondary" : "destructive"}>
                {stats.completionRate >= 75 ? "Good" : stats.completionRate >= 50 ? "Fair" : "Low"}
              </Badge>
            </div> */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Overdue Items</span>
              <Badge variant={stats.overdueAssessments === 0 ? "default" : "destructive"}>
                {stats.overdueAssessments === 0 ? "All Current" : `${stats.overdueAssessments} Overdue`}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-muted text-sm">
              → Create New Assessment
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted text-sm">
              → Import Staff Data
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted text-sm">
              → Generate Reports
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted text-sm">
              → System Settings
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              {/* <div>• Assessment submissions: {stats.completionRate > 0 ? 'Active' : 'None today'}</div> */}
              <div>• New staff registrations: Monitoring</div>
              <div>• Pending approvals: {stats.pendingEvaluations} items</div>
              <div>• System alerts: {stats.overdueAssessments > 0 ? `${stats.overdueAssessments} overdue` : 'None'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Data Tables Preview Component
function DataTablesPreview() {
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

      // Low Performing Areas (competencies with average score < 3)
      const competencyScores: Record<string, number[]> = {}
      
      assessmentResults.forEach((result: any) => {
        if (result.score && result.score > 0) {
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
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>Assessments ending within 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No upcoming deadlines
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
                        Ends: {endDate.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={daysLeft <= 2 ? "destructive" : daysLeft <= 5 ? "secondary" : "outline"}>
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''}
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
            Low Performing Areas
          </CardTitle>
          <CardDescription>Competencies with scores below 3.0</CardDescription>
        </CardHeader>
        <CardContent>
          {lowPerformingAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No low performing areas identified
            </p>
          ) : (
            <div className="space-y-3">
              {lowPerformingAreas.map((competency: any) => (
                <div key={competency.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{competency.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {competency.code} • {competency.assessmentCount} assessments
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
            Unassigned Staff
          </CardTitle>
          <CardDescription>Staff members without position assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {staffWithoutPositions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All staff have assigned positions
            </p>
          ) : (
            <div className="space-y-3">
              {staffWithoutPositions.map((staff: any) => (
                <div key={staff.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {staff.orgId || staff.id}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    Unassigned
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