"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
} from "@tanstack/react-table"
import { staffAPI, importAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"
import { Staff, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { StaffFormDialog, type StaffFormData } from "./staff-form-dialog"
import { StaffDeleteDialog } from "./staff-delete-dialog"
import { StaffTableSkeleton } from "./staff-table-skeleton"
import { StaffDataTable } from "./staff-data-table"
import { StaffTableActions } from "./staff-table-actions"
import { StaffViewDialog } from "./staff-view-dialog"
import { StaffImportDialog } from "./staff-import-dialog"

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null)
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchStaff()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchStaff = async () => {
    try {
      setIsLoading(true)
      const data = await staffAPI.getAll()
      setStaff(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch staff data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(staff?: Staff) {
    setEditingStaff(staff || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (staff: Staff) => {
    setViewingStaff(staff)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: StaffFormData) => {
    const submitData = {
      name: formData.name,
      email: formData.email,
      staffOrgId: formData.staffOrgId,
      gender: formData.gender || undefined,
      image: formData.image || undefined,
      password: formData.password,
      positionId: formData.positionId || undefined,
      unitId: formData.unitId || undefined,
      supervisorId: formData.supervisorId || undefined,
    }

    // Remove password if empty (for edit)
    if (!submitData.password) {
      delete submitData.password
    }

    if (editingStaff) {
      await staffAPI.update(editingStaff.id, submitData)
      toast.success("Staff updated successfully")
    } else {
      await staffAPI.create(submitData)
      toast.success("Staff created successfully")
    }

    setEditingStaff(null)
    fetchStaff()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (staff: Staff) => {
    setDeletingStaff(staff)
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
    data: staff,
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
      toast.error("Please select staff to delete")
      return
    }
    setDeletingStaff(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingStaff) {
        // Single delete
        await staffAPI.delete(deletingStaff.id)
        toast.success("Staff deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          staffAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} staff deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingStaff(null)
      fetchStaff()
    } catch (error: any) {
      toast.error("Failed to delete staff")
      console.error(error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importAPI.downloadTemplate('staff')
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'staff_import_template.csv'
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
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff members and their information
          </p>
        </div>
        <StaffTableActions
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
              <CardTitle>All Staff</CardTitle>
              <CardDescription>
                A list of all staff members in the organization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
            <StaffTableSkeleton />
          ) : (
            <>
              <StaffDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {staff.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <StaffFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingStaff={editingStaff}
        onSubmit={handleFormSubmit}
      />

      <StaffDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingStaff={deletingStaff}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <StaffViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        staff={viewingStaff}
      />

      <StaffImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={fetchStaff}
      />
    </div>
  )
}
