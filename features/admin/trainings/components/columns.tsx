"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { format, isBefore, isAfter } from "date-fns"
import { useTranslations } from "next-intl"

export interface Training {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
}

interface ColumnActions {
  onEdit: (training: Training) => void
  onDelete: (training: Training) => void
}

export const getColumns = (actions: ColumnActions): ColumnDef<Training>[] => {
  const t = useTranslations('AdminTrainingsPage')
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
          {t('colName')}
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('colStartDate')}
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
    cell: ({ row }) => {
      const startDate = row.original.startDate
      return startDate ? (
        <span>{format(new Date(startDate), "dd MMM yyyy")}</span>
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
        <span>{format(new Date(endDate), "dd MMM yyyy")}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: "status",
    header: t('colStatus'),
    cell: ({ row }) => {
      const { startDate, endDate } = row.original
      if (!startDate || !endDate) {
        return <Badge variant="outline">{t('statusNoDate')}</Badge>
      }

      const now = new Date()
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isBefore(now, start)) {
        return <Badge className="bg-blue-600 hover:bg-blue-700">{t('statusUpcoming')}</Badge>
      } else if (isAfter(now, end)) {
        return <Badge className="bg-red-600 hover:bg-red-700">{t('statusPast')}</Badge>
      } else {
        return <Badge className="bg-green-600 hover:bg-green-700">{t('statusOngoing')}</Badge>
      }
    },
  },
  // {
  //   accessorKey: "description",
  //   header: "Description",
  //   cell: ({ row }) => {
  //     const description = row.original.description
  //     if (!description) return <span className="text-muted-foreground">-</span>
  //     const words = description.split(" ")
  //     const truncated = words.slice(0, 5).join(" ")
  //     return (
  //       <span className="text-sm text-muted-foreground">
  //         {truncated}{words.length > 5 ? "..." : ""}
  //       </span>
  //     )
  //   },
  // },
  {
    id: "actions",
    header: () => <div className="text-right">{tc('actions')}</div>,
    cell: ({ row }) => {
      const training = row.original

      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onEdit(training)
            }}
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onDelete(training)
            }}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      )
    },
  },
  ]
}
