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
import { Negeri } from "./columns"
import { zonAPI } from "@/lib/api"
import { useTranslations } from "next-intl"

interface NegeriFormData {
  name: string
  description?: string
  zonId?: string
}

interface NegeriFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingNegeri: Negeri | null
  onSubmit: (data: NegeriFormData) => Promise<void>
}

interface Zon {
  id: string
  name: string
}

export function NegeriFormDialog({
  open,
  onOpenChange,
  editingNegeri,
  onSubmit,
}: NegeriFormDialogProps) {
  const t = useTranslations('AdminNegeriPage')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [zones, setZones] = useState<Zon[]>([])
  const [formData, setFormData] = useState<NegeriFormData>({
    name: editingNegeri?.name || "",
    description: editingNegeri?.description || "",
    zonId: editingNegeri?.zonId || "",
  })

  // Fetch zones for the dropdown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const zonesData = await zonAPI.getAll()
        setZones(zonesData)
      } catch (error) {
        console.error("Failed to fetch zones:", error)
      }
    }
    if (open) {
      fetchData()
    }
  }, [open])

  // Update form when editingNegeri or open state changes
  useEffect(() => {
    if (editingNegeri) {
      setFormData({
        name: editingNegeri.name,
        description: editingNegeri.description || "",
        zonId: editingNegeri.zonId || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        zonId: "",
      })
    }
  }, [editingNegeri, open])

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
              {editingNegeri
                ? tc('editEntity', { entity: t('entityNameSingularCap') })
                : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingNegeri
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
              <Label htmlFor="zonId">{t('zonLabel')}</Label>
              <Select
                value={formData.zonId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, zonId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('zonPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noZon')}</SelectItem>
                  {zones.map((zon) => (
                    <SelectItem key={zon.id} value={zon.id}>
                      {zon.name}
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
              {isSaving ? tc('saving') : editingNegeri ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { NegeriFormData }
