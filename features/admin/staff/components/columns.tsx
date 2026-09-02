"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

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
  gred?: string
  position?: {
    name: string
  }
  unit?: {
    name: string
  }
}

// Column id used by staff/page.tsx to toggle this column's visibility via
// the table's own columnVisibility state when the staffGred feature flag is
// off — kept as a real, always-defined column (not conditionally included
// here) so the column set stays stable regardless of the flag.
export const GRED_COLUMN_ID = "gred"

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

export const getColumns = (
  actions: ColumnActions,
  t: ReturnType<typeof useTranslations>,
  tc: ReturnType<typeof useTranslations>
): ColumnDef<Staff>[] => {
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
    header: t('colEmail'),
    cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
  },
  {
    accessorKey: "position.name",
    header: t('colPosition'),
    cell: ({ row }) => <div>{row.original.position?.name || "-"}</div>,
  },
  {
    accessorKey: "unit.name",
    header: t('colUnit'),
    cell: ({ row }) => <div>{row.original.unit?.name || "-"}</div>,
  },
  {
    id: GRED_COLUMN_ID,
    accessorKey: "gred",
    header: t('fieldGred'),
    cell: ({ row }) => <div>{row.original.gred || "-"}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">{tc('actions')}</div>,
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
}
