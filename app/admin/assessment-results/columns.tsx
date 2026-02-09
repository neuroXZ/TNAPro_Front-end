"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { IconArrowUp, IconArrowDown, IconArrowsSort, IconEye, IconEdit, IconTrash } from "@tabler/icons-react"

export interface AssessmentResult {
  id: string
  assessmentId: string
  positionId: string
  competencyId: string
  assessorId: string
  score: number
  status: string
  createdAt: string
  updatedAt: string
  assessment?: {
    id: string
    name: string
  }
  position?: {
    id: string
    name: string
  }
  competency?: {
    id: string
    name: string
  }
  assessor?: {
    id: string
    staff?: {
      name: string
    }
    assessor?: {
      name: string
    }
    type: string
  }
}

interface ColumnsContext {
  onEdit: (result: AssessmentResult) => void
  onView: (result: AssessmentResult) => void
  onDelete: (result: AssessmentResult) => void
}

export const getColumns = (context: ColumnsContext): ColumnDef<AssessmentResult>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "assessment.name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8"
        >
          Assessment
          {isSorted === "asc" ? (
            <IconArrowUp className="ml-2 size-4" />
          ) : isSorted === "desc" ? (
            <IconArrowDown className="ml-2 size-4" />
          ) : (
            <IconArrowsSort className="ml-2 size-4" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => row.original.assessment?.name || "-",
  },
  {
    accessorKey: "position.name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8"
        >
          Position
          {isSorted === "asc" ? (
            <IconArrowUp className="ml-2 size-4" />
          ) : isSorted === "desc" ? (
            <IconArrowDown className="ml-2 size-4" />
          ) : (
            <IconArrowsSort className="ml-2 size-4" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => row.original.position?.name || "-",
  },
  {
    accessorKey: "competency.name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8"
        >
          Competency
          {isSorted === "asc" ? (
            <IconArrowUp className="ml-2 size-4" />
          ) : isSorted === "desc" ? (
            <IconArrowDown className="ml-2 size-4" />
          ) : (
            <IconArrowsSort className="ml-2 size-4" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => row.original.competency?.name || "-",
  },
  {
    accessorKey: "assessor.type",
    header: "Assessor Type",
    cell: ({ row }) => {
      const type = row.original.assessor?.type
      return (
        <span className="capitalize">
          {type || "-"}
        </span>
      )
    },
  },
  {
    accessorKey: "score",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8"
        >
          Score
          {isSorted === "asc" ? (
            <IconArrowUp className="ml-2 size-4" />
          ) : isSorted === "desc" ? (
            <IconArrowDown className="ml-2 size-4" />
          ) : (
            <IconArrowsSort className="ml-2 size-4" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      const score = row.original.score
      return (
        <span className="font-medium">
          {score?.toFixed(2) || "0.00"}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const result = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              context.onView(result)
            }}
          >
            <IconEye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              context.onEdit(result)
            }}
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              context.onDelete(result)
            }}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      )
    },
  },
]
