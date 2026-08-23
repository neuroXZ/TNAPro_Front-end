"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

export interface Unit {
  id: string
  name: string
  description?: string
  unitTypeId?: string
  parentId?: string
  negeriId?: string
  unitType?: {
    id: string
    name: string
  }
  parent?: {
    id: string
    name: string
  }
  negeri?: {
    id: string
    name: string
  }
}

interface ColumnActions {
  onEdit: (unit: Unit) => void
  onDelete: (unit: Unit) => void
}

// Column id used by units/page.tsx to toggle this column's visibility via
// the table's own columnVisibility state when the zonNegeri feature flag is
// off — kept as a real, always-defined column (not conditionally included
// here) so the column set stays stable regardless of the flag.
export const NEGERI_COLUMN_ID = "negeri"

export const getColumns = (
  actions: ColumnActions,
  t: ReturnType<typeof useTranslations>,
  tc: ReturnType<typeof useTranslations>
): ColumnDef<Unit>[] => {
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
    accessorKey: "unitType.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('unitTypeLabel')}
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
      const unitTypeName = row.original.unitType?.name
      return unitTypeName ? (
        <span>{unitTypeName}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "parent.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('parentUnitLabel')}
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
      const parentName = row.original.parent?.name
      return parentName ? (
        <span>{parentName}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    id: NEGERI_COLUMN_ID,
    accessorKey: "negeri.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          {t('negeriLabel')}
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
      const negeriName = row.original.negeri?.name
      return negeriName ? (
        <span>{negeriName}</span>
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
      const unit = row.original

      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onEdit(unit)
            }}
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onDelete(unit)
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
