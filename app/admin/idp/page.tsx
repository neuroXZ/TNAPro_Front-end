"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { staffAPI, assessmentAPI, idpAPI, unitAPI, competencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconFileText, IconDownload, IconUserCheck, IconTarget, IconTrendingUp, IconInfoCircle } from "@tabler/icons-react"
import { format } from "date-fns"
import { useEffect } from "react"

interface Staff {
  id: string
  name: string
  staffOrgId: string
  unitId?: string
  unit?: {
    id: string
    name: string
  }
  position?: {
    id: string
    name: string
  }
}

interface Assessment {
  id: string
  name: string
  startDate: string
  endDate: string
}

interface Unit {
  id: string
  name: string
}

interface Cluster {
  id: string
  name: string
}

interface CompetencyAnalysis {
  competencyId: string
  competencyName: string
  trainingName?: string
  requiredLevel: number
  selfScore: number
  superiorScore: number
  totalScore: number
  gap: number
  clusterId?: string
  clusterName?: string
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

export default function AdminIdpPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [filteredStaffList, setFilteredStaffList] = useState<Staff[]>([])
  const [unitList, setUnitList] = useState<Unit[]>([])
  const [clusterList, setClusterList] = useState<Cluster[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [selectedAssessment, setSelectedAssessment] = useState<string>("")
  const [selectedResultCluster, setSelectedResultCluster] = useState<string>("all")
  const [competenciesData, setCompetenciesData] = useState<any[]>([])
  const [idpResult, setIdpResult] = useState<IdpResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTrainingPopupOpen, setIsTrainingPopupOpen] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    // Filter staff based on selected unit
    if (selectedUnit === "all") {
      setFilteredStaffList(staffList)
    } else {
      const filtered = staffList.filter(staff => 
        staff.unitId === selectedUnit
      )
      setFilteredStaffList(filtered)
    }
    
    // Reset selected staff if not in filtered list
    if (selectedStaff && selectedUnit !== "all") {
      const isSelectedStaffInFiltered = filteredStaffList.some(staff => staff.id === selectedStaff)
      if (!isSelectedStaffInFiltered) {
        setSelectedStaff("")
      }
    }
  }, [selectedUnit, staffList])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      const [staffData, assessmentsData, unitsData, competenciesData] = await Promise.all([
        staffAPI.getAll(),
        assessmentAPI.getAll(),
        unitAPI.getAll(),
        competencyAPI.getAll(),
      ])
      
      // Extract unique clusters from competency data
      const clusters: Cluster[] = []
      const seenClusterIds = new Set<string>()
      
      competenciesData.forEach((competency: any) => {
        // Try different possible cluster reference paths
        const cluster = competency.cluster || 
                       (competency.clusterId && { id: competency.clusterId, name: competency.clusterName }) ||
                       null
                       
        if (cluster && !seenClusterIds.has(cluster.id)) {
          clusters.push({
            id: cluster.id,
            name: cluster.name
          })
          seenClusterIds.add(cluster.id)
        }
      })
      

      
      setStaffList(staffData)
      setFilteredStaffList(staffData)
      setUnitList(unitsData)
      setClusterList(clusters)
      setCompetenciesData(competenciesData)
      setAssessments(assessmentsData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateIdp = async () => {
    if (!selectedStaff) {
      toast.error("Please select a staff member")
      return
    }

    try {
      setIsGenerating(true)
      
      const payload: any = {
        staffId: selectedStaff
      }
      
      if (selectedAssessment && selectedAssessment !== "latest") {
        payload.assessmentId = selectedAssessment
      }

      console.log("Generating IDP with payload:", payload)
      const result = await idpAPI.generate(payload)
      console.log("IDP Result:", result)
      
      // Backend returns { message, data } structure
      if (result.data) {
        setIdpResult(result.data)
        toast.success(result.message || "IDP generated successfully!")
      } else {
        // Fallback if backend returns data directly
        setIdpResult(result)
        toast.success("IDP generated successfully!")
      }
    } catch (error: any) {
      console.error("Failed to generate IDP - Full error:", error)
      console.error("Error response:", error.response)
      
      // Better error message extraction
      let errorMessage = "Failed to generate IDP"
      
      if (error.response?.data) {
        const data = error.response.data
        errorMessage = data.error || data.message || JSON.stringify(data)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // User-friendly error messages
      if (errorMessage.includes("assessment score missing")) {
        const staff = staffList.find(s => s.id === selectedStaff)
        toast.error(
          `Assessment incomplete for ${staff?.name || 'this staff'}. Please ensure all competency assessments (Self & Superior) are completed.`,
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No assessment results found")) {
        toast.error(
          "No assessment results found for this staff member. Please complete the assessment first.",
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No competencies defined")) {
        toast.error(
          "No competencies defined for this staff's position. Please configure position competencies first.",
          { duration: 5000 }
        )
      } else {
        toast.error(errorMessage, { duration: 5000 })
      }
    } finally {
      setIsGenerating(false)
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
    if (gap >= 1.0) return "text-purple-600 font-semibold"
    if (gap > 0) return "text-yellow-600"
    return "text-green-600"
  }

  const handleExportCSV = async () => {
    if (!idpResult) return

    try {
      toast.info("Generating CSV export...")
      
      const response = await idpAPI.exportCsv({
        staffId: selectedStaff,
        assessmentId: selectedAssessment || undefined
      })

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `IDP_${idpResult.staffName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("IDP exported to CSV successfully")
    } catch (error) {
      console.error("CSV Export Error:", error)
      toast.error("Failed to export IDP to CSV")
    }
  }

  const handleExportPDF = async () => {
    if (!idpResult) return

    try {
      toast.info("Generating PDF export...")
      
      const response = await idpAPI.exportPdf({
        staffId: selectedStaff,
        assessmentId: selectedAssessment || undefined
      })

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `IDP_${idpResult.staffName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("IDP exported to PDF successfully")
    } catch (error) {
      console.error("PDF Export Error:", error)
      toast.error("Failed to export IDP to PDF")
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Individual Development Plan (IDP)</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage staff development plans
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary">Individual Development Plan (IDP)</h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage staff development plans based on competency gaps
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate IDP</CardTitle>
          <CardDescription>
            Select a staff member and optionally an assessment to generate their development plan
            {selectedUnit && selectedUnit !== "all" && (
              <span className="block mt-1 text-primary font-medium">
                Showing {filteredStaffList.length} staff from selected unit
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="unit">Filter by Unit (Optional)</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue placeholder="All Units" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[300px]">
                  <SelectItem value="all">All Units</SelectItem>
                  {unitList.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id} className="max-w-[280px]">
                      <span className="truncate block">{unit.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member *</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger id="staff" className="w-full">
                  <SelectValue placeholder="Select staff member" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[450px]">
                  {filteredStaffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id} className="max-w-[430px]">
                      <span className="truncate block">
                        {staff.name} ({staff.staffOrgId}) - {staff.position?.name || 'No Position'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment (Optional)</Label>
              <Select value={selectedAssessment || "latest"} onValueChange={(v) => setSelectedAssessment(v === "latest" ? "" : v)}>
                <SelectTrigger id="assessment" className="w-full">
                  <SelectValue placeholder="Use latest assessment" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[400px]">
                  <SelectItem value="latest">Use Latest</SelectItem>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id} className="max-w-[380px]">
                      <span className="truncate block">
                        {assessment.name} ({format(new Date(assessment.startDate), "dd MMM yyyy")})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleGenerateIdp} disabled={isGenerating || !selectedStaff}>
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <IconFileText className="size-4 mr-2" />
                  Generate IDP
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {idpResult && (
        <>
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
                      {filteredCompetencies.filter(c => c.developmentStrategies.training).length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Average Gap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {filteredCompetencies.length > 0 
                        ? (filteredCompetencies.reduce((sum, c) => sum + c.gap, 0) / filteredCompetencies.length).toFixed(1)
                        : "0.0"
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Competency Gap Analysis</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedResultCluster} onValueChange={setSelectedResultCluster}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by Cluster" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clusters</SelectItem>
                      {clusterList.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isTrainingPopupOpen} onOpenChange={setIsTrainingPopupOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <IconTarget className="size-4 mr-2" />
                        Recommended Training
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Recommended Training Programs</DialogTitle>
                        <DialogDescription>
                          Training recommendations based on competency gaps for {idpResult?.staffName}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium">Competency</th>
                                  <th className="px-3 py-3 text-center text-sm font-medium">Gap</th>
                                  <th className="px-3 py-3 text-left text-sm font-medium">Training Program</th>
                                  <th className="px-3 py-3 text-center text-sm font-medium">Priority</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredCompetencies
                                  .filter(comp => comp.developmentStrategies.training)
                                  .sort((a, b) => b.gap - a.gap)
                                  .map((comp, index) => (
                                    <tr key={comp.competencyId} className="border-t hover:bg-muted/50">
                                      <td className="px-4 py-3 text-sm font-medium">{comp.competencyName}</td>
                                      <td className={`px-3 py-3 text-sm text-center font-medium ${getGapColor(comp.gap)}`}>
                                        {comp.gap.toFixed(1)}
                                      </td>
                                      <td className="px-3 py-3 text-sm">
                                        {comp.trainingName || `${comp.competencyName} Training Program`}
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <Badge 
                                          variant={comp.gap >= 2 ? "destructive" : comp.gap >= 1.5 ? "default" : "default"}
                                        >
                                          {comp.gap >= 2 ? "High" : comp.gap >= 1.5 ? "Medium" : "Low"}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))
                                }
                                {filteredCompetencies.filter(comp => comp.developmentStrategies.training).length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                      No training recommendations found for selected competencies
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <IconDownload className="size-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <IconDownload className="size-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
              {selectedResultCluster !== "all" && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCompetencies.length} of {idpResult.competencyAnalysis.length} competencies
                </div>
              )}
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
                      {filteredCompetencies.map((comp, index) => {
                        // Find competency cluster info for debugging
                        const competencyData = competenciesData.find(c => c.id === comp.competencyId)
                        
                        // Try different possible cluster reference paths
                        let clusterId = null
                        if (competencyData) {
                          clusterId = competencyData.clusterId || 
                                     competencyData.cluster?.id || 
                                     competencyData.clusterID ||
                                     competencyData.cluster_id
                        }
                        
                        const clusterInfo = clusterList.find(cl => cl.id === clusterId)
                        
                        return (
                          <tr key={comp.competencyId} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm font-medium border-r">{comp.competencyName}</td>
                            <td className="px-3 py-3 text-sm text-center border-r">{comp.requiredLevel}</td>
                            <td className="px-3 py-3 text-sm text-center">{comp.selfScore || 'N/A'}</td>
                            <td className="px-3 py-3 text-sm text-center">{comp.superiorScore || 'N/A'}</td>
                            <td className={`px-3 py-3 text-sm text-center border-r font-medium ${getGapColor(comp.gap)}`}>
                              {comp.gap.toFixed(1)}
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
                        )
                      })}
                      {filteredCompetencies.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                            No competencies found for selected cluster
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <Badge className="bg-purple-600">Coaching</Badge>
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
