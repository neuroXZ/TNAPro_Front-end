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
import { clusterAPI } from "@/lib/api"
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
import { Cluster, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { ClusterFormDialog, type ClusterFormData } from "./cluster-form-dialog"
import { ClusterDeleteDialog } from "./cluster-delete-dialog"
import { ClusterTableSkeleton } from "./cluster-table-skeleton"
import { ClusterDataTable } from "./cluster-data-table"
import { ClusterTableActions } from "./cluster-table-actions"
import { ClusterViewDialog } from "./cluster-view-dialog"

export default function ClusterManagementPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null)
  const [deletingCluster, setDeletingCluster] = useState<Cluster | null>(null)
  const [viewingCluster, setViewingCluster] = useState<Cluster | null>(null)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchClusters()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchClusters = async () => {
    try {
      setIsLoading(true)
      const data = await clusterAPI.getAll()
      setClusters(data)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch clusters data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  function handleOpenDialog(cluster?: Cluster) {
    setEditingCluster(cluster || null)
    setIsDialogOpen(true)
  }

  const handleRowClick = (cluster: Cluster) => {
    setViewingCluster(cluster)
    setIsViewDialogOpen(true)
  }

  const handleFormSubmit = async (formData: ClusterFormData) => {
    if (editingCluster) {
      await clusterAPI.update(editingCluster.id, formData)
      toast.success("Cluster updated successfully")
    } else {
      await clusterAPI.create(formData)
      toast.success("Cluster created successfully")
    }

    setEditingCluster(null)
    fetchClusters()
  }

  // ==================== DELETE HANDLERS ====================
  const handleOpenDeleteDialog = (cluster: Cluster) => {
    setDeletingCluster(cluster)
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
    data: clusters,
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
      toast.error("Please select clusters to delete")
      return
    }
    setDeletingCluster(null)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deletingCluster) {
        // Single delete
        await clusterAPI.delete(deletingCluster.id)
        toast.success("Cluster deleted successfully")
      } else {
        // Bulk delete
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const deletePromises = selectedRows.map((row) =>
          clusterAPI.delete(row.original.id)
        )
        await Promise.all(deletePromises)
        toast.success(`${selectedRows.length} clusters deleted successfully`)
        setRowSelection({})
      }
      setIsDeleteDialogOpen(false)
      setDeletingCluster(null)
      fetchClusters()
    } catch (error: any) {
      toast.error("Failed to delete cluster")
      console.error(error)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cluster Management</h1>
          <p className="text-muted-foreground">
            Manage competency clusters in the organization
          </p>
        </div>
        <ClusterTableActions
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onAdd={() => handleOpenDialog()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Clusters</CardTitle>
              <CardDescription>
                A list of all competency clusters in the system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search clusters..."
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
            <ClusterTableSkeleton />
          ) : (
            <>
              <ClusterDataTable 
                table={table} 
                columnsLength={columns.length}
                onRowClick={handleRowClick}
              />
              {clusters.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <ClusterFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCluster={editingCluster}
        onSubmit={handleFormSubmit}
      />

      <ClusterDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deletingCluster={deletingCluster}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        onConfirm={handleDeleteConfirm}
      />

      <ClusterViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        cluster={viewingCluster}
      />
    </div>
  )
}

