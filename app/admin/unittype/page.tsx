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
import { unitTypeAPI } from "@/lib/api"
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
import { UnitType, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { UnitTypeFormDialog, type UnitTypeFormData } from "./unittype-form-dialog"
import { UnitTypeDeleteDialog } from "./unittype-delete-dialog"
import { UnitTypeTableSkeleton } from "./unittype-table-skeleton"
import { UnitTypeDataTable } from "./unittype-data-table"
import { UnitTypeTableActions } from "./unittype-table-actions"
import { UnitTypeViewDialog } from "./unittype-view-dialog"

export default function UnitTypeManagementPage() {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingUnitType, setEditingUnitType] = useState<UnitType | null>(null)
  const [deletingUnitType, setDeletingUnitType] = useState<UnitType | null>(null)
  const [viewingUnitType, setViewingUnitType] = useState<UnitType | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchUnitTypes()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchUnitTypes = async () => {
    try {
      setIsLoading(true)
      const data = await unitTypeAPI.getAll()
      setUnitTypes(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch unit types data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(unitType?: UnitType) {
    setEditingUnitType(unitType || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (unitType: UnitType) => {
    setViewingUnitType(unitType)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: UnitTypeFormData) => {
    if (editingUnitType) {
      await unitTypeAPI.update(editingUnitType.id, formData)
      toast.success("Unit type updated successfully")
    } else {
      await unitTypeAPI.create(formData)
      toast.success("Unit type created successfully")
    }

    setEditingUnitType(null)
    fetchUnitTypes()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (unitType: UnitType) => {
    setDeletingUnitType(unitType)
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
    data: unitTypes,
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
      toast.error("Please select unit types to delete")
      return
    }
    setDeletingUnitType(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingUnitType) {
        // Single delete
        await unitTypeAPI.delete(deletingUnitType.id)
        toast.success("Unit type deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          unitTypeAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} unit types deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingUnitType(null)
      fetchUnitTypes()
    } catch (error: any) {
      toast.error("Failed to delete unit type")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Type Management</h1>
          <p className="text-muted-foreground">
            Manage unit types in the organization
          </p>
        </div>
        <UnitTypeTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Unit Types</CardTitle>
              <CardDescription>
                A list of all unit types in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search unit types..."
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
            <UnitTypeTableSkeleton />
          ) : (
            <>
              <UnitTypeDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {unitTypes.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <UnitTypeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingUnitType={editingUnitType}
        onSubmit={handleFormSubmit}
      />

      <UnitTypeDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingUnitType={deletingUnitType}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <UnitTypeViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        unitType={viewingUnitType}
      />
    </div>
  )
}
