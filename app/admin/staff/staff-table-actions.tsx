import { useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  IconPlus,
  IconDownload,
  IconUpload,
  IconTrash,
} from "@tabler/icons-react"

interface StaffTableActionsProps {
  selectedCount: number
  isImporting: boolean
  isExporting: boolean
  onAdd: () => void
  onBulkDelete: () => void
  onImport: (file: File) => void
  onExport: () => void
}

export function StaffTableActions({
  selectedCount,
  isImporting,
  isExporting,
  onAdd,
  onBulkDelete,
  onImport,
  onExport,
}: StaffTableActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImport(file)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={isImporting}
      >
        <IconUpload className="mr-2 size-4" />
        {isImporting ? "Importing..." : "Import"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={isExporting}
      >
        <IconDownload className="mr-2 size-4" />
        {isExporting ? "Exporting..." : "Export"}
      </Button>
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
    </div>
  )
}
