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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assessmentAPI, unitAPI, clusterAPI, unitCompetencyReportAPI } from "@/lib/api";
import {
  IconChevronLeft,
  IconRefresh,
  IconAlertTriangle,
  IconBuildingCommunity,
  IconDownload,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface Assessment {
  id: string;
  name: string;
}

interface Option {
  id: string;
  name: string;
}

interface CompetencyReportResult {
  competencyId: string;
  competencyName: string;
  clusterName: string;
  staffCount: number;
  averageRequiredLevel: number;
  averageScore: number;
  averageGap: number;
}

interface UnitCompetencyReportResponse {
  unitName: string | null;
  assessmentName: string | null;
  results: CompetencyReportResult[];
}

const getGapColor = (gap: number): { text: string; badge: string } => {
  if (gap >= 1.5) return { text: "text-red-700", badge: "bg-red-100" };
  if (gap >= 1) return { text: "text-orange-700", badge: "bg-orange-100" };
  if (gap >= 0.5) return { text: "text-yellow-700", badge: "bg-yellow-100" };
  return { text: "text-green-700", badge: "bg-green-100" };
};

const ALL = "all";

export default function UnitCompetencyReportPage() {
  const t = useTranslations("AdminAnalyticsUnitCompetencyReportPage");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [clusters, setClusters] = useState<Option[]>([]);

  const [assessmentId, setAssessmentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [clusterId, setClusterId] = useState(ALL);

  const [result, setResult] = useState<UnitCompetencyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([assessmentAPI.getAll(), unitAPI.getAll(), clusterAPI.getAll()])
      .then(([a, u, c]) => {
        setAssessments(a || []);
        setUnits(u || []);
        setClusters(c || []);
        if (a && a.length > 0) setAssessmentId(a[0].id);
      })
      .catch(() => setError(t("errorLoadSelectors")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canGenerate = !!assessmentId && !!unitId;

  const buildParams = () => ({
    assessmentId,
    unitId,
    clusterId: clusterId === ALL ? undefined : clusterId,
  });

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const data = await unitCompetencyReportAPI.getReport(buildParams());
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || t("errorGenerate"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!canGenerate) return;
    try {
      const response = await unitCompetencyReportAPI.exportCsv(buildParams());
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `UnitCompetencyReport_${unitId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    }
  };

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
            <IconBuildingCommunity className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("filtersTitle")}</CardTitle>
          <CardDescription>{t("filtersDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("labelUnit")}</label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("placeholderUnit")} /></SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("labelAssessment")}</label>
            <Select value={assessmentId} onValueChange={setAssessmentId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("placeholderAssessment")} /></SelectTrigger>
              <SelectContent>
                {assessments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("labelCluster")}</label>
            <Select value={clusterId} onValueChange={setClusterId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("placeholderCluster")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("allClusters")}</SelectItem>
                {clusters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button onClick={handleGenerate} disabled={!canGenerate || loading} className="gap-2">
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("generating") : t("generateButton")}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )}

      {result && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{result.unitName || t("resultsTitle")}</CardTitle>
            <CardDescription className="flex items-center justify-between gap-4">
              <span>{result.assessmentName}</span>
              <Button variant="default" size="sm" onClick={handleExportCsv}>
                <IconDownload className="size-4 mr-2" />
                {t("exportCsv")}
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <IconBuildingCommunity className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t("noData")}</p>
              </div>
            ) : (
              <Card className="max-h-[500px] overflow-scroll">
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">{t("colCompetency")}</TableHead>
                        <TableHead className="font-semibold">{t("colCluster")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colStaffCount")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colRequiredLevel")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colScore")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colGap")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.results.map((r) => {
                        const color = getGapColor(r.averageGap);
                        return (
                          <TableRow key={r.competencyId} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{r.competencyName}</TableCell>
                            <TableCell className="text-muted-foreground">{r.clusterName}</TableCell>
                            <TableCell className="text-center">{r.staffCount}</TableCell>
                            <TableCell className="text-center">{r.averageRequiredLevel.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{r.averageScore.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={`${color.badge} ${color.text} border-0 font-semibold`}>
                                {r.averageGap.toFixed(2)}
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
      )}
    </div>
  );
}
