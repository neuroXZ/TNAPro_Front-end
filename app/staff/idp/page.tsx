"use client"

import { useEffect, useState } from "react"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { idpAPI, assessmentAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { 
  IconTarget, 
  IconFileText,
  IconDownload,
  IconUserCheck,
  IconTrendingUp,
  IconInfoCircle
} from "@tabler/icons-react"
import { format } from "date-fns"

interface CompetencyAnalysis {
  competencyId: string
  competencyName: string
  trainingName?: string
  requiredLevel: number
  selfScore: number
  superiorScore: number
  totalScore: number
  gap: number
  developmentStrategies: {
    training: boolean
    coaching: boolean
    selfLearning: boolean
    workExperience: boolean
  }
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

export default function MyIdpPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [idpResult, setIdpResult] = useState<IdpResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchAssessments()
  }, [])

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
      toast.error("Failed to load assessments")
    } finally {
      setIsLoadingAssessments(false)
    }
  }

  const generateIdp = async () => {
    if (!selectedAssessmentId || !user?.id) {
      toast.error("Please select an assessment")
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
        toast.success(response.message || "IDP generated successfully!")
      } else {
        setIdpResult(response)
        toast.success("IDP generated successfully!")
      }
    } catch (err: any) {
      console.error("IDP generation failed:", err)
      const errorMessage = err.response?.data?.error || err.message || "Failed to generate IDP"
      
      // User-friendly error messages
      if (errorMessage.includes("assessment score missing")) {
        toast.error(
          "Assessment incomplete. Please ensure all competency assessments (Self & Superior) are completed.",
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No assessment results found")) {
        toast.error(
          "No assessment results found. Please complete the assessment first.",
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No competencies defined")) {
        toast.error(
          "No competencies defined for your position. Please contact administrator.",
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
      toast.error("No IDP data to export")
      return
    }

    try {
      setIsExporting(true)
      
      const response = await idpAPI.exportPdf({
        staffId: user.id,
        assessmentId: selectedAssessmentId
      })
      
      // Create blob and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Open PDF in new tab
      window.open(url, '_blank')
      
      // Clean up URL object after a delay to ensure it opens
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
      
      toast.success("IDP opened in new tab!")
    } catch (error: any) {
      console.error("Export failed:", error)
      toast.error(error.response?.data?.error || "Failed to export IDP")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCsv = async () => {
    if (!idpResult || !user?.id) {
      toast.error("No IDP data to export")
      return
    }

    try {
      setIsExporting(true)
      
      const response = await idpAPI.exportCsv({
        staffId: user.id,
        assessmentId: selectedAssessmentId
      })
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
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
      
      toast.success("IDP exported successfully!")
    } catch (error: any) {
      console.error("Export failed:", error)
      toast.error(error.response?.data?.error || "Failed to export IDP")
    } finally {
      setIsExporting(false)
    }
  }

  const getStrategyBadges = (strategies: CompetencyAnalysis['developmentStrategies']) => {
    const badges = []
    if (strategies.training) badges.push({ label: "Training", color: "bg-red-600" })
    if (strategies.coaching) badges.push({ label: "Coaching", color: "bg-orange-600" })
    if (strategies.selfLearning) badges.push({ label: "Self Learning", color: "bg-blue-600" })
    if (strategies.workExperience) badges.push({ label: "Work Experience", color: "bg-green-600" })
    return badges
  }

  const getGapColor = (gap: number) => {
    if (gap >= 1.5) return "text-red-600 font-bold"
    if (gap >= 1.0) return "text-orange-600 font-semibold"
    if (gap > 0) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className={`space-y-4 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
      <div className={isMobile ? 'px-1' : ''}>
        <h1 className={`font-bold text-primary ${isMobile ? 'text-lg' : 'text-3xl'}`}>
          {isMobile ? 'My Individual Development Plan (IDP)' : 'My Individual Development Plan (IDP)'}
        </h1>
        <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          View your personalized development plan based on competency assessment results
        </p>
      </div>

      {/* Assessment Selection */}
      {isMobile ? (
        <MobileCard>
          <MobileCardHeader>
            <MobileCardTitle>Generate IDP</MobileCardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Select an assessment to generate your development plan
            </p>
          </MobileCardHeader>
          <MobileCardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="assessment" className="text-xs">Assessment</Label>
                <Select
                  value={selectedAssessmentId}
                  onValueChange={setSelectedAssessmentId}
                  disabled={isLoadingAssessments}
                >
                  <SelectTrigger id="assessment" className="h-9">
                    <SelectValue placeholder="Select an assessment" />
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
                  <>Generating...</>
                ) : (
                  <>
                    <IconFileText className="size-3 mr-2" />
                    Generate IDP
                  </>
                )}
              </Button>
            </div>
          </MobileCardContent>
        </MobileCard>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Generate IDP</CardTitle>
            <CardDescription>
              Select an assessment to generate your development plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="assessment">Assessment</Label>
                <Select
                  value={selectedAssessmentId}
                  onValueChange={setSelectedAssessmentId}
                  disabled={isLoadingAssessments}
                >
                  <SelectTrigger id="assessment">
                    <SelectValue placeholder="Select an assessment" />
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
                    <>Generating...</>
                  ) : (
                    <>
                      <IconFileText className="size-4 mr-2" />
                      Generate IDP
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
                    Generated: {format(new Date(idpResult.generatedAt), "dd MMM yyyy")}
                  </Badge>
                </div>
              </MobileCardHeader>
              <MobileCardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Total Competencies</div>
                    <div className="text-lg font-bold">{idpResult.competencyAnalysis.length}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Need Training</div>
                    <div className="text-lg font-bold text-red-600">
                      {idpResult.competencyAnalysis.filter(c => c.developmentStrategies?.training === true).length}
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
                    Generated: {format(new Date(idpResult.generatedAt), "dd MMM yyyy HH:mm")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Competencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{idpResult.competencyAnalysis.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Needs Training</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {idpResult.competencyAnalysis.filter((c: CompetencyAnalysis) => c.developmentStrategies.training).length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Average Gap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {(idpResult.competencyAnalysis.reduce((acc, c) => acc + c.gap, 0) / idpResult.competencyAnalysis.length).toFixed(1)}
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
                  Competency Analysis
                </MobileCardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Individual development recommendations for each competency
                </p>
              </MobileCardHeader>
              <MobileCardContent>
                <div className="space-y-3">
                  {idpResult.competencyAnalysis.map((comp) => (
                    <div key={comp.competencyId} className="border rounded-lg p-3 bg-background">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground leading-tight">
                          {comp.competencyName}
                        </h4>
                        <Badge 
                          variant={comp.gap > 0 ? "destructive" : "primary"} 
                          className="text-xs ml-2 shrink-0"
                        >
                          Gap: {comp.gap}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                        <div className="text-center">
                          <div className="text-muted-foreground">Required</div>
                          <div className="font-medium">{comp.requiredLevel}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Self</div>
                          <div className="font-medium">{comp.selfScore || 'N/A'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Superior</div>
                          <div className="font-medium">{comp.superiorScore || 'N/A'}</div>
                        </div>
                      </div>

                      {comp.gap > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-medium text-foreground mb-1">Development Strategies:</div>
                          <div className="flex flex-wrap gap-1">
                            {comp.developmentStrategies.training && (
                              <Badge variant="outline" className="text-[10px] h-5">Training</Badge>
                            )}
                            {comp.developmentStrategies.coaching && (
                              <Badge variant="outline" className="text-[10px] h-5">Coaching</Badge>
                            )}
                            {comp.developmentStrategies.selfLearning && (
                              <Badge variant="outline" className="text-[10px] h-5">Self Learning</Badge>
                            )}
                            {comp.developmentStrategies.workExperience && (
                              <Badge variant="outline" className="text-[10px] h-5">Work Experience</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

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
                      "Exporting..."
                    ) : (
                      <>
                        <IconDownload className="size-3 mr-2" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </div>
              </MobileCardContent>
            </MobileCard>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconTrendingUp className="size-5" />
                      Competency Analysis & Development Plan
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Individual development recommendations for each competency
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    {isExporting ? (
                      "Exporting..."
                    ) : (
                      <>
                        <IconDownload className="size-4 mr-2" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium border-r">Competency</th>
                        <th className="px-3 py-2 text-center text-sm font-medium border-r">Required</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">Self</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">Superior</th>
                        <th className="px-3 py-2 text-center text-sm font-medium border-r">Gap</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">Training</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">Coaching</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">Self Learning</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <span>Work Experience</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <IconInfoCircle className="size-3.5 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enhance Competency Through Working Experience</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {idpResult.competencyAnalysis.map((comp, index) => (
                        <tr key={comp.competencyId} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm font-medium border-r">{comp.competencyName}</td>
                          <td className="px-3 py-3 text-sm text-center border-r">{comp.requiredLevel}</td>
                          <td className="px-3 py-3 text-sm text-center">{comp.selfScore || 'N/A'}</td>
                          <td className="px-3 py-3 text-sm text-center">{comp.superiorScore || 'N/A'}</td>
                          <td className={`px-3 py-3 text-sm text-center border-r font-medium ${getGapColor(comp.gap)}`}>
                            {comp.gap}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {comp.developmentStrategies.training && <span className="text-green-600 text-lg">✓</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {comp.developmentStrategies.coaching && <span className="text-green-600 text-lg">✓</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {comp.developmentStrategies.selfLearning && <span className="text-green-600 text-lg">✓</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {comp.developmentStrategies.workExperience && <span className="text-green-600 text-lg">✓</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
                </Card>
          )}

          {/* Competency Gap Analysis Table - Hidden on Mobile */}
          {!isMobile && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Competency Gap Analysis</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportCsv}
                      disabled={isExporting}
                    >
                      <IconDownload className="size-4 mr-2" />
                      {isExporting ? "Exporting..." : "Export CSV"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={isExporting}
                    >
                      <IconDownload className="size-4 mr-2" />
                      {isExporting ? "Opening..." : "View PDF"}
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
                          <th rowSpan={2} className="px-4 py-3 text-left text-sm font-medium border-r align-middle">Competency</th>
                          <th rowSpan={2} className="px-3 py-3 text-center text-sm font-medium border-r align-middle">RCL</th>
                          <th colSpan={3} className="px-3 py-2 text-center text-sm font-medium border-r border-b">Assessment Result</th>
                          <th colSpan={4} className="px-3 py-2 text-center text-sm font-medium">Development Strategy</th>
                        </tr>
                        <tr>
                          <th className="px-3 py-2 text-center text-sm font-medium">Self</th>
                          <th className="px-3 py-2 text-center text-sm font-medium">Superior</th>
                          <th className="px-3 py-2 text-center text-sm font-medium border-r">Gap</th>
                          <th className="px-3 py-2 text-center text-sm font-medium">Training</th>
                          <th className="px-3 py-2 text-center text-sm font-medium">Coaching</th>
                          <th className="px-3 py-2 text-center text-sm font-medium">Self Learning</th>
                          <th className="px-3 py-2 text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-1">
                              <span>Work Experience</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <IconInfoCircle className="size-3.5 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Enhance Competency Through Working Experience</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {idpResult.competencyAnalysis.map((comp, index) => (
                          <tr key={comp.competencyId} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium border-r">{comp.competencyName}</td>
                            <td className="px-3 py-3 text-sm text-center border-r">{comp.requiredLevel}</td>
                            <td className="px-3 py-3 text-sm text-center">{comp.selfScore || 'N/A'}</td>
                            <td className="px-3 py-3 text-sm text-center">{comp.superiorScore || 'N/A'}</td>
                            <td className={`px-3 py-3 text-sm text-center border-r font-medium ${getGapColor(comp.gap)}`}>
                              {comp.gap}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.training && <span className="text-green-600 text-lg">✓</span>}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.coaching && <span className="text-green-600 text-lg">✓</span>}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.selfLearning && <span className="text-green-600 text-lg">✓</span>}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.workExperience && <span className="text-green-600 text-lg">✓</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconTrendingUp className="size-4" />
                Development Strategy Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-red-600">Training</Badge>
                  <span className="text-muted-foreground">Gap ≥ 1.5 - Formal training required</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-orange-600">Coaching</Badge>
                  <span className="text-muted-foreground">Gap 1.0-1.5 - Coaching/mentoring needed</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-blue-600">Self Learning</Badge>
                  <span className="text-muted-foreground">Gap {'<'} 1.0 - Self-study materials</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-green-600">Work Experience</Badge>
                  <span className="text-muted-foreground">No gap - Maintain through practice</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
