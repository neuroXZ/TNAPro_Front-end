"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trainingAPI, trainingCompetencyAPI, competencyAPI, idpAPI, assessmentAPI } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { IconSchool, IconCalendar, IconTarget, IconClock, IconAlertCircle, IconSparkles } from "@tabler/icons-react"
import { format, isBefore, isAfter } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Training {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  competencies?: {
    id: string
    name: string
    code: string
  }[]
  isRecommended?: boolean
}

interface CompetencyGap {
  competencyId: string
  competencyName: string
  trainingName?: string
  gap: number
  developmentStrategies: {
    training: boolean
    coaching: boolean
    selfLearning: boolean
    workExperience: boolean
  }
}

interface IdpData {
  staffId: string
  staffName: string
  positionName: string
  competencyAnalysis: CompetencyGap[]
  generatedAt: string
}

type TrainingStatus = 'upcoming' | 'ongoing' | 'past'

export default function MyTraining() {
  const { user } = useAuth()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [idpData, setIdpData] = useState<IdpData | null>(null)
  const [hasIdpRecommendations, setHasIdpRecommendations] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
      setHasIdpRecommendations(false)

      // Fetch all trainings first
      const [trainingsData, allTrainingCompetencies, allCompetencies] = await Promise.all([
        trainingAPI.getAll(),
        trainingCompetencyAPI.getAll(),
        competencyAPI.getAll(),
      ])

      // Try to fetch IDP for personalized recommendations
      let recommendedCompetencyIds: string[] = []
      let idp: IdpData | null = null
      let idpSuccess = false

      try {
        // Fetch latest assessment
        const assessments = await assessmentAPI.getAll()
        const latestAssessment = assessments.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]

        if (latestAssessment) {
          // Try to generate IDP
          const idpResponse = await idpAPI.generate({
            staffId: user!.id,
            assessmentId: latestAssessment.id
          })
          idp = idpResponse.data
          setIdpData(idp)

          // Get recommended competency IDs from IDP
          if (idp && idp.competencyAnalysis) {
            recommendedCompetencyIds = idp.competencyAnalysis
              .filter(comp => comp.developmentStrategies.training === true)
              .map(comp => comp.competencyId)

            if (recommendedCompetencyIds.length > 0) {
              idpSuccess = true
              setHasIdpRecommendations(true)
            }

            console.log("IDP generated successfully. Recommended Competency IDs:", recommendedCompetencyIds)
          }
        } else {
          console.log("No assessment found - showing all trainings")
        }
      } catch (err: any) {
        console.error("IDP generation failed:", err)
        console.log("Falling back to show all trainings")
        // Continue without IDP - will show all trainings
        idpSuccess = false
        setHasIdpRecommendations(false)
      }

      // Enrich trainings with their competencies
      const enrichedTrainings = trainingsData.map((training: any) => {
        const trainingComps = allTrainingCompetencies.filter(
          (tc: any) => tc.trainingId === training.id
        )

        const competencies = trainingComps
          .map((tc: any) => {
            const comp = allCompetencies.find((c: any) => c.id === tc.competencyId)
            return comp ? {
              id: comp.id,
              name: comp.name,
              code: comp.code
            } : null
          })
          .filter(Boolean)

        // Check if any competency in this training is recommended
        const isRecommended = idpSuccess && recommendedCompetencyIds.length > 0 
          ? competencies.some((comp: any) => recommendedCompetencyIds.includes(comp.id))
          : false

        return {
          ...training,
          competencies,
          isRecommended
        }
      })

      // Filter: Only filter if IDP was successful AND has recommendations
      const filteredTrainings = idpSuccess && recommendedCompetencyIds.length > 0
        ? enrichedTrainings.filter((training: Training) => training.isRecommended)
        : enrichedTrainings

      console.log("IDP Success:", idpSuccess)
      console.log("Recommended Competency IDs count:", recommendedCompetencyIds.length)
      console.log("Filtered Trainings count:", filteredTrainings.length)

      setTrainings(filteredTrainings)
    } catch (error: any) {
      console.error("Failed to fetch trainings:", error)
      setError("Failed to load training programs")
      toast.error("Failed to load training programs")
    } finally {
      setIsLoading(false)
    }
  }

  const getTrainingStatus = (training: Training): TrainingStatus => {
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
        <div>
          <h1 className="text-3xl font-bold">Training Programs</h1>
          <p className="text-muted-foreground mt-1">
            Loading your training programs...
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span>Loading training programs...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Training Programs</h1>
          <p className="text-muted-foreground mt-1">
            Available training programs
          </p>
        </div>
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const upcomingCount = filterTrainingsByStatus('upcoming').length
  const ongoingCount = filterTrainingsByStatus('ongoing').length
  const pastCount = filterTrainingsByStatus('past').length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {hasIdpRecommendations && <IconSparkles className="size-8 text-primary" />}
          {hasIdpRecommendations ? "Recommended Training Programs" : "Training Programs"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {hasIdpRecommendations 
            ? "Personalized training recommendations based on your competency gaps"
            : "Available training programs to enhance your competencies"
          }
        </p>
      </div>

      {idpData && hasIdpRecommendations && (
        <Alert className="border-primary/50 bg-primary/5">
          <IconTarget className="h-4 w-4 text-primary" />
          <AlertDescription className="ml-2">
            <strong>IDP Generated:</strong> Based on your assessment results, we've identified{" "}
            <strong>{idpData.competencyAnalysis.filter(c => c.developmentStrategies.training).length}</strong>{" "}
            competencies that would benefit from formal training programs.
          </AlertDescription>
        </Alert>
      )}

      {!hasIdpRecommendations && trainings.length > 0 && (
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Showing all available trainings. Complete your assessments to get personalized recommendations.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {hasIdpRecommendations ? <IconSparkles className="size-4 text-primary" /> : <IconSchool className="size-4" />}
              {hasIdpRecommendations ? "Recommended" : "Total Programs"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasIdpRecommendations ? "Programs matched to your needs" : "Available programs"}
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
                {hasIdpRecommendations 
                  ? "No training programs currently recommended"
                  : "No training programs available"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {hasIdpRecommendations
                  ? "Great job! Your competency levels are meeting requirements, or there are no matching training programs available at this time."
                  : "Please check back later for new training opportunities."
                }
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
                <Badge variant="secondary" className="ml-1">
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
  trainings: Training[]
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
        return <Badge variant="secondary">Past</Badge>
    }
  }

  return (
    <div className="grid gap-4">
      {trainings.map((training) => (
        <Card key={training.id} className={training.isRecommended ? "border-primary/20 shadow-sm hover:shadow-md transition-shadow" : ""}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {training.isRecommended && <IconSparkles className="size-5 text-primary" />}
                  <CardTitle>{training.name}</CardTitle>
                  {getStatusBadge(status)}
                  {training.isRecommended && (
                    <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                      <IconTarget className="size-3" />
                      Recommended
                    </Badge>
                  )}
                </div>
                {training.description && (
                  <CardDescription className="mt-2">
                    {training.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <IconCalendar className="size-4" />
                <span>
                  {format(new Date(training.startDate), "dd MMM yyyy")} - {format(new Date(training.endDate), "dd MMM yyyy")}
                </span>
              </div>
              {training.competencies && training.competencies.length > 0 && (
                <div className="flex items-center gap-1">
                  <IconTarget className="size-4" />
                  <span>{training.competencies.length} Competencies</span>
                </div>
              )}
            </div>
          </CardHeader>
          {training.competencies && training.competencies.length > 0 && (
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Competencies Covered:</p>
                <div className="flex flex-wrap gap-2">
                  {training.competencies.map((comp) => (
                    <Badge key={comp.id} variant="outline" className={training.isRecommended ? "border-primary/30" : ""}>
                      {comp.code} - {comp.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}