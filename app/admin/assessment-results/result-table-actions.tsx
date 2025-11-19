import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from "@tabler/icons-react"

interface ResultTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
}

export function ResultTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
}: ResultTableActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {selectedCount > 0 && (
        <Button variant="destructive" size="sm" onClick={onBulkDelete}>
          <IconTrash className="mr-2 size-4" />
          Delete ({selectedCount})
        </Button>
      )}
      <Button onClick={onAdd}>
        <IconPlus className="mr-2 size-4" />
        Add Result
      </Button>
    </div>
  )
}
