import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from "@tabler/icons-react"

interface GradeTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
}

export function GradeTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
}: GradeTableActionsProps) {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={onAdd}>
        <IconPlus className="mr-2 size-4" />
        Add Grade
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
