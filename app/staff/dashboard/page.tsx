"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { staffAPI, assessmentAPI, trainingAPI } from "@/lib/api"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

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

export default function StaffDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalCompetencies: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    trainingAttended: 0,
    upcomingTraining: 0
  })
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Assessments
            </CardTitle>
            <IconClipboardCheck className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAssessments}</div>
            <p className="text-xs text-muted-foreground">
              Assessments to complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Assessments
            </CardTitle>
            <IconChecks className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssessments}</div>
            <p className="text-xs text-muted-foreground">
              Total completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Sessions
            </CardTitle>
            <IconBriefcase className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trainingAttended}</div>
            <p className="text-xs text-muted-foreground">
              Training attended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Training
            </CardTitle>
            <IconCalendar className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingTraining}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
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
                          <Badge className={`${status.color} text-white text-xs`}>
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
                <CardTitle>Upcoming Training</CardTitle>
                <CardDescription>
                  Training sessions scheduled for you
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
            ) : upcomingTrainings.length > 0 ? (
              <div className="space-y-3">
                {upcomingTrainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{training.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(training.startDate), "dd MMM yyyy")} - {format(new Date(training.endDate), "dd MMM yyyy")}
                      </p>
                    </div>
                    <IconCalendar className="size-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IconCalendar className="size-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No upcoming training
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Shortcuts to common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/staff/assessments')}
            >
              <IconTrophy className="size-4" />
              View Assessments
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/staff/idp')}
            >
              <IconTarget className="size-4" />
              My IDP
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/staff/profile')}
            >
              <IconUser className="size-4" />
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}