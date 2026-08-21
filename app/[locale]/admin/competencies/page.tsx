"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
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
import { competencyAPI, importAPI, clusterAPI } from "@/lib/api"
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
import { Competency, getColumns } from "@/features/admin/competencies/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { CompetencyFormDialog, type CompetencyFormData } from "@/features/admin/competencies/components/competency-form-dialog"
import { CompetencyDeleteDialog } from "@/features/admin/competencies/components/competency-delete-dialog"
import { CompetencyTableSkeleton } from "@/features/admin/competencies/components/competency-table-skeleton"
import { CompetencyDataTable } from "@/features/admin/competencies/components/competency-data-table"
import { CompetencyTableActions } from "@/features/admin/competencies/components/competency-table-actions"
import { CompetencyViewDialog } from "@/features/admin/competencies/components/competency-view-dialog"
import { CompetencyImportDialog } from "@/features/admin/competencies/components/competency-import-dialog"
import { useTranslations, useLocale } from "next-intl"

export default function CompetencyManagementPage() {
  const t = useTranslations('AdminCompetenciesPage')
  const locale = useLocale()
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [clusters, setClusters] = useState<Array<{ id: string; name: string }>>([])
  const [selectedClusterId, setSelectedClusterId] = useState<string>("all")
  const [clusterPopoverOpen, setClusterPopoverOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null)
  const [deletingCompetency, setDeletingCompetency] = useState<Competency | null>(null)
  const [viewingCompetency, setViewingCompetency] = useState<Competency | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  // Filter competencies based on selected cluster
  const filteredCompetencies = useMemo(() => {
    if (!selectedClusterId || selectedClusterId === "all") return competencies
    return competencies.filter(competency => competency.clusterId === selectedClusterId)
  }, [competencies, selectedClusterId])

  useEffect(() => {
    fetchCompetencies()
    fetchClusters()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchCompetencies = async () => {
    try {
      setIsLoading(true)
      const data = await competencyAPI.getAll()
      setCompetencies(data)
      setRowSelection({})
    } catch (error: unknown) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClusters = async () => {
    try {
      const data = await clusterAPI.getAll()
      setClusters(data)
    } catch (error: unknown) {
      console.error("Failed to fetch clusters:", error)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(competency?: Competency) {
    setEditingCompetency(competency || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (competency: Competency) => {
    setViewingCompetency(competency)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: CompetencyFormData) => {
    if (editingCompetency) {
      await competencyAPI.update(editingCompetency.id, formData)
      toast.success(t('updateSuccess'))
    } else {
      await competencyAPI.create(formData)
      toast.success(t('createSuccess'))
    }

    setEditingCompetency(null)
    fetchCompetencies()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (competency: Competency) => {
    setDeletingCompetency(competency)
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
    [locale]
  )

  // ==================== TABLE INITIALIZATION ====================
  // Initialize table after columns are defined
  const table = useReactTable({
    data: filteredCompetencies,
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
    setDeletingCompetency(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingCompetency) {
        // Single delete
        await competencyAPI.delete(deletingCompetency.id)
        toast.success(t('deleteSuccess'))
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          competencyAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(t('deletedMultiple', { count: selectedRows.length }))
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingCompetency(null)
      fetchCompetencies()
    } catch (error: unknown) {
      // A 409 here means the backend blocked the delete because the
      // competency is still mapped elsewhere (position/training/assessment) —
      // that message is more useful to the admin than the generic fallback.
      const backendMessage = axios.isAxiosError(error) ? error.response?.data?.error : undefined
      toast.error(backendMessage || t('deleteError'))
      console.error(error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importAPI.downloadTemplate('competency')
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'competency_import_template.csv'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <CompetencyTableActions
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
              <CardTitle>{t('cardTitle')}</CardTitle>
              <CardDescription>
                {t('cardDescription')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={clusterPopoverOpen} onOpenChange={setClusterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clusterPopoverOpen}
                    className="w-[180px] justify-between"
                  >
                    {selectedClusterId === "all" 
                      ? t('filterByCluster')
                      : clusters.find((c) => c.id === selectedClusterId)?.name || t('filterByCluster')
                    }
                    <IconFilter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                  <Command>
                    <CommandInput placeholder={t('searchClusters')} />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>{t('noClusterFound')}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="all"
                          value="all"
                          onSelect={() => {
                            setSelectedClusterId("all")
                            setClusterPopoverOpen(false)
                          }}
                        >
                          {t('allClusters')}
                        </CommandItem>
                        {clusters.map((cluster) => (
                          <CommandItem
                            key={cluster.id}
                            value={cluster.name}
                            onSelect={() => {
                              setSelectedClusterId(cluster.id)
                              setClusterPopoverOpen(false)
                            }}
                          >
                            {cluster.name}
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
            <CompetencyTableSkeleton />
          ) : (
            <>
              <CompetencyDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {filteredCompetencies.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <CompetencyFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCompetency={editingCompetency}
        onSubmit={handleFormSubmit}
      />

      <CompetencyDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingCompetency={deletingCompetency}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <CompetencyViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        competency={viewingCompetency}
      />

      <CompetencyImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={fetchCompetencies}
      />
    </div>
  )
}
