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
  IconCheck, 
  IconAlertCircle,
  IconCalendar,
  IconTrophy,
  IconPencil,
  IconInfoCircle
} from "@tabler/icons-react"
import { format } from "date-fns"
import { useTranslations } from "next-intl"
import { Textarea } from "@/components/ui/textarea"
import { FeatureRoute } from "@/components/route/feature-route"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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

interface CompetencyScore {
  competencyId: string
  score: number | null
  remark?: string
  resultId?: string
  status?: string
}

export default function AssessmentDetailPage() {
  return (
    <FeatureRoute feature="superiorOnlyAssessment" negate redirectTo="/staff/dashboard">
      <AssessmentDetailPageContent />
    </FeatureRoute>
  )
}

function AssessmentDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [scores, setScores] = useState<Record<string, CompetencyScore>>({})
  const [levels, setLevels] = useState<any[]>([])
  const [selfAssessorId, setSelfAssessorId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [positionId, setPositionId] = useState<string | null>(null)
  const [hasShownWarning, setHasShownWarning] = useState(false)
  const t = useTranslations('StaffAssessmentFormPage')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    console.log("=== ASSESSMENT DETAIL DEBUG ===")
    console.log("Stored user raw:", storedUser)
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        console.log("Parsed user data:", userData)
        console.log("User ID:", userData.id)
        setUserId(userData.id)
        if (userData.id) {
          fetchAssessmentData(userData.id)
        } else {
          toast.error(t('userIdNotFoundToast'))
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
        setIsLoading(false)
      }
    } else {
      toast.error(t('loginRequiredToast'))
      setIsLoading(false)
    }
  }, [assessmentId])

  const fetchAssessmentData = async (staffId: string) => {
    try {
      setIsLoading(true)

      // Fetch assessment data, live staff record, assessors, levels, competencies, and clusters.
      // Staff's positionId is fetched fresh here (not read from the localStorage login
      // snapshot) so a position assigned after login is picked up immediately.
      const [assessmentData, staffData, allAssessors, levelsData, allCompetencies, allClusters] = await Promise.all([
        assessmentAPI.getById(assessmentId),
        staffAPI.getById(staffId),
        assessorAPI.getAll(),
        levelAPI.getAll(),
        competencyAPI.getAll(),
        clusterAPI.getAll(),
      ])

      const positionId = staffData?.positionId || null
      setPositionId(positionId)

      console.log("Fetching assessment data for:", { staffId, positionId })
      console.log("Assessment data:", assessmentData)
      console.log("All assessors:", allAssessors)
      console.log("Levels data:", levelsData)

      setAssessment(assessmentData)
      setLevels(levelsData)

      // Fetch position competencies only if positionId exists
      let positionCompetenciesData: Competency[] = []
      if (positionId) {
        console.log("Fetching position competencies for positionId:", positionId)
        const rawPositionCompetencies = await positionCompetencyAPI.getEffective(positionId, staffData?.unitId ?? null)
        
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
        
        console.log("Enriched position competencies:", positionCompetenciesData)
        setCompetencies(positionCompetenciesData)
      } else {
        console.warn("No positionId - cannot fetch competencies")
        if (!hasShownWarning) {
          toast.warning(t('noPositionAssignedToast'))
          setHasShownWarning(true)
        }
      }

      // Fetch all results
      const allResults = await assessmentResultAPI.getAll()

      // Find self-assessor record
      const selfAssessor = allAssessors.find(
        (a: any) => a.staffId === staffId && a.type?.toLowerCase() === "self"
      )

      if (!selfAssessor) {
        toast.error(t('selfAssessorNotFoundToast'))
        setIsLoading(false)
        return
      }

      setSelfAssessorId(selfAssessor.id)

      // Load existing results
      const existingResults = allResults.filter(
        (r: any) => r.assessmentId === assessmentId && r.assessorId === selfAssessor.id
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
          status: existingResult?.status || 'DRAFT',
        }
      })

      setScores(initialScores)
    } catch (error) {
      console.error("Failed to fetch assessment data:", error)
      toast.error(t('loadAssessmentFailedToast'))
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
    if (!selfAssessorId || !positionId) {
      toast.error(t('missingRequiredDataToast'))
      return
    }

    try {
      setIsSaving(true)

      const promises = Object.values(scores).map(async (scoreData) => {
        if (scoreData.score === null) return // Skip if not rated

        const payload = {
          assessmentId,
          positionId,
          competencyId: scoreData.competencyId,
          assessorId: selfAssessorId,
          score: scoreData.score,
          remark: scoreData.remark || '',
          status: 'DRAFT',
        }

        if (scoreData.resultId) {
          // Update existing
          return assessmentResultAPI.update(scoreData.resultId, payload)
        } else {
          // Create new
          return assessmentResultAPI.create(payload)
        }
      })

      await Promise.all(promises)
      toast.success(t('saveSuccessToast'))

      // Refresh data
      if (userId) {
        await fetchAssessmentData(userId)
      }
    } catch (error) {
      console.error("Failed to save assessment:", error)
      toast.error(t('saveFailedToast'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    const unanswered = Object.values(scores).filter(s => s.score === null)
    
    if (unanswered.length > 0) {
      toast.error(t('rateAllCompetenciesToast', { count: unanswered.length }))
      return
    }

    if (!selfAssessorId || !positionId) {
      toast.error(t('missingRequiredDataToast'))
      return
    }

    try {
      setIsSaving(true)

      const promises = Object.values(scores).map(async (scoreData) => {
        if (scoreData.score === null) return // Skip if not rated

        const payload = {
          assessmentId,
          positionId,
          competencyId: scoreData.competencyId,
          assessorId: selfAssessorId,
          score: scoreData.score,
          remark: scoreData.remark || '',
          status: 'SUBMITTED',
        }

        if (scoreData.resultId) {
          // Update existing
          return assessmentResultAPI.update(scoreData.resultId, payload)
        } else {
          // Create new
          return assessmentResultAPI.create(payload)
        }
      })

      await Promise.all(promises)
      
      // Update local state to reflect submitted status
      setScores(prevScores => {
        const updatedScores = { ...prevScores }
        Object.keys(updatedScores).forEach(competencyId => {
          if (updatedScores[competencyId].score !== null) {
            updatedScores[competencyId] = {
              ...updatedScores[competencyId],
              status: 'SUBMITTED'
            }
          }
        })
        return updatedScores
      })
      
      toast.success(t('submitSuccessToast'))

      setTimeout(() => {
        router.push("/staff/assessments")
      }, 1500)
    } catch (error) {
      console.error("Failed to submit assessment:", error)
      toast.error(t('submitFailedToast'))
    } finally {
      setIsSaving(false)
    }
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

  const isAssessmentSubmitted = () => {
    // Check if all competencies have been rated AND submitted (status is SUBMITTED)
    const totalCompetencies = competencies.length
    const submittedCompetencies = Object.values(scores).filter(s => 
      s.score !== null && s.resultId && s.status === 'SUBMITTED'
    ).length
    return totalCompetencies > 0 && submittedCompetencies === totalCompetencies
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="size-4 mr-2" />
          {t('back')}
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">{t('loading')}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessment || !userId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="size-4 mr-2" />
          {t('back')}
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {t('notFound')}
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
  const isSubmitted = isAssessmentSubmitted()

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.back()}>
        <IconArrowLeft className="size-4 mr-2" />
        {t('backToAssessments')}
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{assessment.name}</h1>
          {assessment.description && (
            <p className="text-muted-foreground mt-1">{assessment.description}</p>
          )}
        </div>
        <Badge variant={withinPeriod ? "default" : "secondary"}>
          {withinPeriod ? t('badgeActive') : t('badgeClosed')}
        </Badge>
      </div>

      {!withinPeriod && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <IconAlertCircle className="size-5" />
              <span className="font-medium">
                {t('periodEnded')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconCalendar className="size-4" />
              {t('assessmentPeriod')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>{format(new Date(assessment.startDate), "dd MMM yyyy")}</div>
              <div className="text-muted-foreground">{t('dateTo')}</div>
              <div>{format(new Date(assessment.endDate), "dd MMM yyyy")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconTrophy className="size-4" />
              {t('progress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {completedCount} / {totalCount}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t('progressCompleted', { percent: progress.toFixed(0) })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('selfWeightage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(assessment.weightageSelf * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('ofTotalAssessment')}
            </p>
          </CardContent>
        </Card>
      </div>

      {competencies.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <IconInfoCircle className="size-5" />
              {t('howToTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-900 dark:text-blue-100">
              <li>{t('howToStep1Self')}</li>
              <li>{t('howToStep2')}</li>
              <li>{t('howToRclInfoButton')}</li>
              <li>{t('howToStep3')}</li>
              <li>{t('howToStep4')}</li>
            </ol>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-blue-900 dark:text-blue-100">{t('howToLevelsIntro')}</span>
              {[...levels].sort((a, b) => (a.value || 0) - (b.value || 0)).map((level) => (
                <Badge key={level.id} variant="outline" className="bg-white dark:bg-blue-900 text-xs font-normal">
                  {level.value} – {level.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('rateYourCompetencies')}</CardTitle>
          <CardDescription>
            {t('rateYourCompetenciesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noCompetenciesYourPosition')}
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
            disabled={isSaving || !withinPeriod || isSubmitted}
          >
            {t('saveDraft')}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSaving || !withinPeriod || completedCount < totalCount || isSubmitted}
            variant={isSubmitted ? "outline" : "default"}
            className={isSubmitted ? "bg-green-50 border-green-500 text-green-700 hover:bg-green-100" : ""}
          >
            {isSubmitted && <IconCheck className="size-4 mr-1" />}
            {isSubmitted 
              ? t('assessmentSubmitted') 
              : isSaving 
                ? t('submitting') 
                : t('submitAssessment')
            }
          </Button>
        </div>
      )}
    </div>
  )
}

interface CompetencyRatingProps {
  competency: {
    id?: string
    name?: string
    code?: string
    description?: string
    cluster?: { name?: string }
    level?: { name?: string }
  }
  index: number
  score: number | null
  onScoreChange: (score: number) => void
  disabled?: boolean
  levels?: any[]
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
  const t = useTranslations('StaffAssessmentFormPage')
  const [currentTabIndex, setCurrentTabIndex] = useState(0)

  // Group competencies by cluster with cluster info
  const groupedByCluster = competencies.reduce((acc, pc) => {
    const cluster = pc.competency?.cluster
    const clusterName = cluster?.name || t('uncategorized')
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
        <TabsList
          className="flex w-full items-stretch justify-start gap-1 overflow-x-auto md:grid md:justify-center md:overflow-visible"
          style={{ gridTemplateColumns: `repeat(${clusterEntries.length}, minmax(0, 1fr))` }}
        >
          {clusterEntries.map(([clusterName, clusterCompetencies], index) => {
            const completed = clusterCompetencies.filter(pc => scores[pc.competency.id]?.score !== null).length
            const total = clusterCompetencies.length

            return (
              <TabsTrigger
                key={clusterName}
                value={clusterName}
                className="shrink-0 basis-auto gap-2 md:shrink md:basis-0"
              >
                <span className="max-w-[40vw] truncate md:max-w-none" title={clusterName}>
                  {index + 1}. {clusterName}
                </span>
                <span className="text-xs text-muted-foreground hidden md:inline">({completed}/{total})</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

      {clusterEntries.map(([clusterName, clusterCompetencies], clusterIndex) => (
        <TabsContent key={clusterName} value={clusterName} className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('clusterCompetencies', { cluster: clusterName })}</CardTitle>
                <Badge variant="outline">
                  {t('clusterCompleted', { completed: clusterCompetencies.filter(pc => scores[pc.competency.id]?.score !== null).length, total: clusterCompetencies.length })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium w-12">{t('colNo')}</th>
                        <th className="px-3 py-2 text-left text-sm font-medium min-w-[200px]">{t('colCompetency')}</th>
                        <th className="px-3 py-2 text-center text-sm font-medium w-16">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">RCL</span>
                              </TooltipTrigger>
                              <TooltipContent>{t('rclTooltip')}</TooltipContent>
                            </Tooltip>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="hover:bg-primary-foreground/10 rounded-full p-1 transition-colors">
                                  <IconInfoCircle className="size-4" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>{t('rclDialogTitle')}</DialogTitle>
                                  <DialogDescription className="text-sm mb-4">
                                    {t('rclDialogDesc')}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                  {sortedLevels.map((level) => (
                                    <div 
                                      key={level.id} 
                                      className="flex items-center justify-between p-4 rounded-lg border-2 bg-muted/50 border-border transition-all"
                                    >
                                      <div className="flex-1">
                                        <h3 className="font-semibold text-base mb-1">{level.name}</h3>
                                        {level.description && (
                                          <p className="text-sm text-muted-foreground">
                                            {level.description}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg bg-primary text-primary-foreground">
                                        {level.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                              </DialogContent>
                            </Dialog>
                          </div>
                        </th>
                        {sortedLevels.map((level) => (
                          <th key={level.id} className="px-3 py-2 text-center text-sm font-medium w-12">
                            {level.value}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-left text-sm font-medium min-w-[150px]">{t('colRemarks')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clusterCompetencies.map((pc, index) => {
                        const competencyScore = scores[pc.competency.id]
                        // RCL from position competency's level field (numeric value)
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
                                  placeholder={t('addRemark')}
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {clusterCompetencies.map((pc, index) => {
                    const competencyScore = scores[pc.competency.id]
                    // RCL from position competency's level field (numeric value)
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
                                      <h4 className="font-medium text-sm mb-2">{t('descriptionLabel')}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {pc.competency.description}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium text-sm mb-2">{t('rclMobileHeader', { rcl })}</h4>
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
                              <Label className="text-sm font-medium">{t('selectLevel')}</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{t('rclLabel')}</span>
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
                            <Label className="text-sm font-medium">{t('remarksLabel')}</Label>
                            <Textarea
                              value={competencyScore?.remark || ''}
                              onChange={(e) => onRemarkChange(pc.competency.id, e.target.value)}
                              disabled={disabled}
                              placeholder={t('addRemarksHere')}
                              className="min-h-[80px] text-sm resize-none"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
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
          {t('previous')}
        </Button>

        <div className="text-sm text-muted-foreground">
          {t('tabCounter', { current: currentTabIndex + 1, total: clusterEntries.length })}
        </div>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={disabled || currentTabIndex === clusterEntries.length - 1}
          className="flex items-center gap-2"
        >
          {t('next')}
          <IconArrowLeft className="size-4 rotate-180" />
        </Button>
      </div>
    </div>
  )
}

function CompetencyRating({ 
  competency, 
  index, 
  score, 
  onScoreChange,
  disabled,
  levels = []
}: CompetencyRatingProps) {
  // Sort levels by value and use them as ratings
  const ratings = levels.length > 0 
    ? levels
        .sort((a, b) => (a.value || 0) - (b.value || 0)) // Sort by value ascending
        .map((level) => ({
          value: level.value || 0,
          label: `${level.value || 0} - ${level.name}`
        }))
    : [
        { value: 0, label: "0 - No Knowledge" },
        { value: 1, label: "1 - Basic" },
        { value: 2, label: "2 - Limited" },
        { value: 3, label: "3 - Moderate" },
        { value: 4, label: "4 - Good" },
        { value: 5, label: "5 - Excellent" },
      ]

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {index}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {competency?.code || 'N/A'}
            </Badge>
            <Badge className="text-xs">
              {competency?.level?.name || 'N/A'}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg">{competency?.name || 'Unnamed Competency'}</h3>
          {competency?.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {competency.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span className="font-medium">Cluster:</span>
            <span>{competency?.cluster?.name || 'N/A'}</span>
          </div>
        </div>
        {score !== null && (
          <div className="flex items-center gap-2 text-green-600">
            <IconCheck className="size-5" />
            <span className="text-sm font-medium">Rated</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Your Rating</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ratings.map((rating) => (
            <button
              key={rating.value}
              type="button"
              onClick={() => onScoreChange(rating.value)}
              disabled={disabled}
              className={`
                px-4 py-3 rounded-lg border-2 text-left transition-all
                ${score === rating.value
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border hover:border-primary/50 hover:bg-muted"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="font-semibold">{rating.value}</div>
              <div className="text-xs opacity-90">{rating.label.split(' - ')[1]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
