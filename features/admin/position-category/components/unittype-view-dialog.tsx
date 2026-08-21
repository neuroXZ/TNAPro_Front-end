import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import { PositionCategory } from "./columns"

interface PositionCategoryViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  positionCategory: PositionCategory | null
}

export function PositionCategoryViewDialog({
  open,
  onOpenChange,
  positionCategory,
}: PositionCategoryViewDialogProps) {
  const t = useTranslations('AdminPositionCategoryPage')
  const tc = useTranslations('Common')

  if (!positionCategory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tc('entityDetails', { entity: t('entityNameSingularCap') })}</DialogTitle>
          <DialogDescription>
            {tc('viewDetailedInfo', { name: positionCategory.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">{t('colName')}</Label>
            <p className="text-sm font-medium">{positionCategory.name}</p>
          </div>
          {positionCategory.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{tc('description')}</Label>
              <p className="text-sm">{positionCategory.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
