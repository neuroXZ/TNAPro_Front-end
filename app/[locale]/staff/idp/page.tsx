"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent
} from "@/components/ui/mobile-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  idpAPI,
  assessmentAPI,
  clusterAPI,
  competencyAPI,
  developmentStrategyAPI,
  type DevelopmentStrategy,
} from "@/lib/api"
import { useAuth } from "@/providers/auth-provider"
import { toast } from "sonner"
import {
  IconTarget,
  IconFileText,
  IconDownload,
  IconUserCheck,
  IconTrendingUp,
  IconLock,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { useTranslations } from "next-intl"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useSettings } from "@/hooks/use-settings"

interface DevelopmentStrategySummary {
  id: string
  name: string
  color: string
  isTrainingLinked: boolean
}

interface CompetencyAnalysis {
  competencyId: string
  competencyName: string
  trainingNames?: string[]
  requiredLevel: number
  selfScore: number
  superiorScore: number
  totalScore: number
  gap: number
  gapRatioPercent?: string
  developmentStrategies: DevelopmentStrategySummary[]
  requiresTraining: boolean
}

interface IdpResult {
  staffId: string
  staffName: string
  positionName: string
  competencyAnalysis: CompetencyAnalysis[]
  generatedAt: string
}

interface Assessment {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
}
interface Cluster {
  id: string
  name: string
}

export default function MyIdpPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const t = useTranslations('StaffIdpPage')
  const { flags: featureFlags } = useFeatureFlags()
  const { settings, isLoading: isLoadingSettings } = useSettings()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [idpResult, setIdpResult] = useState<IdpResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [clusterList, setClusterList] = useState<Cluster[]>([])
  const [competenciesData, setCompetenciesData] = useState<any[]>([])
  const [strategies, setStrategies] = useState<DevelopmentStrategy[]>([])


  const [selectedResultCluster, setSelectedResultCluster] = useState<string>("all")


  useEffect(() => {
    if (isLoadingSettings || settings.hideIdpFromStaff) return
    fetchAssessments()
    fetchClusters()
    fetchCompetencies()
    fetchStrategies()
  }, [isLoadingSettings, settings.hideIdpFromStaff])

  const fetchStrategies = async () => {
    try {
      const data = await developmentStrategyAPI.getAll()
      setStrategies(data)
    } catch (error) {
      console.error("Failed to fetch development strategies:", error)
    }
  }

  const fetchAssessments = async () => {
    try {
      setIsLoadingAssessments(true)
      const data = await assessmentAPI.getAll()
      // Sort by latest
      const sortedAssessments = data.sort((a: Assessment, b: Assessment) =>
        new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
      )
      setAssessments(sortedAssessments)

      // Auto-select latest assessment
      if (sortedAssessments.length > 0) {
        setSelectedAssessmentId(sortedAssessments[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error)
      toast.error(t('loadAssessmentsError'))
    } finally {
      setIsLoadingAssessments(false)
    }
  }

  const fetchClusters = async () => {
    try {
      const data = await clusterAPI.getAll()
      setClusterList(data)
    } catch (error) {
      console.error("Failed to fetch clusters:", error)
    }
  }

  const fetchCompetencies = async () => {
    try {
      const data = await competencyAPI.getAll()
      setCompetenciesData(data)
    } catch (error) {
      console.error("Failed to fetch competencies:", error)
    }
  }

  const generateIdp = async () => {
    if (!selectedAssessmentId || !user?.id) {
      toast.error(t('selectAssessmentError'))
      return
    }

    try {
      setIsLoading(true)

      const response = await idpAPI.generate({
        staffId: user.id,
        assessmentId: selectedAssessmentId
      })

      if (response.data) {
        setIdpResult(response.data)
        toast.success(response.message || t('generateSuccess'))
      } else {
        setIdpResult(response)
        toast.success(t('generateSuccess'))
      }
    } catch (err: any) {
      console.error("IDP generation failed:", err)
      const errorMessage = err.response?.data?.error || err.message || t('generateError')

      // User-friendly error messages
      if (errorMessage.includes("assessment score missing")) {
        toast.error(
          t('assessmentIncompleteError'),
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No assessment results found")) {
        toast.error(
          t('noAssessmentResultsError'),
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No competencies defined")) {
        toast.error(
          t('noCompetenciesDefinedError'),
          { duration: 5000 }
        )
      } else {
        toast.error(errorMessage, { duration: 5000 })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!idpResult || !user?.id) {
      toast.error(t('noDataToExport'))
      return
    }

    try {
      setIsExporting(true)

      const response = await idpAPI.exportPdf({
        staffId: user.id,
        assessmentId: selectedAssessmentId
      })

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data)

      // Open PDF in new tab
      window.open(url, '_blank')

      // Clean up URL object after a delay to ensure it opens
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

      toast.success(t('pdfOpenedSuccess'))
    } catch (error: unknown) {
      console.error("Export failed:", error)
      const isAxios = axios.isAxiosError(error)
      const data = isAxios ? (error.response?.data as { error?: string; message?: string } | undefined) : undefined
      const message = isAxios ? error.message : error instanceof Error ? error.message : ""
      toast.error(data?.error || data?.message || message || t('exportError'))
    } finally {
      setIsExporting(false)
    }
  }
  const getFilteredCompetencies = () => {
    if (!idpResult) return []

    if (selectedResultCluster === "all") {
      return idpResult.competencyAnalysis
    }

    return idpResult.competencyAnalysis.filter(comp => {
      // Find the competency data to get cluster info
      const competencyData = competenciesData.find(c => c.id === comp.competencyId)

      // Try different possible cluster reference paths
      let clusterId = null
      if (competencyData) {
        clusterId = competencyData.clusterId ||
          competencyData.cluster?.id ||
          competencyData.clusterID ||
          competencyData.cluster_id
      }

      return clusterId === selectedResultCluster
    })
  }

  const filteredCompetencies = getFilteredCompetencies()

  const handleExportCsv = async () => {
    if (!idpResult || !user?.id) {
      toast.error(t('noDataToExport'))
      return
    }

    try {
      setIsExporting(true)

      const response = await idpAPI.exportCsv({
        staffId: user.id,
        assessmentId: selectedAssessmentId
      })

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url

      // Generate filename with staff name and date
      const staffName = idpResult.staffName.replace(/\s/g, '_')
      const dateStr = new Date().toISOString().slice(0, 10)
      link.download = `IDP_${staffName}_${dateStr}.csv`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(t('csvExportSuccess'))
    } catch (error: unknown) {
      console.error("Export failed:", error)
      const isAxios = axios.isAxiosError(error)
      const data = isAxios ? (error.response?.data as { error?: string; message?: string } | undefined) : undefined
      const message = isAxios ? error.message : error instanceof Error ? error.message : ""
      toast.error(data?.error || data?.message || message || t('exportError'))
    } finally {
      setIsExporting(false)
    }
  }

  // Color for a given gap: the color of the highest-threshold strategy it
  // crosses — kept in sync with the admin IDP page via the same API data.
  const NO_GAP_COLOR = "#16A34A"
  const getGapColor = (gap: number) => {
    const applicable = strategies.filter((s) => gap >= s.minGap)
    if (applicable.length === 0) return NO_GAP_COLOR
    return applicable[applicable.length - 1].color
  }

  if (!isLoadingSettings && settings.hideIdpFromStaff) {
    return (
      <div className={`space-y-4 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <IconLock className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{t('disabledTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('disabledDesc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
      <div className={isMobile ? 'px-1' : ''}>
        <h1 className={`font-bold text-primary ${isMobile ? 'text-lg' : 'text-3xl'}`}>
          {t('title')}
        </h1>
        <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {t('description')}
        </p>
      </div>

      {/* Assessment Selection */}
      {isMobile ? (
        <MobileCard>
          <MobileCardHeader>
            <MobileCardTitle>{t('generateCardTitle')}</MobileCardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t('generateCardDesc')}
            </p>
          </MobileCardHeader>
          <MobileCardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="assessment" className="text-xs">{t('assessmentLabel')}</Label>
                <Select
                  value={selectedAssessmentId}
                  onValueChange={setSelectedAssessmentId}
                  disabled={isLoadingAssessments}
                >
                  <SelectTrigger id="assessment" className="h-9">
                    <SelectValue placeholder={t('assessmentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        <span className="text-sm">{assessment.name}</span>
                        {assessment.startDate && (
                          <span className="text-xs text-muted-foreground">
                            {` (${format(new Date(assessment.startDate), "dd MMM yyyy")})`}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={generateIdp}
                disabled={!selectedAssessmentId || isLoading}
                className="w-full h-9"
                size="sm"
              >
                {isLoading ? (
                  <>{t('generating')}</>
                ) : (
                  <>
                    <IconFileText className="size-3 mr-2" />
                    {t('generateBtn')}
                  </>
                )}
              </Button>
            </div>
          </MobileCardContent>
        </MobileCard>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('generateCardTitle')}</CardTitle>
            <CardDescription>
              {t('generateCardDesc')}
            </CardDescription>

          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="assessment">{t('assessmentLabel')}</Label>
                <Select
                  value={selectedAssessmentId}
                  onValueChange={setSelectedAssessmentId}
                  disabled={isLoadingAssessments}
                >
                  <SelectTrigger id="assessment">
                    <SelectValue placeholder={t('assessmentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        {assessment.name}
                        {assessment.startDate && ` (${format(new Date(assessment.startDate), "dd MMM yyyy")})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-8">
                <Button
                  onClick={generateIdp}
                  disabled={!selectedAssessmentId || isLoading}
                >
                  {isLoading ? (
                    <>{t('generating')}</>
                  ) : (
                    <>
                      <IconFileText className="size-4 mr-2" />
                      {t('generateBtn')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {idpResult && (
        <>
          {/* Summary Section */}
          {isMobile ? (
            <MobileCard>
              <MobileCardHeader>
                <div className="space-y-2">
                  <MobileCardTitle className="flex items-center gap-2">
                    <IconUserCheck className="size-4" />
                    {idpResult.staffName}
                  </MobileCardTitle>
                  <p className="text-xs text-muted-foreground">
                    {idpResult.positionName}
                  </p>
                  <Badge variant="outline" className="text-xs w-fit">
                    {t('generated', { date: format(new Date(idpResult.generatedAt), "dd MMM yyyy") })}
                  </Badge>
                </div>
              </MobileCardHeader>
              <MobileCardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">{t('totalCompetencies')}</div>
                    <div className="text-lg font-bold">{filteredCompetencies.length}</div>
                    {selectedResultCluster !== "all" && (
                      <div className="text-[10px] text-muted-foreground">{t('totalSuffix', { total: idpResult.competencyAnalysis.length })}</div>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">{t('needsTraining')}</div>
                    <div className="text-lg font-bold text-red-600">
                      {filteredCompetencies.filter(c => c.requiresTraining).length}
                    </div>
                  </div>
                </div>
              </MobileCardContent>
            </MobileCard>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconUserCheck className="size-5" />
                      {idpResult.staffName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {idpResult.positionName}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {t('generated', { date: format(new Date(idpResult.generatedAt), "dd MMM yyyy HH:mm") })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{t('totalCompetencies')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{filteredCompetencies.length}</div>
                      {selectedResultCluster !== "all" && (
                        <div className="text-xs text-muted-foreground">{t('totalSuffix', { total: idpResult.competencyAnalysis.length })}</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{t('needsTraining')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {filteredCompetencies.filter((c: CompetencyAnalysis) => c.requiresTraining).length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{t('averageGap')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {filteredCompetencies.length > 0 ? 
                          (filteredCompetencies.reduce((acc, c) => acc + c.gap, 0) / filteredCompetencies.length).toFixed(1) : 
                          '0.0'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competency Analysis */}
          {isMobile ? (
            <MobileCard>
              <MobileCardHeader>
                <MobileCardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="size-4" />
                  {t('analysisTitle')}
                </MobileCardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('analysisDesc')}
                </p>
              </MobileCardHeader>
              <MobileCardContent>
                <div className="space-y-3">
                  {filteredCompetencies.map((comp) => (
                    <div key={comp.competencyId} className="border rounded-lg p-3 bg-background">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground leading-tight">
                          {comp.competencyName}
                        </h4>
                        <div className="flex flex-col items-end gap-0.5 ml-2 shrink-0">
                          <Badge
                            variant={comp.gap > 0 ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {t('gapValue', { gap: comp.gap.toFixed(1) })}
                          </Badge>
                          {featureFlags.gapRatio && comp.gapRatioPercent && (
                            <span className="text-[10px] text-muted-foreground">
                              {comp.gapRatioPercent}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                        <div className="text-center">
                          <div className="text-muted-foreground">{t('required')}</div>
                          <div className="font-medium">{comp.requiredLevel}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">{t('self')}</div>
                          <div className="font-medium">{comp.selfScore !== undefined ? comp.selfScore : 'N/A'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">{t('superior')}</div>
                          <div className="font-medium">{comp.superiorScore !== undefined ? comp.superiorScore : 'N/A'}</div>
                        </div>
                      </div>

                      {comp.developmentStrategies.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium text-foreground mb-1">{t('devStrategiesLabel')}</div>
                          <div className="flex flex-wrap gap-1">
                            {comp.developmentStrategies.map((s) => (
                              <Badge key={s.id} variant="outline" className="text-[10px] h-5">{s.name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Select value={selectedResultCluster} onValueChange={setSelectedResultCluster}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('filterCluster')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allClusters')}</SelectItem>
                    {clusterList.map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Mobile Export Button */}
                <div className="mt-4 pt-3 border-t">


                  <Button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isExporting ? (
                      t('exporting')
                    ) : (
                      <>
                        <IconDownload className="size-3 mr-2" />
                        {t('viewPdf')}
                      </>
                    )}
                  </Button>
                </div>
                {selectedResultCluster !== "all" && (
                  <div className="text-sm text-muted-foreground">
                    {t('showingFilter', { count: filteredCompetencies.length, total: idpResult.competencyAnalysis.length })}
                  </div>
                )}
              </MobileCardContent>
            </MobileCard>
          ) : null}

          {/* Competency Gap Analysis Table - Hidden on Mobile */}
          {!isMobile && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('tableTitle')}</CardTitle>
                  <div className="flex gap-2">
                    <div>
                      <Select value={selectedResultCluster} onValueChange={setSelectedResultCluster}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder={t('filterCluster')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('allClusters')}</SelectItem>
                          {clusterList.map((cluster) => (
                            <SelectItem key={cluster.id} value={cluster.id}>
                              {cluster.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCsv}
                      disabled={isExporting}
                    >
                      <IconDownload className="size-4 mr-2" />
                      {isExporting ? t('exporting') : t('exportCsv')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={isExporting}
                    >
                      <IconDownload className="size-4 mr-2" />
                      {isExporting ? t('opening') : t('viewPdf')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th rowSpan={2} className="px-4 py-3 text-left text-sm font-medium border-r align-middle">{t('colCompetency')}</th>
                          <th rowSpan={2} className="px-3 py-3 text-center text-sm font-medium border-r align-middle">{t('colRcl')}</th>
                          <th colSpan={featureFlags.gapRatio ? 4 : 3} className="px-3 py-2 text-center text-sm font-medium border-r border-b">{t('colAssessmentResult')}</th>
                          <th colSpan={strategies.length} className="px-3 py-2 text-center text-sm font-medium">{t('colDevStrategy')}</th>
                        </tr>
                        <tr>
                          <th className="px-3 py-2 text-center text-sm font-medium">{t('colSelf')}</th>
                          <th className="px-3 py-2 text-center text-sm font-medium">{t('colSuperior')}</th>
                          <th className="px-3 py-2 text-center text-sm font-medium border-r">{t('colGap')}</th>
                          {featureFlags.gapRatio && (
                            <th className="px-3 py-2 text-center text-sm font-medium border-r">{t('colGapRatio')}</th>
                          )}
                          {strategies.map((s) => (
                            <th key={s.id} className="px-3 py-2 text-center text-sm font-medium">{s.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompetencies.map((comp, index) => (
                          <tr key={comp.competencyId} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium border-r">{comp.competencyName}</td>
                            <td className="px-3 py-3 text-sm text-center border-r">{comp.requiredLevel}</td>
                            <td className="px-3 py-3 text-sm text-center">{comp.selfScore !== undefined ? comp.selfScore : 'N/A'}</td>
                            <td className="px-3 py-3 text-sm text-center">{comp.superiorScore !== undefined ? comp.superiorScore : 'N/A'}</td>
                            <td
                              className="px-3 py-3 text-sm text-center border-r font-medium"
                              style={{ color: getGapColor(comp.gap) }}
                            >
                              {comp.gap.toFixed(1)}
                            </td>
                            {featureFlags.gapRatio && (
                              <td className="px-3 py-3 text-sm text-center border-r text-muted-foreground">
                                {comp.gapRatioPercent || 'N/A'}
                              </td>
                            )}
                            {strategies.map((s) => {
                              const active = comp.developmentStrategies.some((ds) => ds.id === s.id)
                              return (
                                <td key={s.id} className="px-3 py-3 text-center">
                                  {active && <span className="text-lg" style={{ color: s.color }}>✓</span>}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {selectedResultCluster !== "all" && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {t('showingFilter', { count: filteredCompetencies.length, total: idpResult.competencyAnalysis.length })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconTrendingUp className="size-4" />
                {t('legendTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {strategies.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <Badge style={{ backgroundColor: s.color }}>{s.name}</Badge>
                    <span className="text-muted-foreground">
                      {t('legendItemTemplate', { minGap: s.minGap })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
