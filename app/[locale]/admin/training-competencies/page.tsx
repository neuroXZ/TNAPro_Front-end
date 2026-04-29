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
import { trainingAPI, trainingCompetencyAPI } from "@/lib/api"
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
import { Training, getColumns } from "@/features/admin/training-competencies/components/columns"
import { DataTablePagination } from "@/components/data-table-pagination"
import { TrainingCompetencyTableSkeleton } from "@/features/admin/training-competencies/components/training-competency-table-skeleton"
import { TrainingCompetencyDataTable } from "@/features/admin/training-competencies/components/training-competency-data-table"
import { useTranslations } from "next-intl"

export default function TrainingCompetencyManagementPage() {
  const t = useTranslations('AdminTrainingCompetenciesPage')
  const [trainings, setTrainings] = useState<Training[]>([])
  const [trainingCompetencies, setTrainingCompetencies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
      const [trainingsData, trainingCompetenciesData] = await Promise.all([
        trainingAPI.getAll(),
        trainingCompetencyAPI.getAll(),
      ])
      
      // Add count to trainings
      const trainingsWithCount = trainingsData.map((training: any) => ({
        ...training,
        _count: {
          trainingCompetencies: trainingCompetenciesData.filter(
            (tc: any) => tc.trainingId === training.id
          ).length,
        },
      }))
      
      setTrainings(trainingsWithCount)
      setTrainingCompetencies(trainingCompetenciesData)
      setRowSelection({})
    } catch (error: unknown) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Define columns
  const columns = useMemo(() => getColumns(), [])

  // ==================== TABLE INITIALIZATION ====================
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
            <TrainingCompetencyTableSkeleton />
          ) : (
            <>
              <TrainingCompetencyDataTable 
                table={table} 
                columnsLength={columns.length}
              />
              {trainings.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
