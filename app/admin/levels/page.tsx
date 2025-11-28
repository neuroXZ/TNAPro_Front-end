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
import { levelAPI } from "@/lib/api"
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
import { Level, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { LevelFormDialog, type LevelFormData } from "./level-form-dialog"
import { LevelDeleteDialog } from "./level-delete-dialog"
import { LevelTableSkeleton } from "./level-table-skeleton"
import { LevelDataTable } from "./level-data-table"
import { LevelTableActions } from "./level-table-actions"
import { LevelViewDialog } from "./level-view-dialog"

export default function LevelManagementPage() {
  const [levels, setLevels] = useState<Level[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [deletingLevel, setDeletingLevel] = useState<Level | null>(null)
  const [viewingLevel, setViewingLevel] = useState<Level | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchLevels()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchLevels = async () => {
    try {
      setIsLoading(true)
      const data = await levelAPI.getAll()
      setLevels(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch levels data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(level?: Level) {
    setEditingLevel(level || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (level: Level) => {
    setViewingLevel(level)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: LevelFormData) => {
    if (editingLevel) {
      await levelAPI.update(editingLevel.id, formData)
      toast.success("Level updated successfully")
    } else {
      await levelAPI.create(formData)
      toast.success("Level created successfully")
    }

    setEditingLevel(null)
    fetchLevels()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (level: Level) => {
    setDeletingLevel(level)
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
    data: levels,
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
      toast.error("Please select levels to delete")
      return
    }
    setDeletingLevel(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingLevel) {
        // Single delete
        await levelAPI.delete(deletingLevel.id)
        toast.success("Level deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          levelAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} levels deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingLevel(null)
      fetchLevels()
    } catch (error: any) {
      toast.error("Failed to delete level")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Level Management</h1>
          <p className="text-muted-foreground">
            Manage competency proficiency levels
          </p>
        </div>
        <LevelTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Levels</CardTitle>
              <CardDescription>
                A list of all competency levels in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search levels..."
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
            <LevelTableSkeleton />
          ) : (
            <>
              <LevelDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {levels.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <LevelFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingLevel={editingLevel}
        onSubmit={handleFormSubmit}
      />

      <LevelDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingLevel={deletingLevel}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <LevelViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        level={viewingLevel}
      />
    </div>
  )
}

