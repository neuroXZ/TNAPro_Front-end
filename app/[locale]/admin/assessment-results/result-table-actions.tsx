import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react"

interface ResultTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
  onBulkStatusChange: (status: string) => void
}

export function ResultTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
  onBulkStatusChange,
}: ResultTableActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {selectedCount > 0 && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconEdit className="mr-2 size-4" />
                Change Status ({selectedCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkStatusChange("DRAFT")}>
                Set to Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkStatusChange("SUBMITTED")}>
                Set to Submitted
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" onClick={onBulkDelete}>
            <IconTrash className="mr-2 size-4" />
            Delete ({selectedCount})
          </Button>
        </>
      )}
      <Button onClick={onAdd}>
        <IconPlus className="mr-2 size-4" />
        Add Result
      </Button>
    </div>
  )
}
