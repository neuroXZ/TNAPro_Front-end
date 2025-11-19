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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingCluster
              ? `This will permanently delete "${deletingCluster.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected clusters. This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
