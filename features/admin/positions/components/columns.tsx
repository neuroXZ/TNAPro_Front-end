"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

export interface Position {
  id: string
  name: string
  description?: string
  gradeId?: string
  grade?: {
    id: string
    name: string
  }
  categoryId?: string
  category?: {
    id: string
    name: string
  }
}

interface ColumnActions {
  onEdit: (position: Position) => void
  onDelete: (position: Position) => void
}

export const getColumns = (actions: ColumnActions): ColumnDef<Position>[] => {
  const t = useTranslations('AdminPositionsPage')
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
    accessorKey: "grade.name",
    header: t('gradeLabel'),
    cell: ({ row }) => {
      const grade = row.original.grade
      return grade?.name ? (
        <span>{grade.name}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "category.name",
    header: t('categoryLabel'),
    cell: ({ row }) => {
      const category = row.original.category
      return category?.name ? (
        <span>{category.name}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "description",
    header: tc('description'),
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
    header: () => <div className="text-right">{tc('actions')}</div>,
    cell: ({ row }) => {
      const position = row.original

      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onEdit(position)
            }}
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onDelete(position)
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
