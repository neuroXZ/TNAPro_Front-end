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

interface GradeImportDialogProps {
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

export function GradeImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: GradeImportDialogProps) {
  const t = useTranslations('AdminGradesPage')
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
      toast.error(t('selectFileError'))
      return
    }

    try {
      setIsImporting(true)
      const result = await importAPI.import('grade', file)

      setImportResult(result.data)
      
      if (result.data.failureCount === 0) {
        toast.success(t('importSuccess', { count: result.data.successCount }))
        setTimeout(() => {
          onImportSuccess()
          handleClose()
        }, 2000)
      } else {
        toast.warning(
          t('importPartial', { success: result.data.successCount, failure: result.data.failureCount })
        )
      }
    } catch (error: unknown) {
      console.error('Import error:', error)
      const message = error instanceof Error ? error.message : ''
      toast.error(message || t('importFailedDefault'))
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
                {t('selectedFileLabel', { fileName: file.name })}
              </p>
            )}
          </div>

          {importResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">{importResult.totalRows}</div>
                  <div className="text-xs text-muted-foreground">{tc('totalRows')}</div>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                    <IconCheck className="size-5" />
                    {importResult.successCount}
                  </div>
                  <div className="text-xs text-green-600">{tc('successful')}</div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                    <IconAlertCircle className="size-5" />
                    {importResult.failureCount}
                  </div>
                  <div className="text-xs text-red-600">{tc('failedCount')}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <IconAlertCircle className="size-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">{tc('importErrors')}</div>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          {t('importErrorRow', { row: error.rowIndex, message: error.message })}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
            >
              <IconUpload className="mr-2 size-4" />
              {isImporting ? tc('importing') : tc('import')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
