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
import { useTranslations } from "next-intl"
import { PositionCategory } from "./columns"

interface PositionCategoryFormData {
  name: string
  description?: string
}

interface PositionCategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPositionCategory: PositionCategory | null
  onSubmit: (data: PositionCategoryFormData) => Promise<void>
}

export function PositionCategoryFormDialog({
  open,
  onOpenChange,
  editingPositionCategory,
  onSubmit,
}: PositionCategoryFormDialogProps) {
  const t = useTranslations('AdminPositionCategoryPage')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<PositionCategoryFormData>({
    name: editingPositionCategory?.name || "",
    description: editingPositionCategory?.description || "",
  })

  // Update form when editingPositionCategory or open state changes
  useEffect(() => {
    if (editingPositionCategory) {
      setFormData({
        name: editingPositionCategory.name,
        description: editingPositionCategory.description || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
      })
    }
  }, [editingPositionCategory, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSubmit(formData)
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
              {editingPositionCategory
                ? tc('editEntity', { entity: t('entityNameSingularCap') })
                : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingPositionCategory
                ? t('updateEntityInfo', { entity: t('entityNameSingular') })
                : t('addEntityToSystem', { entity: t('entityNameSingular') })}
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
              {isSaving ? tc('saving') : editingPositionCategory ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { PositionCategoryFormData }
