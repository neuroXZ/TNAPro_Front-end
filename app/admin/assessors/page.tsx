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
import { assessorAPI } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconSearch, IconFilter } from "@tabler/icons-react"
import { toast } from "sonner"
import { Assessor, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { AssessorFormDialog, type AssessorFormData } from "./assessor-form-dialog"
import { AssessorDeleteDialog } from "./assessor-delete-dialog"
import { AssessorTableSkeleton } from "./assessor-table-skeleton"
import { AssessorDataTable } from "./assessor-data-table"
import { AssessorTableActions } from "./assessor-table-actions"
import { AssessorViewDialog } from "./assessor-view-dialog"

export default function AssessorManagementPage() {
  const [assessors, setAssessors] = useState<Assessor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingAssessor, setEditingAssessor] = useState<Assessor | null>(null)
  const [deletingAssessor, setDeletingAssessor] = useState<Assessor | null>(null)
  const [viewingAssessor, setViewingAssessor] = useState<Assessor | null>(null)
  const [selectedAssessorId, setSelectedAssessorId] = useState<string>("all")
  const [assessorPopoverOpen, setAssessorPopoverOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'self' | 'superior'>('superior')
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  // Filter assessors by type and selected assessor
  const filteredAssessors = useMemo(() => {
    let filtered = assessors.filter(assessor => assessor.type === activeTab)
    
    if (selectedAssessorId && selectedAssessorId !== "all") {
      filtered = filtered.filter(assessor => assessor.assessorId === selectedAssessorId)
    }
    
    return filtered
  }, [assessors, activeTab, selectedAssessorId])

  const selfCount = useMemo(() => {
    return assessors.filter(a => a.type === 'self').length
  }, [assessors])

  const superiorCount = useMemo(() => {
    return assessors.filter(a => a.type === 'superior').length
  }, [assessors])

  // Get unique assessors for filter dropdown
  const uniqueAssessors = useMemo(() => {
    const assessorMap = new Map()
    assessors.forEach(item => {
      if (item.assessor && item.assessor.id && item.assessor.name) {
        assessorMap.set(item.assessor.id, item.assessor)
      }
    })
    return Array.from(assessorMap.values())
  }, [assessors])

  useEffect(() => {
    fetchAssessors()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchAssessors = async () => {
    try {
      setIsLoading(true)
      const data = await assessorAPI.getAll()
      setAssessors(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch assessors data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(assessor?: Assessor) {
    setEditingAssessor(assessor || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (assessor: Assessor) => {
    setViewingAssessor(assessor)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: AssessorFormData) => {
    if (editingAssessor) {
      await assessorAPI.update(editingAssessor.id, formData)
      toast.success("Assessor updated successfully")
    } else {
      await assessorAPI.create(formData)
      toast.success("Assessor created successfully")
    }

    setEditingAssessor(null)
    fetchAssessors()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (assessor: Assessor) => {
    setDeletingAssessor(assessor)
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
    data: filteredAssessors,
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
      toast.error("Please select assessors to delete")
      return
    }
    setDeletingAssessor(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingAssessor) {
        // Single delete
        await assessorAPI.delete(deletingAssessor.id)
        toast.success("Assessor deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          assessorAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} assessors deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingAssessor(null)
      fetchAssessors()
    } catch (error: any) {
      toast.error("Failed to delete assessor")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Assessor Management</h1>
          <p className="text-muted-foreground">
            Manage assessor assignments for staff evaluations
          </p>
        </div>
        <AssessorTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Assessor Assignments</CardTitle>
              <CardDescription>
                A list of all assessor assignments in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={assessorPopoverOpen} onOpenChange={setAssessorPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assessorPopoverOpen}
                    className="min-w-[180px] max-w-[300px] justify-between"
                  >
                    <span className="truncate">
                      {selectedAssessorId === "all" 
                        ? "Filter by Assessor"
                        : uniqueAssessors.find((a) => a.id === selectedAssessorId)?.name || "Filter by Assessor"
                      }
                    </span>
                    <IconFilter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-[180px] max-w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search assessors..." />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>No assessor found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            setSelectedAssessorId("all")
                            setAssessorPopoverOpen(false)
                          }}
                        >
                          All Assessors
                        </CommandItem>
                        {uniqueAssessors.map((assessor) => (
                          <CommandItem
                            key={assessor.id}
                            value={assessor.name}
                            onSelect={() => {
                              setSelectedAssessorId(assessor.id)
                              setAssessorPopoverOpen(false)
                            }}
                          >
                            {assessor.name}
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
                  placeholder="Search assessors..."
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
            <AssessorTableSkeleton />
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'self' | 'superior')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="superior" className="gap-2">
                  Superior
                  <Badge variant="secondary" className="ml-1 bg-green-500 text-white">
                    {superiorCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="self" className="gap-2">
                  Self
                  <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                    {selfCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="self">
                <AssessorDataTable 
                  table={table} 
                  columnsLength={columns.length}
                  onRowClick={handleRowClick}
                />
                {filteredAssessors.length > 0 && <DataTablePagination table={table} />}
              </TabsContent>

              <TabsContent value="superior">
                <AssessorDataTable 
                  table={table} 
                  columnsLength={columns.length}
                  onRowClick={handleRowClick}
                />
                {filteredAssessors.length > 0 && <DataTablePagination table={table} />}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <AssessorFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingAssessor={editingAssessor}
        onSubmit={handleFormSubmit}
      />

      <AssessorDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingAssessor={deletingAssessor}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <AssessorViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        assessor={viewingAssessor}
      />
    </div>
  )
}

