import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Cluster } from "./columns"
import { useTranslations } from "next-intl"

interface ClusterViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cluster: Cluster | null
}

export function ClusterViewDialog({
  open,
  onOpenChange,
  cluster,
}: ClusterViewDialogProps) {
  const t = useTranslations('AdminClustersPage')
  const tc = useTranslations('Common')

  if (!cluster) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tc('entityDetails', { entity: t('entityNameSingularCap') })}</DialogTitle>
          <DialogDescription>
            {tc('viewDetailedInfo', { name: cluster.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">{t('nameLabel')}</Label>
            <p className="text-sm font-medium">{cluster.name}</p>
          </div>
          {cluster.level !== null && cluster.level !== undefined && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('levelLabel')}</Label>
              <p className="text-sm font-medium">{cluster.level}</p>
            </div>
          )}
          {cluster.color && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{t('colorLabel')}</Label>
              <div className="flex items-center gap-2">
                <div
                  className="size-6 rounded border"
                  style={{ backgroundColor: cluster.color }}
                />
                <p className="text-sm font-medium">{cluster.color}</p>
              </div>
            </div>
          )}
          {cluster.description && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">{tc('description')}</Label>
              <p className="text-sm">{cluster.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
