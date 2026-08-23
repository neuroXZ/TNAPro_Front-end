"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEye, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export interface Position {
  id: string
  name: string
  gradeId?: string
  grade?: {
    id: string
    name: string
  }
  _count?: {
    positionCompetencies: number
  }
}

export const getColumns = (
  t: ReturnType<typeof useTranslations>,
  tc: ReturnType<typeof useTranslations>
): ColumnDef<Position>[] => {
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
          {t('colPositionName')}
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
    accessorKey: "grade.name",
    header: t('colGrade'),
    cell: ({ row }) => {
      const gradeName = row.original.grade?.name
      return gradeName ? (
        <span>{gradeName}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "_count.positionCompetencies",
    header: t('colTotalCompetencies'),
    cell: ({ row }) => {
      const count = row.original._count?.positionCompetencies || 0
      return (
        <span className="font-medium">
          {count === 1 ? t('competencyCount', { count }) : t('competenciesCount', { count })}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">{tc('actions')}</div>,
    cell: ({ row }) => {
      const position = row.original
      const router = useRouter()

      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/admin/position-competencies/${position.id}`)
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
