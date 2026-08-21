import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Training } from "./columns"
import { useTranslations } from "next-intl"

interface TrainingFormData {
  name: string
  description?: string
  startDate?: string
  endDate?: string
}

interface TrainingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTraining: Training | null
  onSubmit: (data: TrainingFormData) => Promise<void>
}

export function TrainingFormDialog({
  open,
  onOpenChange,
  editingTraining,
  onSubmit,
}: TrainingFormDialogProps) {
  const t = useTranslations('AdminTrainingsPage')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TrainingFormData>({
    name: editingTraining?.name || "",
    description: editingTraining?.description || "",
    startDate: editingTraining?.startDate ? new Date(editingTraining.startDate).toISOString().split('T')[0] : "",
    endDate: editingTraining?.endDate ? new Date(editingTraining.endDate).toISOString().split('T')[0] : "",
  })

  // Update form when editingTraining or open state changes
  useEffect(() => {
    if (editingTraining) {
      setFormData({
        name: editingTraining.name,
        description: editingTraining.description || "",
        startDate: editingTraining.startDate ? new Date(editingTraining.startDate).toISOString().split('T')[0] : "",
        endDate: editingTraining.endDate ? new Date(editingTraining.endDate).toISOString().split('T')[0] : "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      })
    }
  }, [editingTraining, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const submitData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      }
      await onSubmit(submitData)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingTraining ? tc('editEntity', { entity: t('entityNameSingularCap') }) : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingTraining
                ? t('updateEntityInfo')
                : t('addEntityToSystem')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('colName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t('namePlaceholder')}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">{t('colStartDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">{t('colEndDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{tc('description')}</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={tc('enterDescriptionOptional')}
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? tc('saving') : editingTraining ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { TrainingFormData }
