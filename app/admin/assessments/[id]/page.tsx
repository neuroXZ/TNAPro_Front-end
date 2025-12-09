"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowLeft } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAssessmentData } from "./hooks/useAssessmentData"
import { WeightageCard } from "./components/WeightageCard"
import { StaffList } from "./components/StaffList"

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const {
    assessment,
    results,
    positions,
    isLoading,
    buildMatrix,
    getAllStaffWithResults,
    refreshData,
  } = useAssessmentData(assessmentId)

  const matrix = buildMatrix()
  const allStaff = getAllStaffWithResults(matrix)

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
          <h1 className="text-3xl font-bold text-primary">{assessment?.name}</h1>
          <p className="text-muted-foreground">
            {assessment?.startDate &&
              `${new Date(assessment.startDate).toLocaleDateString()} - `}
            {assessment?.endDate && new Date(assessment.endDate).toLocaleDateString()}
            {assessment?.startDate && assessment?.endDate && " • "}
            {results.length} {results.length === 1 ? "result" : "results"} recorded
          </p>
        </div>
      </div>

      <WeightageCard assessment={assessment} />

      <Card>
        <CardHeader>
          <CardTitle>Assessment Results Matrix</CardTitle>
          <CardDescription>
            Staff Competency scores with weighted final scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffList 
            allStaff={allStaff} 
            matrix={matrix} 
            positions={positions} 
            onDataUpdate={refreshData}
          />
        </CardContent>
      </Card>
    </div>
  )
}
