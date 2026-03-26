"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"

export interface Staff {
  id: string
  staffOrgId: string
  name: string
  email?: string
  image?: string
  gender?: string
  positionId?: string
  unitId?: string
  supervisorId?: string
  position?: {
    name: string
  }
  unit?: {
    name: string
  }
}

// Helper function to get avatar image
const getAvatarImage = (staff: Staff) => {
  if (staff.image) return staff.image
  if (staff.gender?.toLowerCase() === 'female') return '/female-avatar.svg'
  return '/male-avatar.svg'
}

interface ColumnActions {
  onEdit: (staff: Staff) => void
  onDelete: (staff: Staff) => void
}

export const getColumns = (actions: ColumnActions): ColumnDef<Staff>[] => [
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
          Name
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
      const staff = row.original
      return (
        <div className="flex items-center gap-3">
          <img
            src={getAvatarImage(staff)}
            alt={staff.name}
            className="size-12 rounded-full object-cover"
          />
          <div className="flex flex-col gap-1">
            <span className="font-medium">{staff.name}</span>
            <Badge className="w-fit text-xs">
              {staff.staffOrgId}
            </Badge>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
  },
  {
    accessorKey: "position.name",
    header: "Position",
    cell: ({ row }) => <div>{row.original.position?.name || "-"}</div>,
  },
  {
    accessorKey: "unit.name",
    header: "Unit",
    cell: ({ row }) => <div>{row.original.unit?.name || "-"}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const staff = row.original

      return (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onEdit(staff)
            }}
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              actions.onDelete(staff)
            }}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      )
    },
  },
]
