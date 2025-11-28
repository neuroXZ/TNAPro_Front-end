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
import { mailAPI } from "@/lib/api"
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
import { Mail, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { MailFormDialog, type MailFormData } from "./mail-form-dialog"
import { MailDeleteDialog } from "./mail-delete-dialog"
import { MailTableSkeleton } from "./mail-table-skeleton"
import { MailDataTable } from "./mail-data-table"
import { MailTableActions } from "./mail-table-actions"
import { MailViewDialog } from "./mail-view-dialog"

export default function MailManagementPage() {
  const [mails, setMails] = useState<Mail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingMail, setEditingMail] = useState<Mail | null>(null)
  const [deletingMail, setDeletingMail] = useState<Mail | null>(null)
  const [viewingMail, setViewingMail] = useState<Mail | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchMails()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchMails = async () => {
    try {
      setIsLoading(true)
      const data = await mailAPI.getAll()
      setMails(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch mail templates data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(mail?: Mail) {
    setEditingMail(mail || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (mail: Mail) => {
    setViewingMail(mail)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: MailFormData) => {
    if (editingMail) {
      await mailAPI.update(editingMail.id, formData)
      toast.success("Mail template updated successfully")
    } else {
      await mailAPI.create(formData)
      toast.success("Mail template created successfully")
    }

    setEditingMail(null)
    fetchMails()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (mail: Mail) => {
    setDeletingMail(mail)
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
    data: mails,
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
      toast.error("Please select mail templates to delete")
      return
    }
    setDeletingMail(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingMail) {
        // Single delete
        await mailAPI.delete(deletingMail.id)
        toast.success("Mail template deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          mailAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} mail templates deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingMail(null)
      fetchMails()
    } catch (error: any) {
      toast.error("Failed to delete mail template")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mail Template Management</h1>
          <p className="text-muted-foreground">
            Manage email templates for system notifications
          </p>
        </div>
        <MailTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Mail Templates</CardTitle>
              <CardDescription>
                A list of all mail templates in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search mail templates..."
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
            <MailTableSkeleton />
          ) : (
            <>
              <MailDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {mails.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <MailFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingMail={editingMail}
        onSubmit={handleFormSubmit}
      />

      <MailDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingMail={deletingMail}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <MailViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        mail={viewingMail}
      />
    </div>
  )
}
