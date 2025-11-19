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
import { Mail } from "./columns"

interface MailDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deletingMail: Mail | null
  selectedCount?: number
  onConfirm: () => Promise<void>
}

export function MailDeleteDialog({
  open,
  onOpenChange,
  deletingMail,
  selectedCount = 0,
  onConfirm,
}: MailDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingMail
              ? `This will permanently delete mail template "${deletingMail.name}". This action cannot be undone.`
              : `This will permanently delete ${selectedCount} selected mail templates. This action cannot be undone.`}
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
