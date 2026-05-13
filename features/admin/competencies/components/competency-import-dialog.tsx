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

interface CompetencyImportDialogProps {
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

export function CompetencyImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: CompetencyImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    try {
      setIsImporting(true)
      const result = await importAPI.import('competency', file)

      setImportResult(result.data)
      
      if (result.data.failureCount === 0) {
        toast.success(`Successfully imported ${result.data.successCount} competencies`)
        setTimeout(() => {
          onImportSuccess()
          handleClose()
        }, 2000)
      } else {
        toast.warning(
          `Import completed with ${result.data.successCount} successes and ${result.data.failureCount} failures`
        )
      }
    } catch (error: unknown) {
      console.error('Import error:', error)
      const message = error instanceof Error ? error.message : ''
      toast.error(message || 'Failed to import competencies')
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
          <DialogTitle>Import Competencies from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import competencies. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          {importResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">{importResult.totalRows}</div>
                  <div className="text-xs text-muted-foreground">Total Rows</div>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                    <IconCheck className="size-5" />
                    {importResult.successCount}
                  </div>
                  <div className="text-xs text-green-600">Successful</div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                    <IconAlertCircle className="size-5" />
                    {importResult.failureCount}
                  </div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <IconAlertCircle className="size-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Import Errors:</div>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          Row {error.rowIndex}: {error.message}
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
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
            >
              <IconUpload className="mr-2 size-4" />
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
