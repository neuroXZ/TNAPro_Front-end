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
import { assessmentResultAPI, assessmentAPI, positionAPI, competencyAPI, assessorAPI } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconSearch, IconFilterOff } from "@tabler/icons-react"
import { toast } from "sonner"
import { AssessmentResult, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { ResultFormDialog } from "./result-form-dialog"
import { ResultDeleteDialog } from "./result-delete-dialog"
import { ResultTableSkeleton } from "./result-table-skeleton"
import { ResultDataTable } from "./result-data-table"
import { ResultTableActions } from "./result-table-actions"
import { ResultViewDialog } from "./result-view-dialog"

export default function AssessmentResultsPage() {
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [competencies, setCompetencies] = useState<any[]>([])
  const [assessors, setAssessors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingResult, setEditingResult] = useState<AssessmentResult | null>(null)
  const [deletingResult, setDeletingResult] = useState<AssessmentResult | null>(null)
  const [viewingResult, setViewingResult] = useState<AssessmentResult | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [assessorTypeFilter, setAssessorTypeFilter] = useState("all")
  const [assessorNameFilter, setAssessorNameFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchData()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [resultsData, assessmentsData, positionsData, competenciesData, assessorsData] = await Promise.all([
        assessmentResultAPI.getAll(),
        assessmentAPI.getAll(),
        positionAPI.getAll(),
        competencyAPI.getAll(),
        assessorAPI.getAll(),
      ])
      setResults(resultsData)
      setAssessments(assessmentsData)
      setPositions(positionsData)
      setCompetencies(competenciesData)
      setAssessors(assessorsData)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(result?: AssessmentResult) {
    setEditingResult(result || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (result: AssessmentResult) => {
    setViewingResult(result)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: any) => {
    if (editingResult) {
      await assessmentResultAPI.update(editingResult.id, formData)
      toast.success("Assessment result updated successfully")
    } else {
      await assessmentResultAPI.create(formData)
      toast.success("Assessment result created successfully")
    }

    setEditingResult(null)
    fetchData()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (result: AssessmentResult) => {
    setDeletingResult(result)
    setIsDeleteDialogOpen(true)
  }

  // Define columns after handler functions are declared
  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleOpenDialog,
        onView: handleRowClick,
        onDelete: handleOpenDeleteDialog,
        assessors: assessors,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assessors]
  )

  // ==================== TABLE INITIALIZATION ====================
  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      // Assessor Type filter
      if (assessorTypeFilter !== "all") {
        const assessor = assessors.find((a: any) => a.id === result.assessorId)
        if (assessor?.type !== assessorTypeFilter) return false
      }

      // Assessor Name filter
      if (assessorNameFilter !== "all") {
        if (result.assessorId !== assessorNameFilter) return false
      }

      // Status filter
      if (statusFilter !== "all") {
        if (result.status !== statusFilter) return false
      }

      return true
    })
  }, [results, assessorTypeFilter, assessorNameFilter, statusFilter, assessors])

  // Initialize table after columns are defined
  const table = useReactTable({
    data: filteredResults,
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

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error("Please select results to delete")
      return
    }
    setDeletingResult(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingResult) {
        // Single delete
        await assessmentResultAPI.delete(deletingResult.id)
        toast.success("Assessment result deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          assessmentResultAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} results deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingResult(null)
      fetchData()
    } catch (error: any) {
      toast.error("Failed to delete result")
      console.error(error)
    }
  }

  const handleClearFilters = () => {
    setAssessorTypeFilter("all")
    setAssessorNameFilter("all")
    setStatusFilter("all")
    setGlobalFilter("")
  }

  const hasActiveFilters = 
    assessorTypeFilter !== "all" || 
    assessorNameFilter !== "all" || 
    statusFilter !== "all" || 
    globalFilter !== ""

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Assessment Results</h1>
          <p className="text-muted-foreground">
            Manage assessment results and scores
          </p>
        </div>
        <ResultTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Assessment Results</CardTitle>
              <CardDescription>
                {filteredResults.length === results.length
                  ? `A list of all assessment results in the system (${results.length} total)`
                  : `Showing ${filteredResults.length} of ${results.length} results`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={assessorTypeFilter} onValueChange={setAssessorTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Assessor Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SELF">Self</SelectItem>
                  <SelectItem value="SUPERIOR">Superior</SelectItem>
                  <SelectItem value="PEER">Peer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assessorNameFilter} onValueChange={setAssessorNameFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Assessor Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessors</SelectItem>
                  {assessors.map((assessor: any) => (
                    <SelectItem key={assessor.id} value={assessor.id}>
                      {assessor.assessor?.name || assessor.staff?.name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search results..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-10"
                >
                  <IconFilterOff className="mr-2 size-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ResultTableSkeleton />
          ) : (
            <>
              <ResultDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {results.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <ResultFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        result={editingResult}
        onSubmit={handleFormSubmit}
        assessments={assessments}
        positions={positions}
        competencies={competencies}
        assessors={assessors}
      />

      <ResultDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingResult={deletingResult}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <ResultViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        result={viewingResult}
      />
    </div>
  )
}
