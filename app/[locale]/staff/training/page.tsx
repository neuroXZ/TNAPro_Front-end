"use client"

import React, { useState, useEffect } from "react"
import { rtnAPI, assessmentAPI } from "@/lib/api"
import { useAuth } from "@/providers/auth-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent
} from "@/components/ui/mobile-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IconSearch, IconCalendar, IconUser, IconTarget, IconChevronRight, IconChevronDown } from "@tabler/icons-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useTranslations } from "next-intl"



// Backend RTN Response structure
interface RTNReportResponse {
  staffId: string
  staffName: string | null
  positionName: string | null
  assessmentId: string
  results: RecommendedTrainingRecord[]
  generatedAt: string
}

interface RecommendedTrainingRecord {
  trainingId: string
  trainingName: string | null
  startDate: string | null
  endDate: string | null
  relatedCompetency: {
    competencyId: string
    competencyName: string | null
    clusterName: string | null
    requiredLevel: number
    weightedGap: number
  }
}

export default function StaffTrainingTestingPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const t = useTranslations('StaffTrainingPage')
  const [recommendedTrainings, setRecommendedTrainings] = useState<RecommendedTrainingRecord[]>([])
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [assessments, setAssessments] = useState<any[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (trainingId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(trainingId)) {
      newExpanded.delete(trainingId)
    } else {
      newExpanded.add(trainingId)
    }
    setExpandedRows(newExpanded)
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const data = await assessmentAPI.getAll()
      setAssessments(data)
      // Auto-select the first assessment if available
      if (data.length > 0) {
        setSelectedAssessmentId(data[0].id)
      }
    } catch (error: unknown) {
      console.error("Failed to fetch assessments:", error)
    }
  }

  useEffect(() => {
    if (user?.id && selectedAssessmentId) {
      fetchRecommendedTrainings()
    }
  }, [user?.id, selectedAssessmentId])



  const fetchRecommendedTrainings = async () => {
    if (!user?.id || !selectedAssessmentId) {
      toast.error("Please select an assessment first")
      return
    }
    
    try {
      setIsLoadingRecommended(true)
      
      // Use RTN API directly - backend handles all the complex logic
      const rtnReport: RTNReportResponse = await rtnAPI.getReport({ 
        staffId: user.id, 
        assessmentId: selectedAssessmentId
      })
      
      // Backend already returns the complete recommended training records
      setRecommendedTrainings(rtnReport.results || [])
      
    } catch (error: unknown) {
      if (error.response?.status === 404) {
        toast.info("No training recommendations found. Complete your assessment to get personalized recommendations.")
        setRecommendedTrainings([])
      } else {
        toast.error("Failed to fetch recommended trainings")
        console.error(error)
      }
    } finally {
      setIsLoadingRecommended(false)
    }
  }



  const filteredRecommendedTrainings = recommendedTrainings.filter((record) =>
    record.trainingName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.relatedCompetency.competencyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.relatedCompetency.clusterName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date set"
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }



  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Upcoming": return "default"
      case "Ongoing": return "default"
      case "Closed": return "secondary"
      default: return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming": return "text-blue-600 bg-blue-50"
      case "Ongoing": return "text-green-600 bg-green-50"
      case "Closed": return "text-red-600 bg-red-50"
      default: return "text-yellow-600 bg-yellow-50"
    }
  }

  const getRecommendedTrainingStatus = (record: RecommendedTrainingRecord) => {
    if (!record.startDate || !record.endDate) return "No dates"
    
    const now = new Date()
    const start = new Date(record.startDate)
    const end = new Date(record.endDate)
    
    if (now < start) return "Upcoming"
    if (now > end) return "Closed"
    return "Ongoing"
  }





  // Group recommended trainings by training ID
  const groupedRecommendedTrainings = (recommendedData: RecommendedTrainingRecord[]) => {
    const grouped = new Map<string, {
      training: RecommendedTrainingRecord,
      competencies: RecommendedTrainingRecord[]
    }>()

    recommendedData.forEach(record => {
      const key = record.trainingId
      if (!grouped.has(key)) {
        grouped.set(key, {
          training: record,
          competencies: [record]
        })
      } else {
        grouped.get(key)?.competencies.push(record)
      }
    })

    return Array.from(grouped.values())
  }

  // Mobile-friendly training card view
  const renderMobileTrainingCards = (recommendedData: RecommendedTrainingRecord[]) => {
    const groupedData = groupedRecommendedTrainings(recommendedData)

    return (
      <div className="space-y-3">
        {groupedData.map((group) => {
          const { training, competencies } = group
          const status = getRecommendedTrainingStatus(training)
          const isExpanded = expandedRows.has(training.trainingId)
          
          return (
            <MobileCard key={training.trainingId} className="overflow-hidden">
              <MobileCardContent className="p-0">
                {/* Main training info */}
                <div 
                  className="p-3 cursor-pointer"
                  onClick={() => toggleRow(training.trainingId)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <IconTarget className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm leading-tight truncate">
                          {training.trainingName || "N/A"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={getStatusVariant(status)}
                            className={`text-[10px] h-5 ${getStatusColor(status)}`}
                          >
                            {status === "Upcoming" ? t('statusUpcoming') : status === "Ongoing" ? t('statusOngoing') : status === "Closed" ? t('statusClosed') : t('statusNoDates')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {competencies.length === 1 ? t('competencyCount', { count: competencies.length }) : t('competenciesCount', { count: competencies.length })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? (
                        <IconChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                      ) : (
                        <IconChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconCalendar className="h-3 w-3" />
                      {formatDate(training.startDate ?? undefined)}
                    </span>
                    {training.endDate && (
                      <span>- {formatDate(training.endDate)}</span>
                    )}
                  </div>
                </div>

                {/* Expanded competencies view */}
                {isExpanded && (
                  <div className="border-t bg-muted/20 p-3">
                    <h4 className="text-xs font-medium text-foreground mb-2">
                      {t('relatedCompetencies')}
                    </h4>
                    <div className="space-y-2">
                      {competencies.map((record) => (
                        <div 
                          key={`${record.trainingId}-${record.relatedCompetency.competencyId}`}
                          className="bg-background rounded-lg p-3 border"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">
                                {record.relatedCompetency.competencyName}
                              </div>
                              {record.relatedCompetency.clusterName && (
                                <Badge variant="outline" className="text-[10px] h-4 mt-1">
                                  {record.relatedCompetency.clusterName}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="destructive" className="text-[10px] h-5 ml-2">
                              {t('requiredBadge', { level: record.relatedCompetency.requiredLevel })}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </MobileCardContent>
            </MobileCard>
          )
        })}
      </div>
    )
  }

  const renderRecommendedTrainingTable = (recommendedData: RecommendedTrainingRecord[]) => {
    const groupedData = groupedRecommendedTrainings(recommendedData)

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="w-[300px]">{t('colTrainingName')}</TableHead>
            <TableHead className="w-[120px]">{t('colStartDate')}</TableHead>
            <TableHead className="w-[120px]">{t('colEndDate')}</TableHead>
            <TableHead className="w-[100px]">{t('colStatus')}</TableHead>
            <TableHead className="w-[100px]">{t('colCompetencies')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedData.map((group) => {
            const { training, competencies } = group
            const status = getRecommendedTrainingStatus(training)
            const isExpanded = expandedRows.has(training.trainingId)
            
            return (
              <React.Fragment key={training.trainingId}>
                {/* Main Training Row */}
                <TableRow 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleRow(training.trainingId)}
                >
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {isExpanded ? (
                        <IconChevronDown className="h-4 w-4 transition-transform" />
                      ) : (
                        <IconChevronRight className="h-4 w-4 transition-transform" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <IconTarget className="h-4 w-4 text-blue-500" />
                      {training.trainingName || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(training.startDate ?? undefined)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(training.endDate ?? undefined)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusVariant(status)}
                      className={getStatusColor(status)}
                    >
                      {status === "Upcoming" ? t('statusUpcoming') : status === "Ongoing" ? t('statusOngoing') : status === "Closed" ? t('statusClosed') : t('statusNoDates')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="text-xs">
                      {competencies.length === 1 ? t('competencyCount', { count: competencies.length }) : t('competenciesCount', { count: competencies.length })}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* Expanded Competencies */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <div className="bg-muted/30 px-6 py-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            {t('relatedCompetencies')}
                          </h4>
                          <div className="grid gap-3">
                            {competencies.map((record, index) => (
                              <div 
                                key={`${record.trainingId}-${record.relatedCompetency.competencyId}-${index}`}
                                className="flex items-center justify-between p-3 bg-background rounded-md border"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {record.relatedCompetency.competencyName || "N/A"}
                                    </span>
                                    {record.relatedCompetency.clusterName && (
                                      <Badge variant="outline" className="text-xs">
                                        {record.relatedCompetency.clusterName}
                                      </Badge>
                                    )}
                                  </div>
                                  {/* <div className="text-xs text-muted-foreground">
                                    Required Level: {record.relatedCompetency.requiredLevel}
                                  </div> */}
                                </div>
                                <div className="text-right">
                                  <Badge variant="destructive" className="text-xs">
                                    {/* Gap: {record.relatedCompetency.weightedGap.toFixed(1)} */}
                                  {t('requiredBadge', { level: record.relatedCompetency.requiredLevel })}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'}`}>
      <div className={`mb-4 ${isMobile ? 'mb-3' : 'mb-6'}`}>
        <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
          {isMobile ? t('titleMobile') : t('titleDesktop')}
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-xs mt-1' : 'text-sm'}`}>
          {t('description')}
        </p>
      </div>

      {/* Search */}
      <div className={`mb-4 ${isMobile ? 'mb-3' : 'mb-6'}`}>
        <div className="relative">
          <IconSearch className={`absolute left-3 top-1/2 text-muted-foreground -translate-y-1/2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-9 ${isMobile ? 'h-9 text-sm' : ''}`}
          />
        </div>
      </div>

      {/* Recommended Training Programs */}
      {isMobile ? (
        <MobileCard>
          <MobileCardHeader>
            <MobileCardTitle className="flex items-center gap-2">
              <IconTarget className="h-4 w-4 text-blue-500" />
              {t('mobileCardTitle')}
            </MobileCardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t('mobileCardDesc')}
            </p>
            
            {/* Mobile Assessment Selector */}
            <div className="space-y-2 mt-3">
              <label className="text-xs font-medium">{t('selectAssessmentLabel')}</label>
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder={t('assessmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      <span className="text-sm">{assessment.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </MobileCardHeader>
          <MobileCardContent>
            {isLoadingRecommended ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredRecommendedTrainings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <IconTarget className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {searchQuery 
                    ? t('noTrainingsSearch')
                    : t('noTrainingsEmpty')}
                </p>
              </div>
            ) : (
              renderMobileTrainingCards(filteredRecommendedTrainings)
            )}
            
            {/* Mobile Summary */}
            {!isLoadingRecommended && filteredRecommendedTrainings.length > 0 && (
              <div className="mt-3 text-center text-xs text-muted-foreground">
                {t('showingCount', { count: filteredRecommendedTrainings.length, total: recommendedTrainings.length })}
                {searchQuery && ` for "${searchQuery}"`}
              </div>
            )}
          </MobileCardContent>
        </MobileCard>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTarget className="h-5 w-5 text-blue-500" />
              {t('titleDesktop')}
            </CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
            
            {/* Desktop Assessment Selector */}
            <div className="flex items-center gap-4 mt-4">
              <label className="text-sm font-medium">{t('selectAssessmentLabel')}</label>
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={t('assessmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRecommended ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredRecommendedTrainings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <IconTarget className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchQuery 
                    ? t('noTrainingsSearch')
                    : t('noTrainingsEmpty')}
                </p>
              </div>
            ) : (
              renderRecommendedTrainingTable(filteredRecommendedTrainings)
            )}
            
            {/* Desktop Summary */}
            {!isLoadingRecommended && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('showingCount', { count: filteredRecommendedTrainings.length, total: recommendedTrainings.length })}
                {searchQuery && ` for "${searchQuery}"`}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}