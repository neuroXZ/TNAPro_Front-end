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
import { Label } from "@/components/ui/label"
import { levelAPI } from "@/lib/api"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface Competency {
  id: string
  name: string
  description?: string
}

interface Level {
  id: string
  name: string
  value: number
  description?: string
}

interface CompetencyLevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
  currentLevel?: number
  isEdit: boolean
  onSubmit: (level: number) => Promise<void>
  // Base mapping template: level pre-filled when adding (from the cluster's
  // matrix for this position's category), and an optional note (e.g. "this
  // mapping comes from the template; changing it detaches it").
  suggestedLevel?: number | null
  notice?: string | null
}

export function CompetencyLevelDialog({
  open,
  onOpenChange,
  competency,
  currentLevel,
  isEdit,
  onSubmit,
  suggestedLevel,
  notice,
}: CompetencyLevelDialogProps) {
  const t = useTranslations('AdminPositionCompetenciesDetailPage')
  const tc = useTranslations('Common')
  const [selectedLevel, setSelectedLevel] = useState<number | null>(currentLevel || null)
  const [levels, setLevels] = useState<Level[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedLevel(currentLevel || (!isEdit ? suggestedLevel ?? null : null))
      fetchLevels()
    }
  }, [open, currentLevel, suggestedLevel, isEdit])

  const fetchLevels = async () => {
    try {
      setIsLoading(true)
      const data = await levelAPI.getAll()
      // Sort by value ascending
      const sortedLevels = data.sort((a: Level, b: Level) => (a.value || 0) - (b.value || 0))
      setLevels(sortedLevels)
    } catch (error) {
      console.error("Failed to fetch levels:", error)
      toast.error(t('failedToLoadLevels'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedLevel === null) {
      toast.error(t('selectLevelRequired'))
      return
    }

    setIsSaving(true)
    try {
      await onSubmit(selectedLevel)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!competency) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? t('editCompetencyLevelTitle') : t('addCompetencyTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('setLevelDescription', { name: competency.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('competencyFieldLabel')}</Label>
              <div className="text-sm font-medium px-3 py-2 bg-muted rounded-md">
                {competency.name}
              </div>
              {competency.description && (
                <p className="text-xs text-muted-foreground">
                  {competency.description}
                </p>
              )}
            </div>
            {notice && (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{notice}</p>
            )}
            <div className="grid gap-2">
              <Label>{t('requiredLevelFieldLabel')}</Label>
              {!isEdit && suggestedLevel != null && (
                <p className="text-xs text-muted-foreground">{t('templateSuggestedLevel', { level: suggestedLevel })}</p>
              )}
              {isLoading ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  {t('loadingLevels')}
                </div>
              ) : levels.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                  {t('noLevelsFound')}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setSelectedLevel(level.value || 0)}
                      className={`
                        px-4 py-3 rounded-lg border-2 text-left transition-all
                        ${selectedLevel === level.value
                          ? "border-primary bg-primary text-primary-foreground font-semibold"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{level.name}</div>
                          {level.description && (
                            <div className="text-xs opacity-90 mt-1">
                              {level.description}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-bold ml-4">
                          {level.value}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
            <Button type="submit" disabled={isSaving || selectedLevel === null}>
              {isSaving ? tc('saving') : isEdit ? tc('update') : t('actionAdd')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
