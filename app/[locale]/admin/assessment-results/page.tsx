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
import { AssessmentResult, getColumns } from "@/features/admin/assessment-results/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { ResultFormDialog } from "@/features/admin/assessment-results/components/result-form-dialog"
import { ResultDeleteDialog } from "@/features/admin/assessment-results/components/result-delete-dialog"
import { ResultTableSkeleton } from "@/features/admin/assessment-results/components/result-table-skeleton"
import { ResultDataTable } from "@/features/admin/assessment-results/components/result-data-table"
import { ResultTableActions } from "@/features/admin/assessment-results/components/result-table-actions"
import { ResultViewDialog } from "@/features/admin/assessment-results/components/result-view-dialog"
import { useTranslations } from "next-intl"

export default function AssessmentResultsPage() {
  const t = useTranslations('AdminAssessmentResultsPage')
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
    } catch (error: unknown) {
      toast.error(t('fetchError'))
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
      toast.success(t('updateSuccess'))
    } else {
      await assessmentResultAPI.create(formData)
      toast.success(t('createSuccess'))
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
      toast.error(t('deleteSelectError'))
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
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          assessmentResultAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingResult(null)
      fetchData()
    } catch (error: unknown) {
      toast.error(t('deleteError'))
      console.error(error)
    }
  }

  const handleClearFilters = () => {
    setAssessorTypeFilter("all")
    setAssessorNameFilter("all")
    setStatusFilter("all")
    setGlobalFilter("")
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      if (selectedRows.length === 0) {
        toast.error(t('updateSelectError'))
        return
      }

      const updatePromises = selectedRows.map((row) =>
        assessmentResultAPI.update(row.original.id, { status: newStatus })
      )
      await Promise.all(updatePromises)
      
      toast.success(t('statusUpdated', { count: selectedRows.length, status: newStatus }))
      setRowSelection({})
      fetchData()
    } catch (error: unknown) {
      toast.error(t('updateStatusError'))
      console.error(error)
    }
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
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <ResultTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>
                {filteredResults.length === results.length
                  ? t('cardDescription', { count: results.length })
                  : t('showingResults', { filtered: filteredResults.length, total: results.length })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={assessorTypeFilter} onValueChange={setAssessorTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('assessorTypeLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes')}</SelectItem>
                  <SelectItem value="SELF">{t('typeSelf')}</SelectItem>
                  <SelectItem value="SUPERIOR">{t('typeSuperior')}</SelectItem>
                  <SelectItem value="PEER">{t('typePeer')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assessorNameFilter} onValueChange={setAssessorNameFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('assessorNameLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allAssessors')}</SelectItem>
                  {assessors.map((assessor: any) => (
                    <SelectItem key={assessor.id} value={assessor.id}>
                      {assessor.assessor?.name || assessor.staff?.name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('statusLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatus')}</SelectItem>
                  <SelectItem value="DRAFT">{t('statusDraft')}</SelectItem>
                  <SelectItem value="SUBMITTED">{t('statusSubmitted')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
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
                  {t('clearButton')}
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
