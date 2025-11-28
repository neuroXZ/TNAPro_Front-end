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
import { positionAPI, positionCompetencyAPI } from "@/lib/api"
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
import { Position, getColumns } from "./columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PositionCompetencyTableSkeleton } from "./position-competency-table-skeleton"
import { PositionCompetencyDataTable } from "./position-competency-data-table"

export default function PositionCompetencyManagementPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [positionCompetencies, setPositionCompetencies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    fetchPositions()
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchPositions = async () => {
    try {
      setIsLoading(true)
      const [positionsData, positionCompetenciesData] = await Promise.all([
        positionAPI.getAll(),
        positionCompetencyAPI.getAll(),
      ])
      
      // Add count to positions
      const positionsWithCount = positionsData.map((position: any) => ({
        ...position,
        _count: {
          positionCompetencies: positionCompetenciesData.filter(
            (pc: any) => pc.positionId === position.id
          ).length,
        },
      }))
      
      setPositions(positionsWithCount)
      setPositionCompetencies(positionCompetenciesData)
      setRowSelection({})
    } catch (error: any) {
      toast.error("Failed to fetch positions data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Define columns
  const columns = useMemo(() => getColumns(), [])

  // ==================== TABLE INITIALIZATION ====================
  const table = useReactTable({
    data: positions,
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

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Position Competency Management</h1>
          <p className="text-muted-foreground">
            Manage competencies required for each position
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Positions</CardTitle>
              <CardDescription>
                Click on a position to manage its required competencies
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
            <PositionCompetencyTableSkeleton />
          ) : (
            <>
              <PositionCompetencyDataTable 
                table={table} 
                columnsLength={columns.length}
              />
              {positions.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
