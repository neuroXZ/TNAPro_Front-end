"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { positionAPI, competencyAPI, positionCompetencyAPI } from "@/lib/api"
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
import { IconArrowLeft, IconPlus, IconEdit, IconTrash, IconEye, IconTrashX, IconSearch, IconAlertTriangle } from "@tabler/icons-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { CompetencyLevelDialog } from "@/features/admin/position-competencies/[id]/components/competency-level-dialog"
import { CompetencyViewDialog } from "@/features/admin/position-competencies/[id]/components/competency-view-dialog"
import { CompetencyDeleteDialog } from "@/features/admin/position-competencies/[id]/components/competency-delete-dialog"
import { BulkLevelDialog } from "@/features/admin/position-competencies/[id]/components/bulk-level-dialog"
import { useTranslations } from "next-intl"

interface Position {
  id: string
  name: string
  grade?: { name: string }
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

interface PositionCompetency {
  id: string
  positionId: string
  competencyId: string
  level: number
  competency: Competency
}

interface GroupedCompetencies {
  [clusterId: string]: {
    cluster: Cluster | null
    competencies: Array<{
      competency: Competency
      positionCompetency?: PositionCompetency
    }>
  }
}

export default function PositionCompetencyDetailPage() {
  const t = useTranslations('AdminPositionCompetenciesDetailPage')
  const params = useParams()
  const router = useRouter()
  const positionId = params.id as string

  const [position, setPosition] = useState<Position | null>(null)
  const [allCompetencies, setAllCompetencies] = useState<Competency[]>([])
  const [positionCompetencies, setPositionCompetencies] = useState<PositionCompetency[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null)
  const [selectedPositionCompetency, setSelectedPositionCompetency] = useState<PositionCompetency | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isRemovingOrphaned, setIsRemovingOrphaned] = useState(false)
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isBulkLevelDialogOpen, setIsBulkLevelDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [positionId])

  // Set initial active tab after data loads
  useEffect(() => {
    const groupedKeys = Object.keys(groupCompetenciesByCluster())
    if (!activeTab && groupedKeys.length > 0) {
      setActiveTab(groupedKeys[0])
    }
  }, [positionCompetencies, allCompetencies])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [positionData, competenciesData, positionCompetenciesData] = await Promise.all([
        positionAPI.getById(positionId),
        competencyAPI.getAll(),
        positionCompetencyAPI.getByPosition(positionId),
      ])
      setPosition(positionData)
      setAllCompetencies(competenciesData)
      setPositionCompetencies(positionCompetenciesData)
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

      const positionComp = positionCompetencies.find(
        (pc) => pc.competencyId === competency.id
      )

      // Filter by search query
      const matchesSearch = !searchQuery || 
        competency.name.toLowerCase().includes(searchQuery.toLowerCase())

      if (matchesSearch) {
        grouped[clusterId].competencies.push({
          competency,
          positionCompetency: positionComp,
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

  const handleAdd = (competency: Competency) => {
    setSelectedCompetency(competency)
    setSelectedPositionCompetency(null)
    setEditMode(false)
    setIsLevelDialogOpen(true)
  }

  const handleEdit = (competency: Competency, positionCompetency: PositionCompetency) => {
    setSelectedCompetency(competency)
    setSelectedPositionCompetency(positionCompetency)
    setEditMode(true)
    setIsLevelDialogOpen(true)
  }

  const handleView = (competency: Competency, positionCompetency?: PositionCompetency) => {
    setSelectedCompetency(competency)
    setSelectedPositionCompetency(positionCompetency || null)
    setIsViewDialogOpen(true)
  }

  const handleDelete = (positionCompetency: PositionCompetency) => {
    setSelectedPositionCompetency(positionCompetency)
    setIsDeleteDialogOpen(true)
  }

  const handleLevelSubmit = async (level: number) => {
    try {
      if (editMode && selectedPositionCompetency) {
        await positionCompetencyAPI.update(selectedPositionCompetency.id, {
          level,
        })
        toast.success(t('levelUpdated'))
      } else {
        await positionCompetencyAPI.create({
          positionId,
          competencyId: selectedCompetency!.id,
          level,
        })
        toast.success(t('competencyAdded'))
      }
      await fetchData()
    } catch (error) {
      toast.error(t('saveError'))
      console.error(error)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await positionCompetencyAPI.delete(selectedPositionCompetency!.id)
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

  const toggleSelectAll = (competencies: Array<{ positionCompetency?: PositionCompetency }>) => {
    const assignedIds = competencies
      .filter(c => c.positionCompetency)
      .map(c => c.positionCompetency!.id)
    
    if (selectedIds.length === assignedIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(assignedIds)
    }
  }

  const toggleSelectAllNotAdded = (competencies: Array<{ competency: Competency; positionCompetency?: PositionCompetency }>) => {
    const notAddedIds = competencies
      .filter(c => !c.positionCompetency)
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
        selectedIds.map(id => positionCompetencyAPI.delete(id))
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

    setIsBulkLevelDialogOpen(true)
  }

  const handleBulkAddConfirm = async (level: number) => {
    try {
      setIsBulkAdding(true)
      await Promise.all(
        selectedCompetencyIds.map(competencyId => 
          positionCompetencyAPI.create({
            positionId,
            competencyId,
            level,
          })
        )
      )
      toast.success(t('addedWithLevel', { count: selectedCompetencyIds.length, level }))
      setSelectedCompetencyIds([])
      setIsBulkLevelDialogOpen(false)
      await fetchData()
    } catch (error) {
      toast.error(t('addError'))
      console.error(error)
    } finally {
      setIsBulkAdding(false)
    }
  }

  // A mapping row whose competency was deleted from the master list keeps
  // pointing at nothing (competencyId null) — it still counts toward the
  // row total but never shows up in groupCompetenciesByCluster() since that
  // walks allCompetencies, not positionCompetencies. Surface it separately
  // instead of letting it inflate the "assigned" count silently.
  const orphanedPositionCompetencies = positionCompetencies.filter((pc) => !pc.competencyId)
  const orphanedPositionCompetencyCount = orphanedPositionCompetencies.length
  const validPositionCompetencyCount = positionCompetencies.length - orphanedPositionCompetencyCount

  const handleRemoveOrphaned = async () => {
    if (orphanedPositionCompetencies.length === 0) return
    if (!confirm(t('confirmRemoveOrphaned', { count: orphanedPositionCompetencies.length }))) {
      return
    }

    try {
      setIsRemovingOrphaned(true)
      await Promise.all(orphanedPositionCompetencies.map((pc) => positionCompetencyAPI.delete(pc.id)))
      toast.success(t('orphanedMappingsRemoved'))
      await fetchData()
    } catch (error) {
      toast.error(t('removeError'))
      console.error(error)
    } finally {
      setIsRemovingOrphaned(false)
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
          onClick={() => router.push("/admin/position-competencies")}
        >
          <IconArrowLeft className="mr-2 size-4" />
          {t('backToPositions')}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{position?.name}</h1>
          <p className="text-muted-foreground ">
            {position?.grade?.name && `${t('gradeLabel', { grade: position.grade.name })} • `}
            {validPositionCompetencyCount === 1
              ? t('statusAssignedSingle', { count: validPositionCompetencyCount })
              : t('statusAssignedMultiple', { count: validPositionCompetencyCount })}
            {orphanedPositionCompetencyCount > 0 && (
              <span className="text-destructive"> {t('orphanedInlineNote', { count: orphanedPositionCompetencyCount })}</span>
            )}
          </p>
        </div>
      </div>

      {orphanedPositionCompetencyCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <IconAlertTriangle className="size-4 text-destructive shrink-0" />
              <span>
                {orphanedPositionCompetencyCount === 1
                  ? t('orphanedWarningSingle', { count: orphanedPositionCompetencyCount })
                  : t('orphanedWarningMultiple', { count: orphanedPositionCompetencyCount })}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveOrphaned}
              disabled={isRemovingOrphaned}
            >
              <IconTrashX className="mr-2 size-4" />
              {orphanedPositionCompetencyCount === 1
                ? t('removeDeletedMappingSingle')
                : t('removeDeletedMappingMultiple')}
            </Button>
          </CardContent>
        </Card>
      )}

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
                    {competencies.filter((c) => c.positionCompetency).length}/{competencies.length}
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
                      {competencies.filter((c) => c.positionCompetency).length} / {competencies.length}
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
                  {t('assignedCount', { count: competencies.filter((c) => c.positionCompetency).length })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(competencies.filter(c => !c.positionCompetency).length > 0 || competencies.filter(c => c.positionCompetency).length > 0) && (
                  <div className="mb-3 flex items-center gap-6 border-b pb-2">
                    {competencies.filter(c => !c.positionCompetency).length > 0 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={
                            competencies.filter(c => !c.positionCompetency).length > 0 &&
                            selectedCompetencyIds.length === competencies.filter(c => !c.positionCompetency).length
                          }
                          onCheckedChange={() => toggleSelectAllNotAdded(competencies)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {t('selectAllNotAdded')}
                        </span>
                      </div>
                    )}
                    {competencies.filter(c => c.positionCompetency).length > 0 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={
                            competencies.filter(c => c.positionCompetency).length > 0 &&
                            selectedIds.length === competencies.filter(c => c.positionCompetency).length
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
                  {competencies.map(({ competency, positionCompetency }) => (
                    <div
                      key={competency.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {positionCompetency ? (
                          <Checkbox
                            checked={selectedIds.includes(positionCompetency.id)}
                            onCheckedChange={() => toggleSelection(positionCompetency.id)}
                          />
                        ) : (
                          <Checkbox
                            checked={selectedCompetencyIds.includes(competency.id)}
                            onCheckedChange={() => toggleCompetencySelection(competency.id)}
                          />
                        )}
                        {positionCompetency ? (
                          <Badge variant="default">{t('badgeAdded')}</Badge>
                        ) : (
                          <Badge variant="outline">{t('badgeNotAdded')}</Badge>
                        )}
                        <div>
                          <p className="font-medium">{competency.name}</p>
                          {positionCompetency && (
                            <p className="text-sm text-muted-foreground">
                              {t('requiredLevel', { level: positionCompetency.level })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {positionCompetency ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(competency, positionCompetency)}
                            >
                              <IconEdit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(positionCompetency)}
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
      </Tabs>      <CompetencyLevelDialog
        open={isLevelDialogOpen}
        onOpenChange={setIsLevelDialogOpen}
        competency={selectedCompetency}
        currentLevel={selectedPositionCompetency?.level}
        isEdit={editMode}
        onSubmit={handleLevelSubmit}
      />

      <CompetencyViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        competency={selectedCompetency}
        positionCompetency={selectedPositionCompetency}
      />

      <CompetencyDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        competency={selectedCompetency}
        onConfirm={handleDeleteConfirm}
      />

      <BulkLevelDialog
        open={isBulkLevelDialogOpen}
        onOpenChange={setIsBulkLevelDialogOpen}
        count={selectedCompetencyIds.length}
        isLoading={isBulkAdding}
        onSubmit={handleBulkAddConfirm}
      />
    </div>
  )
}
