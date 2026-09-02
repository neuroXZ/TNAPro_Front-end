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
import { modulAPI } from "@/lib/api"
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
import { Modul, getColumns } from "@/features/admin/modul/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { ModulFormDialog, type ModulFormData } from "@/features/admin/modul/components/modul-form-dialog"
import { ModulDeleteDialog } from "@/features/admin/modul/components/modul-delete-dialog"
import { ModulTableSkeleton } from "@/features/admin/modul/components/modul-table-skeleton"
import { ModulDataTable } from "@/features/admin/modul/components/modul-data-table"
import { ModulTableActions } from "@/features/admin/modul/components/modul-table-actions"
import { ModulViewDialog } from "@/features/admin/modul/components/modul-view-dialog"
import { useTranslations, useLocale } from "next-intl"
import { FeatureRoute } from "@/components/route/feature-route"

export default function ModulManagementPage() {
  return (
    <FeatureRoute feature="modulFungsi">
      <ModulManagementPageContent />
    </FeatureRoute>
  )
}

function ModulManagementPageContent() {
  const t = useTranslations('AdminModulPage')
  const tc = useTranslations('Common')
  const locale = useLocale()
  const [moduls, setModuls] = useState<Modul[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingModul, setEditingModul] = useState<Modul | null>(null)
  const [deletingModul, setDeletingModul] = useState<Modul | null>(null)
  const [viewingModul, setViewingModul] = useState<Modul | null>(null)

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchModuls()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchModuls = async () => {
    try {
      setIsLoading(true)
      const data = await modulAPI.getAll()
      setModuls(data)
      setRowSelection({})
    } catch (error: unknown) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(modul?: Modul) {
    setEditingModul(modul || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (modul: Modul) => {
    setViewingModul(modul)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: ModulFormData) => {
    if (editingModul) {
      await modulAPI.update(editingModul.id, formData)
      toast.success(t('updateSuccess'))
    } else {
      await modulAPI.create(formData)
      toast.success(t('createSuccess'))
    }

    setEditingModul(null)
    fetchModuls()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (modul: Modul) => {
    setDeletingModul(modul)
    setIsDeleteDialogOpen(true)
  }

  // Define columns after handler functions are declared
  const columns = useMemo(
    () =>
      getColumns(
        {
          onEdit: handleOpenDialog,
          onDelete: handleOpenDeleteDialog,
        },
        t,
        tc
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  )

  // ==================== TABLE INITIALIZATION ====================
  // Initialize table after columns are defined
  const table = useReactTable({
    data: moduls,
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
    setDeletingModul(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingModul) {
        // Single delete
        await modulAPI.delete(deletingModul.id)
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          modulAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingModul(null)
      fetchModuls()
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
        <ModulTableActions
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
            <ModulTableSkeleton />
          ) : (
            <>
              <ModulDataTable
                table={table}
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {moduls.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <ModulFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingModul={editingModul}
        onSubmit={handleFormSubmit}
      />

      <ModulDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingModul={deletingModul}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <ModulViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        modul={viewingModul}
      />
    </div>
  )
}
