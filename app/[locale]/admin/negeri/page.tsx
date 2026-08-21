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
import { negeriAPI } from "@/lib/api"
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
import { Negeri, getColumns } from "@/features/admin/negeri/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { NegeriFormDialog, type NegeriFormData } from "@/features/admin/negeri/components/negeri-form-dialog"
import { NegeriDeleteDialog } from "@/features/admin/negeri/components/negeri-delete-dialog"
import { NegeriTableSkeleton } from "@/features/admin/negeri/components/negeri-table-skeleton"
import { NegeriDataTable } from "@/features/admin/negeri/components/negeri-data-table"
import { NegeriTableActions } from "@/features/admin/negeri/components/negeri-table-actions"
import { NegeriViewDialog } from "@/features/admin/negeri/components/negeri-view-dialog"
import { useTranslations } from "next-intl"
import { FeatureRoute } from "@/components/route/feature-route"

export default function NegeriManagementPage() {
  return (
    <FeatureRoute feature="zonNegeri">
      <NegeriManagementPageContent />
    </FeatureRoute>
  )
}

function NegeriManagementPageContent() {
  const t = useTranslations('AdminNegeriPage')
  const [negeriList, setNegeriList] = useState<Negeri[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingNegeri, setEditingNegeri] = useState<Negeri | null>(null)
  const [deletingNegeri, setDeletingNegeri] = useState<Negeri | null>(null)
  const [viewingNegeri, setViewingNegeri] = useState<Negeri | null>(null)

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchNegeriList()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchNegeriList = async () => {
    try {
      setIsLoading(true)
      const data = await negeriAPI.getAll()
      setNegeriList(data)
      setRowSelection({})
    } catch (error: unknown) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(negeri?: Negeri) {
    setEditingNegeri(negeri || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (negeri: Negeri) => {
    setViewingNegeri(negeri)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: NegeriFormData) => {
    if (editingNegeri) {
      await negeriAPI.update(editingNegeri.id, formData)
      toast.success(t('updateSuccess'))
    } else {
      await negeriAPI.create(formData)
      toast.success(t('createSuccess'))
    }

    setEditingNegeri(null)
    fetchNegeriList()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (negeri: Negeri) => {
    setDeletingNegeri(negeri)
    setIsDeleteDialogOpen(true)
  }

  // Not wrapped in useMemo: getColumns() calls hooks (useTranslations), and
  // hooks can only be called unconditionally at the top level of a render —
  // wrapping it in useMemo made those calls conditional on the dependency
  // array, which crashes React with "change in the order of Hooks" the
  // moment the memo ever recomputes.
  const columns = getColumns({
    onEdit: handleOpenDialog,
    onDelete: handleOpenDeleteDialog,
  })

  // ==================== TABLE INITIALIZATION ====================
  // Initialize table after columns are defined
  const table = useReactTable({
    data: negeriList,
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
    setDeletingNegeri(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingNegeri) {
        // Single delete
        await negeriAPI.delete(deletingNegeri.id)
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          negeriAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingNegeri(null)
      fetchNegeriList()
    } catch (error: unknown) {
      toast.error(t('deleteError'))
      console.error(error)
    }
  }

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
        <NegeriTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>
                {t('cardDescription')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
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
            <NegeriTableSkeleton />
          ) : (
            <>
              <NegeriDataTable
                table={table}
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {negeriList.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <NegeriFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingNegeri={editingNegeri}
        onSubmit={handleFormSubmit}
      />

      <NegeriDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingNegeri={deletingNegeri}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <NegeriViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        negeri={viewingNegeri}
      />
    </div>
  )
}
