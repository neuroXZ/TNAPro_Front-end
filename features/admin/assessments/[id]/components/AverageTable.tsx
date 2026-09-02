import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { getScoreColor, getGapColor, type CompetencyAverage } from "../utils"

interface AverageTableProps {
  averages: CompetencyAverage[]
}

export function AverageTable({ averages }: AverageTableProps) {
  const t = useTranslations('AdminAssessmentDetailPage')
  const { flags: featureFlags } = useFeatureFlags()

  if (averages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('noAveragesData')}
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
              {items.length} {items.length === 1 ? t('competencySingular') : t('competenciesPlural')}
            </Badge>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colCompetency')}</TableHead>
                  <TableHead className="text-center">{t('colStaffCount')}</TableHead>
                  <TableHead className="text-center">{t('colAvgRcl')}</TableHead>
                  <TableHead className="text-center">{t('colAvgScore')}</TableHead>
                  <TableHead className="text-center">{t('colAvgGap')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((avg) => (
                  <TableRow key={avg.competencyId}>
                    <TableCell className="font-medium">{avg.competencyName}</TableCell>
                    <TableCell className="text-center">
                      {avg.staffCount}
                    </TableCell>
                    <TableCell className="text-center">{avg.averageRequiredLevel.toFixed(2)}</TableCell>
                    <TableCell className={`text-center ${getScoreColor(avg.averageScore)}`}>
                      {avg.averageScore.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-center ${getGapColor(avg.averageGap)}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{avg.averageGap.toFixed(2)}</span>
                        {featureFlags.gapRatio && avg.averageGapRatioPercent && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {avg.averageGapRatioPercent}
                          </span>
                        )}
                      </div>
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
