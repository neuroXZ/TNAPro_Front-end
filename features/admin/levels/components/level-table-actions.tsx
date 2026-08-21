import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

interface LevelTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
}

export function LevelTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
}: LevelTableActionsProps) {
  const t = useTranslations('AdminLevelsPage')
  const tc = useTranslations('Common')

  return (
    <div className="flex gap-2">
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
