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
import { unitAPI } from "@/lib/api"
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
import { Unit, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { UnitFormDialog, type UnitFormData } from "./unit-form-dialog"
import { UnitDeleteDialog } from "./unit-delete-dialog"
import { UnitTableSkeleton } from "./unit-table-skeleton"
import { UnitDataTable } from "./unit-data-table"
import { UnitTableActions } from "./unit-table-actions"
import { UnitViewDialog } from "./unit-view-dialog"

export default function UnitManagementPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)
  const [viewingUnit, setViewingUnit] = useState<Unit | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchUnits()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchUnits = async () => {
    try {
      setIsLoading(true)
      const data = await unitAPI.getAll()
      setUnits(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch units data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(unit?: Unit) {
    setEditingUnit(unit || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (unit: Unit) => {
    setViewingUnit(unit)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: UnitFormData) => {
    if (editingUnit) {
      await unitAPI.update(editingUnit.id, formData)
      toast.success("Unit updated successfully")
    } else {
      await unitAPI.create(formData)
      toast.success("Unit created successfully")
    }

    setEditingUnit(null)
    fetchUnits()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (unit: Unit) => {
    setDeletingUnit(unit)
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
    data: units,
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
      toast.error("Please select units to delete")
      return
    }
    setDeletingUnit(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingUnit) {
        // Single delete
        await unitAPI.delete(deletingUnit.id)
        toast.success("Unit deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          unitAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} units deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingUnit(null)
      fetchUnits()
    } catch (error: any) {
      toast.error("Failed to delete unit")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Management</h1>
          <p className="text-muted-foreground">
            Manage organizational units
          </p>
        </div>
        <UnitTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Units</CardTitle>
              <CardDescription>
                A list of all organizational units in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search units..."
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
            <UnitTableSkeleton />
          ) : (
            <>
              <UnitDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {units.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <UnitFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingUnit={editingUnit}
        onSubmit={handleFormSubmit}
      />

      <UnitDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingUnit={deletingUnit}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <UnitViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        unit={viewingUnit}
      />
    </div>
  )
}
