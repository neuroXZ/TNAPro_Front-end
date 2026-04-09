"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowsDiff,
  IconArrowDownRight,
  IconArrowUpRight,
  IconBuilding,
  IconChevronLeft,
  IconGitCompare,
  IconHierarchy2,
  IconMinus,
  IconRefresh,
  IconSearch,
  IconSparkles,
  IconTimeline,
  IconUser,
} from "@tabler/icons-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { api, assessmentAPI, unitAPI } from "@/lib/api";

interface UnitOption {
  id: string;
  name: string;
}

interface AssessmentOption {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
}

interface ComparisonAssessment {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  weightageSelf?: number | null;
  weightageSuperiror?: number | null;
  weightageSuperior?: number | null;
  weightagePeer?: number | null;
}

interface StructuralChanges {
  positionChanged: boolean;
  position1?: string | null;
  position2?: string | null;
  unitChanged: boolean;
  unit1?: string | null;
  unit2?: string | null;
}

interface CompetencyAssessmentScore {
  selfScore?: number | null;
  superiorScore?: number | null;
  weightedScore?: number | null;
  weightageSelf?: number | null;
  weightageSuperiror?: number | null;
  weightageSuperior?: number | null;
}

interface CompetencyChange {
  selfChange?: number | null;
  superiorChange?: number | null;
  weightedChange?: number | null;
  weightageWarning?: boolean;
}

interface CompetencyComparisonItem {
  competencyId: string;
  competencyName: string;
  appearsIn: "assessment1" | "assessment2" | "both" | string;
  assessment1?: CompetencyAssessmentScore | null;
  assessment2?: CompetencyAssessmentScore | null;
  change?: CompetencyChange | null;
  trend?: "improved" | "declined" | "unchanged" | string | null;
}

interface ComparisonResponse {
  unitId?: string;
  unitName?: string;
  staffId?: string;
  staffName?: string;
  assessment1: ComparisonAssessment;
  assessment2: ComparisonAssessment;
  structuralChanges: StructuralChanges;
  competencyComparison: CompetencyComparisonItem[];
  generatedAt?: string;
}

function sortAssessments(items: AssessmentOption[]) {
  return [...items].sort((firstItem, secondItem) => {
    const firstDate = new Date(
      firstItem.startDate || firstItem.createdAt || 0,
    ).getTime();
    const secondDate = new Date(
      secondItem.startDate || secondItem.createdAt || 0,
    ).getTime();

    return secondDate - firstDate;
  });
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatNumber(value?: number | null, fractionDigits = 1) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatWeightage(value?: number | null) {
  if (value === null || value === undefined) return "-";

  const normalized = value > 1 ? value : value * 100;
  return `${formatNumber(normalized, 0)}%`;
}

function getTrendMeta(trend?: string | null) {
  if (trend === "improved") {
    return {
      label: "Improved",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: IconArrowUpRight,
    };
  }

  if (trend === "declined") {
    return {
      label: "Declined",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      icon: IconArrowDownRight,
    };
  }

  return {
    label: "Unchanged",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: IconMinus,
  };
}

function getAppearBadge(appearsIn: string) {
  if (appearsIn === "assessment1") {
    return {
      label: "Assessment 1 only",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  if (appearsIn === "assessment2") {
    return {
      label: "Assessment 2 only",
      className: "border-violet-200 bg-violet-50 text-violet-700",
    };
  }

  return {
    label: "Both assessments",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getChangeTone(value?: number | null) {
  if (value === null || value === undefined) return "text-muted-foreground";
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-slate-600";
}

function getAssessmentSuperiorWeightage(assessment?: ComparisonAssessment | null) {
  if (!assessment) return null;
  return assessment.weightageSuperior ?? assessment.weightageSuperiror ?? null;
}

function getScoreSuperiorWeightage(score?: CompetencyAssessmentScore | null) {
  if (!score) return null;
  return score.weightageSuperior ?? score.weightageSuperiror ?? null;
}

function buildErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "string"
  ) {
    return error.response.data.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load comparison data.";
}

export default function UnitComparisonPage() {
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [assessments, setAssessments] = useState<AssessmentOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [assessmentId1, setAssessmentId1] = useState("");
  const [assessmentId2, setAssessmentId2] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadFilters = async () => {
      setIsBootstrapping(true);

      try {
        const [unitData, assessmentData] = await Promise.all([
          unitAPI.getAll(),
          assessmentAPI.getAll(),
        ]);

        const normalizedUnits = Array.isArray(unitData)
          ? unitData.map((unit) => ({
              id: String(unit.id),
              name: String(unit.name),
            }))
          : [];

        const normalizedAssessments = Array.isArray(assessmentData)
          ? sortAssessments(
              assessmentData.map((assessment) => ({
                id: String(assessment.id),
                name: String(assessment.name),
                startDate: assessment.startDate ?? null,
                endDate: assessment.endDate ?? null,
                createdAt: assessment.createdAt ?? null,
              })),
            )
          : [];

        setUnits(normalizedUnits);
        setAssessments(normalizedAssessments);

        if (normalizedUnits.length > 0) {
          setSelectedUnitId((currentValue) => currentValue || normalizedUnits[0].id);
        }

        if (normalizedAssessments.length > 0) {
          setAssessmentId1((currentValue) => currentValue || normalizedAssessments[0].id);
        }

        if (normalizedAssessments.length > 1) {
          setAssessmentId2((currentValue) => currentValue || normalizedAssessments[1].id);
        }
      } catch (loadError) {
        setError(buildErrorMessage(loadError));
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadFilters();
  }, []);

  useEffect(() => {
    const loadComparison = async () => {
      if (!selectedUnitId || !assessmentId1 || !assessmentId2) {
        return;
      }

      if (assessmentId1 === assessmentId2) {
        setComparison(null);
        setIsPreviewMode(false);
        setError("Please choose two different assessments to compare.");
        return;
      }

      setIsLoadingComparison(true);
      setError(null);

      try {
        const response = await api.get<ComparisonResponse>("/comparison/unit", {
          params: {
            unitId: selectedUnitId,
            assessmentId1,
            assessmentId2,
          },
        });

        setComparison(response.data);
      } catch (loadError) {
        setComparison(null);
        setError(buildErrorMessage(loadError));
      } finally {
        setIsLoadingComparison(false);
      }
    };

    void loadComparison();
  }, [selectedUnitId, assessmentId1, assessmentId2, reloadKey]);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
  const comparisonItems = comparison?.competencyComparison ?? [];
  const filteredItems = comparisonItems.filter((item) => {
    if (!searchTerm) return true;

    const query = searchTerm.toLowerCase();
    return (
      item.competencyName.toLowerCase().includes(query) ||
      item.competencyId.toLowerCase().includes(query)
    );
  });

  const improvedCount = comparisonItems.filter(
    (item) => item.trend === "improved",
  ).length;
  const declinedCount = comparisonItems.filter(
    (item) => item.trend === "declined",
  ).length;
  const unchangedCount = comparisonItems.filter(
    (item) => item.trend === "unchanged",
  ).length;
  const exclusiveCount = comparisonItems.filter(
    (item) => item.appearsIn !== "both",
  ).length;
  const weightedChanges = comparisonItems
    .map((item) => item.change?.weightedChange)
    .filter((value): value is number => value !== null && value !== undefined);
  const averageWeightedChange = weightedChanges.length
    ? weightedChanges.reduce((total, value) => total + value, 0) / weightedChanges.length
    : 0;

  if (isBootstrapping) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link href="/admin/analytics/comparisons">
            <Button variant="outline" size="sm" className="gap-2">
              <IconChevronLeft className="h-4 w-4" />
              Back to comparison menu
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unit Comparison</h1>
            <p className="text-muted-foreground max-w-3xl text-sm sm:text-base">
              Compare two assessment periods for a selected unit and inspect how
              competency scores, structural information, and weighted outcomes shifted.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {comparison?.generatedAt ? (
            <Badge variant="outline">Generated {formatDate(comparison.generatedAt)}</Badge>
          ) : null}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconGitCompare className="h-5 w-5" />
            Comparison Filters
          </CardTitle>
          <CardDescription>
            Pick the unit and two assessment periods to load the comparison payload.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Unit</p>
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Assessment 1</p>
            <Select value={assessmentId1} onValueChange={setAssessmentId1}>
              <SelectTrigger>
                <SelectValue placeholder="Choose assessment 1" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {assessment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Assessment 2</p>
            <Select value={assessmentId2} onValueChange={setAssessmentId2}>
              <SelectTrigger>
                <SelectValue placeholder="Choose assessment 2" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {assessment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Search competency</p>
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or competency ID"
                className="pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Current selection</p>
              <p className="text-muted-foreground text-sm">
                {selectedUnit?.name || "No unit selected"}
                {comparison?.staffName ? ` • Payload subject: ${comparison.staffName}` : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReloadKey((currentValue) => currentValue + 1)}
              disabled={isLoadingComparison}
              className="gap-2"
            >
              <IconRefresh className="h-4 w-4" />
              {isLoadingComparison ? "Refreshing..." : "Refresh comparison"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoadingComparison ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      ) : null}

      {!isLoadingComparison && comparison ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Compared competencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{comparisonItems.length}</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {filteredItems.length} shown after filtering
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Improved vs declined
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-3xl font-semibold text-emerald-600">
                      {improvedCount}
                    </div>
                    <p className="text-xs text-muted-foreground">Improved</p>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-rose-600">
                      {declinedCount}
                    </div>
                    <p className="text-xs text-muted-foreground">Declined</p>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-slate-600">
                      {unchangedCount}
                    </div>
                    <p className="text-xs text-muted-foreground">Unchanged</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Exclusive competencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{exclusiveCount}</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Competencies appearing in only one assessment period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average weighted delta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-semibold ${getChangeTone(averageWeightedChange)}`}>
                  {averageWeightedChange > 0 ? "+" : ""}
                  {formatNumber(averageWeightedChange)}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Mean weighted score change across comparable competencies
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSparkles className="h-5 w-5" />
                  Comparison Summary
                </CardTitle>
                <CardDescription>
                  Core subject and organisational context returned by the comparison endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <IconBuilding className="h-4 w-4" />
                      Selected Unit
                    </div>
                    <p className="text-lg font-semibold">
                      {comparison.unitName || selectedUnit?.name || "Not available"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      ID: {comparison.unitId || selectedUnitId || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <IconUser className="h-4 w-4" />
                      Payload Subject
                    </div>
                    <p className="text-lg font-semibold">
                      {comparison.staffName || "Not available"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      ID: {comparison.staffId || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[comparison.assessment1, comparison.assessment2].map((assessment, index) => (
                    <div key={assessment.id} className="rounded-xl border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Assessment {index + 1}
                          </p>
                          <p className="text-lg font-semibold">{assessment.name}</p>
                        </div>
                        <Badge variant="outline">{assessment.id.slice(0, 8)}</Badge>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground">Start date</p>
                          <p className="font-medium">{formatDate(assessment.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End date</p>
                          <p className="font-medium">{formatDate(assessment.endDate)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Self weightage</p>
                          <p className="font-medium">{formatWeightage(assessment.weightageSelf)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Superior weightage</p>
                          <p className="font-medium">
                            {formatWeightage(getAssessmentSuperiorWeightage(assessment))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconHierarchy2 className="h-5 w-5" />
                  Structural Changes
                </CardTitle>
                <CardDescription>
                  Position and unit movement between the two assessment snapshots.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium">Position</p>
                    <Badge
                      className={
                        comparison.structuralChanges.positionChanged
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }
                    >
                      {comparison.structuralChanges.positionChanged ? "Changed" : "No change"}
                    </Badge>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Assessment 1</p>
                      <p className="font-medium">{comparison.structuralChanges.position1 || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assessment 2</p>
                      <p className="font-medium">{comparison.structuralChanges.position2 || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium">Unit</p>
                    <Badge
                      className={
                        comparison.structuralChanges.unitChanged
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }
                    >
                      {comparison.structuralChanges.unitChanged ? "Changed" : "No change"}
                    </Badge>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Assessment 1</p>
                      <p className="font-medium">{comparison.structuralChanges.unit1 || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assessment 2</p>
                      <p className="font-medium">{comparison.structuralChanges.unit2 || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  The backend payload already exposes both the raw structure values and explicit
                  change flags, so the page can highlight movement without recomputing it in the browser.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconTimeline className="h-5 w-5" />
                    Competency Comparison
                  </CardTitle>
                  <CardDescription>
                    Read the before-and-after scores, weighted changes, and whether a competency
                    exists in one or both assessment periods.
                  </CardDescription>
                </div>
                <Badge variant="outline">{filteredItems.length} rows</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                  <IconArrowsDiff className="text-muted-foreground mb-3 h-10 w-10" />
                  <h3 className="text-lg font-semibold">No competencies found</h3>
                  <p className="text-muted-foreground mt-1 max-w-md text-sm">
                    Try a different search keyword or switch to another assessment pair.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[260px]">Competency</TableHead>
                      <TableHead className="min-w-[220px]">Assessment 1</TableHead>
                      <TableHead className="min-w-[220px]">Assessment 2</TableHead>
                      <TableHead className="min-w-[180px]">Change</TableHead>
                      <TableHead className="min-w-[120px]">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const trendMeta = getTrendMeta(item.trend);
                      const appearsMeta = getAppearBadge(item.appearsIn);
                      const TrendIcon = trendMeta.icon;

                      return (
                        <TableRow key={item.competencyId}>
                          <TableCell className="align-top">
                            <div className="space-y-2">
                              <div>
                                <p className="font-medium">{item.competencyName}</p>
                                <p className="text-muted-foreground text-xs">
                                  {item.competencyId}
                                </p>
                              </div>
                              <Badge className={appearsMeta.className}>{appearsMeta.label}</Badge>
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Self:</span>{" "}
                                <span className="font-medium">
                                  {formatNumber(item.assessment1?.selfScore)}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Superior:</span>{" "}
                                <span className="font-medium">
                                  {formatNumber(item.assessment1?.superiorScore)}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Weighted:</span>{" "}
                                <span className="font-medium">
                                  {formatNumber(item.assessment1?.weightedScore)}
                                </span>
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Weightage {formatWeightage(item.assessment1?.weightageSelf)} /{" "}
                                {formatWeightage(getScoreSuperiorWeightage(item.assessment1))}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Self:</span>{" "}
                                <span className="font-medium">
                                  {formatNumber(item.assessment2?.selfScore)}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Superior:</span>{" "}
                                <span className="font-medium">
                                  {formatNumber(item.assessment2?.superiorScore)}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Weighted:</span>{" "}
                                <span className="font-medium">
                                  {formatNumber(item.assessment2?.weightedScore)}
                                </span>
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Weightage {formatWeightage(item.assessment2?.weightageSelf)} /{" "}
                                {formatWeightage(getScoreSuperiorWeightage(item.assessment2))}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            <div className="space-y-1 text-sm">
                              <p className={getChangeTone(item.change?.selfChange)}>
                                Self {item.change?.selfChange && item.change.selfChange > 0 ? "+" : ""}
                                {formatNumber(item.change?.selfChange)}
                              </p>
                              <p className={getChangeTone(item.change?.superiorChange)}>
                                Superior {item.change?.superiorChange && item.change.superiorChange > 0 ? "+" : ""}
                                {formatNumber(item.change?.superiorChange)}
                              </p>
                              <p className={getChangeTone(item.change?.weightedChange)}>
                                Weighted {item.change?.weightedChange && item.change.weightedChange > 0 ? "+" : ""}
                                {formatNumber(item.change?.weightedChange)}
                              </p>
                              {item.change?.weightageWarning ? (
                                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                  Weightage warning
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            <Badge className={`gap-1 ${trendMeta.className}`}>
                              <TrendIcon className="h-3 w-3" />
                              {trendMeta.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}