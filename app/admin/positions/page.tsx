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
import { positionAPI, importAPI } from "@/lib/api"
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
import { Position, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PositionFormDialog, type PositionFormData } from "./position-form-dialog"
import { PositionDeleteDialog } from "./position-delete-dialog"
import { PositionTableSkeleton } from "./position-table-skeleton"
import { PositionDataTable } from "./position-data-table"
import { PositionTableActions } from "./position-table-actions"
import { PositionViewDialog } from "./position-view-dialog"
import { PositionImportDialog } from "./position-import-dialog"

export default function PositionManagementPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null)
  const [viewingPosition, setViewingPosition] = useState<Position | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchPositions()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchPositions = async () => {
    try {
      setIsLoading(true)
      const data = await positionAPI.getAll()
      setPositions(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch positions data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(position?: Position) {
    setEditingPosition(position || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (position: Position) => {
    setViewingPosition(position)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: PositionFormData) => {
    if (editingPosition) {
      await positionAPI.update(editingPosition.id, formData)
      toast.success("Position updated successfully")
    } else {
      await positionAPI.create(formData)
      toast.success("Position created successfully")
    }

    setEditingPosition(null)
    fetchPositions()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (position: Position) => {
    setDeletingPosition(position)
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
    data: positions,
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
      toast.error("Please select positions to delete")
      return
    }
    setDeletingPosition(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importAPI.downloadTemplate('position')
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'position_import_template.csv'
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

  const handleDeleteConfirm = async () => {
    try {
      if (deletingPosition) {
        // Single delete
        await positionAPI.delete(deletingPosition.id)
        toast.success("Position deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          positionAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} positions deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingPosition(null)
      fetchPositions()
    } catch (error: any) {
      toast.error("Failed to delete position")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Position Management</h1>
          <p className="text-muted-foreground">
            Manage job positions in the organization
          </p>
        </div>
        <PositionTableActions
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
              <CardTitle>All Positions</CardTitle>
              <CardDescription>
                A list of all job positions in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search positions..."
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
            <PositionTableSkeleton />
          ) : (
            <>
              <PositionDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {positions.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <PositionFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingPosition={editingPosition}
        onSubmit={handleFormSubmit}
      />

      <PositionDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingPosition={deletingPosition}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <PositionViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        position={viewingPosition}
      />

      <PositionImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={fetchPositions}
      />
    </div>
  )
}

