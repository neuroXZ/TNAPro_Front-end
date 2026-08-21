import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Zon } from "./columns"
import { useTranslations } from "next-intl"

interface ZonViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zon: Zon | null
}

export function ZonViewDialog({
  open,
  onOpenChange,
  zon,
}: ZonViewDialogProps) {
  const t = useTranslations('AdminZonPage')
  const tc = useTranslations('Common')

  if (!zon) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tc('entityDetails', { entity: t('entityNameSingularCap') })}</DialogTitle>
          <DialogDescription>
            {tc('viewDetailedInfo', { name: zon.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">{t('nameLabel')}</Label>
            <p className="text-sm font-medium">{zon.name}</p>
          </div>
          {zon.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{tc('description')}</Label>
              <p className="text-sm">{zon.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
