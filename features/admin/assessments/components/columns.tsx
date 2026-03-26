"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { IconEye, IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

export interface Assessment {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  weightageSelf?: number
  weightageSuperior?: number
  _count?: {
    assessmentResults: number
  }
  completedStaff?: number
  totalStaff?: number
}

interface ColumnsContext {
  onEdit: (assessment: Assessment) => void
  onDelete: (assessment: Assessment) => void
}

export const getColumns = (context: ColumnsContext): ColumnDef<Assessment>[] => [
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
          Assessment Name
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
    accessorKey: "_count.assessmentResults",
    header: "Total Results",
    cell: ({ row }) => {
      const completedStaff = row.original.completedStaff || 0
      const totalStaff = row.original.totalStaff || 0
      return (
        <span className="font-medium">
          {completedStaff}/{totalStaff}
        </span>
      )
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const startDate = row.original.startDate
      const endDate = row.original.endDate
      const now = new Date()

      if (!startDate || !endDate) {
        return <Badge variant="secondary">No Date</Badge>
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (now < start) {
        return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">Coming Soon</Badge>
      } else if (now >= start && now <= end) {
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">Active</Badge>
      } else {
        return <Badge className="bg-red-600 hover:bg-red-700 text-white">Ended</Badge>
      }
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const assessment = row.original
      const router = useRouter()

      return (
        <div className="text-right flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              context.onEdit(assessment)
            }}
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/admin/assessments/${assessment.id}`)
            }}
          >
            <IconEye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              context.onDelete(assessment)
            }}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      )
    },
  },
]
