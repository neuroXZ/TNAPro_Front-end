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
import { positionAPI, importAPI, gradeAPI, positionCategoryAPI } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { IconSearch, IconFilter } from "@tabler/icons-react"
import { toast } from "sonner"
import { Position, getColumns } from "@/features/admin/positions/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PositionFormDialog, type PositionFormData } from "@/features/admin/positions/components/position-form-dialog"
import { PositionDeleteDialog } from "@/features/admin/positions/components/position-delete-dialog"
import { PositionTableSkeleton } from "@/features/admin/positions/components/position-table-skeleton"
import { PositionDataTable } from "@/features/admin/positions/components/position-data-table"
import { PositionTableActions } from "@/features/admin/positions/components/position-table-actions"
import { PositionViewDialog } from "@/features/admin/positions/components/position-view-dialog"
import { PositionImportDialog } from "@/features/admin/positions/components/position-import-dialog"
import { useTranslations, useLocale } from "next-intl"

export default function PositionManagementPage() {
  const t = useTranslations('AdminPositionsPage')
  const tc = useTranslations('Common')
  const locale = useLocale()
  const [positions, setPositions] = useState<Position[]>([])
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([])
  const [selectedGradeId, setSelectedGradeId] = useState<string>("all")
  const [gradePopoverOpen, setGradePopoverOpen] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  
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

  // Filter positions based on selected grade and category
  const filteredPositions = useMemo(() => {
    let filtered = positions
    
    if (selectedGradeId && selectedGradeId !== "all") {
      filtered = filtered.filter(position => position.gradeId === selectedGradeId)
    }
    
    if (selectedCategoryId && selectedCategoryId !== "all") {
      filtered = filtered.filter(position => position.categoryId === selectedCategoryId)
    }
    
    return filtered
  }, [positions, selectedGradeId, selectedCategoryId])

  useEffect(() => {
    fetchPositions()
    fetchGrades()
    fetchCategories()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchPositions = async () => {
    try {
      setIsLoading(true)
      const data = await positionAPI.getAll()
      setPositions(data)
      setRowSelection({})
    } catch (error: unknown) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGrades = async () => {
    try {
      const data = await gradeAPI.getAll()
      setGrades(data)
    } catch (error: unknown) {
      console.error("Failed to fetch grades:", error)
    }
  }
  const fetchCategories = async () => {
    try {
      const data = await positionCategoryAPI.getAll()
      setCategories(data)
    } catch (error: unknown) {
      console.error("Failed to fetch categories:", error)
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
      toast.success(t('updateSuccess'))
    } else {
      await positionAPI.create(formData)
      toast.success(t('createSuccess'))
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
    data: filteredPositions,
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
      
      toast.success(t('templateDownloaded'))
    } catch (error) {
      console.error('Download error:', error)
      toast.error(t('templateDownloadError'))
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
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          positionAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingPosition(null)
      fetchPositions()
    } catch (error: unknown) {
      toast.error(t('deleteError'))
      console.error(error)
    }
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>
                {t('cardDescription')}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Popover open={gradePopoverOpen} onOpenChange={setGradePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={gradePopoverOpen}
                    className="w-full sm:w-[180px] justify-between"
                  >
                    {selectedGradeId === "all" 
                      ? t('filterByGrade')
                      : grades.find((g) => g.id === selectedGradeId)?.name || t('filterByGrade')
                    }
                    <IconFilter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                  <Command>
                    <CommandInput placeholder={t('searchGrades')} />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>{t('noGradeFound')}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            setSelectedGradeId("all")
                            setGradePopoverOpen(false)
                          }}
                        >
                          {t('allGrades')}
                        </CommandItem>
                        {grades.map((grade) => (
                          <CommandItem
                            key={grade.id}
                            value={grade.name}
                            onSelect={() => {
                              setSelectedGradeId(grade.id)
                              setGradePopoverOpen(false)
                            }}
                          >
                            {grade.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {categories.length > 0 && (
                <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryPopoverOpen}
                      className="w-full sm:w-[180px] justify-between"
                    >
                      {selectedCategoryId === "all" 
                        ? t('filterByCategory')
                        : categories.find((c) => c.id === selectedCategoryId)?.name || t('filterByCategory')
                      }
                      <IconFilter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-0">
                    <Command>
                      <CommandInput placeholder={t('searchCategories')} />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>{t('noCategoryFound')}</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            key="all"
                            value="all"
                            onSelect={() => {
                              setSelectedCategoryId("all")
                              setCategoryPopoverOpen(false)
                            }}
                          >
                            {t('allCategories')}
                          </CommandItem>
                          {categories.map((category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => {
                                setSelectedCategoryId(category.id)
                                setCategoryPopoverOpen(false)
                              }}
                            >
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
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
            <PositionTableSkeleton />
          ) : (
            <>
              <PositionDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {filteredPositions.length > 0 && <DataTablePagination table={table} />}
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

