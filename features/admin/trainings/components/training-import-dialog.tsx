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
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react"
import { importAPI } from "@/lib/api"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface ImportResult {
  totalRows: number
  successCount: number
  failureCount: number
  errors: Array<{
    rowIndex: number
    data: any
    message: string
  }>
}

interface TrainingImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function TrainingImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: TrainingImportDialogProps) {
  const t = useTranslations('AdminTrainingsPage')
  const tc = useTranslations('Common')
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
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
      const result = await importAPI.import('training', file)

      setImportResult(result.data)

      if (result.data.failureCount === 0) {
        toast.success(
          t('importSuccessMessage', { count: result.data.successCount })
        )
        onImportComplete()
      } else {
        toast.warning(
          t('importPartialMessage', { successCount: result.data.successCount, failureCount: result.data.failureCount })
        )
      }
    } catch (error: unknown) {
      console.error('Import error:', error)
      const message = error instanceof Error ? error.message : ''
      toast.error(message || t('importFailedMessage'))
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setImportResult(null)
    setIsImporting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
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
                {t('selectedFileInfo', { fileName: file.name, size: (file.size / 1024).toFixed(2) })}
              </p>
            )}
          </div>

          {importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-green-600" />
                <span className="font-medium">{t('importResultsLabel')}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600">
                    {importResult.totalRows}
                  </p>
                  <p className="text-sm text-muted-foreground">{tc('totalRows')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.successCount}
                  </p>
                  <p className="text-sm text-muted-foreground">{tc('successful')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-red-600">
                    {importResult.failureCount}
                  </p>
                  <p className="text-sm text-muted-foreground">{tc('failedCount')}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>{tc('importErrors')}</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <IconAlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{t('errorRowLabel', { rowIndex: error.rowIndex })}</strong> {error.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {importResult ? tc('close') : tc('cancel')}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={!file || isImporting}
              >
                {isImporting ? tc('importing') : tc('import')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
