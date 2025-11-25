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
import { competencyAPI, importAPI } from "@/lib/api"
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
import { Competency, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { CompetencyFormDialog, type CompetencyFormData } from "./competency-form-dialog"
import { CompetencyDeleteDialog } from "./competency-delete-dialog"
import { CompetencyTableSkeleton } from "./competency-table-skeleton"
import { CompetencyDataTable } from "./competency-data-table"
import { CompetencyTableActions } from "./competency-table-actions"
import { CompetencyViewDialog } from "./competency-view-dialog"
import { CompetencyImportDialog } from "./competency-import-dialog"

export default function CompetencyManagementPage() {
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null)
  const [deletingCompetency, setDeletingCompetency] = useState<Competency | null>(null)
  const [viewingCompetency, setViewingCompetency] = useState<Competency | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchCompetencies()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchCompetencies = async () => {
    try {
      setIsLoading(true)
      const data = await competencyAPI.getAll()
      setCompetencies(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch competencies data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(competency?: Competency) {
    setEditingCompetency(competency || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (competency: Competency) => {
    setViewingCompetency(competency)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: CompetencyFormData) => {
    if (editingCompetency) {
      await competencyAPI.update(editingCompetency.id, formData)
      toast.success("Competency updated successfully")
    } else {
      await competencyAPI.create(formData)
      toast.success("Competency created successfully")
    }

    setEditingCompetency(null)
    fetchCompetencies()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (competency: Competency) => {
    setDeletingCompetency(competency)
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
    data: competencies,
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
      toast.error("Please select competencies to delete")
      return
    }
    setDeletingCompetency(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingCompetency) {
        // Single delete
        await competencyAPI.delete(deletingCompetency.id)
        toast.success("Competency deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          competencyAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} competencies deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingCompetency(null)
      fetchCompetencies()
    } catch (error: any) {
      toast.error("Failed to delete competency")
      console.error(error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importAPI.downloadTemplate('competency')
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'competency_import_template.csv'
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
          <h1 className="text-3xl font-bold">Competency Management</h1>
          <p className="text-muted-foreground">
            Manage competencies and their clusters
          </p>
        </div>
        <CompetencyTableActions
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
              <CardTitle>All Competencies</CardTitle>
              <CardDescription>
                A list of all competencies in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search competencies..."
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
            <CompetencyTableSkeleton />
          ) : (
            <>
              <CompetencyDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {competencies.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <CompetencyFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCompetency={editingCompetency}
        onSubmit={handleFormSubmit}
      />

      <CompetencyDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingCompetency={deletingCompetency}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <CompetencyViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        competency={viewingCompetency}
      />

      <CompetencyImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={fetchCompetencies}
      />
    </div>
  )
}
