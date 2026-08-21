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
import { Unit } from "./columns"
import { unitTypeAPI, unitAPI, negeriAPI } from "@/lib/api"
import { useTranslations } from "next-intl"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

interface UnitFormData {
  name: string
  description?: string
  unitTypeId?: string
  parentId?: string
  negeriId?: string
}

interface UnitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUnit: Unit | null
  onSubmit: (data: UnitFormData) => Promise<void>
}

interface UnitType {
  id: string
  name: string
}

interface Negeri {
  id: string
  name: string
}

export function UnitFormDialog({
  open,
  onOpenChange,
  editingUnit,
  onSubmit,
}: UnitFormDialogProps) {
  const t = useTranslations('AdminUnitsPage')
  const tc = useTranslations('Common')
  const { flags: featureFlags } = useFeatureFlags()
  const [isSaving, setIsSaving] = useState(false)
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [parentUnits, setParentUnits] = useState<Unit[]>([])
  const [negeriList, setNegeriList] = useState<Negeri[]>([])
  const [formData, setFormData] = useState<UnitFormData>({
    name: editingUnit?.name || "",
    description: editingUnit?.description || "",
    unitTypeId: editingUnit?.unitTypeId || "",
    parentId: editingUnit?.parentId || "",
    negeriId: editingUnit?.negeriId || "",
  })

  // Fetch unit types, parent units, and negeri
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch unit types
        const unitTypesData = await unitTypeAPI.getAll()
        setUnitTypes(unitTypesData)

        // Fetch all units for parent selection
        const allUnits = await unitAPI.getAll()
        // Filter out current unit if editing (prevent self-reference)
        const availableParents = editingUnit
          ? allUnits.filter((unit: Unit) => unit.id !== editingUnit.id)
          : allUnits
        setParentUnits(availableParents)

        // Fetch negeri list — only when this deployment has the feature on
        if (featureFlags.zonNegeri) {
          const negeriData = await negeriAPI.getAll()
          setNegeriList(negeriData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    if (open) {
      fetchData()
    }
  }, [open, editingUnit, featureFlags.zonNegeri])

  // Update form when editingUnit or open state changes
  useEffect(() => {
    if (editingUnit) {
      setFormData({
        name: editingUnit.name,
        description: editingUnit.description || "",
        unitTypeId: editingUnit.unitTypeId || "",
        parentId: editingUnit.parentId || "",
        negeriId: editingUnit.negeriId || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        unitTypeId: "",
        parentId: "",
        negeriId: "",
      })
    }
  }, [editingUnit, open])

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
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? tc('editEntity', { entity: t('entityNameSingularCap') }) : tc('addNewEntity', { entity: t('entityNameSingularCap') })}
            </DialogTitle>
            <DialogDescription>
              {editingUnit
                ? t('updateUnitInfo')
                : t('addUnitInfo')}
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
                placeholder={t('enterUnitNamePlaceholder')}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitTypeId">{t('unitTypeLabel')}</Label>
              <Select
                value={formData.unitTypeId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, unitTypeId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectUnitTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noUnitType')}</SelectItem>
                  {unitTypes.map((unitType) => (
                    <SelectItem key={unitType.id} value={unitType.id}>
                      {unitType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parentId">{t('parentUnitLabel')}</Label>
              <Select
                value={formData.parentId ? formData.parentId : "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('noParentUnit')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noParentUnit')}</SelectItem>
                  {parentUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                      {unit.unitType && ` (${unit.unitType.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {featureFlags.zonNegeri && (
              <div className="grid gap-2">
                <Label htmlFor="negeriId">{t('negeriLabel')}</Label>
                <Select
                  value={formData.negeriId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, negeriId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectNegeriPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('noNegeri')}</SelectItem>
                    {negeriList.map((negeri) => (
                      <SelectItem key={negeri.id} value={negeri.id}>
                        {negeri.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              {isSaving ? tc('saving') : editingUnit ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { UnitFormData }
