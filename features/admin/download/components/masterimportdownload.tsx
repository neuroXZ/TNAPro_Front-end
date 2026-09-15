"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { IconDownload, IconUpload } from "@tabler/icons-react"
import { masterImportAPI } from "@/lib/api"
import { useTranslations } from "next-intl"
import { MasterImportDialog } from "@/features/admin/master-import/components/master-import-dialog"

export default function AdminMasterImportDownloadPage() {
  const t = useTranslations('AdminMasterImport')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true)
      const blob = await masterImportAPI.downloadTemplate()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'TNAPro_Master_Import_Template.xlsx'
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch {
      toast.error(t('downloadTemplateError'))
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl">{t('flowDescription')}</p>

      <ol className="max-w-2xl list-decimal space-y-1 pl-5">
        <li>{t('flowStep1')}</li>
        <li>{t('flowStep2')}</li>
        <li>{t('flowStep3')}</li>
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={handleDownloadTemplate} disabled={isDownloading}>
          <IconDownload className="mr-2 size-4" />
          {t('downloadTemplateBtn')}
        </Button>
        <Button onClick={() => setIsDialogOpen(true)}>
          <IconUpload className="mr-2 size-4" />
          {t('uploadImportBtn')}
        </Button>
      </div>

      <MasterImportDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onImportSuccess={() => {}}
      />
    </div>
  )
}
