import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { IconCheck, IconX, IconSearch, IconChartBar, IconClock } from "@tabler/icons-react"
import type { StaffMemberWithResults, StaffCompetencyMatrix, Position } from "../types"
import { calculateAverages } from "../utils"
import { StaffAccordionItem } from "./StaffAccordionItem"
import { AverageTable } from "./AverageTable"

interface StaffListProps {
  allStaff: StaffMemberWithResults[]
  matrix: StaffCompetencyMatrix
  positions: Position[]
  onDataUpdate?: () => void
}

export function StaffList({ allStaff, matrix, positions, onDataUpdate }: StaffListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPosition, setSelectedPosition] = useState<string>("all")

  // Calculate averages for completed staff
  const averages = calculateAverages(matrix)

  // Filter staff based on search and position
  const filteredStaff = allStaff.filter((staffMember) => {
    const matchesSearch =
      staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staffMember.orgId?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPosition =
      selectedPosition === "all" || staffMember.positionId === selectedPosition
    return matchesSearch && matchesPosition
  })

  const completedCount = filteredStaff.filter((s) => s.hasResults).length
  const incompleteCount = filteredStaff.length - completedCount

  // Get unique positions for filter
  const uniquePositions = Array.from(
    new Set(
      allStaff
        .filter((s) => s.positionId)
        .map((s) => ({ id: s.positionId!, name: s.positionName }))
        .map((p) => JSON.stringify(p))
    )
  ).map((p) => JSON.parse(p))

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="all">All Staff ({filteredStaff.length})</TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <IconCheck className="size-3" />
            Complete ({(() => {
              return filteredStaff.filter(s => {
                const staffData = matrix[s.id]
                if (!staffData) return false
                const competencyEntries = Object.values(staffData.competencies || {})
                return competencyEntries.length > 0 && competencyEntries.every(
                  comp => comp.scores.self !== undefined && comp.scores.superior !== undefined
                )
              }).length
            })()})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <IconClock className="size-3" />
            In Progress/Incomplete ({incompleteCount})
          </TabsTrigger>
          <TabsTrigger value="average" className="gap-2">
            <IconChartBar className="size-3" />
            Average Statistics
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {uniquePositions.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="all" className="space-y-2">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No staff found.</div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {filteredStaff.map((staffMember) => (
              <StaffAccordionItem
                key={staffMember.id}
                staffMember={staffMember}
                staffData={matrix[staffMember.id]}
                onDataUpdate={onDataUpdate}
              />
            ))}
          </Accordion>
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-2">
        {(() => {
          const completeStaff = filteredStaff.filter(s => {
            const staffData = matrix[s.id]
            if (!staffData) return false
            const competencyEntries = Object.values(staffData.competencies || {})
            return competencyEntries.length > 0 && competencyEntries.every(
              comp => comp.scores.self !== undefined && comp.scores.superior !== undefined
            )
          })
          
          return completeStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No completed assessments yet.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {completeStaff.map((staffMember) => (
                <StaffAccordionItem
                  key={staffMember.id}
                  staffMember={staffMember}
                  staffData={matrix[staffMember.id]}
                  onDataUpdate={onDataUpdate}
                />
              ))}
            </Accordion>
          )
        })()}
      </TabsContent>

      <TabsContent value="pending" className="space-y-4">
        {incompleteCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All staff have completed their assessments!
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStaff
              .filter((s) => !s.hasResults)
              .map((staffMember) => (
                <div key={staffMember.id} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{staffMember.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {staffMember.orgId && `${staffMember.orgId} • `}
                        {staffMember.positionName}
                      </p>
                    </div>
                    <Badge className="gap-1 ml-4 bg-red-600 hover:bg-red-700 text-white">
                      <IconX className="size-3" />
                      Incomplete
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="average" className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <IconChartBar className="size-5 text-primary" />
            <h3 className="font-semibold">Competency Average Statistics</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Average scores and gaps calculated from {completedCount} completed staff {completedCount === 1 ? 'assessment' : 'assessments'}.
            Only staff with both Self and Superior assessments are included.
          </p>
        </div>
        <AverageTable averages={averages} />
      </TabsContent>
    </Tabs>
  )
}
