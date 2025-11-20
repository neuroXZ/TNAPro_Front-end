import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconCheck, IconX, IconFileTypePdf } from "@tabler/icons-react"
import { toast } from "sonner"
import type { StaffMemberWithResults, StaffCompetencyMatrix } from "../types"
import { CompetencyTable } from "./CompetencyTable"

interface StaffAccordionItemProps {
  staffMember: StaffMemberWithResults
  staffData?: StaffCompetencyMatrix[string]
}

export function StaffAccordionItem({ staffMember, staffData }: StaffAccordionItemProps) {
  const clusterNames = staffData
    ? Array.from(
        new Set(
          Object.values(staffData.competencies)
            .map((c) => c.competency.cluster?.name)
            .filter(Boolean)
        )
      )
    : []

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
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation()
                  toast.info("PDF export feature coming soon")
                }}
              >
                <IconFileTypePdf className="size-4" />
                Save PDF
              </Button>
            )}
            {staffMember.hasResults ? (
              <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                <IconCheck className="size-3" />
                Completed
              </Badge>
            ) : (
              <Badge className="gap-1 bg-red-600 hover:bg-red-700 text-white">
                <IconX className="size-3" />
                Incomplete
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        {staffData ? (
          <Tabs defaultValue="all-clusters" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="all-clusters">All</TabsTrigger>
              {clusterNames.map((clusterName) => (
                <TabsTrigger key={clusterName} value={clusterName || ""}>
                  {clusterName}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all-clusters">
              <CompetencyTable competencies={staffData.competencies} />
            </TabsContent>

            {clusterNames.map((clusterName) => (
              <TabsContent key={clusterName} value={clusterName || ""}>
                <CompetencyTable
                  competencies={staffData.competencies}
                  clusterName={clusterName}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="rounded-md border p-4 text-center text-muted-foreground">
            Assessment not yet completed
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
