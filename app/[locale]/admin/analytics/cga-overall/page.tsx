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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  assessmentAPI,
  unitAPI,
  positionCategoryAPI,
  gradeAPI,
  cgaOverallAPI,
} from "@/lib/api";
import {
  IconChevronLeft,
  IconRefresh,
  IconAlertTriangle,
  IconUsersGroup,
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

interface CompetencyAverage {
  competencyId: string;
  competencyName: string;
  requiredLevelAvg: number;
  actualScoreAvg: number;
  gap: number;
  gapRatioPercent: string;
  staffCount: number;
}

interface CgaOverallResponse {
  totalStaffEvaluated: number;
  competencyGaps: CompetencyAverage[];
}

const getGapColor = (gap: number): { bg: string; text: string; badge: string } => {
  const magnitude = Math.abs(gap);
  if (magnitude >= 1.5) return { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" };
  if (magnitude >= 1) return { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100" };
  if (magnitude >= 0.5) return { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" };
  return { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100" };
};

const ALL = "all";

export default function CgaOverallPage() {
  const t = useTranslations("AdminAnalyticsCgaOverallPage");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [grades, setGrades] = useState<Option[]>([]);

  const [assessmentId, setAssessmentId] = useState("");
  const [unitId, setUnitId] = useState(ALL);
  const [includeSubUnits, setIncludeSubUnits] = useState(true);
  const [categoryId, setCategoryId] = useState(ALL);
  const [gradeId, setGradeId] = useState(ALL);

  const [result, setResult] = useState<CgaOverallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([assessmentAPI.getAll(), unitAPI.getAll(), positionCategoryAPI.getAll(), gradeAPI.getAll()])
      .then(([a, u, c, g]) => {
        setAssessments(a || []);
        setUnits(u || []);
        setCategories(c || []);
        setGrades(g || []);
        if (a && a.length > 0) setAssessmentId(a[0].id);
      })
      .catch(() => setError(t("errorLoadSelectors")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildFilter = () => ({
    assessmentId,
    unitId: unitId === ALL ? undefined : unitId,
    includeSubUnits: unitId === ALL ? undefined : includeSubUnits,
    categoryId: categoryId === ALL ? undefined : categoryId,
    gradeId: gradeId === ALL ? undefined : gradeId,
  });

  const handleGenerate = async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cgaOverallAPI.getReport(buildFilter());
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || t("errorGenerate"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!assessmentId) return;
    try {
      const response = await cgaOverallAPI.exportCsv(buildFilter());
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `CgaOverall_${assessmentId}_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <IconUsersGroup className="h-8 w-8" />
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
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <label className="text-sm font-medium">{t("labelUnit")}</label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("placeholderUnit")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("allUnits")}</SelectItem>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unitId !== ALL && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox id="includeSubUnits" checked={includeSubUnits} onCheckedChange={(v) => setIncludeSubUnits(v === true)} />
                <label htmlFor="includeSubUnits" className="text-xs text-muted-foreground">{t("includeSubUnits")}</label>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("labelCategory")}</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("placeholderCategory")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("allCategories")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("labelGrade")}</label>
            <Select value={gradeId} onValueChange={setGradeId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("placeholderGrade")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("allGrades")}</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button onClick={handleGenerate} disabled={!assessmentId || loading} className="gap-2">
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
            <CardTitle className="text-lg">{t("resultsTitle")}</CardTitle>
            <CardDescription className="flex items-center justify-between gap-4">
              <span>{t("staffEvaluated", { count: result.totalStaffEvaluated })}</span>
              <Button variant="default" size="sm" onClick={handleExportCsv}>
                <IconDownload className="size-4 mr-2" />
                {t("exportCsv")}
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.competencyGaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <IconUsersGroup className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t("noData")}</p>
              </div>
            ) : (
              <Card className="max-h-[500px] overflow-scroll">
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">{t("colCompetency")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colStaffCount")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colRequiredLevel")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colActualScore")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("colGap")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.competencyGaps.map((c) => {
                        const color = getGapColor(c.gap);
                        return (
                          <TableRow key={c.competencyId} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{c.competencyName}</TableCell>
                            <TableCell className="text-center">{c.staffCount}</TableCell>
                            <TableCell className="text-center">{c.requiredLevelAvg.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{c.actualScoreAvg.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <Badge variant="outline" className={`${color.badge} ${color.text} border-0 font-semibold`}>
                                  {c.gap.toFixed(2)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{c.gapRatioPercent}</span>
                              </div>
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
