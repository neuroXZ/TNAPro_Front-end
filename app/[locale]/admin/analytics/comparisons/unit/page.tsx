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
import { assessmentAPI, unitAPI, comparisonAPI } from "@/lib/api";
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
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

type Trend = "improved" | "declined" | "no_change" | "new" | "not_assessed" | "first_assessment" | "not_applicable";
type StaffStatus = "compared" | "new_member" | "left" | "transferred_in" | "transferred_out" | "no_participation";

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
  change: { weightedChange: number | null; weightageWarning: boolean } | null;
  trend: Trend;
}

interface StaffBreakdownEntry {
  staffId: string;
  staffName: string | null;
  status: StaffStatus;
  positionChanged: boolean;
  position1: string | null;
  position2: string | null;
  competencyComparison: CompetencyComparison[];
}

interface UnitComparisonResponse {
  unitId: string;
  unitName: string | null;
  assessment1: { id: string; name: string | null };
  assessment2: { id: string; name: string | null };
  staffSummary: { compared: number; newMembers: number; left: number; transferredIn: number; transferredOut: number; noParticipation: number };
  competencyComparison: CompetencyComparison[];
  staffBreakdown: StaffBreakdownEntry[];
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

function staffStatusBadge(status: StaffStatus, t: (k: string) => string) {
  const map: Record<StaffStatus, string> = {
    compared:        "bg-green-100 text-green-800",
    new_member:      "bg-blue-100 text-blue-800",
    left:            "bg-red-100 text-red-800",
    transferred_in:  "bg-cyan-100 text-cyan-800",
    transferred_out: "bg-orange-100 text-orange-800",
    no_participation:"bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {t(`staffStatus_${status}`)}
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

export default function UnitComparisonPage() {
  const t = useTranslations("AdminAnalyticsUnitComparisonPage");

  const [assessments, setAssessments] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [assessment1, setAssessment1] = useState("");
  const [assessment2, setAssessment2] = useState("");
  const [result, setResult] = useState<UnitComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([assessmentAPI.getAll(), unitAPI.getAll()])
      .then(([a, u]) => {
        setAssessments(a || []);
        setUnits(u || []);
      })
      .catch(() => setError(t("errorLoadSelectors")));
  }, []);

  const canCompare = selectedUnit && assessment1 && assessment2 && assessment1 !== assessment2;

  const handleCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedStaff(null);
    try {
      const data = await comparisonAPI.compareByUnit({ unitId: selectedUnit, assessmentId1: assessment1, assessmentId2: assessment2 });
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("labelUnit")}</label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger><SelectValue placeholder={t("placeholderUnit")} /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.id}</SelectItem>
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
          {/* Staff summary stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: t("summaryCompared"),        value: result.staffSummary.compared,        icon: <IconUsers size={18} className="text-green-500" /> },
              { label: t("summaryNew"),              value: result.staffSummary.newMembers,      icon: <IconUserPlus size={18} className="text-blue-500" /> },
              { label: t("summaryLeft"),             value: result.staffSummary.left,            icon: <IconUserMinus size={18} className="text-red-500" /> },
              { label: t("summaryTransferredIn"),    value: result.staffSummary.transferredIn,   icon: <IconArrowsTransferUp size={18} className="text-cyan-500" /> },
              { label: t("summaryTransferredOut"),   value: result.staffSummary.transferredOut,  icon: <IconArrowsTransferUp size={18} className="text-orange-500" style={{ transform: "rotate(180deg)" }} /> },
              { label: t("summaryNoParticipation"),  value: result.staffSummary.noParticipation, icon: <IconMinus size={18} className="text-gray-400" /> },
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
              <CardDescription>
                {result.assessment1.name || result.assessment1.id} vs {result.assessment2.name || result.assessment2.id}
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

          {/* Staff breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("staffBreakdownTitle")}</CardTitle>
              <CardDescription>{t("staffBreakdownDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colStaffName")}</TableHead>
                      <TableHead>{t("colStatus")}</TableHead>
                      <TableHead>{t("colPosition1")}</TableHead>
                      <TableHead>{t("colPosition2")}</TableHead>
                      <TableHead className="text-center">{t("colAction")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.staffBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("noStaff")}</TableCell>
                      </TableRow>
                    ) : (
                      result.staffBreakdown.flatMap((s) => {
                        const rows = [
                          <TableRow key={s.staffId} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedStaff(expandedStaff === s.staffId ? null : s.staffId)}>
                            <TableCell className="font-medium">{s.staffName || s.staffId}</TableCell>
                            <TableCell>{staffStatusBadge(s.status, t)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{s.position1 || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{s.position2 || "—"}</TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" className="text-xs h-7">
                                {expandedStaff === s.staffId ? t("collapse") : t("expand")}
                              </Button>
                            </TableCell>
                          </TableRow>,
                        ];
                        if (expandedStaff === s.staffId && s.competencyComparison.length > 0) {
                          rows.push(
                            <TableRow key={`${s.staffId}-expanded`}>
                              <TableCell colSpan={5} className="bg-muted/30 p-0">
                                <div className="px-4 py-3">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs h-8">{t("colCompetency")}</TableHead>
                                        <TableHead className="text-center text-xs h-8">{t("scoreWeighted")} A1</TableHead>
                                        <TableHead className="text-center text-xs h-8">{t("scoreWeighted")} A2</TableHead>
                                        <TableHead className="text-center text-xs h-8">{t("colChange")}</TableHead>
                                        <TableHead className="text-xs h-8">{t("colTrend")}</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {s.competencyComparison.map((c) => (
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
