"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  assessmentAPI, 
  assessmentResultAPI, 
  assessorAPI, 
  positionCompetencyAPI,
  levelAPI,
  competencyAPI,
  clusterAPI,
  staffAPI
} from "@/lib/api"
import { toast } from "sonner"
import { 
  IconArrowLeft, 
  IconCalendar,
  IconTrophy,
  IconPencil,
  IconUser,
  IconCheck, 
  IconAlertCircle,
  IconInfoCircle
} from "@tabler/icons-react"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Assessment {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  weightageSelf: number
  weightageSuperior: number
  weightagePeer: number
}

interface Competency {
  id: string
  positionId: string
  competencyId: string
  level?: number
  competency: {
    id: string
    name: string
    code: string
    description: string
    cluster: {
      id: string
      name: string
    }
    level: {
      id: string
      name: string
    }
  }
}

interface CompetencyScore {
  competencyId: string
  score: number | null
  remark?: string
  resultId?: string
}

interface SubordinateInfo {
  id: string
  name: string
  email: string
  staffOrgId: string
  positionId?: string
  position?: {
    id: string
    name: string
  }
}

export default function SuperiorAssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.assessmentId as string
  const subordinateId = params.subordinateId as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [subordinate, setSubordinate] = useState<SubordinateInfo | null>(null)
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [scores, setScores] = useState<Record<string, CompetencyScore>>({})
  const [levels, setLevels] = useState<any[]>([])
  const [superiorAssessorId, setSuperiorAssessorId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUserId(userData.id)
        if (userData.id) {
          fetchAssessmentData(userData.id)
        } else {
          toast.error("User ID not found")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
        setIsLoading(false)
      }
    } else {
      toast.error("Please login to continue")
      setIsLoading(false)
    }
  }, [assessmentId, subordinateId])

  const fetchAssessmentData = async (staffId: string) => {
    try {
      setIsLoading(true)

      // Fetch assessment, subordinate info, assessors, levels, competencies, and clusters
      const [
        assessmentData, 
        subordinateData,
        allAssessors, 
        levelsData, 
        allCompetencies, 
        allClusters
      ] = await Promise.all([
        assessmentAPI.getById(assessmentId),
        staffAPI.getById(subordinateId),
        assessorAPI.getAll(),
        levelAPI.getAll(),
        competencyAPI.getAll(),
        clusterAPI.getAll(),
      ])

      setAssessment(assessmentData)
      setSubordinate(subordinateData)
      setLevels(levelsData)

      console.log("=== SUPERIOR ASSESSMENT DETAIL DEBUG ===")
      console.log("Current staffId (superior):", staffId)
      console.log("Subordinate ID:", subordinateId)
      console.log("All assessors:", allAssessors)

      // Find superior assessor record for this subordinate
      // assessorId = current user (the superior)
      // staffId = subordinate being assessed
      const superiorAssessor = allAssessors.find(
        (a: any) => 
          a.assessorId === staffId && 
          a.staffId === subordinateId &&
          a.type?.toLowerCase() === 'superior'
      )

      console.log("Found superior assessor:", superiorAssessor)

      if (!superiorAssessor) {
        toast.error("You are not assigned as superior for this staff member")
        setIsLoading(false)
        return
      }

      setSuperiorAssessorId(superiorAssessor.id)

      // Fetch position competencies for subordinate's position
      let positionCompetenciesData: Competency[] = []
      if (subordinateData.positionId) {
        const rawPositionCompetencies = await positionCompetencyAPI.getByPosition(subordinateData.positionId)
        
        // Enrich competencies with cluster and level data
        positionCompetenciesData = rawPositionCompetencies.map((pc: any) => {
          const fullCompetency = allCompetencies.find((c: any) => c.id === pc.competencyId)
          const cluster = allClusters.find((cl: any) => cl.id === fullCompetency?.clusterId)
          const level = levelsData.find((l: any) => l.id === fullCompetency?.levelId)
          
          return {
            ...pc,
            competency: {
              ...pc.competency,
              ...fullCompetency,
              cluster: cluster || { id: '', name: 'N/A' },
              level: level || { id: '', name: 'N/A' }
            }
          }
        })
        
        setCompetencies(positionCompetenciesData)
      } else {
        toast.warning("Subordinate has no position assigned")
      }

      // Fetch existing results
      const allResults = await assessmentResultAPI.getAll()
      const existingResults = allResults.filter(
        (r: any) => 
          r.assessmentId === assessmentId && 
          r.assessorId === superiorAssessor.id &&
          r.positionId === subordinateData.positionId
      )

      // Initialize scores
      const initialScores: Record<string, CompetencyScore> = {}
      positionCompetenciesData.forEach((pc: Competency) => {
        const existingResult = existingResults.find(
          (r: any) => r.competencyId === pc.competency.id
        )
        initialScores[pc.competency.id] = {
          competencyId: pc.competency.id,
          score: existingResult ? existingResult.score : null,
          remark: existingResult?.remark || '',
          resultId: existingResult?.id,
        }
      })

      setScores(initialScores)
    } catch (error) {
      console.error("Failed to fetch assessment data:", error)
      toast.error("Failed to load assessment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleScoreChange = (competencyId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        score,
      }
    }))
  }

  const handleRemarkChange = (competencyId: string, remark: string) => {
    setScores(prev => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        remark,
      }
    }))
  }

  const handleSaveAll = async () => {
    if (!superiorAssessorId || !subordinate?.positionId) {
      toast.error("Missing required data")
      return
    }

    try {
      setIsSaving(true)

      const promises = Object.values(scores).map(async (scoreData) => {
        if (scoreData.score === null) return // Skip if not rated

        const payload = {
          assessmentId,
          positionId: subordinate!.positionId!,
          competencyId: scoreData.competencyId,
          assessorId: superiorAssessorId,
          score: scoreData.score,
          remark: scoreData.remark || '',
        }

        if (scoreData.resultId) {
          return assessmentResultAPI.update(scoreData.resultId, payload)
        } else {
          return assessmentResultAPI.create(payload)
        }
      })

      await Promise.all(promises)
      toast.success("Assessment saved successfully!")
      
      // Refresh data
      if (userId) {
        await fetchAssessmentData(userId)
      }
    } catch (error) {
      console.error("Failed to save assessment:", error)
      toast.error("Failed to save assessment")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    const unanswered = Object.values(scores).filter(s => s.score === null)
    
    if (unanswered.length > 0) {
      toast.error(`Please rate all competencies (${unanswered.length} remaining)`)
      return
    }

    await handleSaveAll()
    toast.success("Assessment submitted successfully!")
    setTimeout(() => {
      router.push("/staff/superior-assessments")
    }, 1500)
  }

  const calculateProgress = () => {
    const total = Object.keys(scores).length
    const completed = Object.values(scores).filter(s => s.score !== null).length
    return total > 0 ? (completed / total) * 100 : 0
  }

  const getCompletedCount = () => {
    return Object.values(scores).filter(s => s.score !== null).length
  }

  const isWithinPeriod = () => {
    if (!assessment) return false
    const now = new Date()
    const start = new Date(assessment.startDate)
    const end = new Date(assessment.endDate)
    return now >= start && now <= end
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessment || !userId || !subordinate) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Assessment not found
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = calculateProgress()
  const completedCount = getCompletedCount()
  const totalCount = competencies.length
  const withinPeriod = isWithinPeriod()

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.back()}>
        <IconArrowLeft className="size-4 mr-2" />
        Back to Superior Assessments
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{assessment.name}</h1>
          {assessment.description && (
            <p className="text-muted-foreground mt-1">{assessment.description}</p>
          )}
        </div>
        <Badge variant={withinPeriod ? "default" : "secondary"}>
          {withinPeriod ? "Active" : "Closed"}
        </Badge>
      </div>

      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconUser className="size-4" />
            Assessing Subordinate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="font-semibold text-lg">{subordinate.name}</div>
            <div className="text-sm text-muted-foreground">
              {subordinate.staffOrgId} • {subordinate.email}
            </div>
            <div className="text-sm">
              <Badge variant="outline">{subordinate.position?.name || 'No Position'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconCalendar className="size-4" />
              Assessment Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>{format(new Date(assessment.startDate), "dd MMM yyyy")}</div>
              <div className="text-muted-foreground">to</div>
              <div>{format(new Date(assessment.endDate), "dd MMM yyyy")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconTrophy className="size-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {completedCount} / {totalCount}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.toFixed(0)}% completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Superior Weightage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(assessment.weightageSuperior * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of total assessment
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Subordinate's Competencies</CardTitle>
          <CardDescription>
            Rate based on the required competency level for their position
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No competencies assigned to this position
            </div>
          ) : (
            <CompetencyAssessmentTable
              competencies={competencies}
              scores={scores}
              levels={levels}
              onScoreChange={handleScoreChange}
              onRemarkChange={handleRemarkChange}
              disabled={!withinPeriod}
            />
          )}
        </CardContent>
      </Card>

      {competencies.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleSaveAll}
            disabled={isSaving || !withinPeriod}
          >
            Save Progress
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSaving || !withinPeriod || completedCount < totalCount}
          >
            {isSaving ? "Submitting..." : "Submit Assessment"}
          </Button>
        </div>
      )}
    </div>
  )
}

interface CompetencyAssessmentTableProps {
  competencies: Competency[]
  scores: Record<string, CompetencyScore>
  levels: any[]
  onScoreChange: (competencyId: string, score: number) => void
  onRemarkChange: (competencyId: string, remark: string) => void
  disabled?: boolean
}

function CompetencyAssessmentTable({
  competencies,
  scores,
  levels,
  onScoreChange,
  onRemarkChange,
  disabled
}: CompetencyAssessmentTableProps) {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)

  // Group competencies by cluster with cluster info
  const groupedByCluster = competencies.reduce((acc, pc) => {
    const cluster = pc.competency?.cluster
    const clusterName = cluster?.name || 'Uncategorized'
    if (!acc[clusterName]) {
      acc[clusterName] = {
        competencies: [],
        cluster: cluster
      }
    }
    acc[clusterName].competencies.push(pc)
    return acc
  }, {} as Record<string, { competencies: Competency[], cluster: any }>)

  // Sort levels by value
  const sortedLevels = levels.sort((a, b) => (a.value || 0) - (b.value || 0))

  // Sort clusters by level, then convert to entries format
  const clusterEntries = Object.entries(groupedByCluster)
    .sort(([, a], [, b]) => {
      const levelA = a.cluster?.level || 999
      const levelB = b.cluster?.level || 999
      return levelA - levelB
    })
    .map(([clusterName, clusterData]) => [clusterName, clusterData.competencies] as [string, Competency[]])

  // Navigation handlers
  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setCurrentTabIndex(currentTabIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentTabIndex < clusterEntries.length - 1) {
      setCurrentTabIndex(currentTabIndex + 1)
    }
  }

  return (
    <div className="w-full space-y-4">
      <Tabs value={clusterEntries[currentTabIndex]?.[0]} onValueChange={(value) => {
        const index = clusterEntries.findIndex(([clusterName]) => clusterName === value)
        if (index !== -1) {
          setCurrentTabIndex(index)
        }
      }} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${clusterEntries.length}, minmax(0, 1fr))` }}>
          {clusterEntries.map(([clusterName, clusterCompetencies], index) => {
            const completed = clusterCompetencies.filter(pc => scores[pc.competency.id]?.score !== null).length
            const total = clusterCompetencies.length
            
            return (
              <TabsTrigger key={clusterName} value={clusterName} className="gap-2">
                <span>{index + 1}. {clusterName}</span>
                <span className="text-xs text-muted-foreground hidden md:inline">({completed}/{total})</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

      {clusterEntries.map(([clusterName, clusterCompetencies]) => (
        <TabsContent key={clusterName} value={clusterName} className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{clusterName} Competencies</CardTitle>
                <Badge variant="outline">
                  {clusterCompetencies.filter(pc => scores[pc.competency.id]?.score !== null).length} / {clusterCompetencies.length} Completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium w-12">No</th>
                        <th className="px-3 py-2 text-left text-sm font-medium min-w-[200px]">Competency</th>
                        <th className="px-3 py-2 text-center text-sm font-medium w-16">RCL</th>
                        {sortedLevels.map((level) => (
                          <th key={level.id} className="px-3 py-2 text-center text-sm font-medium w-12">
                            {level.value}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-left text-sm font-medium min-w-[150px]">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clusterCompetencies.map((pc, index) => {
                        const competencyScore = scores[pc.competency.id]
                        const rcl = pc.level !== undefined && pc.level !== null ? pc.level.toString() : 'N/A'
                        
                        return (
                          <tr key={pc.id} className="border-t hover:bg-muted/50">
                            <td className="px-3 py-3 text-sm text-center">{index + 1}</td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-sm">{pc.competency?.name}</div>
                              {pc.competency?.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {pc.competency.description}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center text-sm font-medium">{rcl}</td>
                            {sortedLevels.map((level) => (
                              <td key={level.id} className="px-3 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => onScoreChange(pc.competency.id, level.value)}
                                  disabled={disabled}
                                  className={`
                                    size-8 rounded-full border-2 transition-all
                                    ${competencyScore?.score === level.value
                                      ? 'bg-primary border-primary'
                                      : 'border-muted-foreground/30 hover:border-primary/50'
                                    }
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                  `}
                                  title={`${level.value} - ${level.name}`}
                                />
                              </td>
                            ))}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <Textarea
                                  value={competencyScore?.remark || ''}
                                  onChange={(e) => onRemarkChange(pc.competency.id, e.target.value)}
                                  disabled={disabled}
                                  placeholder="Add remark..."
                                  className="min-h-[60px] text-sm resize-none"
                                />
                                <IconPencil className="size-4 text-muted-foreground shrink-0" />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {clusterCompetencies.map((pc, index) => {
                  const competencyScore = scores[pc.competency.id]
                  const rcl = pc.level !== undefined && pc.level !== null ? pc.level.toString() : 'N/A'
                  
                  return (
                    <Card key={pc.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-4">
                        {/* Competency Title with Info Button */}
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base leading-tight">{pc.competency?.name}</h3>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors">
                                <IconAlertCircle className="size-5 text-primary" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm mx-4">
                              <DialogHeader>
                                <DialogTitle className="text-left">{pc.competency?.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {pc.competency?.description && (
                                  <div>
                                    <h4 className="font-medium text-sm mb-2">Description:</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {pc.competency.description}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Required Competency Level (RCL): {rcl}</h4>
                                  <div className="space-y-2">
                                    {sortedLevels.map((level) => (
                                      <div 
                                        key={level.id}
                                        className={`flex items-center gap-3 p-2 rounded-lg border ${
                                          level.value?.toString() === rcl 
                                            ? 'bg-primary/10 border-primary/30' 
                                            : 'bg-muted/50 border-border'
                                        }`}
                                      >
                                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                          level.value?.toString() === rcl
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted-foreground/20 text-muted-foreground'
                                        }`}>
                                          {level.value}
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{level.name}</div>
                                          {level.description && (
                                            <div className="text-xs text-muted-foreground">{level.description}</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Rating Circles with RCL */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Select Level:</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">RCL:</span>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted border text-xs font-semibold">
                                {rcl}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            {sortedLevels.map((level) => (
                              <button
                                key={level.id}
                                type="button"
                                onClick={() => onScoreChange(pc.competency.id, level.value)}
                                disabled={disabled}
                                className={`
                                  relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all font-semibold text-sm
                                  ${competencyScore?.score === level.value
                                    ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                                    : 'border-muted-foreground/40 hover:border-primary/60 hover:scale-105'
                                  }
                                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                                title={`${level.value} - ${level.name}`}
                              >
                                {level.value}
                                {competencyScore?.score === level.value && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <IconCheck className="size-3 text-white" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Remarks */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Remarks:</Label>
                          <Textarea
                            value={competencyScore?.remark || ''}
                            onChange={(e) => onRemarkChange(pc.competency.id, e.target.value)}
                            disabled={disabled}
                            placeholder="Add your remarks here..."
                            className="min-h-[80px] text-sm resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={disabled || currentTabIndex === 0}
          className="flex items-center gap-2"
        >
          <IconArrowLeft className="size-4" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Tab {currentTabIndex + 1} of {clusterEntries.length}
        </div>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={disabled || currentTabIndex === clusterEntries.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <IconArrowLeft className="size-4 rotate-180" />
        </Button>
      </div>
    </div>
  )
}
