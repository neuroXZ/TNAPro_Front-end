"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [idpResult, setIdpResult] = useState<IdpResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true)

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
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary">My Individual Development Plan (IDP)</h1>
        <p className="text-muted-foreground mt-1">
          View your personalized development plan based on competency assessment results
        </p>
      </div>

      {/* Assessment Selection */}
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

      {idpResult && (
        <>
          {/* Summary Section */}
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
                    <div className="text-2xl font-bold">
                      {(idpResult.competencyAnalysis.reduce((sum, c) => sum + c.gap, 0) / idpResult.competencyAnalysis.length).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Competency Gap Analysis Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Competency Gap Analysis</CardTitle>
                <Button variant="outline" size="sm">
                  <IconDownload className="size-4 mr-2" />
                  Export PDF
                </Button>
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
