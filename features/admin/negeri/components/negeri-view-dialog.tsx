import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Negeri } from "./columns"
import { useTranslations } from "next-intl"

interface NegeriViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  negeri: Negeri | null
}

export function NegeriViewDialog({
  open,
  onOpenChange,
  negeri,
}: NegeriViewDialogProps) {
  const t = useTranslations('AdminNegeriPage')
  const tc = useTranslations('Common')

  if (!negeri) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tc('entityDetails', { entity: t('entityNameSingularCap') })}</DialogTitle>
          <DialogDescription>
            {tc('viewDetailedInfo', { name: negeri.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">{t('nameLabel')}</Label>
            <p className="text-sm font-medium">{negeri.name}</p>
          </div>
          {negeri.zon?.name && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('zonLabel')}</Label>
              <p className="text-sm font-medium">{negeri.zon.name}</p>
            </div>
          )}
          {negeri.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{tc('description')}</Label>
              <p className="text-sm">{negeri.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
