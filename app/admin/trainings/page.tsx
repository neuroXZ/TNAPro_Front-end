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
import { trainingAPI } from "@/lib/api"
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
import { Training, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { TrainingFormDialog, type TrainingFormData } from "./training-form-dialog"
import { TrainingDeleteDialog } from "./training-delete-dialog"
import { TrainingTableSkeleton } from "./training-table-skeleton"
import { TrainingDataTable } from "./training-data-table"
import { TrainingTableActions } from "./training-table-actions"
import { TrainingViewDialog } from "./training-view-dialog"

export default function TrainingManagementPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [deletingTraining, setDeletingTraining] = useState<Training | null>(null)
  const [viewingTraining, setViewingTraining] = useState<Training | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchTrainings()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchTrainings = async () => {
    try {
      setIsLoading(true)
      const data = await trainingAPI.getAll()
      setTrainings(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch trainings data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(training?: Training) {
    setEditingTraining(training || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (training: Training) => {
    setViewingTraining(training)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: TrainingFormData) => {
    if (editingTraining) {
      await trainingAPI.update(editingTraining.id, formData)
      toast.success("Training updated successfully")
    } else {
      await trainingAPI.create(formData)
      toast.success("Training created successfully")
    }

    setEditingTraining(null)
    fetchTrainings()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (training: Training) => {
    setDeletingTraining(training)
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
    data: trainings,
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
      toast.error("Please select trainings to delete")
      return
    }
    setDeletingTraining(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingTraining) {
        // Single delete
        await trainingAPI.delete(deletingTraining.id)
        toast.success("Training deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          trainingAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} trainings deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingTraining(null)
      fetchTrainings()
    } catch (error: any) {
      toast.error("Failed to delete training")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Management</h1>
          <p className="text-muted-foreground">
            Manage training programs and schedules
          </p>
        </div>
        <TrainingTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Trainings</CardTitle>
              <CardDescription>
                A list of all training programs in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search trainings..."
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
            <TrainingTableSkeleton />
          ) : (
            <>
              <TrainingDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {trainings.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <TrainingFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTraining={editingTraining}
        onSubmit={handleFormSubmit}
      />

      <TrainingDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingTraining={deletingTraining}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <TrainingViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        training={viewingTraining}
      />
    </div>
  )
}
