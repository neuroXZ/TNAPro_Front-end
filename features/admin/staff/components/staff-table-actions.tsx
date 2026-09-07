import { Button } from "@/components/ui/button"
import {
  IconPlus,
  IconDownload,
  IconUpload,
  IconTrash,
  IconMail,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"

interface StaffTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
  onSendEmailNotification: () => void
  onDownloadTemplate?: () => void
  onImport?: () => void
}

export function StaffTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
  onSendEmailNotification,
  onDownloadTemplate,
  onImport,
}: StaffTableActionsProps) {
  const t = useTranslations('AdminStaffPage')
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
        {t('addStaffButton')}
      </Button>
      {selectedCount > 0 && (
        <Button variant="destructive" size="sm" onClick={onBulkDelete}>
          <IconTrash className="mr-2 size-4" />
          {tc('deleteSelected', { count: selectedCount })}
        </Button>
      )}
      {selectedCount > 0 && (
        <Button variant="default" size="sm" onClick={onSendEmailNotification}>
          <IconMail className="mr-2 size-4" />
          {t('sendEmailNotification', { count: selectedCount })}
        </Button>
      )}
    </div>
  )
}
