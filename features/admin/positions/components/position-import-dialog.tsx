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
      const result = await importAPI.import('position', file)

      setImportResult(result.data)
      
      if (result.data.failureCount === 0) {
        toast.success(`Successfully imported ${result.data.successCount} positions`)
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
      toast.error(error.message || 'Failed to import positions')
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
          <DialogTitle>Import Positions from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import positions. Download the template first if you haven't already.
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
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
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
                  <p className="font-medium">Import Results:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Total Rows: {importResult.totalRows}</li>
                    <li>Successful: {importResult.successCount}</li>
                    <li>Failed: {importResult.failureCount}</li>
                  </ul>
                  
                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium mb-1">Errors:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, idx) => (
                          <p key={idx} className="text-xs">
                            Row {error.rowIndex}: {error.message}
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
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? (
                <>Importing...</>
              ) : (
                <>
                  <IconUpload className="mr-2 size-4" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
