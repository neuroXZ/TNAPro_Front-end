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
import { positionCategoryAPI } from "@/lib/api"
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
import { PositionCategory, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PositionCategoryFormDialog, type PositionCategoryFormData } from "./unittype-form-dialog"
import { PositionCategoryDeleteDialog } from "./unittype-delete-dialog"
import { PositionCategoryTableSkeleton } from "./unittype-table-skeleton"
import { PositionCategoryDataTable } from "./unittype-data-table"
import { PositionCategoryTableActions } from "./unittype-table-actions"
import { PositionCategoryViewDialog } from "./unittype-view-dialog"
import { useTranslations } from "next-intl"

export default function PositionCategoryManagementPage() {
  const t = useTranslations('AdminPositionCategoryPage')
  const [positionCategorys, setPositionCategorys] = useState<PositionCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingPositionCategory, setEditingPositionCategory] = useState<PositionCategory | null>(null)
  const [deletingPositionCategory, setDeletingPositionCategory] = useState<PositionCategory | null>(null)
  const [viewingPositionCategory, setViewingPositionCategory] = useState<PositionCategory | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchPositionCategorys()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchPositionCategorys = async () => {
    try {
      setIsLoading(true)
      const data = await positionCategoryAPI.getAll()
      setPositionCategorys(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(positionCategory?: PositionCategory) {
    setEditingPositionCategory(positionCategory || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (positionCategory: PositionCategory) => {
    setViewingPositionCategory(positionCategory)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: PositionCategoryFormData) => {
    if (editingPositionCategory) {
      await positionCategoryAPI.update(editingPositionCategory.id, formData)
      toast.success(t('updateSuccess'))
    } else {
      await positionCategoryAPI.create(formData)
      toast.success(t('createSuccess'))
    }

    setEditingPositionCategory(null)
    fetchPositionCategorys()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (positionCategory: PositionCategory) => {
    setDeletingPositionCategory(positionCategory)
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
    data: positionCategorys,
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
    setDeletingPositionCategory(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingPositionCategory) {
        // Single delete
        await positionCategoryAPI.delete(deletingPositionCategory.id)
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          positionCategoryAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingPositionCategory(null)
      fetchPositionCategorys()
    } catch (error: any) {
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
        <PositionCategoryTableActions
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
            <PositionCategoryTableSkeleton />
          ) : (
            <>
              <PositionCategoryDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {positionCategorys.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <PositionCategoryFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingPositionCategory={editingPositionCategory}
        onSubmit={handleFormSubmit}
      />

      <PositionCategoryDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingPositionCategory={deletingPositionCategory}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <PositionCategoryViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        positionCategory={viewingPositionCategory}
      />
    </div>
  )
}
