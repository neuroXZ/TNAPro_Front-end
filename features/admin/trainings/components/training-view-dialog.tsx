import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Training } from "./columns"
import { format } from "date-fns"
import { useTranslations } from "next-intl"

interface TrainingViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  training: Training | null
}

export function TrainingViewDialog({
  open,
  onOpenChange,
  training,
}: TrainingViewDialogProps) {
  const t = useTranslations('AdminTrainingsPage')
  const tc = useTranslations('Common')

  if (!training) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tc('entityDetails', { entity: t('entityNameSingularCap') })}</DialogTitle>
          <DialogDescription>
            {tc('viewDetailedInfo', { name: training.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">{t('colName')}</Label>
            <p className="text-sm font-medium">{training.name}</p>
          </div>
          {training.startDate && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('colStartDate')}</Label>
              <p className="text-sm font-medium">
                {format(new Date(training.startDate), "dd MMMM yyyy")}
              </p>
            </div>
          )}
          {training.endDate && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('colEndDate')}</Label>
              <p className="text-sm font-medium">
                {format(new Date(training.endDate), "dd MMMM yyyy")}
              </p>
            </div>
          )}
          {training.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{tc('description')}</Label>
              <p className="text-sm">{training.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
