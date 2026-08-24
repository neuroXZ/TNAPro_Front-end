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

type Translate = ReturnType<typeof useTranslations>;

const createGenderChartConfig = (data: ChartData[], t: Translate) => {
  const config: ChartConfig = {
    value: {
      label: t('staffCountLabel'),
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

const normalizeGenderLabel = (label: string, t: Translate) => {
  const value = label.trim();

  if (!value) return t('genderUnspecified');

  const normalized = value.toLowerCase();

  if (["male", "lelaki", "m"].includes(normalized)) return t('genderMale');
  if (["female", "perempuan", "f"].includes(normalized)) return t('genderFemale');

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const mergeGenderDistribution = (data: ChartData[], t: Translate) => {
  const groupedData = new Map<string, number>();

  data.forEach((item) => {
    const normalizedLabel = normalizeGenderLabel(item.label, t);
    groupedData.set(
      normalizedLabel,
      (groupedData.get(normalizedLabel) || 0) + item.value,
    );
  });

  const displayOrder = [t('genderMale'), t('genderFemale'), t('genderUnspecified')];

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
  t: Translate,
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
      (staffMember) => staffMember.unit?.name || t('noUnitAssigned'),
    ),
  );
  const genderDistribution = buildDistribution(
    selectedStaff.map(
      (staffMember) => normalizeGenderLabel(staffMember.gender || "", t),
    ),
  );
  const gradeDistribution = buildDistribution(
    selectedStaff.map(
      (staffMember) =>
        staffMember.position?.grade?.name ||
        staffMember.grade?.name ||
        t('noGradeAssigned'),
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

const TECHNICAL_ERROR_PATTERNS = [
  /invalid\s+`prisma\./i,
  /can'?t\s+reach\s+database\s+server/i,
  /database\s+server/i,
  /econnrefused/i,
  /connect\s+etimedout/i,
  /connect\s+ehostunreach/i,
  /\bP\d{4}\b/i,
];

const sanitizeApiErrorMessage = (message?: string): string | null => {
  if (!message) return null;

  const normalizedMessage = message.trim();
  if (!normalizedMessage) return null;

  const isTechnicalError = TECHNICAL_ERROR_PATTERNS.some((pattern) =>
    pattern.test(normalizedMessage),
  );

  return isTechnicalError ? null : normalizedMessage;
};

const getErrorMessage = (error: unknown, fallbackMessage: string): string | null => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: { error?: string } } }).response?.data?.error
  ) {
    const responseMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
    return sanitizeApiErrorMessage(responseMessage) || null;
  }

  if (error instanceof Error) {
    return sanitizeApiErrorMessage(error.message) || null;
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
          t,
        ),
      );
      setTrainingDemandData(trainingDemandReport);
    } catch (err: any) {
      console.error("Failed to fetch assessment analytics:", err);
      setDashboardData(createEmptyDashboardData());
      setTrainingDemandData([]);
      setError(getErrorMessage(err, t('loadAnalyticsError')));
    } finally {
      setTrainingDemandLoading(false);
      setReportLoading(false);
    }
  }, [t]);

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
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setDashboardData(createEmptyDashboardData());
      setTrainingDemandData([]);
      setError(getErrorMessage(err, t('loadDashboardError')));
    } finally {
      setLoading(false);
    }
  }, [fetchAssessmentReports, t]);

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
    ? mergeGenderDistribution(dashboardData.genderDistribution, t)
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
        <div className="overflow-hidden rounded-3xl border border-sky-100/80 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/30 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border bg-white/70 dark:bg-slate-900/40 p-4 backdrop-blur">
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
            <Card key={i} className="rounded-2xl border-white/60 dark:border-white/10 shadow-sm">
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
          <Card className="rounded-3xl border-white/60 dark:border-white/10 shadow-sm">
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
              <Card key={i} className="rounded-3xl border-white/60 dark:border-white/10 shadow-sm">
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
    <div className="flex-1 space-y-6 ">
      <section className="overflow-hidden rounded-3xl border border-sky-100/80 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/30 shadow-sm">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge variant="secondary" className="rounded-full border border-sky-200/70 dark:border-sky-800/40 bg-white/80 dark:bg-white/10 px-3 py-1 text-sky-700 dark:text-sky-300 shadow-sm">
                {t('overviewBadge')}
              </Badge>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                  {t('title')}
                </h2>
                <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                  {t('description')}
                </p>
              </div>
            </div>

            <div className="w-full max-w-xl rounded-3xl border border-sky-100 dark:border-sky-900/40 bg-white/85 dark:bg-slate-900/60 p-3 shadow-sm backdrop-blur lg:mt-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <IconCalendar className="h-4 w-4 text-sky-600" />
                {t('assessmentSelectionTitle')}
              </div>
              <Select
                value={selectedAssessmentId}
                onValueChange={setSelectedAssessmentId}
                disabled={reportLoading || assessments.length === 0}
              >
                <SelectTrigger className="h-11 rounded-2xl border-sky-100 dark:border-sky-900/40 bg-white dark:bg-slate-900/60 text-left">
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
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
            <Card className="rounded-3xl border-white/60 dark:border-white/10 bg-white/85 dark:bg-slate-900/60 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('totalUnits', { count: dashboardData.summary.totalUnits })}</CardTitle>
                  <CardDescription>{t('staffDistributionDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 p-2 text-indigo-700 dark:text-indigo-300">
                  <IconBuilding className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  {dashboardData.summary.totalUnits}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {topUnit ? `${t('topUnit')}: ${topUnit.label}` : t('staffDistributionDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/60 dark:border-white/10 bg-white/85 dark:bg-slate-900/60 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('genderDistTitle')}</CardTitle>
                  <CardDescription>{t('genderDistDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 p-2 text-emerald-700 dark:text-emerald-300">
                  <IconChartPie className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
                    {totalGenderCount}
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {genderDistributionData.length}
                  </Badge>
                </div>
                <div className="rounded-2xl border bg-slate-50/70 dark:bg-slate-800/40 p-3 text-sm text-muted-foreground">
                  {t('genderDistFooter')}
                </div>

              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/60 dark:border-white/10 bg-white/85 dark:bg-slate-900/60 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('trainingPrograms')}</CardTitle>
                  <CardDescription>{t('trainingProgramsDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-orange-100 dark:bg-orange-500/20 p-2 text-orange-700 dark:text-orange-300">
                  <IconBook className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  {totalTrainingDemandCount}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedAssessmentName
                    ? t('basedOnAssessment', { name: selectedAssessmentName })
                    : t('noTrainingDemands')}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/60 dark:border-white/10 bg-white/85 dark:bg-slate-900/60 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('gradeDistTitle')}</CardTitle>
                  <CardDescription>{t('gradeDistDesc')}</CardDescription>
                </div>
                <div className="rounded-2xl bg-violet-100 dark:bg-violet-500/20 p-2 text-violet-700 dark:text-violet-300">
                  <IconTrendingUp className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
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


              {/* Grade Distribution Chart */}
              <Card className="rounded-3xl border-white/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 shadow-sm backdrop-blur">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-3 inline-flex rounded-2xl bg-violet-100 dark:bg-violet-500/20 p-2 text-violet-700 dark:text-violet-300">
                      <IconTrendingUp className="h-5 w-5" />
                    </div>
                    <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-slate-50">
                      {t('gradeDistTitle')}
                    </CardTitle>
                    <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                      {t('gradeDistDesc')}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-slate-700 dark:text-slate-200">
                    {t('totalGrades', { count: dashboardData.gradeDistribution.length })}
                  </Badge>
                    <Link href="/admin/analytics/grade-distribution">
                      <Button variant="outline" size="sm" className="rounded-full px-5">
                        <IconChartBar className="mr-2 h-4 w-4" />
                        {t('viewDetail')}
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[360px] overflow-y-auto pr-2">
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
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {item.label}
                            </p>
                            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                              {item.value}
                            </Badge>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-indigo-600 transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-3 text-sm">
                  <div className="flex items-center gap-2 leading-none font-medium text-slate-800 dark:text-slate-100">
                    <TrendingUp className="h-4 w-4 text-violet-600" />
                    {topGrade ? `${t('topGrade')}: ${topGrade.label}` : t('gradeDistDesc')}
                  </div>
                  <div className="text-muted-foreground leading-none">
                    {t('gradeDistDesc')}
                  </div>
                </CardFooter>
              </Card>


            </div>
            <div className="grid gap-6">
              {/* Gender Distribution Chart */}
              <Card className="flex flex-col rounded-3xl border-white/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 shadow-sm backdrop-blur">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-3 inline-flex rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 p-2 text-emerald-700 dark:text-emerald-300">
                      <IconChartPie className="h-5 w-5" />
                    </div>
                    <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-slate-50">
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
                    config={createGenderChartConfig(genderDistributionData, t)}
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
                            const config = createGenderChartConfig(genderDistributionData, t);
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
                        className="flex items-center justify-between rounded-2xl border bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
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
                  <div className="flex items-center gap-2 leading-none font-medium text-slate-800 dark:text-slate-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    {t('totalStaff', { count: totalGenderCount })}
                  </div>
                  <div className="text-muted-foreground leading-none">
                    {t('genderDistFooter')}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
          {/* Unit Distribution Chart */}
          <Card className="rounded-3xl border-white/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex rounded-2xl bg-sky-100 dark:bg-sky-500/20 p-2 text-sky-700 dark:text-sky-300">
                  <IconChartBar className="h-5 w-5" />
                </div>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-slate-50">
                  {t('staffPerUnitTitle')}
                </CardTitle>
                <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                  {t('staffPerUnitDesc')}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-slate-700 dark:text-slate-200">
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
                          className="text-sm font-medium text-slate-700 dark:text-slate-200"
                          title={item.label}
                        >
                          {item.label}
                        </p>
                        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                          {item.value}
                        </Badge>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-3 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium text-slate-800 dark:text-slate-100">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                {topUnit ? `${t('topUnit')}: ${topUnit.label}` : t('staffDistributionDesc')}
              </div>
              <div className="text-muted-foreground leading-none">
                {t('staffDistributionDesc')}
              </div>
            </CardFooter>
          </Card>


          {/* Training Demand Chart */}
          <Card className="rounded-3xl border-white/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex rounded-2xl bg-orange-100 dark:bg-orange-500/20 p-2 text-orange-700 dark:text-orange-300">
                  <IconBook className="h-5 w-5" />
                </div>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-slate-50">
                  {t('trainingDemandTitle')}
                </CardTitle>
                <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                  {t('trainingDemandDesc')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">

                <Badge variant="secondary" className="rounded-full px-3 py-1 text-slate-700 dark:text-slate-200">
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
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {item.trainingName}
                          </p>
                          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                            {item.totalStaffCount}
                          </Badge>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all"
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
              <div className="flex items-center gap-2 leading-none font-medium text-slate-800 dark:text-slate-100">
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


        </>
      )}
    </div>
  );
}
