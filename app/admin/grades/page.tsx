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
import { gradeAPI, importAPI } from "@/lib/api"
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
import { Grade, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { GradeFormDialog, type GradeFormData } from "./grade-form-dialog"
import { GradeDeleteDialog } from "./grade-delete-dialog"
import { GradeTableSkeleton } from "./grade-table-skeleton"
import { GradeDataTable } from "./grade-data-table"
import { GradeTableActions } from "./grade-table-actions"
import { GradeViewDialog } from "./grade-view-dialog"
import { GradeImportDialog } from "./grade-import-dialog"

export default function GradeManagementPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null)
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchGrades()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchGrades = async () => {
    try {
      setIsLoading(true)
      const data = await gradeAPI.getAll()
      setGrades(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch grades data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(grade?: Grade) {
    setEditingGrade(grade || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (grade: Grade) => {
    setViewingGrade(grade)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: GradeFormData) => {
    if (editingGrade) {
      await gradeAPI.update(editingGrade.id, formData)
      toast.success("Grade updated successfully")
    } else {
      await gradeAPI.create(formData)
      toast.success("Grade created successfully")
    }

    setEditingGrade(null)
    fetchGrades()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (grade: Grade) => {
    setDeletingGrade(grade)
    setIsDeleteDialogOpen(true)
  }

  // Define columns after handler functions are declared
  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleOpenDialog,
        onDelete: handleOpenDeleteDialog,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ==================== TABLE INITIALIZATION ====================
  // Initialize table after columns are defined
  const table = useReactTable({
    data: grades,
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
      toast.error("Please select grades to delete")
      return
    }
    setDeletingGrade(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingGrade) {
        // Single delete
        await gradeAPI.delete(deletingGrade.id)
        toast.success("Grade deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          gradeAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} grades deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingGrade(null)
      fetchGrades()
    } catch (error: any) {
      toast.error("Failed to delete grade")
      console.error(error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importAPI.downloadTemplate('grade')
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'grade_import_template.csv'
      document.body.appendChild(link)
      link.click()
      
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      toast.success('Template downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download template')
    }
  }

  const handleImport = () => {
    setIsImportDialogOpen(true)
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Grade Management</h1>
          <p className="text-muted-foreground">
            Manage grades in the organization
          </p>
        </div>
        <GradeTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
          onDownloadTemplate={handleDownloadTemplate}
          onImport={handleImport}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Grades</CardTitle>
              <CardDescription>
                A list of all grades in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search grades..."
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
            <GradeTableSkeleton />
          ) : (
            <>
              <GradeDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {grades.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <GradeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingGrade={editingGrade}
        onSubmit={handleFormSubmit}
      />

      <GradeDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingGrade={deletingGrade}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <GradeViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        grade={viewingGrade}
      />

      <GradeImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={fetchGrades}
      />
    </div>
  )
}

