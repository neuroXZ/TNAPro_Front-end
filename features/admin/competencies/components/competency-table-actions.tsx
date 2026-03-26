import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash, IconDownload, IconUpload } from "@tabler/icons-react"

interface CompetencyTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
  onDownloadTemplate?: () => void
  onImport?: () => void
}

export function CompetencyTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
  onDownloadTemplate,
  onImport,
}: CompetencyTableActionsProps) {
  return (
    <div className="flex gap-2">
      {onDownloadTemplate && (
        <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
          <IconDownload className="mr-2 size-4" />
          Download Template
        </Button>
      )}
      {onImport && (
        <Button variant="outline" size="sm" onClick={onImport}>
          <IconUpload className="mr-2 size-4" />
          Import CSV
        </Button>
      )}
      <Button size="sm" onClick={onAdd}>
        <IconPlus className="mr-2 size-4" />
        Add Competency
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
