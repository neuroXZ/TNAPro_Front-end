"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { trainingAPI, competencyAPI, trainingCompetencyAPI } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconPlus, IconTrash, IconEye } from "@tabler/icons-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { CompetencyViewDialog } from "./competency-view-dialog"
import { CompetencyDeleteDialog } from "./competency-delete-dialog"

interface Training {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
}

interface Cluster {
  id: string
  name: string
  color?: string
}

interface Competency {
  id: string
  name: string
  description?: string
  clusterId?: string
  cluster?: Cluster
}

interface TrainingCompetency {
  id: string
  trainingId: string
  competencyId: string
  competency: Competency
}

interface GroupedCompetencies {
  [clusterId: string]: {
    cluster: Cluster | null
    competencies: Array<{
      competency: Competency
      trainingCompetency?: TrainingCompetency
    }>
  }
}

export default function TrainingCompetencyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const trainingId = params.id as string

  const [training, setTraining] = useState<Training | null>(null)
  const [allCompetencies, setAllCompetencies] = useState<Competency[]>([])
  const [trainingCompetencies, setTrainingCompetencies] = useState<TrainingCompetency[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null)
  const [selectedTrainingCompetency, setSelectedTrainingCompetency] = useState<TrainingCompetency | null>(null)

  useEffect(() => {
    fetchData()
  }, [trainingId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [trainingData, competenciesData, trainingCompetenciesData] = await Promise.all([
        trainingAPI.getById(trainingId),
        competencyAPI.getAll(),
        trainingCompetencyAPI.getByTraining(trainingId),
      ])
      setTraining(trainingData)
      setAllCompetencies(competenciesData)
      setTrainingCompetencies(trainingCompetenciesData)
    } catch (error) {
      toast.error("Failed to fetch data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const groupCompetenciesByCluster = (): GroupedCompetencies => {
    const grouped: GroupedCompetencies = {}

    allCompetencies.forEach((competency) => {
      const clusterId = competency.clusterId || "uncategorized"
      
      if (!grouped[clusterId]) {
        grouped[clusterId] = {
          cluster: competency.cluster || null,
          competencies: [],
        }
      }

      const trainingComp = trainingCompetencies.find(
        (tc) => tc.competencyId === competency.id
      )

      grouped[clusterId].competencies.push({
        competency,
        trainingCompetency: trainingComp,
      })
    })

    return grouped
  }

  const handleAdd = async (competency: Competency) => {
    try {
      await trainingCompetencyAPI.create({
        trainingId,
        competencyId: competency.id,
      })
      toast.success("Competency added successfully")
      await fetchData()
    } catch (error) {
      toast.error("Failed to add competency")
      console.error(error)
    }
  }

  const handleView = (competency: Competency, trainingCompetency?: TrainingCompetency) => {
    setSelectedCompetency(competency)
    setSelectedTrainingCompetency(trainingCompetency || null)
    setIsViewDialogOpen(true)
  }

  const handleDelete = (trainingCompetency: TrainingCompetency) => {
    setSelectedTrainingCompetency(trainingCompetency)
    setSelectedCompetency(trainingCompetency.competency)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await trainingCompetencyAPI.delete(selectedTrainingCompetency!.id)
      toast.success("Competency removed successfully")
      await fetchData()
    } catch (error) {
      toast.error("Failed to remove competency")
      console.error(error)
    }
  }

  const groupedCompetencies = groupCompetenciesByCluster()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/training-competencies")}
        >
          <IconArrowLeft className="mr-2 size-4" />
          Back to Trainings
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{training?.name}</h1>
          <p className="text-muted-foreground">
            {training?.startDate && `${new Date(training.startDate).toLocaleDateString()} - `}
            {training?.endDate && new Date(training.endDate).toLocaleDateString()}
            {training?.startDate && training?.endDate && " • "}
            {trainingCompetencies.length} {trainingCompetencies.length === 1 ? "competency" : "competencies"} assigned
          </p>
        </div>
      </div>

      <Tabs defaultValue={Object.keys(groupedCompetencies)[0]} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(groupedCompetencies).length}, minmax(0, 1fr))` }}>
          {Object.entries(groupedCompetencies).map(([clusterId, { cluster, competencies }]) => (
            <TabsTrigger key={clusterId} value={clusterId} className="gap-2">
              {cluster?.color && (
                <div
                  className="size-3 rounded"
                  style={{ backgroundColor: cluster.color }}
                />
              )}
              {cluster?.name || "Uncategorized"}
              <Badge variant="secondary" className="ml-1">
                {competencies.filter((c) => c.trainingCompetency).length}/{competencies.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupedCompetencies).map(([clusterId, { cluster, competencies }]) => (
          <TabsContent key={clusterId} value={clusterId} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {cluster?.color && (
                    <div
                      className="size-4 rounded"
                      style={{ backgroundColor: cluster.color }}
                    />
                  )}
                  <CardTitle>{cluster?.name || "Uncategorized"}</CardTitle>
                  <Badge variant="secondary">
                    {competencies.filter((c) => c.trainingCompetency).length} / {competencies.length}
                  </Badge>
                </div>
                <CardDescription>
                  {competencies.filter((c) => c.trainingCompetency).length} competencies taught in this training
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {competencies.map(({ competency, trainingCompetency }) => (
                    <div
                      key={competency.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {trainingCompetency ? (
                          <Badge variant="default">✓ Added</Badge>
                        ) : (
                          <Badge variant="outline">Not Added</Badge>
                        )}
                        <div>
                          <p className="font-medium">{competency.name}</p>
                          {competency.description && (
                            <p className="text-sm text-muted-foreground">
                              {competency.description.split(" ").slice(0, 5).join(" ")}
                              {competency.description.split(" ").length > 5 && "..."}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {trainingCompetency ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(competency, trainingCompetency)}
                            >
                              <IconEye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(trainingCompetency)}
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdd(competency)}
                          >
                            <IconPlus className="mr-2 size-4" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <CompetencyViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        competency={selectedCompetency}
        trainingCompetency={selectedTrainingCompetency}
      />

      <CompetencyDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        competency={selectedCompetency}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
