import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from "@tabler/icons-react"

interface PositionTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
}

export function PositionTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
}: PositionTableActionsProps) {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={onAdd}>
        <IconPlus className="mr-2 size-4" />
        Add Position
      </Button>
      {selectedCount > 0 && (
        <Button variant="destructive" size="sm" onClick={onBulkDelete}>
          <IconTrash className="mr-2 size-4" />
          Delete Selected ({selectedCount})
        </Button>
      )}
    </div>
  )
}
