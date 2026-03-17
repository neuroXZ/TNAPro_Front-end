"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconEye, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

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

export const getColumns = (): ColumnDef<Training>[] => [
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
          Training Name
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
    header: "Start Date",
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
    header: "End Date",
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
    header: "Total Competencies",
    cell: ({ row }) => {
      const count = row.original._count?.trainingCompetencies || 0
      return (
        <span className="font-medium">
          {count} {count === 1 ? "competency" : "competencies"}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
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
            Manage Competencies
          </Button>
        </div>
      )
    },
  },
]
