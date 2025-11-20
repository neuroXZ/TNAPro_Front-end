"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  IconAlertCircle, 
  IconTrophy,
  IconSchool,
  IconUsers,
  IconBook,
  IconBriefcase,
  IconRefresh,
  IconDownload
} from "@tabler/icons-react"
import { format } from "date-fns"

interface CompetencyGap {
  competencyId: string
  competencyName: string
  trainingName?: string
  requiredLevel: number
  selfScore: number
  superiorScore: number
  gap: number
  developmentStrategies: {
    training: boolean
    coaching: boolean
    selfLearning: boolean
    workExperience: boolean
  }
}

interface IdpData {
  staffId: string
  staffName: string
  positionName: string
  competencyAnalysis: CompetencyGap[]
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
  const [idpData, setIdpData] = useState<IdpData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      
      const response = await idpAPI.generate({
        staffId: user.id,
        assessmentId: selectedAssessmentId
      })
      
      setIdpData(response.data)
      toast.success("IDP generated successfully")
    } catch (err: any) {
      console.error("IDP generation failed:", err)
      const errorMessage = err.response?.data?.error || "Failed to generate IDP"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getGapBadgeColor = (gap: number) => {
    if (gap >= 1.5) return "bg-red-600 hover:bg-red-700"
    if (gap >= 1.0) return "bg-orange-600 hover:bg-orange-700"
    if (gap > 0) return "bg-yellow-600 hover:bg-yellow-700"
    return "bg-green-600 hover:bg-green-700"
  }

  const getGapLabel = (gap: number) => {
    if (gap >= 1.5) return "Critical Gap"
    if (gap >= 1.0) return "Significant Gap"
    if (gap > 0) return "Minor Gap"
    return "Meets Requirement"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Individual Development Plan (IDP)</h1>
        <p className="text-muted-foreground mt-1">
          View your personalized development plan based on competency assessment results
        </p>
      </div>

      {/* Assessment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Assessment</CardTitle>
          <CardDescription>
            Choose an assessment to generate your IDP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={selectedAssessmentId}
                onValueChange={setSelectedAssessmentId}
                disabled={isLoadingAssessments}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name}
                      {assessment.startDate && ` - ${format(new Date(assessment.startDate), "MMM yyyy")}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateIdp}
              disabled={!selectedAssessmentId || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <IconRefresh className="size-4" />
                  Generate IDP
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* IDP Results */}
      {idpData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <IconTarget className="size-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Competencies</p>
                    <p className="text-2xl font-bold">{idpData.competencyAnalysis.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <IconAlertCircle className="size-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Critical Gaps</p>
                    <p className="text-2xl font-bold">
                      {idpData.competencyAnalysis.filter(c => c.gap >= 1.5).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <IconSchool className="size-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Training Recommended</p>
                    <p className="text-2xl font-bold">
                      {idpData.competencyAnalysis.filter(c => c.developmentStrategies.training).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <IconUsers className="size-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coaching Recommended</p>
                    <p className="text-2xl font-bold">
                      {idpData.competencyAnalysis.filter(c => c.developmentStrategies.coaching).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IDP Info */}
          <Alert>
            <IconTarget className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>IDP for {idpData.staffName}</strong> ({idpData.positionName}) 
              - Generated on {format(new Date(idpData.generatedAt), "dd MMM yyyy 'at' HH:mm")}
            </AlertDescription>
          </Alert>

          {/* Competency Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Competency Gap Analysis & Development Strategies</CardTitle>
                  <CardDescription>
                    Review your competency gaps and recommended development actions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {idpData.competencyAnalysis.map((comp) => (
                  <div
                    key={comp.competencyId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{comp.competencyName}</h3>
                        {comp.trainingName && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Recommended Training: {comp.trainingName}
                          </p>
                        )}
                      </div>
                      <Badge className={`${getGapBadgeColor(comp.gap)} text-white`}>
                        {getGapLabel(comp.gap)}
                      </Badge>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Required Level</p>
                        <p className="text-lg font-bold">{comp.requiredLevel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Self Score</p>
                        <p className="text-lg font-bold">{comp.selfScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Superior Score</p>
                        <p className="text-lg font-bold">{comp.superiorScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gap</p>
                        <p className="text-lg font-bold text-red-600">{comp.gap.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Development Strategies */}
                    <div>
                      <p className="text-sm font-medium mb-2">Recommended Development Actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {comp.developmentStrategies.training && (
                          <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
                            <IconSchool className="size-3" />
                            Formal Training
                          </Badge>
                        )}
                        {comp.developmentStrategies.coaching && (
                          <Badge variant="outline" className="gap-1 border-purple-500 text-purple-700">
                            <IconUsers className="size-3" />
                            Coaching/Mentoring
                          </Badge>
                        )}
                        {comp.developmentStrategies.selfLearning && (
                          <Badge variant="outline" className="gap-1 border-blue-500 text-blue-700">
                            <IconBook className="size-3" />
                            Self-Learning
                          </Badge>
                        )}
                        {comp.developmentStrategies.workExperience && (
                          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700">
                            <IconBriefcase className="size-3" />
                            Work Experience
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!idpData && !isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <IconTarget className="size-16 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">No IDP Generated Yet</p>
                <p className="text-sm text-muted-foreground">
                  Select an assessment and click "Generate IDP" to view your development plan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
