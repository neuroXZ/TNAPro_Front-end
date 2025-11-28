"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { assessmentAPI, assessorAPI, staffAPI, assessmentResultAPI, positionCompetencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconUsers, IconClipboardCheck, IconAlertCircle, IconCheck } from "@tabler/icons-react"
import { format } from "date-fns"

interface Assessment {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  weightageSuperior: number
}

interface Subordinate {
  id: string
  name: string
  email: string
  staffOrgId: string
  position?: {
    id: string
    name: string
  }
  assessorId: string
}

export default function SuperiorAssessmentsPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [subordinates, setSubordinates] = useState<Subordinate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [assessmentResults, setAssessmentResults] = useState<any[]>([])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUserId(userData.id)
        if (userData.id) {
          fetchData(userData.id)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
        toast.error("Authentication error")
        setIsLoading(false)
      }
    } else {
      toast.error("Please login to continue")
      setIsLoading(false)
    }
  }, [])

  const fetchData = async (staffId: string) => {
    try {
      setIsLoading(true)

      // Fetch assessments and all assessors
      const [assessmentsData, allAssessors, allStaff, allResults] = await Promise.all([
        assessmentAPI.getAll(),
        assessorAPI.getAll(),
        staffAPI.getAll(),
        assessmentResultAPI.getAll(),
      ])

      setAssessments(assessmentsData)

      console.log("=== SUPERIOR ASSESSMENT DEBUG ===")
      console.log("Current staffId (superior):", staffId)
      console.log("All assessors:", allAssessors)

      // Find assessor records where current user is the assessor (superior)
      // assessorId = current user (the superior)
      // staffId = subordinate being assessed
      const superiorAssessors = allAssessors.filter(
        (a: any) => 
          a.assessorId === staffId && 
          a.type?.toLowerCase() === 'superior' &&
          a.staffId
      )

      console.log("Superior assessor records:", superiorAssessors)

      // Get unique subordinates from assessor records (staffId is the subordinate)
      const subordinateIds = [...new Set(superiorAssessors.map((a: any) => a.staffId))]
      console.log("Subordinate IDs:", subordinateIds)
      
      const subordinatesData = subordinateIds
        .map(subId => {
          const staff = allStaff.find((s: any) => s.id === subId)
          const assessor = superiorAssessors.find((a: any) => a.staffId === subId)
          
          if (!staff) return null
          
          return {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            staffOrgId: staff.staffOrgId,
            position: staff.position,
            assessorId: assessor?.id || '',
          }
        })
        .filter(Boolean) as Subordinate[]

      console.log("Subordinates data:", subordinatesData)
      setSubordinates(subordinatesData)
      setAssessmentResults(allResults)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const isWithinPeriod = (assessment: Assessment) => {
    const now = new Date()
    const start = new Date(assessment.startDate)
    const end = new Date(assessment.endDate)
    return now >= start && now <= end
  }

  const checkAssessmentCompletion = async (assessmentId: string, subordinateId: string, assessorId: string) => {
    try {
      // Get subordinate info to get positionId
      const subordinate = subordinates.find(s => s.id === subordinateId)
      if (!subordinate?.position?.id) return { completed: 0, total: 0, isComplete: false }

      // Get position competencies count
      const positionCompetencies = await positionCompetencyAPI.getByPosition(subordinate.position.id)
      const totalCompetencies = positionCompetencies.length

      // Count how many results exist for this assessment + assessor + subordinate position
      const completedResults = assessmentResults.filter(
        (r: any) => 
          r.assessmentId === assessmentId && 
          r.assessorId === assessorId &&
          r.positionId === subordinate.position?.id &&
          r.score !== null
      )

      return {
        completed: completedResults.length,
        total: totalCompetencies,
        isComplete: completedResults.length === totalCompetencies && totalCompetencies > 0
      }
    } catch (error) {
      return { completed: 0, total: 0, isComplete: false }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Superior Assessments</h1>
          <p className="text-muted-foreground mt-1">
            Assess your subordinates' competencies
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (subordinates.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Superior Assessments</h1>
          <p className="text-muted-foreground mt-1">
            Assess your subordinates' competencies
          </p>
        </div>
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-yellow-800 dark:text-yellow-200">
              <IconAlertCircle className="size-12" />
              <div className="text-center">
                <p className="font-semibold text-lg">No Subordinates Found</p>
                <p className="text-sm mt-1">
                  You have not been assigned as a superior assessor for any staff members.
                </p>
                <p className="text-sm">
                  Please contact the admin to set up assessor relationships.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary">Superior Assessments</h1>
        <p className="text-muted-foreground mt-1">
          Assess your subordinates' competencies
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconUsers className="size-4" />
              Your Subordinates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subordinates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Staff members to assess
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconClipboardCheck className="size-4" />
              Active Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.filter(isWithinPeriod).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently available
            </p>
          </CardContent>
        </Card>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No assessments available
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={assessments[0]?.id} className="flex flex-row gap-4">
          <TabsList className="flex flex-col h-fit w-64 bg-muted p-2 shrink-0">
            {assessments.map((assessment) => {
              const withinPeriod = isWithinPeriod(assessment)
              return (
                <TabsTrigger
                  key={assessment.id}
                  value={assessment.id}
                  className="w-full justify-start text-left data-[state=active]:bg-background"
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{assessment.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(assessment.startDate), "dd MMM")} - {format(new Date(assessment.endDate), "dd MMM yyyy")}
                      </div>
                    </div>
                    <Badge 
                      variant={withinPeriod ? "default" : "secondary"}
                      className={`shrink-0 h-5 text-xs ${withinPeriod ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    >
                      {withinPeriod ? "Active" : "Closed"}
                    </Badge>
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {assessments.map((assessment) => {
            const withinPeriod = isWithinPeriod(assessment)
            
            return (
              <TabsContent key={assessment.id} value={assessment.id} className="flex-1 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>{assessment.name}</CardTitle>
                    {assessment.description && (
                      <CardDescription>{assessment.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span>
                        {format(new Date(assessment.startDate), "dd MMM yyyy")} - {format(new Date(assessment.endDate), "dd MMM yyyy")}
                      </span>
                      <Badge variant="outline">
                        Superior: {(assessment.weightageSuperior * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Select a subordinate to assess:</p>
                      <div className="grid gap-2">
                        {subordinates.map((subordinate) => {
                          // Check if assessment is completed for this subordinate
                          const subordinateResults = assessmentResults.filter(
                            (r: any) => 
                              r.assessmentId === assessment.id && 
                              r.assessorId === subordinate.assessorId &&
                              r.positionId === subordinate.position?.id &&
                              r.score !== null
                          )
                          
                          const isCompleted = subordinate.position?.id && subordinateResults.length > 0
                          
                          return (
                            <Button
                              key={subordinate.id}
                              variant="outline"
                              className="justify-start h-auto py-3"
                              onClick={() => router.push(`/staff/superior-assessments/${assessment.id}/${subordinate.id}`)}
                              disabled={!withinPeriod}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="text-left">
                                  <div className="font-semibold">{subordinate.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {subordinate.staffOrgId} • {subordinate.position?.name || 'No Position'}
                                  </div>
                                </div>
                                {withinPeriod && !isCompleted && (
                                  <Badge variant="destructive">Assess</Badge>
                                )}
                                {isCompleted && (
                                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
                                    <IconCheck className="size-3" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
