import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CompetencyData } from "../types"
import { getScoreColor, getGapColor } from "../utils"

interface CompetencyTableProps {
  competencies: { [competencyId: string]: CompetencyData }
  clusterName?: string
}

export function CompetencyTable({ competencies, clusterName }: CompetencyTableProps) {
  const filteredEntries = Object.entries(competencies).filter(([, data]) =>
    clusterName ? data.competency.cluster?.name === clusterName : true
  )

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Competency</TableHead>
            <TableHead className="text-center">RCL</TableHead>
            <TableHead className="text-center">Self</TableHead>
            <TableHead className="text-center">Superior</TableHead>
            <TableHead className="text-center font-semibold">Total Score</TableHead>
            <TableHead className="text-center font-semibold">Gap</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map(
            ([competencyId, { competency, requiredLevel, scores, finalScore, gap }]) => (
              <TableRow key={competencyId}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {competency.cluster?.color && (
                      <div
                        className="size-3 rounded"
                        style={{ backgroundColor: competency.cluster.color }}
                      />
                    )}
                    {competency.name}
                  </div>
                </TableCell>
                <TableCell className="text-center">{requiredLevel || "-"}</TableCell>
                <TableCell className={`text-center ${getScoreColor(scores.self)}`}>
                  {scores.self?.toFixed(1) || "-"}
                </TableCell>
                <TableCell className={`text-center ${getScoreColor(scores.superior)}`}>
                  {scores.superior?.toFixed(1) || "-"}
                </TableCell>
                <TableCell className={`text-center ${getScoreColor(finalScore)}`}>
                  <Badge
                    variant={
                      finalScore && finalScore >= 4
                        ? "default"
                        : finalScore && finalScore >= 3
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {finalScore?.toFixed(2) || "-"}
                  </Badge>
                </TableCell>
                <TableCell className={`text-center ${getGapColor(gap)}`}>
                  {gap !== undefined ? gap.toFixed(2) : "-"}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  )
}
