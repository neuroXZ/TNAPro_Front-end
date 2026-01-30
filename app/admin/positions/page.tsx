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
import { Position, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PositionFormDialog, type PositionFormData } from "./position-form-dialog"
import { PositionDeleteDialog } from "./position-delete-dialog"
import { PositionTableSkeleton } from "./position-table-skeleton"
import { PositionDataTable } from "./position-data-table"
import { PositionTableActions } from "./position-table-actions"
import { PositionViewDialog } from "./position-view-dialog"
import { PositionImportDialog } from "./position-import-dialog"

export default function PositionManagementPage() {
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
    } catch (error: any) {
      toast.error("Failed to fetch positions data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGrades = async () => {
    try {
      const data = await gradeAPI.getAll()
      setGrades(data)
    } catch (error: any) {
      console.error("Failed to fetch grades:", error)
    }
  }
  const fetchCategories = async () => {
    try {
      const data = await positionCategoryAPI.getAll()
      setCategories(data)
    } catch (error: any) {
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
      toast.success("Position updated successfully")
    } else {
      await positionAPI.create(formData)
      toast.success("Position created successfully")
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
      toast.error("Please select positions to delete")
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
      
      toast.success('Template downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download template')
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
        toast.success("Position deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          positionAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} positions deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingPosition(null)
      fetchPositions()
    } catch (error: any) {
      toast.error("Failed to delete position")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Position Management</h1>
          <p className="text-muted-foreground">
            Manage job positions in the organization
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Positions</CardTitle>
              <CardDescription>
                A list of all job positions in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={gradePopoverOpen} onOpenChange={setGradePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={gradePopoverOpen}
                    className="w-[180px] justify-between"
                  >
                    {selectedGradeId === "all" 
                      ? "Filter by Grade"
                      : grades.find((g) => g.id === selectedGradeId)?.name || "Filter by Grade"
                    }
                    <IconFilter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                  <Command>
                    <CommandInput placeholder="Search grades..." />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>No grade found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            setSelectedGradeId("all")
                            setGradePopoverOpen(false)
                          }}
                        >
                          All Grades
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
                      className="w-[180px] justify-between"
                    >
                      {selectedCategoryId === "all" 
                        ? "Filter by Category"
                        : categories.find((c) => c.id === selectedCategoryId)?.name || "Filter by Category"
                      }
                      <IconFilter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-0">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            key="all"
                            value="all"
                            onSelect={() => {
                              setSelectedCategoryId("all")
                              setCategoryPopoverOpen(false)
                            }}
                          >
                            All Categories
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
                  placeholder="Search positions..."
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

