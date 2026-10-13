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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { assessmentAPI, staffAPI, comparisonAPI } from "@/lib/api";
import {
  IconChevronLeft,
  IconRefresh,
  IconAlertTriangle,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconSparkles,
  IconDownload,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Trend = "improved" | "declined" | "no_change" | "new" | "not_assessed" | "first_assessment" | "not_applicable";

interface CompetencyScore {
  selfScore: number | null;
  superiorScore: number | null;
  weightedScore: number | null;
}

interface CompetencyComparison {
  competencyId: string;
  competencyName: string;
  appearsIn: "both" | "assessment1_only" | "assessment2_only";
  assessment1: CompetencyScore | null;
  assessment2: CompetencyScore | null;
  change: { selfChange: number | null; superiorChange: number | null; weightedChange: number | null; weightageWarning: boolean } | null;
  trend: Trend;
}

interface StaffComparisonResponse {
  staffId: string;
  staffName: string | null;
  assessment1: { id: string; name: string | null; startDate: string | null; endDate: string | null };
  assessment2: { id: string; name: string | null; startDate: string | null; endDate: string | null };
  structuralChanges: { positionChanged: boolean; position1: string | null; position2: string | null; unitChanged: boolean; unit1: string | null; unit2: string | null };
  competencyComparison: CompetencyComparison[];
  generatedAt: string;
}

function trendBadge(trend: Trend, t: (k: string) => string) {
  const map: Record<Trend, { label: string; className: string; icon: React.ReactNode }> = {
    improved:         { label: t("trendImproved"),        className: "bg-green-100 text-green-800",  icon: <IconArrowUp size={12} /> },
    declined:         { label: t("trendDeclined"),        className: "bg-red-100 text-red-800",     icon: <IconArrowDown size={12} /> },
    no_change:        { label: t("trendNoChange"),        className: "bg-gray-100 text-gray-700",   icon: <IconMinus size={12} /> },
    new:              { label: t("trendNew"),             className: "bg-blue-100 text-blue-800",   icon: <IconSparkles size={12} /> },
    not_assessed:     { label: t("trendNotAssessed"),     className: "bg-gray-100 text-gray-500",   icon: <IconMinus size={12} /> },
    first_assessment: { label: t("trendFirstAssessment"), className: "bg-purple-100 text-purple-700", icon: <IconSparkles size={12} /> },
    not_applicable:   { label: t("trendNotApplicable"),   className: "bg-gray-100 text-gray-500",   icon: <IconMinus size={12} /> },
  };
  const { label, className, icon } = map[trend] ?? map.not_applicable;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {icon}{label}
    </span>
  );
}

function formatScore(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  return val.toFixed(2);
}

function changeCell(val: number | null | undefined) {
  if (val === null || val === undefined) return <span className="text-muted-foreground">—</span>;
  const color = val > 0 ? "text-green-600" : val < 0 ? "text-red-600" : "text-muted-foreground";
  const prefix = val > 0 ? "+" : "";
  return <span className={`font-medium ${color}`}>{prefix}{val.toFixed(2)}</span>;
}

export default function StaffComparisonPage() {
  const t = useTranslations("AdminAnalyticsStaffComparisonPage");
  const tc = useTranslations("Common");

  const [assessments, setAssessments] = useState<{ id: string; name: string }[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [assessment1, setAssessment1] = useState("");
  const [assessment2, setAssessment2] = useState("");
  const [result, setResult] = useState<StaffComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([assessmentAPI.getAll(), staffAPI.getAll()])
      .then(([a, s]) => {
        setAssessments(a || []);
        setStaffList(s || []);
      })
      .catch(() => setError(t("errorLoadSelectors")));
  }, []);

  const canCompare = selectedStaff && assessment1 && assessment2 && assessment1 !== assessment2;

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    if (!canCompare) return;
    try {
      const response = await comparisonAPI.exportStaffCsv({ staffId: selectedStaff, assessmentId1: assessment1, assessmentId2: assessment2 });
      downloadBlob(response.data, `Comparison_Staff_${selectedStaff}_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error(tc("exportFailed"));
    }
  };

  const handleExportPdf = async () => {
    if (!canCompare) return;
    try {
      const response = await comparisonAPI.exportStaffPdf({ staffId: selectedStaff, assessmentId1: assessment1, assessmentId2: assessment2 });
      downloadBlob(response.data, `Comparison_Staff_${selectedStaff}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error(tc("exportFailed"));
    }
  };

  const handleCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await comparisonAPI.compareByStaff({ staffId: selectedStaff, assessmentId1: assessment1, assessmentId2: assessment2 });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || t("errorCompare"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Back */}
      <div className="mb-4">
        <Link href="/admin/analytics/comparisons">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <IconChevronLeft size={16} />
            {t("backToComparisons")}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Selectors */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("selectionTitle")}</CardTitle>
          <CardDescription>{t("selectionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("labelStaff")}</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger><SelectValue placeholder={t("placeholderStaff")} /></SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name || s.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("labelAssessment1")}</label>
              <Select value={assessment1} onValueChange={setAssessment1}>
                <SelectTrigger><SelectValue placeholder={t("placeholderAssessment")} /></SelectTrigger>
                <SelectContent>
                  {assessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name || a.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("labelAssessment2")}</label>
              <Select value={assessment2} onValueChange={setAssessment2}>
                <SelectTrigger><SelectValue placeholder={t("placeholderAssessment")} /></SelectTrigger>
                <SelectContent>
                  {assessments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name || a.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {assessment1 && assessment2 && assessment1 === assessment2 && (
            <p className="text-sm text-red-500 mt-2">{t("errorSameAssessment")}</p>
          )}
          <div className="mt-4">
            <Button onClick={handleCompare} disabled={!canCompare || loading} className="gap-2">
              <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
              {loading ? t("comparing") : t("compareButton")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <IconAlertTriangle size={16} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Staff info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("staffInfoTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm text-muted-foreground">{t("staff")}: </span>
                  <span className="font-medium">{result.staffName || result.staffId}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t("generatedAt")}: </span>
                  <span className="font-medium">{new Date(result.generatedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Structural changes */}
              {(result.structuralChanges.positionChanged || result.structuralChanges.unitChanged) && (
                <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                  <p className="font-semibold mb-1">{t("structuralChangesTitle")}</p>
                  {result.structuralChanges.positionChanged && (
                    <p>{t("positionChanged")}: <span className="font-medium">{result.structuralChanges.position1}</span> → <span className="font-medium">{result.structuralChanges.position2}</span></p>
                  )}
                  {result.structuralChanges.unitChanged && (
                    <p>{t("unitChanged")}: <span className="font-medium">{result.structuralChanges.unit1}</span> → <span className="font-medium">{result.structuralChanges.unit2}</span></p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competency comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("competencyTableTitle")}</CardTitle>
              <CardDescription className="flex items-center justify-between gap-4">
                <span>
                  {t('comparisonSubtitle', { name1: result.assessment1.name || result.assessment1.id, name2: result.assessment2.name || result.assessment2.id })}
                </span>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleExportCsv}>
                    <IconDownload className="size-4 mr-2" />
                    {t('exportCsv')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPdf}>
                    <IconDownload className="size-4 mr-2" />
                    {t('exportPdf')}
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">{t("colCompetency")}</TableHead>
                      <TableHead className="text-center" colSpan={3}>{result.assessment1.name || t("assessment1")}</TableHead>
                      <TableHead className="text-center" colSpan={3}>{result.assessment2.name || t("assessment2")}</TableHead>
                      <TableHead className="text-center">{t("colChange")}</TableHead>
                      <TableHead>{t("colTrend")}</TableHead>
                    </TableRow>
                    <TableRow className="text-xs text-muted-foreground">
                      <TableHead />
                      <TableHead className="text-center">{t("scoreSelf")}</TableHead>
                      <TableHead className="text-center">{t("scoreSuperior")}</TableHead>
                      <TableHead className="text-center">{t("scoreWeighted")}</TableHead>
                      <TableHead className="text-center">{t("scoreSelf")}</TableHead>
                      <TableHead className="text-center">{t("scoreSuperior")}</TableHead>
                      <TableHead className="text-center">{t("scoreWeighted")}</TableHead>
                      <TableHead className="text-center">{t("scoreWeighted")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.competencyComparison.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {t("noCompetencies")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      result.competencyComparison.map((c) => (
                        <TableRow key={c.competencyId}>
                          <TableCell className="font-medium">{c.competencyName}</TableCell>
                          <TableCell className="text-center text-sm">{formatScore(c.assessment1?.selfScore)}</TableCell>
                          <TableCell className="text-center text-sm">{formatScore(c.assessment1?.superiorScore)}</TableCell>
                          <TableCell className="text-center text-sm font-medium">{formatScore(c.assessment1?.weightedScore)}</TableCell>
                          <TableCell className="text-center text-sm">{formatScore(c.assessment2?.selfScore)}</TableCell>
                          <TableCell className="text-center text-sm">{formatScore(c.assessment2?.superiorScore)}</TableCell>
                          <TableCell className="text-center text-sm font-medium">{formatScore(c.assessment2?.weightedScore)}</TableCell>
                          <TableCell className="text-center">{changeCell(c.change?.weightedChange)}</TableCell>
                          <TableCell>{trendBadge(c.trend, t)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
