import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Cluster } from "./columns"
import { useTranslations } from "next-intl"

interface ClusterDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingCluster: Cluster | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function ClusterDeleteDialog({
  open,
  onOpenChange,
  deletingCluster,
  selectedCount = 0,
  onConfirm,
}: ClusterDeleteDialogProps) {
  const t = useTranslations('AdminClustersPage')
  const tc = useTranslations('Common')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tc('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingCluster
              ? tc('deleteSingleWarning', { name: deletingCluster.name })
              : tc('deleteBulkWarning', { count: selectedCount, entity: t('entityNamePlural') })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
