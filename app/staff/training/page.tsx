"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trainingAPI, trainingCompetencyAPI, competencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconSchool, IconCalendar, IconTarget, IconClock } from "@tabler/icons-react"
import { format, isBefore, isAfter } from "date-fns"

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
}

type TrainingStatus = 'upcoming' | 'ongoing' | 'past'

export default function MyTraining() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TrainingStatus>('ongoing')

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    try {
      setIsLoading(true)

      const [trainingsData, allTrainingCompetencies, allCompetencies] = await Promise.all([
        trainingAPI.getAll(),
        trainingCompetencyAPI.getAll(),
        competencyAPI.getAll(),
      ])

      console.log("Trainings:", trainingsData)
      console.log("Training Competencies:", allTrainingCompetencies)

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

        return {
          ...training,
          competencies
        }
      })

      setTrainings(enrichedTrainings)
    } catch (error) {
      console.error("Failed to fetch trainings:", error)
      toast.error("Failed to load trainings")
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
            Available training programs to enhance your competencies
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

  const upcomingCount = filterTrainingsByStatus('upcoming').length
  const ongoingCount = filterTrainingsByStatus('ongoing').length
  const pastCount = filterTrainingsByStatus('past').length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Training Programs</h1>
        <p className="text-muted-foreground mt-1">
          Available training programs to enhance your competencies
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconSchool className="size-4" />
              Total Trainings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available programs
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
              Currently running
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
            <div className="text-center text-muted-foreground">
              No training programs available
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
        <Card key={training.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{training.name}</CardTitle>
                  {getStatusBadge(status)}
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
                    <Badge key={comp.id} variant="outline">
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