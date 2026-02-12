"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { staffAPI, assessmentAPI, idpAPI, unitAPI, competencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconCheck, IconSelector } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
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
  staffOrgId: string
  positionName: string
  competencyAnalysis: CompetencyAnalysis[]
  generatedAt: string
}

interface StaffIdpResults {
  [staffId: string]: IdpResult
}

export default function AdminIdpDownloadPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [filteredStaffList, setFilteredStaffList] = useState<Staff[]>([])
  const [unitList, setUnitList] = useState<Unit[]>([])
  const [clusterList, setClusterList] = useState<Cluster[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [selectedAssessment, setSelectedAssessment] = useState<string>("")
  const [competenciesData, setCompetenciesData] = useState<any[]>([])
  const [staffIdpResults, setStaffIdpResults] = useState<StaffIdpResults>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStaffId, setGeneratingStaffId] = useState<string>("")  // Track which staff is being generated

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

  const handleGenerateIdp = async (staffId: string) => {
    try {
      setGeneratingStaffId(staffId)
      
      const payload: any = {
        staffId: staffId
      }
      
      if (selectedAssessment && selectedAssessment !== "latest") {
        payload.assessmentId = selectedAssessment
      }

      console.log("Generating IDP with payload:", payload)
      const result = await idpAPI.generate(payload)
      console.log("IDP Result:", result)
      
      // Backend returns { message, data } structure
      let idpData
      if (result.data) {
        idpData = result.data
      } else {
        // Fallback if backend returns data directly
        idpData = result
      }
      
      // Store the result for this specific staff
      setStaffIdpResults(prev => ({
        ...prev,
        [staffId]: idpData
      }))
      
      toast.success(`IDP generated successfully for ${idpData.staffName}!`)
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
      const staff = staffList.find(s => s.id === staffId)
      if (errorMessage.includes("assessment score missing")) {
        toast.error(
          `Assessment incomplete for ${staff?.name || 'this staff'}. Please ensure all competency assessments (Self & Superior) are completed.`,
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No assessment results found")) {
        toast.error(
          `No assessment results found for ${staff?.name || 'this staff'}. Please complete the assessment first.`,
          { duration: 5000 }
        )
      } else if (errorMessage.includes("No competencies defined")) {
        toast.error(
          `No competencies defined for ${staff?.name || 'this staff'} position. Please configure position competencies first.`,
          { duration: 5000 }
        )
      } else {
        toast.error(`${staff?.name}: ${errorMessage}`, { duration: 5000 })
      }
    } finally {
      setGeneratingStaffId("")
    }
  }

  const handleGenerateAllIdp = async () => {
    const staffToGenerate = filteredStaffList
    if (staffToGenerate.length === 0) {
      toast.error("No staff members found to generate IDP")
      return
    }

    setIsGenerating(true)
    toast.info(`Starting IDP generation for ${staffToGenerate.length} staff members...`)
    
    for (const staff of staffToGenerate) {
      await handleGenerateIdp(staff.id)
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsGenerating(false)
    toast.success(`IDP generation completed for all staff members!`)
  }



  const handleExportCSV = async (staffId: string) => {
    const idpResult = staffIdpResults[staffId]
    if (!idpResult) return

    try {
      toast.info("Generating CSV export...")
      
      const response = await idpAPI.exportCsv({
        staffId: staffId,
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

  const handleExportPDF = async (staffId: string) => {
    const idpResult = staffIdpResults[staffId]
    if (!idpResult) return

    try {
      toast.info("Generating PDF export...")
      
      const response = await idpAPI.exportPdf({
        staffId: staffId,
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
      <Card>
        <CardHeader>
          <CardTitle>Individual Development Plan (IDP)</CardTitle>
          <CardDescription>
            View your key metrics and recent project activity. Track progress across all your active projects.
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

            <div className="space-y-2">
              <Label className="text-transparent">Action</Label>
              <Button 
                onClick={handleGenerateAllIdp} 
                disabled={isGenerating || filteredStaffList.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>Generating All...</>
                ) : (
                  <>
                    <IconFileText className="size-4 mr-2" />
                    Generate IDP for All Staff ({filteredStaffList.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List with IDP Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Generate Individual Development Plans for staff members.
            {selectedUnit !== "all" && (
              <span className="block mt-1 text-sm font-medium">
                Filtered by: {unitList.find(u => u.id === selectedUnit)?.name}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaffList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No staff members found
                {selectedUnit !== "all" && " for the selected unit"}
              </div>
            ) : (
              filteredStaffList.map((staff) => {
                const hasIdpResult = staffIdpResults[staff.id]
                const isGeneratingThis = generatingStaffId === staff.id
                
                return (
                  <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <IconUserCheck className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium">{staff.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {staff.staffOrgId} • {staff.position?.name || 'No Position'}
                            {staff.unit && (
                              <span className="ml-2">• {staff.unit.name}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {hasIdpResult && (
                        <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          <IconCheck className="inline h-3 w-3 mr-1" />
                          IDP Generated on {format(new Date(hasIdpResult.generatedAt), "dd MMM yyyy, HH:mm")}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {hasIdpResult ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportCSV(staff.id)}
                          >
                            <IconDownload className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportPDF(staff.id)}
                          >
                            <IconDownload className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleGenerateIdp(staff.id)}
                          disabled={isGeneratingThis || isGenerating}
                          size="sm"
                        >
                          {isGeneratingThis ? (
                            <>Generating...</>
                          ) : (
                            <>
                              <IconFileText className="h-4 w-4 mr-1" />
                              Generate IDP
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
