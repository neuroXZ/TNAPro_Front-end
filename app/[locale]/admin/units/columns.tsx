"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"

export interface Unit {
  id: string
  name: string
  description?: string
  unitTypeId?: string
  parentId?: string
  unitType?: {
    id: string
    name: string
  }
  parent?: {
    id: string
    name: string
  }
}

interface ColumnActions {
  onEdit: (unit: Unit) => void
  onDelete: (unit: Unit) => void
}

export const getColumns = (actions: ColumnActions): ColumnDef<Unit>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
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
          Unit Name
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
          Unit Type
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
          Parent Unit
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
    accessorKey: "description",
    header: "Description",
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
    header: () => <div className="text-right">Actions</div>,
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
