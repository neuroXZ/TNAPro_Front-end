import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from "@tabler/icons-react"

interface AssessmentTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
}

export function AssessmentTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
}: AssessmentTableActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {selectedCount > 0 && (
        <Button variant="destructive" size="sm" onClick={onBulkDelete}>
          <IconTrash className="mr-2 size-4" />
          Delete ({selectedCount})
        </Button>
      )}
      <Button onClick={onAdd} size="sm">
        <IconPlus className="mr-2 size-4" />
        Add Assessment
      </Button>
    </div>
  )
}
