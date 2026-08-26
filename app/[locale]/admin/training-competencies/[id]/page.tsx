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
import { IconArrowLeft, IconPlus, IconTrash, IconEye, IconTrashX, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { CompetencyViewDialog } from "@/features/admin/training-competencies/[id]/components/competency-view-dialog"
import { CompetencyDeleteDialog } from "@/features/admin/training-competencies/[id]/components/competency-delete-dialog"
import { useTranslations } from "next-intl"

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
  const t = useTranslations('AdminTrainingCompetenciesDetailPage')
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
  }, [trainingId])

  // Set initial active tab after data loads
  useEffect(() => {
    const groupedKeys = Object.keys(groupCompetenciesByCluster())
    if (!activeTab && groupedKeys.length > 0) {
      setActiveTab(groupedKeys[0])
    }
  }, [trainingCompetencies, allCompetencies])

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
      toast.error(t('fetchError'))
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

      // Filter by search query
      const matchesSearch = !searchQuery || 
        competency.name.toLowerCase().includes(searchQuery.toLowerCase())

      if (matchesSearch) {
        grouped[clusterId].competencies.push({
          competency,
          trainingCompetency: trainingComp,
        })
      }
    })

    // Remove empty clusters
    Object.keys(grouped).forEach((clusterId) => {
      if (grouped[clusterId].competencies.length === 0) {
        delete grouped[clusterId]
      }
    })

    return grouped
  }

  const handleAdd = async (competency: Competency) => {
    try {
      await trainingCompetencyAPI.create({
        trainingId,
        competencyId: competency.id,
      })
      toast.success(t('competencyAdded'))
      await fetchData()
    } catch (error) {
      toast.error(t('addError'))
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
      toast.success(t('competencyRemoved'))
      await fetchData()
    } catch (error) {
      toast.error(t('removeError'))
      console.error(error)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleCompetencySelection = (id: string) => {
    setSelectedCompetencyIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (competencies: Array<{ trainingCompetency?: TrainingCompetency }>) => {
    const assignedIds = competencies
      .filter(c => c.trainingCompetency)
      .map(c => c.trainingCompetency!.id)
    
    if (selectedIds.length === assignedIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(assignedIds)
    }
  }

  const toggleSelectAllNotAdded = (competencies: Array<{ competency: Competency; trainingCompetency?: TrainingCompetency }>) => {
    const notAddedIds = competencies
      .filter(c => !c.trainingCompetency)
      .map(c => c.competency.id)
    
    if (selectedCompetencyIds.length === notAddedIds.length) {
      setSelectedCompetencyIds([])
    } else {
      setSelectedCompetencyIds(notAddedIds)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error(t('noCompetenciesSelected'))
      return
    }

    if (!confirm(selectedIds.length === 1 ? t('confirmRemoveSingle') : t('confirmRemoveMultiple', { count: selectedIds.length }))) {
      return
    }

    try {
      setIsBulkDeleting(true)
      await Promise.all(
        selectedIds.map(id => trainingCompetencyAPI.delete(id))
      )
      toast.success(selectedIds.length === 1 ? t('removedSingle') : t('removedMultiple', { count: selectedIds.length }))
      setSelectedIds([])
      await fetchData()
    } catch (error) {
      toast.error(t('removeError'))
      console.error(error)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkAdd = async () => {
    if (selectedCompetencyIds.length === 0) {
      toast.error(t('noCompetenciesSelected'))
      return
    }

    try {
      setIsBulkAdding(true)
      await Promise.all(
        selectedCompetencyIds.map(competencyId => 
          trainingCompetencyAPI.create({
            trainingId,
            competencyId,
          })
        )
      )
      toast.success(selectedCompetencyIds.length === 1 ? t('addedSingle') : t('addedMultiple', { count: selectedCompetencyIds.length }))
      setSelectedCompetencyIds([])
      await fetchData()
    } catch (error) {
      toast.error(t('addError'))
      console.error(error)
    } finally {
      setIsBulkAdding(false)
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
          {t('backToTrainings')}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{training?.name}</h1>
          <p className="text-muted-foreground">
            {training?.startDate && `${new Date(training.startDate).toLocaleDateString()} - `}
            {training?.endDate && new Date(training.endDate).toLocaleDateString()}
            {training?.startDate && training?.endDate && " • "}
            {t('assignedCompetencies', { count: trainingCompetencies.length })}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex gap-4">
          <div className="w-64 space-y-4">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <TabsList className="flex flex-col h-fit w-full">
              {Object.entries(groupedCompetencies).map(([clusterId, { cluster, competencies }]) => (
                <TabsTrigger key={clusterId} value={clusterId} className="justify-start gap-3 w-full">
                  {cluster?.color && (
                    <div
                      className="size-4 rounded shrink-0"
                      style={{ backgroundColor: cluster.color }}
                    />
                  )}
                  <span className="flex-1 text-left truncate">{cluster?.name || t('uncategorized')}</span>
                  <Badge className="ml-auto">
                    {competencies.filter((c) => c.trainingCompetency).length}/{competencies.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1">
            {Object.entries(groupedCompetencies).map(([clusterId, { cluster, competencies }]) => (
              <TabsContent key={clusterId} value={clusterId} className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cluster?.color && (
                          <div
                            className="size-4 rounded"
                            style={{ backgroundColor: cluster.color }}
                          />
                        )}
                        <CardTitle>{cluster?.name || t('uncategorized')}</CardTitle>
                        <Badge>
                          {competencies.filter((c) => c.trainingCompetency).length} / {competencies.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCompetencyIds.length > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleBulkAdd}
                            disabled={isBulkAdding}
                          >
                            <IconPlus className="mr-2 size-4" />
                        {t('addSelected', { count: selectedCompetencyIds.length })}
                          </Button>
                        )}
                        {selectedIds.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                          >
                            <IconTrashX className="mr-2 size-4" />
                        {t('deleteSelected', { count: selectedIds.length })}
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {t('totalTaught', { count: competencies.filter((c) => c.trainingCompetency).length })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(competencies.filter(c => !c.trainingCompetency).length > 0 || competencies.filter(c => c.trainingCompetency).length > 0) && (
                      <div className="mb-3 flex items-center gap-6 border-b pb-2">
                        {competencies.filter(c => !c.trainingCompetency).length > 0 && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                competencies.filter(c => !c.trainingCompetency).length > 0 &&
                                selectedCompetencyIds.length === competencies.filter(c => !c.trainingCompetency).length
                              }
                              onCheckedChange={() => toggleSelectAllNotAdded(competencies)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {t('selectAllNotAdded')}
                            </span>
                          </div>
                        )}
                        {competencies.filter(c => c.trainingCompetency).length > 0 && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={
                                competencies.filter(c => c.trainingCompetency).length > 0 &&
                                selectedIds.length === competencies.filter(c => c.trainingCompetency).length
                              }
                              onCheckedChange={() => toggleSelectAll(competencies)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {t('selectAllAssigned')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {competencies.map(({ competency, trainingCompetency }) => (
                        <div
                          key={competency.id}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            {trainingCompetency ? (
                              <Checkbox
                                checked={selectedIds.includes(trainingCompetency.id)}
                                onCheckedChange={() => toggleSelection(trainingCompetency.id)}
                              />
                            ) : (
                              <Checkbox
                                checked={selectedCompetencyIds.includes(competency.id)}
                                onCheckedChange={() => toggleCompetencySelection(competency.id)}
                              />
                            )}
                            {trainingCompetency ? (
                              <Badge variant="default">{t('badgeAdded')}</Badge>
                            ) : (
                              <Badge variant="outline">{t('badgeNotAdded')}</Badge>
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
                                {t('actionAdd')}
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
          </div>
        </div>
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
