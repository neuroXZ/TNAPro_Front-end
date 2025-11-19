"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { assessmentAPI, assessmentResultAPI, positionAPI, competencyAPI, staffAPI, assessorAPI, positionCompetencyAPI } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconArrowLeft, IconPlus, IconCheck, IconX, IconFileTypePdf, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Assessment {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  weightageSelf?: number
  weightageSuperior?: number
  weightagePeer?: number
}

interface Position {
  id: string
  name: string
}

interface Competency {
  id: string
  name: string
  cluster?: {
    name: string
    color?: string
  }
}

interface Staff {
  id: string
  name: string
  orgId?: string
  positionId?: string
}

interface Assessor {
  id: string
  staffId: string
  assessmentId: string
  assessorId: string
  type: string
  staff?: Staff
}

interface AssessmentResult {
  id: string
  assessmentId: string
  positionId: string
  competencyId: string
  assessorId: string
  score: number
  position?: Position
  competency?: Competency
  assessor?: Assessor
}

interface StaffCompetencyMatrix {
  [staffId: string]: {
    staff: Staff
    position: Position
    competencies: {
      [competencyId: string]: {
        competency: Competency
        requiredLevel?: number
        scores: {
          self?: number
          superior?: number
        }
        finalScore?: number
        gap?: number
      }
    }
  }
}

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [assessors, setAssessors] = useState<Assessor[]>([])
  const [positionCompetencies, setPositionCompetencies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPosition, setSelectedPosition] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [assessmentId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [assessmentData, resultsData, positionsData, competenciesData, staffData, assessorsData, positionCompetenciesData] = await Promise.all([
        assessmentAPI.getById(assessmentId),
        assessmentResultAPI.getByAssessment(assessmentId),
        positionAPI.getAll(),
        competencyAPI.getAll(),
        staffAPI.getAll(),
        assessorAPI.getAll(),
        positionCompetencyAPI.getAll(),
      ])
      
      console.log('Assessment Data:', assessmentData)
      console.log('Results Data:', resultsData)
      console.log('Assessors Data:', assessorsData)
      console.log('Position Competencies Data:', positionCompetenciesData)
      
      setAssessment(assessmentData)
      setResults(resultsData)
      setPositions(positionsData)
      setCompetencies(competenciesData)
      setStaff(staffData)
      setPositionCompetencies(positionCompetenciesData)
      
      // Don't filter - we need all assessors to match with results
      console.log('All Assessors:', assessorsData)
      setAssessors(assessorsData)
    } catch (error) {
      toast.error("Failed to fetch data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const buildMatrix = (): StaffCompetencyMatrix => {
    const matrix: StaffCompetencyMatrix = {}

    console.log('Building matrix from results:', results.length)

    results.forEach((result) => {
      // Get assessor info from assessors array instead of result.assessor
      const assessor = assessors.find(a => a.id === result.assessorId)
      
      console.log('Processing result:', { 
        resultId: result.id, 
        assessorId: result.assessorId, 
        assessor,
        competencyId: result.competencyId 
      })
      
      if (!assessor) {
        console.log('No assessor found for result:', result.assessorId)
        return
      }

      const staffId = assessor.staffId
      const competencyId = result.competencyId
      const assessorType = assessor.type?.toLowerCase()

      if (!matrix[staffId]) {
        const staffMember = staff.find((s) => s.id === staffId)
        const position = positions.find((p) => p.id === result.positionId)
        if (!staffMember || !position) {
          console.log('Missing staff or position:', { staffId, positionId: result.positionId })
          return
        }

        matrix[staffId] = {
          staff: staffMember,
          position,
          competencies: {},
        }
      }

      if (!matrix[staffId].competencies[competencyId]) {
        const competency = competencies.find((c) => c.id === competencyId)
        if (!competency) {
          console.log('Missing competency:', competencyId)
          return
        }

        // Get required level from position competencies
        const positionComp = positionCompetencies.find(
          pc => pc.positionId === result.positionId && pc.competencyId === competencyId
        )
        const requiredLevel = positionComp?.level || 0

        console.log('Finding RCL for:', { 
          positionId: result.positionId, 
          competencyId, 
          positionComp,
          requiredLevel,
          totalPositionComps: positionCompetencies.length
        })

        matrix[staffId].competencies[competencyId] = {
          competency,
          requiredLevel,
          scores: {},
        }
      }

      // Assign score based on assessor type
      if (assessorType === "self") {
        matrix[staffId].competencies[competencyId].scores.self = result.score
      } else if (assessorType === "superior") {
        matrix[staffId].competencies[competencyId].scores.superior = result.score
      }
    })

    console.log('Final matrix:', matrix)
    console.log('Staff IDs in matrix:', Object.keys(matrix))

    // Calculate final scores and gaps
    Object.keys(matrix).forEach((staffId) => {
      Object.keys(matrix[staffId].competencies).forEach((competencyId) => {
        const { scores, requiredLevel } = matrix[staffId].competencies[competencyId]
        const selfScore = scores.self || 0
        const superiorScore = scores.superior || 0

        const weightageSelf = assessment?.weightageSelf || 0
        const weightageSuperior = assessment?.weightageSuperior || 0

        const finalScore =
          selfScore * weightageSelf +
          superiorScore * weightageSuperior

        // Calculate gap using backend formula
        const selfGap = (requiredLevel! - selfScore) * weightageSelf
        const superiorGap = (requiredLevel! - superiorScore) * weightageSuperior
        const totalGap = Math.round((selfGap + superiorGap) * 100) / 100

        matrix[staffId].competencies[competencyId].finalScore = finalScore
        matrix[staffId].competencies[competencyId].gap = totalGap
      })
    })

    return matrix
  }

  const matrix = buildMatrix()

  // Get ALL staff from database and check if they have results in this assessment
  const allStaffInAssessment = staff.map(staffMember => {
    const hasResults = !!matrix[staffMember.id]
    const position = positions.find(p => p.id === staffMember.positionId)
    
    return {
      id: staffMember.id,
      name: staffMember.name,
      orgId: staffMember.orgId,
      positionId: staffMember.positionId,
      positionName: position?.name || 'No Position',
      hasResults,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))

  // Filter staff based on search and position
  const filteredStaff = allStaffInAssessment.filter(staffMember => {
    const matchesSearch = staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staffMember.orgId?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPosition = selectedPosition === "all" || staffMember.positionId === selectedPosition
    return matchesSearch && matchesPosition
  })

  console.log('All staff in assessment:', allStaffInAssessment)

  const completedCount = filteredStaff.filter(s => s.hasResults).length
  const incompleteCount = filteredStaff.length - completedCount

  // Get unique positions for filter
  const uniquePositions = Array.from(new Set(
    allStaffInAssessment
      .filter(s => s.positionId)
      .map(s => ({ id: s.positionId!, name: s.positionName }))
      .map(p => JSON.stringify(p))
  )).map(p => JSON.parse(p))

  const getScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground"
    if (score >= 4) return "text-green-600 font-semibold"
    if (score >= 3) return "text-yellow-600 font-semibold"
    return "text-red-600 font-semibold"
  }

  const getGapColor = (gap?: number) => {
    if (gap === undefined) return "text-muted-foreground"
    if (gap >= 1.5) return "text-red-600 font-semibold"
    if (gap >= 1.0) return "text-orange-600 font-semibold"
    if (gap > 0) return "text-yellow-600 font-semibold"
    return "text-green-600 font-semibold"
  }

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
          onClick={() => router.push("/admin/assessments")}
        >
          <IconArrowLeft className="mr-2 size-4" />
          Back to Assessments
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{assessment?.name}</h1>
          <p className="text-muted-foreground">
            {assessment?.startDate && `${new Date(assessment.startDate).toLocaleDateString()} - `}
            {assessment?.endDate && new Date(assessment.endDate).toLocaleDateString()}
            {assessment?.startDate && assessment?.endDate && " • "}
            {results.length} {results.length === 1 ? "result" : "results"} recorded
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weightage Configuration</CardTitle>
          <CardDescription>
            Score calculation weights for different assessment types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Self Assessment</p>
              <p className="text-2xl font-bold">
                {assessment?.weightageSelf ? `${(assessment.weightageSelf * 100).toFixed(0)}%` : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Superior Assessment</p>
              <p className="text-2xl font-bold">
                {assessment?.weightageSuperior ? `${(assessment.weightageSuperior * 100).toFixed(0)}%` : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Results Matrix</CardTitle>
          <CardDescription>
            Staff × Competency scores with weighted final scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">
                  All Staff ({filteredStaff.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <IconCheck className="size-3" />
                  Completed ({completedCount})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <IconX className="size-3" />
                  Incomplete ({incompleteCount})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniquePositions.map(position => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="space-y-2">
              {filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff found.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {filteredStaff.map((staffMember) => {
                    const staffData = matrix[staffMember.id]
                    return (
                      <AccordionItem key={staffMember.id} value={staffMember.id} className="rounded-md border px-4">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div>
                              <h3 className="text-base font-semibold text-left">{staffMember.name}</h3>
                              <p className="text-sm text-muted-foreground text-left">
                                {staffMember.orgId && `${staffMember.orgId} • `}
                                {staffMember.positionName}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {staffMember.hasResults ? (
                                <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                                  <IconCheck className="size-3" />
                                  Completed
                                </Badge>
                              ) : (
                                <Badge className="gap-1 bg-red-600 hover:bg-red-700 text-white">
                                  <IconX className="size-3" />
                                  Incomplete
                                </Badge>
                              )}
                              {staffMember.hasResults && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 gap-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // TODO: Implement PDF export
                                    toast.info("PDF export feature coming soon")
                                  }}
                                >
                                  <IconFileTypePdf className="size-4" />
                                  Save PDF
                                </Button>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          {staffData ? (
                            <Tabs defaultValue="all-clusters" className="w-full">
                              <TabsList className="mb-3">
                                <TabsTrigger value="all-clusters">All</TabsTrigger>
                                {Array.from(new Set(
                                  Object.values(staffData.competencies)
                                    .map(c => c.competency.cluster?.name)
                                    .filter(Boolean)
                                )).map(clusterName => (
                                  <TabsTrigger key={clusterName} value={clusterName || ''}>
                                    {clusterName}
                                  </TabsTrigger>
                                ))}
                              </TabsList>

                              <TabsContent value="all-clusters">
                                <div className="rounded-md border overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[200px]">Competency</TableHead>
                                        <TableHead className="text-center">RCL</TableHead>
                                        <TableHead className="text-center">Self</TableHead>
                                        <TableHead className="text-center">Superior</TableHead>
                                        <TableHead className="text-center font-semibold">Total Score</TableHead>
                                        <TableHead className="text-center font-semibold">Gap</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {Object.entries(staffData.competencies).map(([competencyId, { competency, requiredLevel, scores, finalScore, gap }]) => (
                                        <TableRow key={competencyId}>
                                          <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                              {competency.cluster?.color && (
                                                <div
                                                  className="size-3 rounded"
                                                  style={{ backgroundColor: competency.cluster.color }}
                                                />
                                              )}
                                              {competency.name}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {requiredLevel || "-"}
                                          </TableCell>
                                          <TableCell className={`text-center ${getScoreColor(scores.self)}`}>
                                            {scores.self?.toFixed(1) || "-"}
                                          </TableCell>
                                          <TableCell className={`text-center ${getScoreColor(scores.superior)}`}>
                                            {scores.superior?.toFixed(1) || "-"}
                                          </TableCell>
                                          <TableCell className={`text-center ${getScoreColor(finalScore)}`}>
                                            <Badge variant={finalScore && finalScore >= 4 ? "default" : finalScore && finalScore >= 3 ? "secondary" : "destructive"}>
                                              {finalScore?.toFixed(2) || "-"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className={`text-center ${getScoreColor(gap)}`}>
                                            {gap?.toFixed(2) || "-"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TabsContent>

                              {Array.from(new Set(
                                Object.values(staffData.competencies)
                                  .map(c => c.competency.cluster?.name)
                                  .filter(Boolean)
                              )).map(clusterName => (
                                <TabsContent key={clusterName} value={clusterName || ''}>
                                  <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[200px]">Competency</TableHead>
                                          <TableHead className="text-center">RCL</TableHead>
                                          <TableHead className="text-center">Self</TableHead>
                                          <TableHead className="text-center">Superior</TableHead>
                                          <TableHead className="text-center font-semibold">Final Score</TableHead>
                                          <TableHead className="text-center font-semibold">Gap</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {Object.entries(staffData.competencies)
                                          .filter(([, { competency }]) => competency.cluster?.name === clusterName)
                                          .map(([competencyId, { competency, requiredLevel, scores, finalScore, gap }]) => (
                                            <TableRow key={competencyId}>
                                              <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                  {competency.cluster?.color && (
                                                    <div
                                                      className="size-3 rounded"
                                                      style={{ backgroundColor: competency.cluster.color }}
                                                    />
                                                  )}
                                                  {competency.name}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {requiredLevel || "-"}
                                              </TableCell>
                                              <TableCell className={`text-center ${getScoreColor(scores.self)}`}>
                                                {scores.self?.toFixed(1) || "-"}
                                              </TableCell>
                                              <TableCell className={`text-center ${getScoreColor(scores.superior)}`}>
                                                {scores.superior?.toFixed(1) || "-"}
                                              </TableCell>
                                              <TableCell className={`text-center ${getScoreColor(finalScore)}`}>
                                                <Badge variant={finalScore && finalScore >= 4 ? "default" : finalScore && finalScore >= 3 ? "secondary" : "destructive"}>
                                                  {finalScore?.toFixed(2) || "-"}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className={`text-center ${getGapColor(gap)}`}>
                                                {gap !== undefined ? gap.toFixed(2) : "-"}
                                              </TableCell>
                                            </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TabsContent>
                              ))}
                            </Tabs>
                          ) : (
                            <div className="rounded-md border p-4 text-center text-muted-foreground">
                              Assessment not yet completed
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-2">
              {completedCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No completed assessments yet.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {filteredStaff
                    .filter(s => s.hasResults)
                    .map((staffMember) => {
                      const staffData = matrix[staffMember.id]
                      return (
                        <AccordionItem key={staffMember.id} value={staffMember.id} className="rounded-md border px-4">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div>
                                <h3 className="text-base font-semibold text-left">{staffMember.name}</h3>
                                <p className="text-sm text-muted-foreground text-left">
                                  {staffMember.orgId && `${staffMember.orgId} • `}
                                  {staffMember.positionName}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                                  <IconCheck className="size-3" />
                                  Completed
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 gap-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // TODO: Implement PDF export
                                    toast.info("PDF export feature coming soon")
                                  }}
                                >
                                  <IconFileTypePdf className="size-4" />
                                  Save PDF
                                </Button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <Tabs defaultValue="all-clusters" className="w-full">
                              <TabsList className="mb-3">
                                <TabsTrigger value="all-clusters">All</TabsTrigger>
                                {Array.from(new Set(
                                  Object.values(staffData.competencies)
                                    .map(c => c.competency.cluster?.name)
                                    .filter(Boolean)
                                )).map(clusterName => (
                                  <TabsTrigger key={clusterName} value={clusterName || ''}>
                                    {clusterName}
                                  </TabsTrigger>
                                ))}
                              </TabsList>

                              <TabsContent value="all-clusters">
                                <div className="rounded-md border overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[200px]">Competency</TableHead>
                                        <TableHead className="text-center">RCL</TableHead>
                                        <TableHead className="text-center">Self</TableHead>
                                        <TableHead className="text-center">Superior</TableHead>
                                        <TableHead className="text-center font-semibold">Total Score</TableHead>
                                        <TableHead className="text-center font-semibold">Gap</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {Object.entries(staffData.competencies).map(([competencyId, { competency, requiredLevel, scores, finalScore, gap }]) => (
                                        <TableRow key={competencyId}>
                                          <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                              {competency.cluster?.color && (
                                                <div
                                                  className="size-3 rounded"
                                                  style={{ backgroundColor: competency.cluster.color }}
                                                />
                                              )}
                                              {competency.name}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {requiredLevel || "-"}
                                          </TableCell>
                                          <TableCell className={`text-center ${getScoreColor(scores.self)}`}>
                                            {scores.self?.toFixed(1) || "-"}
                                          </TableCell>
                                          <TableCell className={`text-center ${getScoreColor(scores.superior)}`}>
                                            {scores.superior?.toFixed(1) || "-"}
                                          </TableCell>
                                          <TableCell className={`text-center ${getScoreColor(finalScore)}`}>
                                            <Badge variant={finalScore && finalScore >= 4 ? "default" : finalScore && finalScore >= 3 ? "secondary" : "destructive"}>
                                              {finalScore?.toFixed(2) || "-"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className={`text-center ${getGapColor(gap)}`}>
                                            {gap !== undefined ? gap.toFixed(2) : "-"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TabsContent>

                              {Array.from(new Set(
                                Object.values(staffData.competencies)
                                  .map(c => c.competency.cluster?.name)
                                  .filter(Boolean)
                              )).map(clusterName => (
                                <TabsContent key={clusterName} value={clusterName || ''}>
                                  <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[200px]">Competency</TableHead>
                                          <TableHead className="text-center">RCL</TableHead>
                                          <TableHead className="text-center">Self</TableHead>
                                          <TableHead className="text-center">Superior</TableHead>
                                          <TableHead className="text-center font-semibold">Total Score</TableHead>
                                          <TableHead className="text-center font-semibold">Gap</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {Object.entries(staffData.competencies)
                                          .filter(([, { competency }]) => competency.cluster?.name === clusterName)
                                          .map(([competencyId, { competency, requiredLevel, scores, finalScore, gap }]) => (
                                            <TableRow key={competencyId}>
                                              <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                  {competency.cluster?.color && (
                                                    <div
                                                      className="size-3 rounded"
                                                      style={{ backgroundColor: competency.cluster.color }}
                                                    />
                                                  )}
                                                  {competency.name}
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {requiredLevel || "-"}
                                              </TableCell>
                                              <TableCell className={`text-center ${getScoreColor(scores.self)}`}>
                                                {scores.self?.toFixed(1) || "-"}
                                              </TableCell>
                                              <TableCell className={`text-center ${getScoreColor(scores.superior)}`}>
                                                {scores.superior?.toFixed(1) || "-"}
                                              </TableCell>
                                              <TableCell className={`text-center ${getScoreColor(finalScore)}`}>
                                                <Badge variant={finalScore && finalScore >= 4 ? "default" : finalScore && finalScore >= 3 ? "secondary" : "destructive"}>
                                                  {finalScore?.toFixed(2) || "-"}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className={`text-center ${getGapColor(gap)}`}>
                                                {gap !== undefined ? gap.toFixed(2) : "-"}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TabsContent>
                              ))}
                            </Tabs>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {incompleteCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  All staff have completed their assessments!
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStaff
                    .filter(s => !s.hasResults)
                    .map((staffMember) => (
                      <div key={staffMember.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold">{staffMember.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {staffMember.orgId && `${staffMember.orgId} • `}
                              {staffMember.positionName}
                            </p>
                          </div>
                          <Badge className="gap-1 ml-4 bg-red-600 hover:bg-red-700 text-white">
                            <IconX className="size-3" />
                            Incomplete
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
