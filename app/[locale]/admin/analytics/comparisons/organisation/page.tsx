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
import { assessmentAPI, comparisonAPI } from "@/lib/api";
import {
  IconChevronLeft,
  IconRefresh,
  IconAlertTriangle,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconSparkles,
  IconUsers,
  IconUserPlus,
  IconUserMinus,
  IconArrowsTransferUp,
  IconBuilding,
  IconDownload,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

type Trend = "improved" | "declined" | "no_change" | "new" | "not_assessed" | "first_assessment" | "not_applicable";
type UnitStatus = "compared" | "new_in_assessment2" | "dissolved" | "no_participation";

interface CompetencyScore {
  selfScore: number | null;
  superiorScore: number | null;
  weightedScore: number | null;
}

interface CompetencyComparison {
  competencyId: string;
  competencyName: string;
  assessment1: CompetencyScore | null;
  assessment2: CompetencyScore | null;
  change: { weightedChange: number | null } | null;
  trend: Trend;
}

interface UnitBreakdownEntry {
  unitId: string;
  unitName: string | null;
  unitStatus: UnitStatus;
  staffCount1: number;
  staffCount2: number;
  competencyComparison: CompetencyComparison[];
}

interface OrgComparisonResponse {
  assessment1: { id: string; name: string | null };
  assessment2: { id: string; name: string | null };
  organisationSummary: { totalStaffCompared: number; totalNewMembers: number; totalLeft: number; totalTransferred: number; totalNoParticipation: number };
  competencyComparison: CompetencyComparison[];
  unitBreakdown: UnitBreakdownEntry[];
  generatedAt: string;
}

function trendBadge(trend: Trend, t: (k: string) => string) {
  const map: Record<Trend, { label: string; className: string; icon: React.ReactNode }> = {
    improved:         { label: t("trendImproved"),        className: "bg-green-100 text-green-800",    icon: <IconArrowUp size={12} /> },
    declined:         { label: t("trendDeclined"),        className: "bg-red-100 text-red-800",        icon: <IconArrowDown size={12} /> },
    no_change:        { label: t("trendNoChange"),        className: "bg-gray-100 text-gray-700",      icon: <IconMinus size={12} /> },
    new:              { label: t("trendNew"),             className: "bg-blue-100 text-blue-800",      icon: <IconSparkles size={12} /> },
    not_assessed:     { label: t("trendNotAssessed"),     className: "bg-gray-100 text-gray-500",      icon: <IconMinus size={12} /> },
    first_assessment: { label: t("trendFirstAssessment"), className: "bg-purple-100 text-purple-700",  icon: <IconSparkles size={12} /> },
    not_applicable:   { label: t("trendNotApplicable"),   className: "bg-gray-100 text-gray-500",      icon: <IconMinus size={12} /> },
  };
  const { label, className, icon } = map[trend] ?? map.not_applicable;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {icon}{label}
    </span>
  );
}

function unitStatusBadge(status: UnitStatus, t: (k: string) => string) {
  const map: Record<UnitStatus, string> = {
    compared:           "bg-green-100 text-green-800",
    new_in_assessment2: "bg-blue-100 text-blue-800",
    dissolved:          "bg-red-100 text-red-800",
    no_participation:   "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {t(`unitStatus_${status}`)}
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

export default function OrganisationComparisonPage() {
  const t = useTranslations("AdminAnalyticsOrgComparisonPage");

  const [assessments, setAssessments] = useState<{ id: string; name: string }[]>([]);
  const [assessment1, setAssessment1] = useState("");
  const [assessment2, setAssessment2] = useState("");
  const [result, setResult] = useState<OrgComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  useEffect(() => {
    assessmentAPI.getAll()
      .then((a) => setAssessments(a || []))
      .catch(() => setError(t("errorLoadSelectors")));
  }, []);

  const canCompare = assessment1 && assessment2 && assessment1 !== assessment2;

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
      const response = await comparisonAPI.exportOrganisationCsv({ assessmentId1: assessment1, assessmentId2: assessment2 });
      downloadBlob(response.data, `Comparison_Organisation_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error("CSV export error:", err);
    }
  };

  const handleExportPdf = async () => {
    if (!canCompare) return;
    try {
      const response = await comparisonAPI.exportOrganisationPdf({ assessmentId1: assessment1, assessmentId2: assessment2 });
      downloadBlob(response.data, `Comparison_Organisation_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    }
  };

  const handleCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedUnit(null);
    try {
      const data = await comparisonAPI.compareByOrganisation({ assessmentId1: assessment1, assessmentId2: assessment2 });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || t("errorCompare"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
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
          <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <IconAlertTriangle size={16} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Org summary stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            {[
              { label: t("summaryCompared"),        value: result.organisationSummary.totalStaffCompared,  icon: <IconUsers size={18} className="text-green-500" /> },
              { label: t("summaryNew"),              value: result.organisationSummary.totalNewMembers,     icon: <IconUserPlus size={18} className="text-blue-500" /> },
              { label: t("summaryLeft"),             value: result.organisationSummary.totalLeft,           icon: <IconUserMinus size={18} className="text-red-500" /> },
              { label: t("summaryTransferred"),      value: result.organisationSummary.totalTransferred,    icon: <IconArrowsTransferUp size={18} className="text-cyan-500" /> },
              { label: t("summaryNoParticipation"),  value: result.organisationSummary.totalNoParticipation, icon: <IconMinus size={18} className="text-gray-400" /> },
            ].map((item) => (
              <Card key={item.label} className="text-center py-4 px-2">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </Card>
            ))}
          </div>

          {/* Aggregate competency comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("aggregateTitle")}</CardTitle>
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
                      <TableHead className="text-center">{t("assessment1")} ({t("scoreWeighted")})</TableHead>
                      <TableHead className="text-center">{t("assessment2")} ({t("scoreWeighted")})</TableHead>
                      <TableHead className="text-center">{t("colChange")}</TableHead>
                      <TableHead>{t("colTrend")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.competencyComparison.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("noCompetencies")}</TableCell>
                      </TableRow>
                    ) : (
                      result.competencyComparison.map((c) => (
                        <TableRow key={c.competencyId}>
                          <TableCell className="font-medium">{c.competencyName}</TableCell>
                          <TableCell className="text-center text-sm">{formatScore(c.assessment1?.weightedScore)}</TableCell>
                          <TableCell className="text-center text-sm">{formatScore(c.assessment2?.weightedScore)}</TableCell>
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

          {/* Unit breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("unitBreakdownTitle")}</CardTitle>
              <CardDescription>{t("unitBreakdownDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colUnit")}</TableHead>
                      <TableHead>{t("colUnitStatus")}</TableHead>
                      <TableHead className="text-center">{t("colStaffCount1")}</TableHead>
                      <TableHead className="text-center">{t("colStaffCount2")}</TableHead>
                      <TableHead className="text-center">{t("colAction")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.unitBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("noUnits")}</TableCell>
                      </TableRow>
                    ) : (
                      result.unitBreakdown.flatMap((u) => {
                        const rows = [
                          <TableRow key={u.unitId} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedUnit(expandedUnit === u.unitId ? null : u.unitId)}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <IconBuilding size={14} className="text-muted-foreground" />
                                {u.unitName || u.unitId}
                              </div>
                            </TableCell>
                            <TableCell>{unitStatusBadge(u.unitStatus, t)}</TableCell>
                            <TableCell className="text-center">{u.staffCount1}</TableCell>
                            <TableCell className="text-center">{u.staffCount2}</TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" className="text-xs h-7">
                                {expandedUnit === u.unitId ? t("collapse") : t("expand")}
                              </Button>
                            </TableCell>
                          </TableRow>,
                        ];
                        if (expandedUnit === u.unitId && u.competencyComparison.length > 0) {
                          rows.push(
                            <TableRow key={`${u.unitId}-expanded`}>
                              <TableCell colSpan={5} className="bg-muted/30 p-0">
                                <div className="px-4 py-3">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs h-8">{t("colCompetency")}</TableHead>
                                        <TableHead className="text-center text-xs h-8">{t("scoreWeighted")} {t('assessment1')}</TableHead>
                                        <TableHead className="text-center text-xs h-8">{t("scoreWeighted")} {t('assessment2')}</TableHead>
                                        <TableHead className="text-center text-xs h-8">{t("colChange")}</TableHead>
                                        <TableHead className="text-xs h-8">{t("colTrend")}</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {u.competencyComparison.map((c) => (
                                        <TableRow key={c.competencyId}>
                                          <TableCell className="text-sm">{c.competencyName}</TableCell>
                                          <TableCell className="text-center text-sm">{formatScore(c.assessment1?.weightedScore)}</TableCell>
                                          <TableCell className="text-center text-sm">{formatScore(c.assessment2?.weightedScore)}</TableCell>
                                          <TableCell className="text-center text-sm">{changeCell(c.change?.weightedChange)}</TableCell>
                                          <TableCell>{trendBadge(c.trend, t)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return rows;
                      })
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
