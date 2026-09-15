"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { executiveSummaryAPI, assessmentAPI } from "@/lib/api";
import {
  IconChevronLeft,
  IconRefresh,
  IconAlertTriangle,
  IconFileAnalytics,
  IconDownload,
  IconUsers,
  IconGauge,
  IconClipboardCheck,
  IconBook,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface Assessment {
  id: string;
  name: string;
}

interface TopCompetencyGap {
  competencyName: string;
  gap: number;
  gapRatioPercent: string;
  staffCount: number;
}

interface TopTrainingDemand {
  trainingName: string;
  totalStaffCount: number;
}

interface UnitPerformanceSnippet {
  label: string;
  value: number | null;
}

interface ExecutiveSummaryResponse {
  assessmentName: string | null;
  kpis: {
    totalStaff: number;
    totalUnits: number;
    overallReadinessPercent: number;
    submissionCompletionPercent: number;
    totalTrainingDemandCount: number;
  };
  topCompetencyGaps: TopCompetencyGap[];
  topTrainingDemand: TopTrainingDemand[];
  unitPerformance: UnitPerformanceSnippet[];
}

export default function ExecutiveSummaryPage() {
  const t = useTranslations("AdminAnalyticsExecutiveSummaryPage");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [summary, setSummary] = useState<ExecutiveSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assessmentAPI.getAll()
      .then((a) => {
        setAssessments(a || []);
        if (a && a.length > 0) setAssessmentId(a[0].id);
      })
      .catch(() => setError(t("errorLoadSelectors")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (assessmentId) fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const fetchSummary = async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await executiveSummaryAPI.getSummary(assessmentId);
      setSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || t("errorLoad"));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!assessmentId) return;
    setExporting(true);
    try {
      const response = await executiveSummaryAPI.exportPdf(assessmentId);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Executive_Summary_${assessmentId}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  };

  // Units with no scored staff anywhere in their subtree (value: null) are
  // excluded rather than sorted as if they scored 0 — otherwise units with
  // no data at all would always dominate "lowest-performing" over units
  // that have a real, calculated (if low) average.
  const worstUnits = summary?.unitPerformance
    ? summary.unitPerformance
        .filter((u): u is { label: string; value: number } => u.value !== null)
        .sort((a, b) => a.value - b.value)
        .slice(0, 5)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/analytics">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <IconFileAnalytics className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card className="rounded-3xl border-sky-100/80 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/30">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="w-full max-w-sm">
            <label className="text-sm font-medium mb-1 block">{t("labelAssessment")}</label>
            <Select value={assessmentId} onValueChange={setAssessmentId}>
              <SelectTrigger className="w-full bg-white dark:bg-slate-900"><SelectValue placeholder={t("placeholderAssessment")} /></SelectTrigger>
              <SelectContent>
                {assessments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="lg" className="gap-2 rounded-full px-6" onClick={handleExportPdf} disabled={!assessmentId || exporting}>
            <IconDownload className={`h-5 w-5 ${exporting ? "animate-bounce" : ""}`} />
            {exporting ? t("exporting") : t("downloadPdf")}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("kpiTotalStaff")}</CardTitle>
                <IconUsers className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{summary.kpis.totalStaff}</div></CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("kpiReadiness")}</CardTitle>
                <IconGauge className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{summary.kpis.overallReadinessPercent}%</div></CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("kpiSubmission")}</CardTitle>
                <IconClipboardCheck className="h-5 w-5 text-sky-600" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{summary.kpis.submissionCompletionPercent}%</div></CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("kpiTrainingDemand")}</CardTitle>
                <IconBook className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{summary.kpis.totalTrainingDemandCount}</div></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("topGapsTitle")}</CardTitle>
                <CardDescription>{t("topGapsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.topCompetencyGaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">{t("noGaps")}</p>
                ) : (
                  <div className="space-y-4">
                    {summary.topCompetencyGaps.map((g) => {
                      const magnitude = Math.min(100, Math.abs(g.gap) * 40);
                      return (
                        <div key={g.competencyName} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">{g.competencyName}</p>
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-0">{g.gap.toFixed(2)} ({g.gapRatioPercent})</Badge>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.max(magnitude, 6)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("topTrainingTitle")}</CardTitle>
                <CardDescription>{t("topTrainingDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.topTrainingDemand.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">{t("noTraining")}</p>
                ) : (
                  <div className="space-y-4">
                    {summary.topTrainingDemand.map((tr) => {
                      const highest = summary.topTrainingDemand[0]?.totalStaffCount || 1;
                      const width = Math.max((tr.totalStaffCount / highest) * 100, 10);
                      return (
                        <div key={tr.trainingName} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">{tr.trainingName}</p>
                            <Badge variant="secondary">{tr.totalStaffCount}</Badge>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("lowestUnitsTitle")}</CardTitle>
              <CardDescription>{t("lowestUnitsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {worstUnits.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t("noUnitData")}</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-5">
                  {worstUnits.map((u) => (
                    <div key={u.label} className="rounded-xl border p-3 text-center">
                      <div className="text-xl font-bold">{u.value.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate" title={u.label}>{u.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
