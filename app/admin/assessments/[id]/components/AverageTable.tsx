import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getScoreColor, getGapColor, type CompetencyAverage } from "../utils"

interface AverageTableProps {
  averages: CompetencyAverage[]
}

export function AverageTable({ averages }: AverageTableProps) {
  if (averages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No completed assessments to calculate averages.
      </div>
    )
  }

  // Group by cluster
  const groupedByCluster = averages.reduce((acc, avg) => {
    if (!acc[avg.clusterName]) {
      acc[avg.clusterName] = {
        color: avg.clusterColor,
        items: []
      }
    }
    acc[avg.clusterName].items.push(avg)
    return acc
  }, {} as Record<string, { color?: string, items: CompetencyAverage[] }>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedByCluster).map(([clusterName, { color, items }]) => (
        <div key={clusterName} className="space-y-2">
          <div className="flex items-center gap-2">
            {color && (
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <h4 className="text-sm font-semibold">{clusterName}</h4>
            <Badge variant="outline" className="text-xs">
              {items.length} {items.length === 1 ? 'competency' : 'competencies'}
            </Badge>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competency</TableHead>
                  <TableHead className="text-center">Staff Count</TableHead>
                  <TableHead className="text-center">Avg RCL</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                  <TableHead className="text-center">Avg Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((avg) => (
                  <TableRow key={avg.competencyId}>
                    <TableCell className="font-medium">{avg.competencyName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{avg.staffCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{avg.averageRequiredLevel.toFixed(2)}</TableCell>
                    <TableCell className={`text-center ${getScoreColor(avg.averageScore)}`}>
                      {avg.averageScore.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-center ${getGapColor(avg.averageGap)}`}>
                      {avg.averageGap.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
