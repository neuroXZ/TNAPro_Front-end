import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslations } from "next-intl"
import type { Assessment } from "../types"

interface WeightageCardProps {
  assessment: Assessment | null
}

export function WeightageCard({ assessment }: WeightageCardProps) {
  const t = useTranslations('AdminAssessmentDetailPage')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weightageTitle')}</CardTitle>
        <CardDescription>
          {t('weightageDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('selfAssessmentLabel')}</p>
            <p className="text-2xl font-bold">
              {assessment?.weightageSelf
                ? `${(assessment.weightageSelf * 100).toFixed(0)}%`
                : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('superiorAssessmentLabel')}</p>
            <p className="text-2xl font-bold">
              {assessment?.weightageSuperior
                ? `${(assessment.weightageSuperior * 100).toFixed(0)}%`
                : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
