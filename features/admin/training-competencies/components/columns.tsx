"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEye, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export interface Training {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  _count?: {
    trainingCompetencies: number
  }
}

export const getColumns = (): ColumnDef<Training>[] => {
  const t = useTranslations('AdminTrainingCompetenciesPage')
  const tc = useTranslations('Common')

  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t('selectAll')}
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={t('selectRow')}
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('colTrainingName')}
          {column.getIsSorted() === "asc" ? (
            <IconArrowUp className="ml-2 size-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconArrowDown className="ml-2 size-4" />
          ) : (
            <IconArrowsSort className="ml-2 size-4" />
          )}
        </Button>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: t('colStartDate'),
    cell: ({ row }) => {
      const startDate = row.original.startDate
      return startDate ? (
        <span>{new Date(startDate).toLocaleDateString()}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "endDate",
    header: t('colEndDate'),
    cell: ({ row }) => {
      const endDate = row.original.endDate
      return endDate ? (
        <span>{new Date(endDate).toLocaleDateString()}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "_count.trainingCompetencies",
    header: t('colTotalCompetencies'),
    cell: ({ row }) => {
      const count = row.original._count?.trainingCompetencies || 0
      return (
        <span className="font-medium">
          {t('competencyCount', { count })}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">{tc('actions')}</div>,
    cell: ({ row }) => {
      const training = row.original
      const router = useRouter()

      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/admin/training-competencies/${training.id}`)
            }}
          >
            <IconEye className="mr-2 size-4" />
            {t('manageCompetencies')}
          </Button>
        </div>
      )
    },
  },
]
}
