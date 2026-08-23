import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { IconTrash } from "@tabler/icons-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { assessmentResultAPI } from "@/lib/api"
import type { CompetencyData } from "../types"
import { getScoreColor, getGapColor } from "../utils"

interface CompetencyTableProps {
  competencies: { [competencyId: string]: CompetencyData }
  clusterName?: string
  onDataUpdate?: () => void
  staffId?: string
  staffName?: string
}

export function CompetencyTable({ competencies, clusterName, onDataUpdate, staffId, staffName }: CompetencyTableProps) {
  const t = useTranslations('AdminAssessmentDetailPage')
  const tc = useTranslations('Common')
  const typeLabel = (type: 'self' | 'superior' | null) => type === 'self' ? t('selfWord') : type === 'superior' ? t('superiorWord') : ''
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: 'self' | 'superior' | null
    competencyName: string
    resultId: string | null
    isBulk: boolean
  }>({
    open: false,
    type: null,
    competencyName: '',
    resultId: null,
    isBulk: false
  })

  const filteredEntries = Object.entries(competencies).filter(([, data]) =>
    clusterName ? data.competency.cluster?.name === clusterName : true
  )

  const handleDeleteClick = (type: 'self' | 'superior', competencyName: string, resultId: string | null) => {
    if (!resultId) {
      toast.error(t('noResultIdError'))
      return
    }
    setDeleteDialog({
      open: true,
      type,
      competencyName,
      resultId,
      isBulk: false
    })
  }

  const handleBulkDeleteClick = (type: 'self' | 'superior') => {
    const relevantScores = filteredEntries.filter(([, data]) => 
      type === 'self' ? data.scores.self : data.scores.superior
    )
    
    if (relevantScores.length === 0) {
      toast.error(t('noDataToDeleteError', { type: typeLabel(type) }))
      return
    }
    
    setDeleteDialog({
      open: true,
      type,
      competencyName: '',
      resultId: null,
      isBulk: true
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.isBulk) {
        // Bulk delete all self or superior assessments for this staff
        const resultIds = filteredEntries
          .map(([, data]) => deleteDialog.type === 'self' ? data.resultIds.self : data.resultIds.superior)
          .filter(Boolean) as string[]
        
        if (resultIds.length === 0) {
          toast.error(t('noDataToDeleteError', { type: typeLabel(deleteDialog.type) }))
          return
        }

        // Delete all results in parallel
        await Promise.all(resultIds.map(id => assessmentResultAPI.delete(id)))
        toast.success(t('bulkDeleteSuccess', { type: typeLabel(deleteDialog.type), count: resultIds.length }))
      } else {
        // Single delete
        if (!deleteDialog.resultId) return
        await assessmentResultAPI.delete(deleteDialog.resultId)
        toast.success(t('singleDeleteSuccess', { type: typeLabel(deleteDialog.type) }))
      }

      setDeleteDialog({ open: false, type: null, competencyName: '', resultId: null, isBulk: false })

      // Trigger data refresh if callback provided
      if (onDataUpdate) {
        onDataUpdate()
      }
    } catch (error) {
      toast.error(t('bulkDeleteFailed', { type: typeLabel(deleteDialog.type) }))
      console.error(error)
    }
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">{t('colCompetency')}</TableHead>
            <TableHead className="text-center">{t('colRcl')}</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-2">
                {t('colSelf')}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => handleBulkDeleteClick('self')}
                  title={t('deleteAllSelfTitle')}
                >
                  <IconTrash className="size-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-2">
                {t('colSuperior')}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => handleBulkDeleteClick('superior')}
                  title={t('deleteAllSuperiorTitle')}
                >
                  <IconTrash className="size-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead className="text-center font-semibold">{t('colTotalScore')}</TableHead>
            <TableHead className="text-center font-semibold">{t('colGap')}</TableHead>
            <TableHead className="text-center">{tc('actions')}</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {filteredEntries.map(
              ([competencyId, { competency, requiredLevel, scores, resultIds, finalScore, gap }]) => (
                <TableRow key={competencyId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {competency.cluster?.color && (
                        <div
                          className="size-3 rounded"
                          style={{ backgroundColor: competency.cluster.color }}
                        />
                      )}
                      {competency.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{requiredLevel || "-"}</TableCell>
                  <TableCell className={`text-center ${getScoreColor(scores.self)}`}>
                    {scores.self?.toFixed(1) || "-"}
                  </TableCell>
                  <TableCell className={`text-center ${getScoreColor(scores.superior)}`}>
                    {scores.superior?.toFixed(1) || "-"}
                  </TableCell>
                  <TableCell className={`text-center ${getScoreColor(finalScore)}`}>
                    
                      {finalScore?.toFixed(2) || "-"}
                    
                  </TableCell>
                  <TableCell className={`text-center`}>
                    <Badge
                      variant="outline" className= {`${getGapColor(gap)}`}
                    >
                    {gap !== undefined ? gap.toFixed(2) : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    
                    <div className="flex items-center justify-center gap-1">
                      {scores.self && scores.superior ? (
                        <span className="text-xs text-green-600 font-medium">{t('statusComplete')}</span>
                      ) : scores.self || scores.superior ? (
                        <span className="text-xs text-yellow-500 font-medium">{t('statusInProgress')}</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">{t('statusIncomplete')}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.isBulk ? t('bulkDeleteDialogTitle') : t('deleteDialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.isBulk
                ? t('bulkDeleteConfirmMsg', { type: typeLabel(deleteDialog.type), name: staffName || t('thisStaffMemberFallback') })
                : t('singleDeleteConfirmMsg', { type: typeLabel(deleteDialog.type), competency: deleteDialog.competencyName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDialog.isBulk ? t('deleteAllButtonLabel', { type: typeLabel(deleteDialog.type) }) : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
