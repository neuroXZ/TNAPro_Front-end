import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconCheck, IconX, IconFileTypePdf, IconFileTypeCsv, IconClock } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import type { StaffMemberWithResults, StaffCompetencyMatrix } from "../types"
import { CompetencyTable } from "./CompetencyTable"
import { cgaAPI } from "@/lib/api"

interface StaffAccordionItemProps {
  staffMember: StaffMemberWithResults
  staffData?: StaffCompetencyMatrix[string]
  assessmentId: string
  onDataUpdate?: () => void
}

export function StaffAccordionItem({ staffMember, staffData, assessmentId, onDataUpdate }: StaffAccordionItemProps) {
  const t = useTranslations('AdminAssessmentDetailPage')
  const clusterNames = staffData
    ? Array.from(
        new Set(
          Object.values(staffData.competencies)
            .map((c) => c.competency.cluster?.name)
            .filter(Boolean)
        )
      )
    : []

  const handleExportCSV = async () => {
    try {
      const response = await cgaAPI.exportCsv({
        staffId: staffMember.id,
        assessmentId: assessmentId
      });
      
      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CGA_Report_${staffMember.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(t('exportCsvSuccess'));
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error(t('exportCsvFailed'));
    }
  };

  return (
    <AccordionItem
      key={staffMember.id}
      value={staffMember.id}
      className="rounded-md border px-4"
    >
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-left">{staffMember.name}</h3>
            <p className="text-sm text-muted-foreground text-left">
              {staffMember.orgId && `${staffMember.orgId} • `}
              {staffMember.positionName}
            </p>
          </div>
          <div className="flex items-center gap-2 mr-4">
            {staffMember.hasResults && (
              <>
                <div
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3 gap-1.5 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExportCSV()
                  }}
                >
                  <IconFileTypeCsv className="size-4" />
                  {t('exportCsvButton')}
                </div>
                <div
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3 gap-1.5 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    toast.info(t('pdfComingSoon'))
                  }}
                >
                  <IconFileTypePdf className="size-4" />
                  {t('savePdfButton')}
                </div>
              </>
            )}
            {(() => {
              if (!staffMember.hasResults) {
                return (
                  <Badge className="gap-1 bg-red-600 hover:bg-red-700 text-white">
                    <IconX className="size-3" />
                    {t('statusIncomplete')}
                  </Badge>
                )
              }

              // Check if all competencies have both self and superior scores
              const competencyEntries = Object.values(staffData?.competencies || {})
              const allComplete = competencyEntries.length > 0 && competencyEntries.every(
                (comp) => comp.scores.self !== undefined && comp.scores.superior !== undefined
              )

              if (allComplete) {
                return (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                    <IconCheck className="size-3" />
                    {t('statusComplete')}
                  </Badge>
                )
              } else {
                return (
                  <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white">
                    <IconClock className="size-3" />
                    {t('statusInProgress')}
                  </Badge>
                )
              }
            })()}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        {staffData ? (
          <Tabs defaultValue="all-clusters" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="all-clusters">{t('allClustersTab')}</TabsTrigger>
              {clusterNames.map((clusterName) => (
                <TabsTrigger key={clusterName} value={clusterName || ""}>
                  {clusterName}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all-clusters">
              <CompetencyTable 
                competencies={staffData.competencies} 
                onDataUpdate={onDataUpdate}
                staffId={staffMember.id}
                staffName={staffMember.name}
              />
            </TabsContent>

            {clusterNames.map((clusterName) => (
              <TabsContent key={clusterName} value={clusterName || ""}>
                <CompetencyTable
                  competencies={staffData.competencies}
                  clusterName={clusterName}
                  onDataUpdate={onDataUpdate}
                  staffId={staffMember.id}
                  staffName={staffMember.name}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="rounded-md border p-4 text-center text-muted-foreground">
            {t('notYetCompleted')}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
