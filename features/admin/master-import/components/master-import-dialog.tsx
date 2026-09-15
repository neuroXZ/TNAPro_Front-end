"use client"

import { useState } from "react"
import axios from "axios"
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
import { masterImportAPI } from "@/lib/api"
import { useTranslations } from "next-intl"

interface MasterImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess: () => void
}

interface MasterImportSuccessResult {
  success: true
  countsByEntity: Record<string, number>
}

interface MasterImportFailureResult {
  success: false
  entity: string
  rowIndex: number
  message: string
}

export function MasterImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: MasterImportDialogProps) {
  const t = useTranslations('AdminMasterImport')
  const tc = useTranslations('Common')
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [successResult, setSuccessResult] = useState<MasterImportSuccessResult | null>(null)
  const [failureResult, setFailureResult] = useState<MasterImportFailureResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast.error(t('selectXlsxFile'))
        return
      }
      setFile(selectedFile)
      setSuccessResult(null)
      setFailureResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error(t('noFileSelected'))
      return
    }

    try {
      setIsImporting(true)
      setSuccessResult(null)
      setFailureResult(null)

      const result = await masterImportAPI.import(file)

      setSuccessResult({ success: true, countsByEntity: result.data })
      toast.success(t('importSuccessToast'))
      setTimeout(() => {
        onImportSuccess()
        handleClose()
      }, 2500)
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 422 && error.response.data?.data) {
        setFailureResult(error.response.data.data as MasterImportFailureResult)
        toast.error(t('importFailedToast'))
      } else {
        const message = axios.isAxiosError(error)
          ? (error.response?.data?.error || error.message)
          : error instanceof Error ? error.message : ''
        toast.error(message || t('importFailedToast'))
      }
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setSuccessResult(null)
    setFailureResult(null)
    setIsImporting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="master-import-file">{t('fieldLabel')}</Label>
            <Input
              id="master-import-file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                {t('selectedFile', { name: file.name })}
              </p>
            )}
          </div>

          {successResult && (
            <Alert className="border-green-200 bg-green-50">
              <IconCheck className="size-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold mb-2 text-green-700">{t('resultsCreatedTitle')}</div>
                <div className="space-y-1">
                  {Object.entries(successResult.countsByEntity).map(([entity, count]) => (
                    <div key={entity} className="text-sm flex justify-between">
                      <span className="capitalize">{entity}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {failureResult && (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">{t('resultsFailedTitle')}</div>
                <div className="text-sm">
                  {t('resultsFailedDetail', {
                    entity: failureResult.entity,
                    row: failureResult.rowIndex,
                    message: failureResult.message,
                  })}
                </div>
              </AlertDescription>
            </Alert>
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
