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
      toast.error("Cannot delete - no assessment result ID found")
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
      toast.error(`No ${type} assessment data found to delete`)
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
          toast.error('No assessment data found to delete')
          return
        }

        // Delete all results in parallel
        await Promise.all(resultIds.map(id => assessmentResultAPI.delete(id)))
        toast.success(`All ${deleteDialog.type} assessment data deleted successfully (${resultIds.length} records)`)
      } else {
        // Single delete
        if (!deleteDialog.resultId) return
        await assessmentResultAPI.delete(deleteDialog.resultId)
        toast.success(`${deleteDialog.type === 'self' ? 'Self' : 'Superior'} assessment deleted successfully`)
      }
      
      setDeleteDialog({ open: false, type: null, competencyName: '', resultId: null, isBulk: false })
      
      // Trigger data refresh if callback provided
      if (onDataUpdate) {
        onDataUpdate()
      }
    } catch (error) {
      toast.error(`Failed to delete ${deleteDialog.type} assessment data`)
      console.error(error)
    }
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Competency</TableHead>
            <TableHead className="text-center">RCL</TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-2">
                Self
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => handleBulkDeleteClick('self')}
                  title="Delete all Self assessments for this staff"
                >
                  <IconTrash className="size-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="flex items-center justify-center gap-2">
                Superior
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => handleBulkDeleteClick('superior')}
                  title="Delete all Superior assessments for this staff"
                >
                  <IconTrash className="size-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead className="text-center font-semibold">Total Score</TableHead>
            <TableHead className="text-center font-semibold">Gap</TableHead>
            <TableHead className="text-center">Actions</TableHead>
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
                    <Badge
                      variant="default"
                    >
                      {finalScore?.toFixed(2) || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-center ${getGapColor(gap)}`}>
                    {gap !== undefined ? gap.toFixed(2) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {scores.self && scores.superior ? (
                        <span className="text-xs text-green-600 font-medium">Complete</span>
                      ) : scores.self || scores.superior ? (
                        <span className="text-xs text-yellow-500 font-medium">In Progress</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Incomplete</span>
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
              {deleteDialog.isBulk ? 'Bulk Delete Assessment Data' : 'Delete Assessment Data'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.isBulk ? (
                <>
                  Are you sure you want to delete <strong>ALL {deleteDialog.type}</strong> assessment data for{" "}
                  <strong>{staffName || 'this staff member'}</strong>? This will remove all {deleteDialog.type} scores 
                  across all competencies. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete the <strong>{deleteDialog.type}</strong> assessment data for{" "}
                  <strong>{deleteDialog.competencyName}</strong>? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDialog.isBulk ? `Delete All ${deleteDialog.type?.charAt(0).toUpperCase()}${deleteDialog.type?.slice(1)}` : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
