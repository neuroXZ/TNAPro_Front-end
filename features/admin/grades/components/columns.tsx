"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

export interface Grade {
  id: string
  name: string
  description?: string
  level?: number
}

interface ColumnActions {
  onEdit: (grade: Grade) => void
  onDelete: (grade: Grade) => void
}

export const getColumns = (
  actions: ColumnActions,
  t: ReturnType<typeof useTranslations>,
  tc: ReturnType<typeof useTranslations>
): ColumnDef<Grade>[] => [
  {
    id: "select",
    header: ({ table }) => {
      return (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('selectAll')}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('selectRow')}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
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
    accessorKey: "level",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('colLevel')}
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
      const level = row.original.level
      return level !== null && level !== undefined ? (
        <span>{level}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "description",
    header: () => {
      return tc('description')
    },
    cell: ({ row }) => {
      const description = row.original.description
      if (!description) return <span className="text-muted-foreground">-</span>
      const words = description.split(" ")
      const truncated = words.slice(0, 5).join(" ")
      return (
        <span className="text-sm text-muted-foreground">
          {truncated}{words.length > 5 ? "..." : ""}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => {
      return <div className="text-right">{tc('actions')}</div>
    },
    cell: ({ row }) => {
      const grade = row.original

      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onEdit(grade)
            }}
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onDelete(grade)
            }}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      )
    },
  },
]
