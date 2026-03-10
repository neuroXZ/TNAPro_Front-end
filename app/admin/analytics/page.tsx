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

export default function AdminAnalytics() {
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
      
      // Fetch assessments
      const assessmentsData = await assessmentAPI.getAll();
      setAssessments(assessmentsData);
      if (assessmentsData.length > 0) {
        setSelectedAssessmentId(assessmentsData[0].id);
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
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">
            Dashboard overview and organizational insights
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Assessment Selector for Training Demand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Selection</CardTitle>
          <CardDescription>
            Select an assessment to view training demand analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an assessment" />
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
        </CardContent>
      </Card>

      {dashboardData && (
        <>
          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Unit Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5 text-blue-600" />
                  Staff per Unit
                </CardTitle>
                <CardDescription>
                  Distribution of staff across organizational units
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
                    ? `Showing top 8 of ${dashboardData.unitDistribution.length} units`
                    : `Total ${dashboardData.unitDistribution.length} units`}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none mb-3">
                  Staff distribution across organizational units
                </div>
                <Link href="/admin/analytics/staff-per-unit">
                  <Button variant="outline" size="sm" className="w-full">
                    <IconChartBar className="h-4 w-4 mr-2" />
                    View Detailed Staff List
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Gender Distribution Chart */}
            <Card className="flex flex-col">
              <CardHeader className="items-center">
                <CardTitle className="flex items-center gap-2">
                  <IconChartPie className="h-5 w-5 text-green-600" />
                  Gender Distribution
                </CardTitle>
                <CardDescription>Staff distribution by gender</CardDescription>
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
                  Total:{" "}
                  {dashboardData.genderDistribution.reduce(
                    (acc, item) => acc + item.value,
                    0,
                  )}{" "}
                  staff
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                  Gender distribution across organization
                </div>
              </CardFooter>
            </Card>

            {/* Grade Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="h-5 w-5 text-purple-600" />
                  Grade Distribution
                </CardTitle>
                <CardDescription>
                  Staff distribution across grade levels
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
                  Total {dashboardData.gradeDistribution.length} grades
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none mb-3">
                  Staff distribution across grade levels
                </div>
                <Link href="/admin/analytics/grade-distribution">
                  <Button variant="outline" size="sm" className="w-full">
                    <IconChartBar className="h-4 w-4 mr-2" />
                    View Detailed Grade Distribution
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            {/* Training Demand Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBook className="h-5 w-5 text-orange-600" />
                  Training Demand
                </CardTitle>
                <CardDescription>
                  Staff requiring training by program
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trainingDemandLoading ? (
                  <Skeleton className="h-[230px] w-full" />
                ) : trainingDemandData.length > 0 ? (
                  <ChartContainer
                    config={{
                      staffCount: {
                        label: "Staff Requiring Training",
                        color: "var(--chart-2)",
                      },
                    }}
                  >
                    <BarChart
                      accessibilityLayer
                      data={trainingDemandData.slice(0, 8).map((item) => ({
                        name: item.trainingName.substring(0, 20),
                        staffCount: item.totalStaffCount,
                        fullName: item.trainingName,
                      }))}
                      layout="vertical"
                      margin={{
                        left: 100,
                      }}
                    >
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        width={95}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <XAxis dataKey="staffCount" type="number" />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="staffCount" layout="vertical" radius={5}>
                        <LabelList
                          dataKey="staffCount"
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
                    No training demands identified
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  {trainingDemandData.length > 8
                    ? `Showing top 8 of ${trainingDemandData.length} trainings`
                    : `Total ${trainingDemandData.length} trainings required`}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none mb-3">
                  Based on assessment: {assessments.find(a => a.id === selectedAssessmentId)?.name || "Select an assessment"}
                </div>
                <Link href="/admin/analytics/training-demand">
                  <Button variant="outline" size="sm" className="w-full">
                    <IconBook className="h-4 w-4 mr-2" />
                    View Full Training Demand Report
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
