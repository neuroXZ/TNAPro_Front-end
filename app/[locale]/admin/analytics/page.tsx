"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
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
import { Progress } from "@/components/ui/progress";
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
import { dashboardAPI, trainingDemandAPI, assessmentAPI } from "@/lib/api";
import {
  IconUsers,
  IconBuilding,
  IconLicense,
  IconAlertTriangle,
  IconChartBar,
  IconChartPie,
  IconTrendingUp,
  IconCalendar,
  IconRefresh,
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
  staffList: any[];
}

// Chart configuration for mixed bar charts
const createUnitChartConfig = (data: ChartData[]) => {
  const config: ChartConfig = {
    value: {
      label: "Staff Count",
    },
  };

  data.forEach((item, index) => {
    config[item.label.toLowerCase().replace(/[^a-z0-9]/g, "")] = {
      label: item.label,
      color: `var(--chart-${(index % 5) + 1})`,
    };
  });

  return config;
};

const createGradeChartConfig = (data: ChartData[]) => {
  const config: ChartConfig = {
    value: {
      label: "Staff Count",
    },
  };

  data.forEach((item, index) => {
    config[item.label.toLowerCase()] = {
      label: item.label,
      color: `var(--chart-${(index % 5) + 1})`,
    };
  });

  return config;
};

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

const createTrainingChartConfig = (data: TrainingDemandReport[]) => {
  const config: ChartConfig = {
    value: {
      label: "Staff Count",
    },
  };

  data.forEach((item, index) => {
    config[item.trainingName.toLowerCase().replace(/[^a-z0-9]/g, "")] = {
      label: item.trainingName,
      color: `var(--chart-${(index % 5) + 1})`,
    };
  });

  return config;
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
  const [trainingDemandData, setTrainingDemandData] = useState<TrainingDemandReport[]>([]);
  const [trainingDemandLoading, setTrainingDemandLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await dashboardAPI.getOverview();
      setDashboardData(data);
      
      // Fetch assessments — auto-select the latest by startDate
      const assessmentsData: Assessment[] = await assessmentAPI.getAll();
      setAssessments(assessmentsData);
      if (assessmentsData.length > 0) {
        const latest = [...assessmentsData].sort((a, b) => {
          const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
          const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
          return dateB - dateA;
        })[0];
        setSelectedAssessmentId(latest.id);
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.response?.data?.error || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch training demand data when assessment is selected
  const fetchTrainingDemand = async (assessmentId: string) => {
    if (!assessmentId) return;
    
    try {
      setTrainingDemandLoading(true);
      const data = await trainingDemandAPI.generateReport(assessmentId);
      setTrainingDemandData(data);
    } catch (err: any) {
      console.error("Failed to fetch training demand:", err);
      setTrainingDemandData([]);
    } finally {
      setTrainingDemandLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingDemand(selectedAssessmentId);
  }, [selectedAssessmentId]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getLicenseStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getLicenseStatusText = (percentage: number) => {
    if (percentage >= 90) return "Critical";
    if (percentage >= 75) return "Warning";
    return "Good";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h2>
        </div>
        {/* Loading Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-[150px] mb-2" />
                <Skeleton className="h-3 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Assessment Selector hidden — auto-selects latest assessment */}

      {dashboardData && (
        <>
          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Unit Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5 text-blue-600" />
                  {t('staffPerUnitTitle')}
                </CardTitle>
                <CardDescription>
                  {t('staffPerUnitDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={createUnitChartConfig(
                    dashboardData.unitDistribution.slice(0, 8),
                  )}
                >
                  <BarChart
                    accessibilityLayer
                    data={dashboardData.unitDistribution
                      .slice(0, 8)
                      .map((item, index) => ({
                        category: item.label
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, ""),
                        label: item.label,
                        value: item.value,
                        fill: `var(--color-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "")})`,
                      }))}
                    layout="vertical"
                    margin={{
                      left: 0,
                    }}
                  >
                    <YAxis
                      dataKey="category"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const config = createUnitChartConfig(
                          dashboardData.unitDistribution.slice(0, 8),
                        );
                        return (
                          config[value as keyof typeof config]?.label || value
                        );
                      }}
                    />
                    <XAxis dataKey="value" type="number" hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="value" layout="vertical" radius={5}>
                      <LabelList
                        dataKey="value"
                        position="right"
                        offset={8}
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  {dashboardData.unitDistribution.length > 8
                    ? t('showingTopUnits', { count: dashboardData.unitDistribution.length })
                    : t('totalUnits', { count: dashboardData.unitDistribution.length })}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none mb-3">
                  {t('staffDistributionDesc')}
                </div>
                <Link href="/admin/analytics/staff-per-unit">
                  <Button variant="outline" size="sm" className="w-full">
                    <IconChartBar className="h-4 w-4 mr-2" />
                    {t('viewDetailedStaffList')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Gender Distribution Chart */}
            <Card className="flex flex-col">
              <CardHeader className="items-center">
                <CardTitle className="flex items-center gap-2">
                  <IconChartPie className="h-5 w-5 text-green-600" />
                  {t('genderDistTitle')}
                </CardTitle>
                <CardDescription>{t('genderDistDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ChartContainer
                  config={createGenderChartConfig(
                    dashboardData.genderDistribution,
                  )}
                  className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[230px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent nameKey="value" hideLabel />
                      }
                    />
                    <Pie
                      data={dashboardData.genderDistribution.map((item) => ({
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
                          const config = createGenderChartConfig(
                            dashboardData.genderDistribution,
                          );
                          return (
                            config[value as keyof typeof config]?.label || value
                          );
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                  {t('totalStaff', { count: dashboardData.genderDistribution.reduce((acc, item) => acc + item.value, 0) })}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                  {t('genderDistFooter')}
                </div>
              </CardFooter>
            </Card>

            {/* Grade Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="h-5 w-5 text-purple-600" />
                  {t('gradeDistTitle')}
                </CardTitle>
                <CardDescription>
                  {t('gradeDistDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={createGradeChartConfig(
                    dashboardData.gradeDistribution,
                  )}
                >
                  <BarChart
                    accessibilityLayer
                    data={dashboardData.gradeDistribution.map(
                      (item, index) => ({
                        category: item.label
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, ""),
                        label: item.label,
                        value: item.value,
                        fill: `var(--color-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "")})`,
                      }),
                    )}
                    layout="vertical"
                    margin={{
                      left: 0,
                    }}
                  >
                    <YAxis
                      dataKey="category"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const config = createGradeChartConfig(
                          dashboardData.gradeDistribution,
                        );
                        return (
                          config[value as keyof typeof config]?.label || value
                        );
                      }}
                    />
                    <XAxis dataKey="value" type="number" hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="value" layout="vertical" radius={5} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  {t('totalGrades', { count: dashboardData.gradeDistribution.length })}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none mb-3">
                  {t('gradeDistDesc')}
                </div>
                <Link href="/admin/analytics/grade-distribution">
                  <Button variant="outline" size="sm" className="w-full">
                    <IconChartBar className="h-4 w-4 mr-2" />
                    {t('viewDetailedGradeDist')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            {/* Training Demand Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBook className="h-5 w-5 text-orange-600" />
                  {t('trainingDemandTitle')}
                </CardTitle>
                <CardDescription>
                  {t('trainingDemandDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trainingDemandLoading ? (
                  <Skeleton className="h-[230px] w-full" />
                ) : trainingDemandData.length > 0 ? (
                  <ChartContainer
                    config={createTrainingChartConfig(
                      trainingDemandData.slice(0, 8),
                    )}
                  >
                    <BarChart
                      accessibilityLayer
                      data={trainingDemandData.slice(0, 8).map((item) => ({
                        category: item.trainingName
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, ""),
                        label: item.trainingName,
                        value: item.totalStaffCount,
                        fill: `var(--color-${item.trainingName.toLowerCase().replace(/[^a-z0-9]/g, "")})`,
                      }))}
                      layout="vertical"
                      margin={{
                        left: 0,
                      }}
                    >
                      <YAxis
                        dataKey="category"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const config = createTrainingChartConfig(
                            trainingDemandData.slice(0, 8),
                          );
                          return (
                            config[value as keyof typeof config]?.label || value
                          );
                        }}
                      />
                      <XAxis dataKey="value" type="number" hide />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="value" layout="vertical" radius={5}>
                        <LabelList
                          dataKey="value"
                          position="right"
                          offset={8}
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[230px] flex items-center justify-center text-muted-foreground">
                    {t('noTrainingDemands')}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  {trainingDemandData.length > 8
                    ? t('showingTopTrainings', { count: trainingDemandData.length })
                    : t('totalTrainingsRequired', { count: trainingDemandData.length })}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none mb-3">
                  {t('basedOnAssessment', { name: assessments.find(a => a.id === selectedAssessmentId)?.name || t('selectAssessmentPlaceholder') })}
                </div>
                <Link href="/admin/analytics/training-demand">
                  <Button variant="outline" size="sm" className="w-full">
                    <IconBook className="h-4 w-4 mr-2" />
                    {t('viewFullTrainingReport')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
