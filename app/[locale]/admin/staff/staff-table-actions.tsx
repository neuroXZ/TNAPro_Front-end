import { Button } from "@/components/ui/button"
import {
  IconPlus,
  IconDownload,
  IconUpload,
  IconTrash,
  IconMail,
} from "@tabler/icons-react"

interface StaffTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
  onDownloadTemplate?: () => void
  onImport?: () => void
}

export function StaffTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
  onDownloadTemplate,
  onImport,
}: StaffTableActionsProps) {
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
        Add Staff
      </Button>
      {selectedCount > 0 && (
        <Button variant="destructive" size="sm" onClick={onBulkDelete}>
          <IconTrash className="mr-2 size-4" />
          Delete Selected ({selectedCount})
        </Button>
      )}
      {selectedCount > 0 && (
        <Button variant="default" size="sm" onClick={onBulkDelete}>
          <IconMail className="mr-2 size-4" />
          Send Email Notification ({selectedCount})
        </Button>
      )}
    </div>
  )
}
