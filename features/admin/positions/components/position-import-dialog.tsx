"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconUpload, IconAlertCircle, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"
import { importAPI } from "@/lib/api"
import { useTranslations } from "next-intl"

interface PositionImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess: () => void
}

interface ImportResult {
  totalRows: number
  successCount: number
  failureCount: number
  errors: Array<{
    rowIndex: number
    message: string
  }>
}

export function PositionImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: PositionImportDialogProps) {
  const t = useTranslations('AdminPositionsPage')
  const tc = useTranslations('Common')
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error(tc('selectCsvFile'))
        return
      }
      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error(tc('selectCsvFile'))
      return
    }

    try {
      setIsImporting(true)
      const result = await importAPI.import('position', file)

      setImportResult(result.data)

      if (result.data.failureCount === 0) {
        toast.success(t('importSuccessToast', { count: result.data.successCount, entity: t('entityNamePlural') }))
        setTimeout(() => {
          onImportSuccess()
          handleClose()
        }, 2000)
      } else {
        toast.warning(
          t('importWarningToast', { success: result.data.successCount, failure: result.data.failureCount })
        )
      }
    } catch (error: unknown) {
      console.error('Import error:', error)
      const message = error instanceof Error ? error.message : ''
      toast.error(message || t('importErrorToast', { entity: t('entityNamePlural') }))
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setImportResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('importDialogTitle', { entity: t('entityNamePluralCap') })}</DialogTitle>
          <DialogDescription>
            {t('importDialogDescription', { entity: t('entityNamePlural') })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">{t('csvFileLabel')}</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                {t('selectedFileInfo', { fileName: file.name, fileSize: (file.size / 1024).toFixed(2) })}
              </p>
            )}
          </div>

          {importResult && (
            <Alert variant={importResult.failureCount > 0 ? "destructive" : "default"}>
              {importResult.failureCount > 0 ? (
                <IconAlertCircle className="h-4 w-4" />
              ) : (
                <IconCheck className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{t('importResultsTitle')}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{tc('totalRows')}: {importResult.totalRows}</li>
                    <li>{tc('successful')}: {importResult.successCount}</li>
                    <li>{tc('failedCount')}: {importResult.failureCount}</li>
                  </ul>

                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium mb-1">{tc('importErrors')}</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, idx) => (
                          <p key={idx} className="text-xs">
                            {t('importRowError', { row: error.rowIndex, message: error.message })}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? (
                <>{tc('importing')}</>
              ) : (
                <>
                  <IconUpload className="mr-2 size-4" />
                  {tc('import')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
