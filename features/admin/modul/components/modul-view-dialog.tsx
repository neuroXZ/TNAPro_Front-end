import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Modul } from "./columns"
import { useTranslations } from "next-intl"

interface ModulViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modul: Modul | null
}

export function ModulViewDialog({
  open,
  onOpenChange,
  modul,
}: ModulViewDialogProps) {
  const t = useTranslations('AdminModulPage')
  const tc = useTranslations('Common')

  if (!modul) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tc('entityDetails', { entity: t('entityNameSingularCap') })}</DialogTitle>
          <DialogDescription>
            {tc('viewDetailedInfo', { name: modul.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">{t('nameLabel')}</Label>
            <p className="text-sm font-medium">{modul.name}</p>
          </div>
          {modul.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{tc('description')}</Label>
              <p className="text-sm">{modul.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
