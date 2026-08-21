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
import { UnitType } from "./columns"
import { useTranslations } from "next-intl"

interface UnitTypeFormData {
  name: string
  description?: string
}

interface UnitTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUnitType: UnitType | null
  onSubmit: (data: UnitTypeFormData) => Promise<void>
}

export function UnitTypeFormDialog({
  open,
  onOpenChange,
  editingUnitType,
  onSubmit,
}: UnitTypeFormDialogProps) {
  const t = useTranslations('AdminUnitTypePage')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UnitTypeFormData>({
    name: editingUnitType?.name || "",
    description: editingUnitType?.description || "",
  })

  // Update form when editingUnitType or open state changes
  useEffect(() => {
    if (editingUnitType) {
      setFormData({
        name: editingUnitType.name,
        description: editingUnitType.description || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
      })
    }
  }, [editingUnitType, open])

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
              {editingUnitType
                ? tc('editEntity', { entity: t('entityNameSingularCap') })
                : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingUnitType
                ? t('editDescription')
                : t('createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('nameLabel')} *</Label>
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
              {isSaving ? tc('saving') : editingUnitType ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { UnitTypeFormData }
