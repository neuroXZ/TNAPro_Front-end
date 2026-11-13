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
import { positionAPI, positionCompetencyAPI, unitAPI } from "@/lib/api"
import { summarizePositionScopes } from "@/features/admin/position-competencies/lib/scope-summary"
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
import { Position, getColumns } from "@/features/admin/position-competencies/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PositionCompetencyTableSkeleton } from "@/features/admin/position-competencies/components/position-competency-table-skeleton"
import { PositionCompetencyDataTable } from "@/features/admin/position-competencies/components/position-competency-data-table"
import { useTranslations, useLocale } from "next-intl"

export default function PositionCompetencyManagementPage() {
  const t = useTranslations('AdminPositionCompetenciesPage')
  const tc = useTranslations('Common')
  const locale = useLocale()
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
      const [positionsData, positionCompetenciesData, unitsData] = await Promise.all([
        positionAPI.getAll(),
        positionCompetencyAPI.getAll(),
        // Only used for the Global/unit breakdown; the list still works without it.
        unitAPI.getAll().catch(() => []),
      ])
      
      // Distinct competencies mapped to this position across every scope
      // (Global + any unit) — not a raw row count, so a competency mapped at
      // both Global and a unit only counts once, and this stays in sync with
      // the detail page's "All Scopes" total. Orphaned rows (competencyId
      // null, pointing at a deleted competency) are excluded, matching how
      // the detail page treats them separately rather than inflating this.
      const positionsWithCount = positionsData.map((position: any) => {
        const rowsForPosition = positionCompetenciesData.filter(
          (pc: any) => pc.positionId === position.id && pc.competencyId
        )
        const distinctCompetencyIds = new Set(rowsForPosition.map((pc: any) => pc.competencyId))
        return {
          ...position,
          _count: {
            positionCompetencies: distinctCompetencyIds.size,
          },
          // null unless the position has unit-scoped mappings, in which case
          // the raw total above adds up every unit's own list.
          _scope: summarizePositionScopes(rowsForPosition, unitsData),
        }
      })
      
      setPositions(positionsWithCount)
      setPositionCompetencies(positionCompetenciesData)
      setRowSelection({})
    } catch (error: unknown) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Define columns
  const columns = useMemo(
    () => getColumns(t, tc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  )

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
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
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
