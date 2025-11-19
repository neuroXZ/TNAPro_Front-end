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
import { IconArrowLeft, IconPlus, IconEdit, IconTrash, IconEye, IconTrashX } from "@tabler/icons-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { CompetencyLevelDialog } from "./competency-level-dialog"
import { CompetencyViewDialog } from "./competency-view-dialog"
import { CompetencyDeleteDialog } from "./competency-delete-dialog"

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
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")

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

      const positionComp = positionCompetencies.find(
        (pc) => pc.competencyId === competency.id
      )

      grouped[clusterId].competencies.push({
        competency,
        positionCompetency: positionComp,
      })
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
        toast.success("Competency level updated successfully")
      } else {
        await positionCompetencyAPI.create({
          positionId,
          competencyId: selectedCompetency!.id,
          level,
        })
        toast.success("Competency added successfully")
      }
      await fetchData()
    } catch (error) {
      toast.error("Failed to save competency")
      console.error(error)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await positionCompetencyAPI.delete(selectedPositionCompetency!.id)
      toast.success("Competency removed successfully")
      await fetchData()
    } catch (error) {
      toast.error("Failed to remove competency")
      console.error(error)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("No competencies selected")
      return
    }

    if (!confirm(`Are you sure you want to remove ${selectedIds.length} competenc${selectedIds.length === 1 ? 'y' : 'ies'}?`)) {
      return
    }

    try {
      setIsBulkDeleting(true)
      await Promise.all(
        selectedIds.map(id => positionCompetencyAPI.delete(id))
      )
      toast.success(`${selectedIds.length} competenc${selectedIds.length === 1 ? 'y' : 'ies'} removed successfully`)
      setSelectedIds([])
      await fetchData()
    } catch (error) {
      toast.error("Failed to remove competencies")
      console.error(error)
    } finally {
      setIsBulkDeleting(false)
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
          Back to Positions
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{position?.name}</h1>
          <p className="text-muted-foreground">
            {position?.grade?.name && `Grade: ${position.grade.name} • `}
            {positionCompetencies.length} {positionCompetencies.length === 1 ? "competency" : "competencies"} assigned
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex gap-4">
          <TabsList className="flex flex-col h-fit w-64">
            {Object.entries(groupedCompetencies).map(([clusterId, { cluster, competencies }]) => (
              <TabsTrigger key={clusterId} value={clusterId} className="justify-start gap-2 w-full">
                {cluster?.color && (
                  <div
                    className="size-3 rounded shrink-0"
                    style={{ backgroundColor: cluster.color }}
                  />
                )}
                <span className="flex-1 text-left truncate">{cluster?.name || "Uncategorized"}</span>
                <Badge variant="secondary" className="ml-auto">
                  {competencies.filter((c) => c.positionCompetency).length}/{competencies.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

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
                    <CardTitle>{cluster?.name || "Uncategorized"}</CardTitle>
                    <Badge variant="secondary">
                      {competencies.filter((c) => c.positionCompetency).length} / {competencies.length}
                    </Badge>
                  </div>
                  {selectedIds.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                    >
                      <IconTrashX className="mr-2 size-4" />
                      Delete Selected ({selectedIds.length})
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {competencies.filter((c) => c.positionCompetency).length} competencies assigned to this position
                </CardDescription>
              </CardHeader>
              <CardContent>
                {competencies.filter(c => c.positionCompetency).length > 0 && (
                  <div className="mb-3 flex items-center gap-2 border-b pb-2">
                    <Checkbox
                      checked={
                        competencies.filter(c => c.positionCompetency).length > 0 &&
                        selectedIds.length === competencies.filter(c => c.positionCompetency).length
                      }
                      onCheckedChange={() => toggleSelectAll(competencies)}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select all assigned competencies
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  {competencies.map(({ competency, positionCompetency }) => (
                    <div
                      key={competency.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {positionCompetency && (
                          <Checkbox
                            checked={selectedIds.includes(positionCompetency.id)}
                            onCheckedChange={() => toggleSelection(positionCompetency.id)}
                          />
                        )}
                        {positionCompetency ? (
                          <Badge variant="default">✓ Added</Badge>
                        ) : (
                          <Badge variant="outline">Not Added</Badge>
                        )}
                        <div>
                          <p className="font-medium">{competency.name}</p>
                          {positionCompetency && (
                            <p className="text-sm text-muted-foreground">
                              Required Level: {positionCompetency.level}
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
    </div>
  )
}
