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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assessmentAPI, competencyReportAPI } from "@/lib/api";
import {
  IconRefresh,
  IconAlertTriangle,
  IconChevronLeft,
  IconFileBarcode,
  IconDownload,
} from "@tabler/icons-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

// Breakdown dimension — item 11, NIISe JAP requirements (see
// DEVELOPER_NOTES.md). Grade/Negeri/Unit/Category share one response shape
// (Competency × group), Cluster is a flat aggregate (see below).
type Dimension = "grade" | "negeri" | "unit" | "category" | "cluster";

interface GroupedResult {
  groupLabel: string;
  averageGap: string | number;
  averageGapRatioPercent?: string;
}

interface CompetencyGapData {
  Competency: string;
  Results: GroupedResult[];
}

interface ClusterGapRow {
  Cluster: string;
  AverageGap: string | number;
  AverageGapRatioPercent?: string;
  competencyCount: number;
}

interface Assessment {
  id: string;
  name: string;
}

const getGapColor = (
  gap: number,
): { bg: string; text: string; badge: string } => {
  if (gap >= 0.75)
    return { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" };
  if (gap >= 0.5)
    return {
      bg: "bg-orange-50",
      text: "text-orange-700",
      badge: "bg-orange-100",
    };
  if (gap >= 0.25)
    return {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      badge: "bg-yellow-100",
    };
  return { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100" };
};

export default function CompetencyGapByGradePage() {
  const t = useTranslations('AdminAnalyticsCompetencyGapPage');
  const tc = useTranslations('Common');
  const { flags: featureFlags } = useFeatureFlags();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [dimension, setDimension] = useState<Dimension>("grade");
  const [data, setData] = useState<CompetencyGapData[]>([]);
  const [clusterData, setClusterData] = useState<ClusterGapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const assessmentsData = await assessmentAPI.getAll();
      setAssessments(assessmentsData || []);

      // Set first assessment as default
      if (assessmentsData && assessmentsData.length > 0) {
        setSelectedAssessmentId(assessmentsData[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
      setError(t('loadAssessmentsError'));
    }
  };

  useEffect(() => {
    if (selectedAssessmentId) {
      fetchGapData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssessmentId, dimension]);

  const fetchGapData = async () => {
    if (!selectedAssessmentId) return;

    setLoading(true);
    setError(null);

    try {
      if (dimension === "cluster") {
        const reportData = await competencyReportAPI.getGapByCluster(selectedAssessmentId);
        setClusterData(reportData || []);
        setData([]);
        setGroups([]);
      } else {
        const rawData =
          dimension === "grade"
            ? await competencyReportAPI.getGapByGrade(selectedAssessmentId)
            : dimension === "negeri"
              ? await competencyReportAPI.getGapByNegeri(selectedAssessmentId)
              : dimension === "category"
                ? await competencyReportAPI.getGapByCategory(selectedAssessmentId)
                : await competencyReportAPI.getGapByUnit(selectedAssessmentId);

        // Normalize: the by-Grade endpoint uses a `Grade` field (kept for
        // backward compat), by-Negeri/Unit use a generic `GroupLabel` — map
        // both onto one shape so this page has a single table to render.
        const normalized: CompetencyGapData[] = (rawData || []).map((item: any) => ({
          Competency: item.Competency,
          Results: item.Results.map((r: any) => ({
            groupLabel: r.Grade ?? r.GroupLabel,
            averageGap: r.AverageGap,
            averageGapRatioPercent: r.AverageGapRatioPercent,
          })),
        }));
        setData(normalized);
        setClusterData([]);

        const groupSet = new Set<string>();
        normalized.forEach((item) => {
          item.Results.forEach((result) => groupSet.add(result.groupLabel));
        });
        setGroups(Array.from(groupSet));
      }
    } catch (err) {
      console.error("Failed to fetch gap data:", err);
      setError(t('loadGapDataError'));
      setData([]);
      setClusterData([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const getGroupValue = (
    competency: CompetencyGapData,
    group: string,
  ): number | null => {
    const result = competency.Results.find((r) => r.groupLabel === group);
    return result ? parseFloat(result.averageGap.toString()) : null;
  };

  const getGroupRatioPercent = (
    competency: CompetencyGapData,
    group: string,
  ): string | null => {
    const result = competency.Results.find((r) => r.groupLabel === group);
    return result?.averageGapRatioPercent ?? null;
  };

  const calculateAverageGap = (competency: CompetencyGapData): number => {
    if (competency.Results.length === 0) return 0;
    const sum = competency.Results.reduce(
      (acc, result) => acc + parseFloat(result.averageGap.toString()),
      0,
    );
    return sum / competency.Results.length;
  };

  const handleExportCSV = async () => {
    if (!selectedAssessmentId) return;

    try {
      const response = await competencyReportAPI.exportCsv({
        assessmentId: selectedAssessmentId,
        dimension,
      });

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `CompetencyGap_${dimension}_${selectedAssessmentId}_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV Export Error:", error);
      toast.error(tc('exportFailed'));
    }
  };

  // =============================================================================

  const handleExportPDF = async () => {
    if (!selectedAssessmentId) return;

    try {
      const response = await competencyReportAPI.exportPdf({
        assessmentId: selectedAssessmentId,
        dimension,
      });

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `CompetencyGap_${dimension}_${selectedAssessmentId}_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error(tc('exportFailed'));
    }
  };

  const isEmpty = dimension === "cluster" ? clusterData.length === 0 : data.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <IconFileBarcode className="h-8 w-8" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('selectAssessmentTitle')}</CardTitle>
          <CardDescription>
            {t('selectAssessmentDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Select
            value={selectedAssessmentId}
            onValueChange={setSelectedAssessmentId}
          >
            <SelectTrigger className="w-full md:w-[300px]">
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
            onClick={fetchGapData}
            variant="outline"
            disabled={loading || !selectedAssessmentId}
            className="gap-2"
          >
            <IconRefresh
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            {t('refreshButton')}
          </Button>
        </CardContent>
      </Card>

      {/* Breakdown Dimension Tabs */}
      <Tabs value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
        <TabsList>
          <TabsTrigger value="grade">{t('dimensionGrade')}</TabsTrigger>
          {featureFlags.zonNegeri && (
            <TabsTrigger value="negeri">{t('dimensionNegeri')}</TabsTrigger>
          )}
          <TabsTrigger value="unit">{t('dimensionUnit')}</TabsTrigger>
          <TabsTrigger value="category">{t('dimensionCategory')}</TabsTrigger>
          <TabsTrigger value="cluster">{t('dimensionCluster')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('gapAnalysisTitle')}</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>
              {t('gapAnalysisSubtitle')}
            </span>

            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={handleExportCSV}>
                <IconDownload className="size-4 mr-2" />
                {t('exportCsv')}
              </Button>

              <Button variant="default" size="sm" onClick={handleExportPDF}>
                <IconDownload className="size-4 mr-2" />
                {t('exportPdf')}
              </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <IconFileBarcode className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {t('noGapData')}
              </p>
            </div>
          ) : dimension === "cluster" ? (
            <Card className="max-h-[500px] overflow-scroll">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">{t('colCluster')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('colCompetencyCount')}</TableHead>
                      <TableHead className="text-center font-semibold">{t('colAvgGap')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clusterData.map((row, idx) => {
                      const gapValue = parseFloat(row.AverageGap.toString());
                      const gapColor = getGapColor(gapValue);
                      return (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{row.Cluster}</TableCell>
                          <TableCell className="text-center">{row.competencyCount}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <Badge
                                variant="outline"
                                className={`${gapColor.badge} ${gapColor.text} border-0 font-semibold`}
                              >
                                {gapValue.toFixed(2)}
                              </Badge>
                              {featureFlags.gapRatio && row.AverageGapRatioPercent && (
                                <span className="text-xs text-muted-foreground">
                                  {row.AverageGapRatioPercent}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-h-[500px] overflow-scroll">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        {t('colCompetency')}
                      </TableHead>
                      {groups.map((group) => (
                        <TableHead
                          key={group}
                          className="text-center font-semibold"
                        >
                          {group}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold">
                        {t('colAvgGap')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((competency, idx) => {
                      const avgGap = calculateAverageGap(competency);
                      const gapColor = getGapColor(avgGap);

                      return (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {competency.Competency}
                          </TableCell>
                          {groups.map((group) => {
                            const gapValue = getGroupValue(competency, group);
                            const ratioPercent = getGroupRatioPercent(competency, group);

                            return (
                              <TableCell key={group} className="text-center">
                                {gapValue !== null ? (
                                  (() => {
                                    const color = getGapColor(gapValue);
                                    return (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <Badge
                                          variant="outline"
                                          className={`${color.badge} ${color.text} border-0`}
                                        >
                                          {gapValue.toFixed(2)}
                                        </Badge>
                                        {featureFlags.gapRatio && ratioPercent && (
                                          <span className="text-xs text-muted-foreground">
                                            {ratioPercent}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`${gapColor.badge} ${gapColor.text} border-0 font-semibold`}
                            >
                              {avgGap.toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {!isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('gapInterpTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  gap: 0.1,
                  labelKey: "gapMinimal" as const,
                  color: "bg-green-100",
                  textColor: "text-green-700",
                },
                {
                  gap: 0.5,
                  labelKey: "gapLow" as const,
                  color: "bg-yellow-100",
                  textColor: "text-yellow-700",
                },
                {
                  gap: 0.65,
                  labelKey: "gapMedium" as const,
                  color: "bg-orange-100",
                  textColor: "text-orange-700",
                },
                {
                  gap: 0.85,
                  labelKey: "gapHigh" as const,
                  color: "bg-red-100",
                  textColor: "text-red-700",
                },
              ].map((item) => (
                <div key={item.gap} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${item.color} ${item.textColor} border-0`}
                  >
                    {item.gap.toFixed(2)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {t(item.labelKey)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
