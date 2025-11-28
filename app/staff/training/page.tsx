"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { rtnAPI, assessmentAPI } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { IconSchool, IconCalendar, IconTarget, IconClock, IconAlertCircle, IconSparkles, IconDownload } from "@tabler/icons-react"
import { format, isBefore, isAfter } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RecommendedTraining {
  trainingId: string
  trainingName: string
  startDate: string
  endDate: string
  relatedCompetency: {
    competencyId: string
    competencyName: string
    clusterName: string
    requiredLevel: number
    weightedGap: number
  }
}

interface RtnReport {
  staffId: string
  staffName: string
  positionName: string
  assessmentId: string
  results: RecommendedTraining[]
  generatedAt: string
}

type TrainingStatus = 'upcoming' | 'ongoing' | 'past'

// Group trainings by training ID to avoid duplicates
interface GroupedTraining {
  trainingId: string
  trainingName: string
  startDate: string
  endDate: string
  competencies: {
    competencyId: string
    competencyName: string
    clusterName: string
    requiredLevel: number
    weightedGap: number
  }[]
}

export default function MyTraining() {
  const { user } = useAuth()
  const [trainings, setTrainings] = useState<GroupedTraining[]>([])
  const [rtnReport, setRtnReport] = useState<RtnReport | null>(null)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState<TrainingStatus>('ongoing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch latest assessment
      const assessments = await assessmentAPI.getAll()
      const latestAssessment = assessments.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]

      if (!latestAssessment) {
        setError("No assessment found. Please complete an assessment first.")
        setIsLoading(false)
        return
      }

      setSelectedAssessmentId(latestAssessment.id)

      // Fetch RTN report
      const report = await rtnAPI.getReport({
        staffId: user!.id,
        assessmentId: latestAssessment.id
      })

      setRtnReport(report)

      // Group trainings by trainingId to avoid duplicates
      const trainingMap = new Map<string, GroupedTraining>()
      
      report.results.forEach((item: RecommendedTraining) => {
        if (trainingMap.has(item.trainingId)) {
          // Add competency to existing training
          trainingMap.get(item.trainingId)!.competencies.push(item.relatedCompetency)
        } else {
          // Create new training entry
          trainingMap.set(item.trainingId, {
            trainingId: item.trainingId,
            trainingName: item.trainingName,
            startDate: item.startDate,
            endDate: item.endDate,
            competencies: [item.relatedCompetency]
          })
        }
      })

      setTrainings(Array.from(trainingMap.values()))
      
    } catch (error: any) {
      console.error("Failed to fetch recommended trainings:", error)
      if (error.response?.status === 404) {
        setError("No training recommendations found. Your competency levels are meeting requirements!")
        setTrainings([])
      } else {
        setError(error.response?.data?.error || "Failed to load recommended training programs")
        toast.error("Failed to load recommended training programs")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (!selectedAssessmentId || !user?.id) return
    
    try {
      setIsExporting(true)
      const response = await rtnAPI.export({
        staffId: user.id,
        assessmentId: selectedAssessmentId
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
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error("Failed to export training report")
    } finally {
      setIsExporting(false)
    }
  }

  const getTrainingStatus = (training: GroupedTraining): TrainingStatus => {
    const now = new Date()
    const start = new Date(training.startDate)
    const end = new Date(training.endDate)

    if (isBefore(now, start)) return 'upcoming'
    if (isAfter(now, end)) return 'past'
    return 'ongoing'
  }

  const filterTrainingsByStatus = (status: TrainingStatus) => {
    return trainings.filter(training => getTrainingStatus(training) === status)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Recommended Training Programs</h1>
            <p className="text-muted-foreground mt-1">
              Loading your recommended training programs...
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span>Loading recommended training programs...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Recommended Training Programs</h1>
            <p className="text-muted-foreground mt-1">
              Training programs recommended based on your competency gaps
            </p>
          </div>
        </div>
        <Alert variant={trainings.length === 0 ? "default" : "destructive"}>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
          </AlertDescription>
        </Alert>
        {trainings.length === 0 && (
          <Button onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        )}
      </div>
    )
  }

  const upcomingCount = filterTrainingsByStatus('upcoming').length
  const ongoingCount = filterTrainingsByStatus('ongoing').length
  const pastCount = filterTrainingsByStatus('past').length

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">
            <IconSparkles className="size-8 text-primary" />
            Recommended Training Programs
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalized training recommendations based on your competency gaps
          </p>
          {rtnReport && (
            <p className="text-xs text-muted-foreground mt-1">
              Generated: {format(new Date(rtnReport.generatedAt), "dd MMM yyyy")}
            </p>
          )}
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || !rtnReport}
          className="gap-2"
        >
          <IconDownload className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Report"}
        </Button>
      </div>

      {/* {rtnReport && trainings.length > 0 && (
        <Alert className="border-primary/50 bg-primary/5">
          <IconTarget className="h-4 w-4 text-primary" />
          <AlertDescription className="ml-2">
            <strong>RTN Report:</strong> Based on your assessment, we've identified{" "}
            <strong>{trainings.length}</strong> training program(s) addressing{" "}
            <strong>{rtnReport.results.length}</strong> competency gap(s).
          </AlertDescription>
        </Alert>
      )} */}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconSparkles className="size-4 text-primary" />
              Recommended Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on competency gaps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconClock className="size-4" />
              Ongoing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ongoingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconCalendar className="size-4" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Starting soon
            </p>
          </CardContent>
        </Card>
      </div>

      {trainings.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <IconSchool className="size-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground font-medium">
                No training programs currently recommended
              </p>
              <p className="text-sm text-muted-foreground">
                Great job! Your competency levels are meeting requirements, or there are no matching training programs available at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TrainingStatus)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ongoing" className="gap-2">
              Ongoing
              {ongoingCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-green-600 text-white hover:bg-green-700">
                  {ongoingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-600 text-white hover:bg-blue-700">
                  {upcomingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              Past
              {pastCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-red-600 text-white hover:bg-red-700">
                  {pastCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="mt-4">
            <TrainingList trainings={filterTrainingsByStatus('ongoing')} status="ongoing" />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <TrainingList trainings={filterTrainingsByStatus('upcoming')} status="upcoming" />
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            <TrainingList trainings={filterTrainingsByStatus('past')} status="past" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

interface TrainingListProps {
  trainings: GroupedTraining[]
  status: TrainingStatus
}

function TrainingList({ trainings, status }: TrainingListProps) {
  if (trainings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No {status} training programs
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: TrainingStatus) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Upcoming</Badge>
      case 'ongoing':
        return <Badge className="bg-green-600 hover:bg-green-700">Ongoing</Badge>
      case 'past':
        return <Badge className="bg-red-600 hover:bg-red-700">Past</Badge>
    }
  }

  return (
    <div className="grid gap-4">
      {trainings.map((training) => (
        <Card key={training.trainingId} className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <IconSparkles className="size-5 text-primary" />
                  <CardTitle>{training.trainingName}</CardTitle>
                  {getStatusBadge(status)}
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                    <IconTarget className="size-3" />
                    Recommended
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <IconCalendar className="size-4" />
                <span>
                  {format(new Date(training.startDate), "dd MMM yyyy")} - {format(new Date(training.endDate), "dd MMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <IconTarget className="size-4" />
                <span>{training.competencies.length} Competenc{training.competencies.length === 1 ? 'y' : 'ies'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm font-medium">Addresses Competency Gaps:</p>
              <div className="space-y-2">
                {training.competencies.map((comp) => (
                  <div key={comp.competencyId} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-primary/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/30">
                          {comp.clusterName}
                        </Badge>
                        <span className="font-medium text-sm">{comp.competencyName}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Required Level: {comp.requiredLevel}</span>
                        <span className="text-orange-600 font-medium">Gap: {comp.weightedGap.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}