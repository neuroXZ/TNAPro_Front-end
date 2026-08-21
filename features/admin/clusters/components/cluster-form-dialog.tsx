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
import { Cluster } from "./columns"
import { useTranslations } from "next-intl"

interface ClusterFormData {
  name: string
  description?: string
  level?: number
  color?: string
}

interface ClusterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCluster: Cluster | null
  onSubmit: (data: ClusterFormData) => Promise<void>
}

export function ClusterFormDialog({
  open,
  onOpenChange,
  editingCluster,
  onSubmit,
}: ClusterFormDialogProps) {
  const t = useTranslations('AdminClustersPage')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ClusterFormData>({
    name: editingCluster?.name || "",
    description: editingCluster?.description || "",
    level: editingCluster?.level,
    color: editingCluster?.color || "",
  })

  // Update form when editingCluster or open state changes
  useEffect(() => {
    if (editingCluster) {
      setFormData({
        name: editingCluster.name,
        description: editingCluster.description || "",
        level: editingCluster.level,
        color: editingCluster.color || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        level: undefined,
        color: "",
      })
    }
  }, [editingCluster, open])

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
              {editingCluster ? tc('editEntity', { entity: t('entityNameSingularCap') }) : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingCluster
                ? t('editDescription')
                : t('addDescription')}
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
              <Label htmlFor="level">{t('levelLabel')}</Label>
              <Input
                id="level"
                type="number"
                min={0}
                max={10}
                value={formData.level ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder={t('levelPlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">{t('colorLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color || "#000000"}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder={t('colorPlaceholder')}
                  className="flex-1"
                />
              </div>
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
              {isSaving ? tc('saving') : editingCluster ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { ClusterFormData }
