import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash, IconDownload, IconUpload } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations('AdminCompetenciesPage')
  const tc = useTranslations('Common')

  return (
    <div className="flex flex-wrap gap-2">
      {onDownloadTemplate && (
        <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
          <IconDownload className="mr-2 size-4" />
          {tc('downloadTemplate')}
        </Button>
      )}
      {onImport && (
        <Button variant="outline" size="sm" onClick={onImport}>
          <IconUpload className="mr-2 size-4" />
          {tc('importCsv')}
        </Button>
      )}
      <Button size="sm" onClick={onAdd}>
        <IconPlus className="mr-2 size-4" />
        {tc('addEntity', { entity: t('entityNameSingularCap') })}
      </Button>
      {selectedCount > 0 && (
        <Button variant="destructive" size="sm" onClick={onBulkDelete}>
          <IconTrash className="mr-2 size-4" />
          {tc('deleteSelected', { count: selectedCount })}
        </Button>
      )}
    </div>
  )
}
