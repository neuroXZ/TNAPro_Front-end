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
import { zonAPI } from "@/lib/api"
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
import { Zon, getColumns } from "@/features/admin/zon/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { ZonFormDialog, type ZonFormData } from "@/features/admin/zon/components/zon-form-dialog"
import { ZonDeleteDialog } from "@/features/admin/zon/components/zon-delete-dialog"
import { ZonTableSkeleton } from "@/features/admin/zon/components/zon-table-skeleton"
import { ZonDataTable } from "@/features/admin/zon/components/zon-data-table"
import { ZonTableActions } from "@/features/admin/zon/components/zon-table-actions"
import { ZonViewDialog } from "@/features/admin/zon/components/zon-view-dialog"
import { useTranslations, useLocale } from "next-intl"
import { FeatureRoute } from "@/components/route/feature-route"

export default function ZonManagementPage() {
  return (
    <FeatureRoute feature="zonNegeri">
      <ZonManagementPageContent />
    </FeatureRoute>
  )
}

function ZonManagementPageContent() {
  const t = useTranslations('AdminZonPage')
  const tc = useTranslations('Common')
  const locale = useLocale()
  const [zones, setZones] = useState<Zon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingZon, setEditingZon] = useState<Zon | null>(null)
  const [deletingZon, setDeletingZon] = useState<Zon | null>(null)
  const [viewingZon, setViewingZon] = useState<Zon | null>(null)

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchZones()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchZones = async () => {
    try {
      setIsLoading(true)
      const data = await zonAPI.getAll()
      setZones(data)
      setRowSelection({})
    } catch (error: unknown) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(zon?: Zon) {
    setEditingZon(zon || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (zon: Zon) => {
    setViewingZon(zon)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: ZonFormData) => {
    if (editingZon) {
      await zonAPI.update(editingZon.id, formData)
      toast.success(t('updateSuccess'))
    } else {
      await zonAPI.create(formData)
      toast.success(t('createSuccess'))
    }

    setEditingZon(null)
    fetchZones()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (zon: Zon) => {
    setDeletingZon(zon)
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
    data: zones,
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
    setDeletingZon(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingZon) {
        // Single delete
        await zonAPI.delete(deletingZon.id)
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          zonAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingZon(null)
      fetchZones()
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
        <ZonTableActions
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
            <ZonTableSkeleton />
          ) : (
            <>
              <ZonDataTable
                table={table}
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {zones.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <ZonFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingZon={editingZon}
        onSubmit={handleFormSubmit}
      />

      <ZonDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingZon={deletingZon}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <ZonViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        zon={viewingZon}
      />
    </div>
  )
}
