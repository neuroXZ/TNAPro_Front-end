"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { assessmentAPI, trainingDemandAPI } from "@/lib/api";
import {
  IconAlertTriangle,
  IconDownload,
  IconBook,
  IconTrendingUp,
  IconUsers,
  IconChartBar,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TrainingDemandItem {
  trainingName: string;
  staffName: string;
  unitName: string;
  gap: number;
  triggerCompetency: string;
}

interface TrainingDemandReport {
  trainingId: string;
  trainingName: string;
  totalStaffCount: number;
  staffList: TrainingDemandItem[];
}

interface Assessment {
  id: string;
  name: string;
  createdAt?: string;
  endDate?: string;
}

const getGapColor = (
  gap: number
): { bg: string; text: string; badge: string } => {
  if (gap >= 2) return { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" };
  if (gap >= 1.5)
    return {
      bg: "bg-orange-50",
      text: "text-orange-700",
      badge: "bg-orange-100",
    };
  return { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" };
};

const getGapLabel = (gap: number): string => {
  if (gap >= 2) return "Critical Gap";
  if (gap >= 1.5) return "High Gap";
  return "Moderate Gap";
};

export default function TrainingDemandPage() {
  const t = useTranslations('AdminAnalyticsTrainingDemandPage');
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [demandData, setDemandData] = useState<TrainingDemandReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

  // Fetch assessments on mount
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoadingAssessments(true);
        const data = await assessmentAPI.getAll();
        
        // Sort assessments by createdAt descending (latest first)
        const sortedData = [...data].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setAssessments(sortedData);
        // Auto-select the latest assessment (first in the sorted list)
        if (sortedData.length > 0) {
          setSelectedAssessmentId(sortedData[0].id);
        }
      } catch (err) {
        toast.error("Failed to load assessments");
        console.error(err);
      } finally {
        setIsLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, []);

  // Fetch demand data when assessment is selected
  useEffect(() => {
    if (!selectedAssessmentId) return;

    const fetchDemandData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await trainingDemandAPI.generateReport(selectedAssessmentId);
        setDemandData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load training demand data";
        setError(errorMessage);
        toast.error(errorMessage);
        setDemandData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemandData();
  }, [selectedAssessmentId]);

  const handleExport = async () => {
    if (!selectedAssessmentId) return;

    try {
      setIsExporting(true);
      const response = await trainingDemandAPI.exportCsv(selectedAssessmentId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Training_Demand_${selectedAssessmentId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Report exported successfully");
    } catch (err) {
      toast.error("Failed to export report");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalStaffWithGap = demandData.reduce(
    (sum, training) => sum + training.totalStaffCount,
    0
  );
  const totalTrainingsRecommended = demandData.length;

  // Get top 5 trainings for preview
  const topTrainings = demandData.slice(0, 5);
  const maxStaffCount = Math.max(...demandData.map(t => t.totalStaffCount), 1);

  const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Assessment Selection Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('assessmentPeriodLabel')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAssessments ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex gap-3">
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('selectAssessmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleExport}
                disabled={isExporting || !selectedAssessmentId || demandData.length === 0}
                variant="outline"
                size="default"
              >
                <IconDownload className="w-4 h-4 mr-2" />
                {t('exportButton')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <>
          {demandData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <IconAlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{t('noTrainingDemandsTitle')}</h3>
                  <p className="text-muted-foreground">
                    {selectedAssessmentId
                      ? t('noTrainingDemandsForAssessment')
                      : t('noAssessmentSelected')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Training Demand Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <IconBook className="w-5 h-5" />
                        Training Demand
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Staff requiring training by program
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bar Chart Visualization */}
                  {topTrainings.length > 0 ? (
                    <div className="space-y-3">
                      {topTrainings.map((training, index) => (
                        <div key={training.trainingId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate pr-4">
                              {training.trainingName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                {training.totalStaffCount} staff
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {((training.totalStaffCount / maxStaffCount) * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                            <div
                              className="absolute h-full bg-primary transition-all duration-500 flex items-center justify-end pr-3"
                              style={{
                                width: `${(training.totalStaffCount / maxStaffCount) * 100}%`,
                              }}
                            >
                              {training.totalStaffCount > 0 && (
                                <span className="text-xs font-medium text-primary-foreground">
                                  {training.totalStaffCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No training demands identified
                    </div>
                  )}

                  <Separator />

                  {/* Summary Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <IconTrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">Total {totalTrainingsRecommended} trainings required</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on assessment: {selectedAssessment?.name}
                    </div>
                  </div>

                  {/* View Full Report Button */}
                  {demandData.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowFullReport(!showFullReport)}
                    >
                      <IconBook className="w-4 h-4 mr-2" />
                      {showFullReport ? "Hide Full Report" : "View Full Training Demand Report"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t('trainingsRequiredTitle')}
                      </CardTitle>
                      <IconChartBar className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalTrainingsRecommended}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('statTotalTrainingsDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t('statStaffRequiring')}
                      </CardTitle>
                      <IconUsers className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalStaffWithGap}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('statStaffRequiringDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t('statAvgGap')}
                      </CardTitle>
                      <IconTrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {(
                        demandData.reduce((sum, training) => {
                          const trainingGapSum = training.staffList.reduce(
                            (s, staff) => s + staff.gap,
                            0
                          );
                          return sum + trainingGapSum;
                        }, 0) / Math.max(totalStaffWithGap, 1)
                      ).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('statAvgGapDesc')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Full Report Details */}
              {showFullReport && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">{t('detailedRequirementsTitle')}</h2>
                  </div>
                  {demandData.map((training) => (
                    <Card key={training.trainingId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{training.trainingName}</CardTitle>
                            <CardDescription className="mt-1">
                              {training.totalStaffCount !== 1
                                ? t('staffRequireMultiple', { count: training.totalStaffCount })
                                : t('staffRequireSingle', { count: training.totalStaffCount })}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-base px-3 py-1">
                            {training.totalStaffCount}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {training.staffList.map((staff, idx) => (
                            <div
                              key={`${training.trainingId}-${idx}`}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{staff.staffName}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {staff.unitName} • {staff.triggerCompetency}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <Badge variant="outline" className="font-mono">
                                  {staff.gap.toFixed(2)}
                                </Badge>
                                <Badge
                                  variant={
                                    staff.gap >= 2
                                      ? "destructive"
                                      : staff.gap >= 1.5
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="min-w-[100px] justify-center"
                                >
                                  {staff.gap >= 2 ? t('gapCritical') : staff.gap >= 1.5 ? t('gapHigh') : t('gapModerate')}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
