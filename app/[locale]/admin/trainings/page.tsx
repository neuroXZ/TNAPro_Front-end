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
import { trainingAPI, importAPI } from "@/lib/api"
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
import { Training, getColumns } from "@/features/admin/trainings/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { TrainingFormDialog, type TrainingFormData } from "@/features/admin/trainings/components/training-form-dialog"
import { TrainingDeleteDialog } from "@/features/admin/trainings/components/training-delete-dialog"
import { TrainingTableSkeleton } from "@/features/admin/trainings/components/training-table-skeleton"
import { TrainingDataTable } from "@/features/admin/trainings/components/training-data-table"
import { TrainingTableActions } from "@/features/admin/trainings/components/training-table-actions"
import { TrainingViewDialog } from "@/features/admin/trainings/components/training-view-dialog"
import { TrainingImportDialog } from "@/features/admin/trainings/components/training-import-dialog"
import { useTranslations, useLocale } from "next-intl"

export default function TrainingManagementPage() {
  const t = useTranslations('AdminTrainingsPage')
  const tc = useTranslations('Common')
  const locale = useLocale()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
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
    } catch (error: unknown) {
      toast.error(t('fetchError'))
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
      toast.success(t('updateSuccess'))
    } else {
      await trainingAPI.create(formData)
      toast.success(t('createSuccess'))
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
      toast.error(t('deleteSelectError'))
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
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          trainingAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingTraining(null)
      fetchTrainings()
    } catch (error: unknown) {
      toast.error(t('deleteError'))
      console.error(error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importAPI.downloadTemplate('training')
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'training_import_template.csv'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
      toast.success(t('templateDownloaded'))
    } catch (error) {
      console.error('Download error:', error)
      toast.error(t('templateDownloadError'))
    }
  }

  const handleImport = () => {
    setIsImportDialogOpen(true)
  }


  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <TrainingTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
          onDownloadTemplate={handleDownloadTemplate}
          onImport={handleImport}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>
                {t('cardDescription')}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8 w-full sm:w-[250px]"
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

      <TrainingImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={fetchTrainings}
      />
    </div>
  )
}
