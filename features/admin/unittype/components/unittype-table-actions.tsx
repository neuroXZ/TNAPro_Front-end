import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

interface UnitTypeTableActionsProps {
  selectedCount: number
  onAdd: () => void
  onBulkDelete: () => void
}

export function UnitTypeTableActions({
  selectedCount,
  onAdd,
  onBulkDelete,
}: UnitTypeTableActionsProps) {
  const t = useTranslations('AdminUnitTypePage')
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
