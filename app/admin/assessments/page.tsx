"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { assessmentAPI, assessmentResultAPI, staffAPI, assessorAPI } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"
import { Assessment, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { AssessmentTableSkeleton } from "./assessment-table-skeleton"
import { AssessmentDataTable } from "./assessment-data-table"
import { AssessmentTableActions } from "./assessment-table-actions"
import { AssessmentFormDialog } from "./assessment-form-dialog"
import { AssessmentDeleteDialog } from "./assessment-delete-dialog"

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [assessmentResults, setAssessmentResults] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [assessors, setAssessors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      setIsLoading(true)
      const [assessmentsData, resultsData, staffData, assessorsData] = await Promise.all([
        assessmentAPI.getAll(),
        assessmentResultAPI.getAll(),
        staffAPI.getAll(),
        assessorAPI.getAll(),
      ])
      
      // Add completion count to assessments
      const assessmentsWithCount = assessmentsData.map((assessment: any) => {
        // Get all results for this assessment
        const assessmentResultsForThis = resultsData.filter(
          (result: any) => result.assessmentId === assessment.id
        )
        
        // Build matrix to find unique staff who completed
        const staffMatrix: { [staffId: string]: boolean } = {}
        
        assessmentResultsForThis.forEach((result: any) => {
          const assessor = assessorsData.find((a: any) => a.id === result.assessorId)
          if (assessor && assessor.staffId) {
            staffMatrix[assessor.staffId] = true
          }
        })
        
        const completedCount = Object.keys(staffMatrix).length
        const totalStaff = staffData.length
        
        return {
          ...assessment,
          _count: {
            assessmentResults: resultsData.filter(
              (result: any) => result.assessmentId === assessment.id
            ).length,
          },
          completedStaff: completedCount,
          totalStaff: totalStaff,
        }
      })
      
      setAssessments(assessmentsWithCount)
      setAssessmentResults(resultsData)
      setStaff(staffData)
      setAssessors(assessorsData)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch assessments data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setIsFormDialogOpen(true)
  }

  const handleDelete = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setIsDeleteDialogOpen(true)
  }

  const columns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDelete }), [])

  const table = useReactTable({
    data: assessments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const handleAdd = () => {
    setSelectedAssessment(null)
    setIsFormDialogOpen(true)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedAssessment) {
        await assessmentAPI.update(selectedAssessment.id, data)
        toast.success("Assessment updated successfully")
      } else {
        await assessmentAPI.create(data)
        toast.success("Assessment created successfully")
      }
      await fetchAssessments()
    } catch (error) {
      toast.error("Failed to save assessment")
      console.error(error)
    }
  }

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length > 0) {
      setIsDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      if (selectedAssessment) {
        // Single delete
        await assessmentAPI.delete(selectedAssessment.id)
        toast.success("Assessment deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        await Promise.all(
          selectedRows.map((row) => assessmentAPI.delete(row.original.id))
        )
        toast.success(`${selectedRows.length} assessment(s) deleted successfully`)
      }
      await fetchAssessments()
      setSelectedAssessment(null)
    } catch (error) {
      toast.error("Failed to delete assessments")
      console.error(error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment Management</h1>
          <p className="text-muted-foreground">
            Manage competency assessment campaigns and view results
          </p>
        </div>
        <AssessmentTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={handleAdd}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Assessments</CardTitle>
              <CardDescription>
                Click on an assessment to view and manage results
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search assessments..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AssessmentTableSkeleton />
          ) : (
            <>
              <AssessmentDataTable 
                table={table} 
                columnsLength={columns.length}
              />
              {assessments.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <AssessmentFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        assessment={selectedAssessment}
        onSubmit={handleFormSubmit}
      />

      <AssessmentDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        assessmentName={
          selectedAssessment
            ? selectedAssessment.name
            : table.getFilteredSelectedRowModel().rows.length === 1
            ? table.getFilteredSelectedRowModel().rows[0].original.name
            : `${table.getFilteredSelectedRowModel().rows.length} assessments`
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
