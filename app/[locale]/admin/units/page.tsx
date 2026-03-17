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
import { unitAPI, unitTypeAPI } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { IconSearch, IconFilter } from "@tabler/icons-react"
import { toast } from "sonner"
import { Unit, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { UnitFormDialog, type UnitFormData } from "./unit-form-dialog"
import { UnitDeleteDialog } from "./unit-delete-dialog"
import { UnitTableSkeleton } from "./unit-table-skeleton"
import { UnitDataTable } from "./unit-data-table"
import { UnitTableActions } from "./unit-table-actions"
import { UnitViewDialog } from "./unit-view-dialog"
import { useTranslations } from "next-intl"

interface UnitType {
  id: string
  name: string
}

export default function UnitManagementPage() {
  const t = useTranslations('AdminUnitsPage')
  const [units, setUnits] = useState<Unit[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
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
  const [selectedUnitType, setSelectedUnitType] = useState<string>("all")
  const [unitTypePopoverOpen, setUnitTypePopoverOpen] = useState(false)

  useEffect(() => {
    fetchUnits()
    fetchUnitTypes()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchUnits = async () => {
    try {
      setIsLoading(true)
      const data = await unitAPI.getAll()
      setUnits(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnitTypes = async () => {
    try {
      const data = await unitTypeAPI.getAll()
      setUnitTypes(data)
    } catch (error: any) {
      console.error("Failed to fetch unit types:", error)
    }
  }

  // Filter units by selected unit type
  const filteredUnits = useMemo(() => {
    if (selectedUnitType === "all") {
      return units
    }
    return units.filter(unit => unit.unitTypeId === selectedUnitType)
  }, [units, selectedUnitType])

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
    // Clean up the form data to handle empty strings properly
    const cleanFormData = {
      ...formData,
      unitTypeId: formData.unitTypeId === "" || formData.unitTypeId === "none" ? null : formData.unitTypeId,
      parentId: formData.parentId === "" || formData.parentId === "none" ? null : formData.parentId,
      description: formData.description === "" ? null : formData.description,
    }
    
    if (editingUnit) {
      await unitAPI.update(editingUnit.id, cleanFormData)
      toast.success(t('updateSuccess'))
    } else {
      await unitAPI.create(cleanFormData)
      toast.success(t('createSuccess'))
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
    data: filteredUnits,
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
    setDeletingUnit(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingUnit) {
        // Single delete
        await unitAPI.delete(deletingUnit.id)
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          unitAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingUnit(null)
      fetchUnits()
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
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>
                {t('cardDescription')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              
              <Popover open={unitTypePopoverOpen} onOpenChange={setUnitTypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={unitTypePopoverOpen}
                    className="w-[180px] justify-between"
                  >
                    {selectedUnitType === "all" 
                      ? t('filterByUnitType')
                      : unitTypes.find((ut) => ut.id === selectedUnitType)?.name || t('filterByUnitType')
                    }
                    <IconFilter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                  <Command>
                    <CommandInput placeholder={t('searchUnitTypes')} />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>{t('noUnitTypeFound')}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            setSelectedUnitType("all")
                            setUnitTypePopoverOpen(false)
                          }}
                        >
                          {t('allUnitTypes')}
                        </CommandItem>
                        {unitTypes.map((unitType) => (
                          <CommandItem
                            key={unitType.id}
                            value={unitType.name}
                            onSelect={() => {
                              setSelectedUnitType(unitType.id)
                              setUnitTypePopoverOpen(false)
                            }}
                          >
                            {unitType.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <UnitTableSkeleton />
          ) : (
            <>
              <UnitDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {filteredUnits.length > 0 && <DataTablePagination table={table} />}
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
