import { Button } from "@/components/ui/button"
import { IconEdit, IconInfoCircle } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { CompetencyDetailsDialog } from "@/features/competency-dictionary/competency-details-dialog"
import { Competency } from "./columns"

interface CompetencyViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
  onEdit?: (competency: Competency) => void
}

/** Competency details = its full dictionary entry (details + every level's indicators). */
export function CompetencyViewDialog({
  open,
  onOpenChange,
  competency,
  onEdit,
}: CompetencyViewDialogProps) {
  const t = useTranslations('AdminCompetenciesPage')
  const tc = useTranslations('Common')
  const td = useTranslations('CompetencyDictionary')

  return (
    <CompetencyDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      competencyId={competency?.id}
      fallbackName={competency?.name}
      note={
        <>
          <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
          {td('referenceNote')}
        </>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('close')}
          </Button>
          {onEdit && competency && (
            <Button onClick={() => onEdit(competency)}>
              <IconEdit className="mr-2 size-4" />
              {tc('editEntity', { entity: t('entityNameSingularCap') })}
            </Button>
          )}
        </>
      }
    />
  )
}
