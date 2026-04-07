"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  LabelList,
  Pie,
  PieChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  trainingDemandAPI,
  assessmentAPI,
  assessmentResultAPI,
  assessorAPI,
  staffAPI,
} from "@/lib/api";
import {
  IconBuilding,
  IconAlertTriangle,
  IconChartBar,
  IconChartPie,
  IconTrendingUp,
  IconCalendar,
  IconBook,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

// Dashboard Types based on backend model
interface DashboardSummary {
  totalStaff: number;
  totalUnits: number;
  licenseUsage: {
    used: number;
    max: number;
    percentage: number;
    expiryDate: string | null;
  };
}

interface ChartData {
  label: string;
  value: number;
}

interface DashboardResponse {
  summary: DashboardSummary;
  unitDistribution: ChartData[];
  genderDistribution: ChartData[];
  gradeDistribution: ChartData[];
}

interface Assessment {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

interface TrainingDemandReport {
  trainingId: string;
  trainingName: string;
  totalStaffCount: number;
  staffList: unknown[];
}

interface StaffMember {
  id: string;
  gender?: string;
  unitId?: string;
  unit?: {
    id: string;
    name: string;
  };
  grade?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
    grade?: {
      id: string;
      name: string;
    };
  };
}

interface Assessor {
  id: string;
  staffId: string;
}

interface AssessmentResult {
  id: string;
  assessorId: string;
  assessmentId: string;
}

const createGenderChartConfig = (data: ChartData[]) => {
  const config: ChartConfig = {
    value: {
      label: "Staff Count",
    },
  };

  data.forEach((item, index) => {
    config[item.label.toLowerCase()] = {
      label: item.label,
      color: `var(--chart-${(index % 3) + 1})`,
    };
  });

  return config;
};

const normalizeGenderLabel = (label: string) => {
  const value = label.trim();

  if (!value) return "Unspecified";

  const normalized = value.toLowerCase();

  if (["male", "lelaki", "m"].includes(normalized)) return "Male";
  if (["female", "perempuan", "f"].includes(normalized)) return "Female";

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const mergeGenderDistribution = (data: ChartData[]) => {
  const groupedData = new Map<string, number>();

  data.forEach((item) => {
    const normalizedLabel = normalizeGenderLabel(item.label);
    groupedData.set(
      normalizedLabel,
      (groupedData.get(normalizedLabel) || 0) + item.value,
    );
  });

  const displayOrder = ["Male", "Female", "Unspecified"];

  return Array.from(groupedData.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((firstItem, secondItem) => {
      const firstIndex = displayOrder.indexOf(firstItem.label);
      const secondIndex = displayOrder.indexOf(secondItem.label);

      if (firstIndex !== -1 || secondIndex !== -1) {
        if (firstIndex === -1) return 1;
        if (secondIndex === -1) return -1;
        return firstIndex - secondIndex;
      }

      return secondItem.value - firstItem.value;
    });
};

const createEmptyDashboardData = (): DashboardResponse => ({
  summary: {
    totalStaff: 0,
    totalUnits: 0,
    licenseUsage: {
      used: 0,
      max: 0,
      percentage: 0,
      expiryDate: null,
    },
  },
  unitDistribution: [],
  genderDistribution: [],
  gradeDistribution: [],
});

const sortAssessmentsByLatest = (items: Assessment[]) =>
  [...items].sort((firstAssessment, secondAssessment) => {
    const firstDate = new Date(
      firstAssessment.startDate || firstAssessment.createdAt || 0,
    ).getTime();
    const secondDate = new Date(
      secondAssessment.startDate || secondAssessment.createdAt || 0,
    ).getTime();
    return secondDate - firstDate;
  });

const buildDistribution = (items: string[]) => {
  const distributionMap = new Map<string, number>();

  items.forEach((item) => {
    distributionMap.set(item, (distributionMap.get(item) || 0) + 1);
  });

  return Array.from(distributionMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((firstItem, secondItem) => secondItem.value - firstItem.value);
};

const buildAssessmentDashboardData = (
  staffMembers: StaffMember[],
  assessors: Assessor[],
  assessmentResults: AssessmentResult[],
): DashboardResponse => {
  const assessorStaffMap = new Map(
    assessors.map((assessor) => [assessor.id, assessor.staffId]),
  );

  const assessedStaffIds = new Set(
    assessmentResults
      .map((result) => assessorStaffMap.get(result.assessorId))
      .filter((staffId): staffId is string => Boolean(staffId)),
  );

  const selectedStaff = staffMembers.filter((staffMember) =>
    assessedStaffIds.has(staffMember.id),
  );

  const uniqueUnitIds = new Set(
    selectedStaff
      .map((staffMember) => staffMember.unit?.id || staffMember.unitId)
      .filter((unitId): unitId is string => Boolean(unitId)),
  );

  const unitDistribution = buildDistribution(
    selectedStaff.map(
      (staffMember) => staffMember.unit?.name || "No Unit Assigned",
    ),
  );
  const genderDistribution = buildDistribution(
    selectedStaff.map(
      (staffMember) => normalizeGenderLabel(staffMember.gender || ""),
    ),
  );
  const gradeDistribution = buildDistribution(
    selectedStaff.map(
      (staffMember) =>
        staffMember.position?.grade?.name ||
        staffMember.grade?.name ||
        "No Grade Assigned",
    ),
  );

  return {
    summary: {
      totalStaff: selectedStaff.length,
      totalUnits: uniqueUnitIds.size,
      licenseUsage: {
        used: 0,
        max: 0,
        percentage: 0,
        expiryDate: null,
      },
    },
    unitDistribution,
    genderDistribution,
    gradeDistribution,
  };
};

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: { error?: string } } }).response?.data?.error
  ) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error || fallbackMessage;
  }

  return fallbackMessage;
};

export default function AdminAnalytics() {
  const t = useTranslations('AdminAnalyticsPage');
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assessors, setAssessors] = useState<Assessor[]>([]);
  const [trainingDemandData, setTrainingDemandData] = useState<TrainingDemandReport[]>([]);
  const [trainingDemandLoading, setTrainingDemandLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchAssessmentReports = useCallback(async (
    assessmentId: string,
    currentStaffMembers: StaffMember[],
    currentAssessors: Assessor[],
  ) => {
    if (!assessmentId) return;

    try {
      setReportLoading(true);
      setTrainingDemandLoading(true);
      const [assessmentResults, trainingDemandReport] = await Promise.all([
        assessmentResultAPI.getByAssessment(assessmentId),
        trainingDemandAPI.generateReport(assessmentId),
      ]);

      setDashboardData(
        buildAssessmentDashboardData(
          currentStaffMembers,
          currentAssessors,
          assessmentResults,
        ),
      );
      setTrainingDemandData(trainingDemandReport);
    } catch (err: unknown) {
      console.error("Failed to fetch assessment analytics:", err);
      setDashboardData(createEmptyDashboardData());
      setTrainingDemandData([]);
      setError(getErrorMessage(err, "Failed to load assessment analytics"));
    } finally {
      setTrainingDemandLoading(false);
      setReportLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async (preferredAssessmentId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const [assessmentsData, staffData, assessorsData] = await Promise.all([
        assessmentAPI.getAll(),
        staffAPI.getAll(),
        assessorAPI.getAll(),
      ]);

      const sortedAssessments = sortAssessmentsByLatest(assessmentsData);
      const defaultAssessmentId =
        sortedAssessments.find((assessment) => assessment.id === preferredAssessmentId)?.id ||
        sortedAssessments[0]?.id ||
        "";

      setAssessments(sortedAssessments);
      setStaffMembers(staffData);
      setAssessors(assessorsData);
      setSelectedAssessmentId(defaultAssessmentId);

      if (!defaultAssessmentId) {
        setDashboardData(createEmptyDashboardData());
        setTrainingDemandData([]);
      } else {
        await fetchAssessmentReports(
          defaultAssessmentId,
          staffData,
          assessorsData,
        );
      }
    } catch (err: unknown) {
      console.error("Failed to fetch dashboard data:", err);
      setError(getErrorMessage(err, "Failed to load dashboard data"));
    } finally {
      setLoading(false);
    }
  }, [fetchAssessmentReports]);

  useEffect(() => {
    if (
      loading ||
      !selectedAssessmentId ||
      staffMembers.length === 0 ||
      assessors.length === 0
    ) {
      return;
    }

    fetchAssessmentReports(selectedAssessmentId, staffMembers, assessors);
  }, [selectedAssessmentId, loading, staffMembers, assessors, fetchAssessmentReports]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const genderDistributionData = dashboardData
    ? mergeGenderDistribution(dashboardData.genderDistribution)
    : [];
  const selectedAssessmentName = assessments.find(
    (assessment) => assessment.id === selectedAssessmentId,
  )?.name;
  const topUnit = dashboardData?.unitDistribution[0];
  const topGrade = dashboardData?.gradeDistribution[0];
  const totalGenderCount = genderDistributionData.reduce(
    (acc, item) => acc + item.value,
    0,
  );
  const totalTrainingDemandCount = trainingDemandData.length;

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6">
        <div className="overflow-hidden rounded-3xl border bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border bg-white/70 p-4 backdrop-blur">
                  <Skeleton className="mb-3 h-3 w-20" />
                  <Skeleton className="mb-2 h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-white/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <Card className="rounded-3xl border-white/60 shadow-sm">
              <CardHeader>
              <Skeleton className="mb-2 h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
              <Skeleton className="h-72 w-full" />
              </CardContent>
          </Card>

          <div className="grid gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="rounded-3xl border-white/60 shadow-sm">
                <CardHeader>
                  <Skeleton className="mb-2 h-6 w-40" />
                  <Skeleton className="h-4 w-52" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-56 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_28%)] p-4 pt-6">
      <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-linear-to-br from-sky-50 via-white to-cyan-50 shadow-sm">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge variant="secondary" className="rounded-full border border-sky-200/70 bg-white/80 px-3 py-1 text-sky-700 shadow-sm">
                {t('overviewBadge')}
              </Badge>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {t('title')}
                </h2>
                <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  {t('description')}
                </p>
              </div>
            </div>

            <div className="w-full max-w-xl rounded-3xl border border-sky-100 bg-white/85 p-3 shadow-sm backdrop-blur lg:mt-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <IconCalendar className="h-4 w-4 text-sky-600" />
                  {t('assessmentSelectionTitle')}
                </div>
                <Select
                  value={selectedAssessmentId}
                  onValueChange={setSelectedAssessmentId}
                  disabled={reportLoading || assessments.length === 0}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-sky-100 bg-white text-left">
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
                <p className="mt-2 text-xs text-slate-500">
                  {selectedAssessmentName
                    ? `${t('latestAssessment')}: ${selectedAssessmentName}`
                    : t('assessmentSelectionDesc')}
                </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Assessment Selector hidden — auto-selects latest assessment */}

      {dashboardData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-3xl border-white/60 bg-white/85 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700">{t('totalUnits', { count: dashboardData.summary.totalUnits })}</CardTitle>
                  <CardDescription>{t('staffDistributionDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-700">
                  <IconBuilding className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {dashboardData.summary.totalUnits}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {topUnit ? `${t('topUnit')}: ${topUnit.label}` : t('staffDistributionDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/60 bg-white/85 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700">{t('genderDistTitle')}</CardTitle>
                  <CardDescription>{t('genderDistDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                  <IconChartPie className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div className="text-3xl font-semibold text-slate-900">
                    {totalGenderCount}
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {genderDistributionData.length}
                  </Badge>
                </div>
                <div className="rounded-2xl border bg-slate-50/70 p-3 text-sm text-muted-foreground">
                  {t('genderDistFooter')}
                </div>
            
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/60 bg-white/85 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700">{t('trainingPrograms')}</CardTitle>
                  <CardDescription>{t('trainingProgramsDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-orange-100 p-2 text-orange-700">
                  <IconBook className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {totalTrainingDemandCount}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedAssessmentName
                    ? t('basedOnAssessment', { name: selectedAssessmentName })
                    : t('noTrainingDemands')}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/60 bg-white/85 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700">{t('gradeDistTitle')}</CardTitle>
                  <CardDescription>{t('gradeDistDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                  <IconTrendingUp className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {dashboardData.gradeDistribution.length}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {topGrade ? `${t('topGrade')}: ${topGrade.label}` : t('gradeDistDesc')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="grid gap-6">
            {/* Unit Distribution Chart */}
            <Card className="rounded-3xl border-white/60 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex rounded-2xl bg-sky-100 p-2 text-sky-700">
                    <IconChartBar className="h-5 w-5" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                    {t('staffPerUnitTitle')}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                    {t('staffPerUnitDesc')}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-slate-700">
                    {t('totalUnits', { count: dashboardData.unitDistribution.length })}
                  </Badge>
                  <Link href="/admin/analytics/staff-per-unit">
                    <Button variant="outline" size="sm" className="rounded-full px-5">
                      <IconChartBar className="mr-2 h-4 w-4" />
                      {t('viewDetail')}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="max-h-[460px] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {dashboardData.unitDistribution.map((item) => {
                    const highestUnitValue = dashboardData.unitDistribution[0]?.value || 1;
                    const barWidth = Math.max(
                      (item.value / highestUnitValue) * 100,
                      item.value > 0 ? 10 : 0,
                    );

                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className="text-sm font-medium text-slate-700"
                            title={item.label}
                          >
                            {item.label}
                          </p>
                          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                            {item.value}
                          </Badge>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-sky-300 via-blue-500 to-blue-700 transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-3 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium text-slate-800">
                  <TrendingUp className="h-4 w-4 text-sky-600" />
                  {topUnit ? `${t('topUnit')}: ${topUnit.label}` : t('staffDistributionDesc')}
                </div>
                <div className="text-muted-foreground leading-none">
                  {t('staffDistributionDesc')}
                </div>
              </CardFooter>
            </Card>

            {/* Training Demand Chart */}
            <Card className="rounded-3xl border-white/60 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex rounded-2xl bg-orange-100 p-2 text-orange-700">
                    <IconBook className="h-5 w-5" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  {t('trainingDemandTitle')}
                </CardTitle>
                <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                  {t('trainingDemandDesc')}
                </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-slate-700">
                    {totalTrainingDemandCount > 8
                      ? t('showingTopTrainings', { count: totalTrainingDemandCount })
                      : t('totalTrainingsRequired', { count: totalTrainingDemandCount })}
                  </Badge>
                  <Link href="/admin/analytics/training-demand">
                    <Button variant="outline" size="sm" className="rounded-full px-5">
                      <IconBook className="mr-2 h-4 w-4" />
                      {t('viewDetail')}
                    </Button>
                  </Link>
                  
                  {/* <Button variant="outline" size="icon" className="rounded-full" onClick={fetchDashboardData}>
                    <IconRefresh className="h-4 w-4" />
                  </Button> */}
                </div>
              </CardHeader>
              <CardContent>
                {trainingDemandLoading ? (
                  <Skeleton className="h-58 w-full" />
                ) : trainingDemandData.length > 0 ? (
                  <div className="space-y-4">
                    {trainingDemandData.map((item) => {
                      const highestTrainingValue =
                        trainingDemandData[0]?.totalStaffCount || 1;
                      const barWidth = Math.max(
                        (item.totalStaffCount / highestTrainingValue) * 100,
                        item.totalStaffCount > 0 ? 10 : 0,
                      );

                      return (
                        <div key={item.trainingId} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-slate-700">
                              {item.trainingName}
                            </p>
                            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                              {item.totalStaffCount}
                            </Badge>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-orange-300 via-amber-500 to-orange-600 transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-58 items-center justify-center rounded-2xl border border-dashed text-muted-foreground">
                    {t('noTrainingDemands')}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-3 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium text-slate-800">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  {selectedAssessmentName
                    ? t('basedOnAssessment', { name: selectedAssessmentName })
                    : t('selectAssessmentPlaceholder')}
                </div>
                <div className="text-muted-foreground leading-none">
                  {t('trainingProgramsDesc')}
                </div>
              </CardFooter>
            </Card>
            </div>

            <div className="grid gap-6">
            {/* Gender Distribution Chart */}
            <Card className="flex flex-col rounded-3xl border-white/60 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                    <IconChartPie className="h-5 w-5" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                    {t('genderDistTitle')}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6">{t('genderDistDesc')}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start">
                  <Link href="/admin/analytics/gender-distribution">
                    <Button variant="outline" size="sm" className="rounded-full px-5">
                      <IconChartPie className="mr-2 h-4 w-4" />
                      {t('viewDetail')}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ChartContainer
                  config={createGenderChartConfig(genderDistributionData)}
                  className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[230px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent nameKey="value" hideLabel />
                      }
                    />
                    <Pie
                      data={genderDistributionData.map((item) => ({
                        category: item.label.toLowerCase(),
                        label: item.label,
                        value: item.value,
                        fill: `var(--color-${item.label.toLowerCase()})`,
                      }))}
                      dataKey="value"
                    >
                      <LabelList
                        dataKey="category"
                        className="fill-background"
                        stroke="none"
                        fontSize={12}
                        formatter={(value: string) => {
                          const config = createGenderChartConfig(genderDistributionData);
                          return (
                            config[value as keyof typeof config]?.label || value
                          );
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {genderDistributionData.map((item, index) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border bg-slate-50/70 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: `var(--chart-${(index % 3) + 1})` }}
                        />
                        {item.label}
                      </div>
                      <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                        {item.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-3 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium text-slate-800">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  {t('totalStaff', { count: totalGenderCount })}
                </div>
                <div className="text-muted-foreground leading-none">
                  {t('genderDistFooter')}
                </div>
              </CardFooter>
            </Card>

            {/* Grade Distribution Chart */}
            <Card className="rounded-3xl border-white/60 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex rounded-2xl bg-violet-100 p-2 text-violet-700">
                    <IconTrendingUp className="h-5 w-5" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  {t('gradeDistTitle')}
                </CardTitle>
                <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                  {t('gradeDistDesc')}
                </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start">
                  {/* <Badge variant="secondary" className="rounded-full px-3 py-1 text-slate-700">
                    {t('totalGrades', { count: dashboardData.gradeDistribution.length })}
                  </Badge> */}
                  <Link href="/admin/analytics/grade-distribution">
                    <Button variant="outline" size="sm" className="rounded-full px-5">
                      <IconChartBar className="mr-2 h-4 w-4" />
                      {t('viewDetail')}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="max-h-[460px] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {dashboardData.gradeDistribution.map((item) => {
                    const highestGradeValue =
                      dashboardData.gradeDistribution[0]?.value || 1;
                    const barWidth = Math.max(
                      (item.value / highestGradeValue) * 100,
                      item.value > 0 ? 10 : 0,
                    );

                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-700">
                            {item.label}
                          </p>
                          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                            {item.value}
                          </Badge>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-violet-300 via-indigo-500 to-blue-700 transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-3 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium text-slate-800">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  {topGrade ? `${t('topGrade')}: ${topGrade.label}` : t('gradeDistDesc')}
                </div>
                <div className="text-muted-foreground leading-none">
                  {t('gradeDistDesc')}
                </div>
              </CardFooter>
            </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
