"use client";

import { useState, useEffect } from "react";
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
import { assessmentAPI, trainingDemandAPI } from "@/lib/api";
import {
  IconRefresh,
  IconAlertTriangle,
  IconChevronLeft,
  IconDownload,
  IconBook,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";

interface TrainingDemandItem {
  trainingName: string;
  staffName: string;
  unitName: string;
  gap: number;
  triggerCompetency: string;
}

interface TrainingDemandReport {
  trainingId: string;
  trainingName: string;
  totalStaffCount: number;
  staffList: TrainingDemandItem[];
}

interface Assessment {
  id: string;
  name: string;
}

const getGapColor = (
  gap: number
): { bg: string; text: string; badge: string } => {
  if (gap >= 2) return { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" };
  if (gap >= 1.5)
    return {
      bg: "bg-orange-50",
      text: "text-orange-700",
      badge: "bg-orange-100",
    };
  return { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" };
};

const getGapLabel = (gap: number): string => {
  if (gap >= 2) return "Critical Gap";
  if (gap >= 1.5) return "High Gap";
  return "Moderate Gap";
};

export default function TrainingDemandPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [demandData, setDemandData] = useState<TrainingDemandReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch assessments on mount
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoadingAssessments(true);
        const data = await assessmentAPI.getAll();
        setAssessments(data);
        if (data.length > 0) {
          setSelectedAssessmentId(data[0].id);
        }
      } catch (err) {
        toast.error("Failed to load assessments");
        console.error(err);
      } finally {
        setIsLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, []);

  // Fetch demand data when assessment is selected
  useEffect(() => {
    if (!selectedAssessmentId) return;

    const fetchDemandData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await trainingDemandAPI.generateReport(selectedAssessmentId);
        setDemandData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load training demand data";
        setError(errorMessage);
        toast.error(errorMessage);
        setDemandData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemandData();
  }, [selectedAssessmentId]);

  const handleExport = async () => {
    if (!selectedAssessmentId) return;

    try {
      setIsExporting(true);
      const response = await trainingDemandAPI.exportCsv(selectedAssessmentId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Training_Demand_${selectedAssessmentId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Report exported successfully");
    } catch (err) {
      toast.error("Failed to export report");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalStaffWithGap = demandData.reduce(
    (sum, training) => sum + training.totalStaffCount,
    0
  );
  const totalTrainingsRecommended = demandData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/training-demand" className="flex items-center gap-2">
            <IconBook className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Training Demand</h1>
          </Link>
        </div>
      </div>

      {/* Assessment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Assessment</CardTitle>
          <CardDescription>Choose an assessment to view training demand report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingAssessments ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Assessment</label>
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
              <Button
                onClick={handleExport}
                disabled={isExporting || !selectedAssessmentId || demandData.length === 0}
                variant="outline"
                size="sm"
              >
                <IconDownload className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {!isLoading && demandData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Trainings Recommended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalTrainingsRecommended}</div>
              <p className="text-xs text-gray-500 mt-1">Based on competency gaps</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Staff Requiring Training</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStaffWithGap}</div>
              <p className="text-xs text-gray-500 mt-1">Across all trainings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Gap Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(
                  demandData.reduce((sum, training) => {
                    const trainingGapSum = training.staffList.reduce((s, staff) => s + staff.gap, 0);
                    return sum + trainingGapSum;
                  }, 0) / Math.max(totalStaffWithGap, 1)
                ).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Weighted average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && demandData.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <IconAlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {selectedAssessmentId
                  ? "No training demands identified for this assessment."
                  : "Please select an assessment to view training demands."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trainings List */}
      {!isLoading &&
        demandData.map((training) => (
          <Card key={training.trainingId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{training.trainingName}</CardTitle>
                  <CardDescription>
                    {training.totalStaffCount} staff require this training
                  </CardDescription>
                </div>
                <Badge variant="secondary">{training.totalStaffCount} Staff</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Deficient Competency</TableHead>
                      <TableHead className="text-right">Gap Score</TableHead>
                      <TableHead className="text-right">Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {training.staffList.map((staff, idx) => {
                      const gapColor = getGapColor(staff.gap);
                      return (
                        <TableRow key={`${training.trainingId}-${idx}`}>
                          <TableCell className="font-medium">{staff.staffName}</TableCell>
                          <TableCell>{staff.unitName}</TableCell>
                          <TableCell>{staff.triggerCompetency}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{staff.gap.toFixed(2)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                staff.gap >= 2
                                  ? "destructive"
                                  : staff.gap >= 1.5
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {getGapLabel(staff.gap)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
