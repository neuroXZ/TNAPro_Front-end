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

interface Level {
  id: string
  name: string
  value: number
  description?: string
}

interface BulkLevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  isLoading: boolean
  onSubmit: (level: number) => Promise<void>
}

export function BulkLevelDialog({
  open,
  onOpenChange,
  count,
  isLoading,
  onSubmit,
}: BulkLevelDialogProps) {
  const t = useTranslations('AdminPositionCompetenciesDetailPage')
  const tc = useTranslations('Common')
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedLevel(null)
      fetchLevels()
    }
  }, [open])

  const fetchLevels = async () => {
    try {
      setIsFetching(true)
      const data = await levelAPI.getAll()
      // Sort by value ascending
      const sortedLevels = data.sort((a: Level, b: Level) => (a.value || 0) - (b.value || 0))
      setLevels(sortedLevels)
    } catch (error) {
      console.error("Failed to fetch levels:", error)
      toast.error(t('failedToLoadLevels'))
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedLevel === null) {
      toast.error(t('selectLevelRequired'))
      return
    }

    await onSubmit(selectedLevel)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('setLevelMultipleTitle')}</DialogTitle>
            <DialogDescription>
              {count === 1
                ? t('setLevelMultipleDescSingle', { count })
                : t('setLevelMultipleDescMultiple', { count })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('requiredLevelFieldLabel')}</Label>
              {isFetching ? (
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
              disabled={isLoading}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || selectedLevel === null}>
              {isLoading
                ? t('addingLabel')
                : count === 1
                  ? t('addCompetencyButtonSingle', { count })
                  : t('addCompetencyButtonMultiple', { count })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
