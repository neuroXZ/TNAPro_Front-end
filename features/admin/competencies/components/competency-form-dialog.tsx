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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Competency } from "./columns"
import { clusterAPI } from "@/lib/api"
import { useTranslations } from "next-intl"

interface CompetencyFormData {
  name: string
  description?: string
  clusterId?: string
}

interface CompetencyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCompetency: Competency | null
  onSubmit: (data: CompetencyFormData) => Promise<void>
}

interface Cluster {
  id: string
  name: string
}

export function CompetencyFormDialog({
  open,
  onOpenChange,
  editingCompetency,
  onSubmit,
}: CompetencyFormDialogProps) {
  const t = useTranslations('AdminCompetenciesPage')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [formData, setFormData] = useState<CompetencyFormData>({
    name: editingCompetency?.name || "",
    description: editingCompetency?.description || "",
    clusterId: editingCompetency?.clusterId || "",
  })

  // Fetch clusters
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const data = await clusterAPI.getAll()
        setClusters(data)
      } catch (error) {
        console.error("Failed to fetch clusters:", error)
      }
    }
    if (open) {
      fetchClusters()
    }
  }, [open])

  // Update form when editingCompetency or open state changes
  useEffect(() => {
    if (editingCompetency) {
      setFormData({
        name: editingCompetency.name,
        description: editingCompetency.description || "",
        clusterId: editingCompetency.clusterId || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        clusterId: "",
      })
    }
  }, [editingCompetency, open])

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
              {editingCompetency ? tc('editEntity', { entity: t('entityNameSingularCap') }) : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingCompetency
                ? t('formUpdateDescription')
                : t('formAddDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('nameFieldLabel')}</Label>
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
              <Label htmlFor="clusterId">{t('clusterLabel')}</Label>
              <Select
                value={formData.clusterId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clusterId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('clusterPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {cluster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSaving ? tc('saving') : editingCompetency ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { CompetencyFormData }
