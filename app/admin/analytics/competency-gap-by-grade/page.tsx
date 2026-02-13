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
import { assessmentAPI, competencyReportAPI } from "@/lib/api";
import {
  IconRefresh,
  IconAlertTriangle,
  IconChevronLeft,
  IconFileBarcode,
  IconDownload,
} from "@tabler/icons-react";
import Link from "next/link";

interface GapResult {
  Grade: string;
  AverageGap: string | number;
}

interface CompetencyGapData {
  Competency: string;
  Results: GapResult[];
}

interface Assessment {
  id: string;
  name: string;
}

const getGapColor = (
  gap: number,
): { bg: string; text: string; badge: string } => {
  if (gap >= 0.75)
    return { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" };
  if (gap >= 0.5)
    return {
      bg: "bg-orange-50",
      text: "text-orange-700",
      badge: "bg-orange-100",
    };
  if (gap >= 0.25)
    return {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      badge: "bg-yellow-100",
    };
  return { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100" };
};

const getGapLabel = (gap: number): string => {
  if (gap >= 0.75) return "High Gap";
  if (gap >= 0.5) return "Medium Gap";
  if (gap >= 0.25) return "Low Gap";
  return "Minimal Gap";
};

export default function CompetencyGapByGradePage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [data, setData] = useState<CompetencyGapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<string[]>([]);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const assessmentsData = await assessmentAPI.getAll();
      setAssessments(assessmentsData || []);

      // Set first assessment as default
      if (assessmentsData && assessmentsData.length > 0) {
        setSelectedAssessmentId(assessmentsData[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
      setError("Failed to load assessments");
    }
  };

  useEffect(() => {
    if (selectedAssessmentId) {
      fetchGapData();
    }
  }, [selectedAssessmentId]);

  const fetchGapData = async () => {
    if (!selectedAssessmentId) return;

    setLoading(true);
    setError(null);

    try {
      const reportData =
        await competencyReportAPI.getGapByGrade(selectedAssessmentId);
      setData(reportData || []);

      // Extract all unique grades
      const gradeSet = new Set<string>();
      reportData.forEach((item: CompetencyGapData) => {
        item.Results.forEach((result: GapResult) => {
          gradeSet.add(result.Grade);
        });
      });
      setGrades(Array.from(gradeSet));
    } catch (err) {
      console.error("Failed to fetch gap data:", err);
      setError("Failed to load competency gap data. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getGradeValue = (
    competency: CompetencyGapData,
    grade: string,
  ): number | null => {
    const result = competency.Results.find((r) => r.Grade === grade);
    return result ? parseFloat(result.AverageGap.toString()) : null;
  };

  const calculateAverageGap = (competency: CompetencyGapData): number => {
    if (competency.Results.length === 0) return 0;
    const sum = competency.Results.reduce(
      (acc, result) => acc + parseFloat(result.AverageGap.toString()),
      0,
    );
    return sum / competency.Results.length;
  };

  const handleExportCSV = async () => {
    if (!selectedAssessmentId) return

    try {
      const response = await competencyReportAPI.exportCsv({
        assessmentId: selectedAssessmentId
      })

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `CompetencyGap_${selectedAssessmentId}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("CSV Export Error:", error)
    }
  }

  const handleExportPDF = async () => {
    if (!selectedAssessmentId) return

    try {
      const response = await competencyReportAPI.exportPdf({
        assessmentId: selectedAssessmentId
      })

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `CompetencyGap_${selectedAssessmentId}_${new Date().toISOString().slice(0, 10)}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("PDF Export Error:", error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <IconFileBarcode className="h-8 w-8" />
              Competency Gap by Grade
            </h1>
            <p className="text-muted-foreground">
              Average competency gaps across grades
            </p>
          </div>
        </div>
        <Button
          onClick={fetchGapData}
          variant="outline"
          disabled={loading || !selectedAssessmentId}
          className="gap-2"
        >
          <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Assessment Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Assessment</CardTitle>
          <CardDescription>
            Choose an assessment to view competency gaps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAssessmentId}
            onValueChange={setSelectedAssessmentId}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select an assessment..." />
            </SelectTrigger>
            <SelectContent>
              {assessments.map((assessment) => (
                <SelectItem key={assessment.id} value={assessment.id}>
                  {assessment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gap Analysis by Grade</CardTitle>
          <CardDescription>
            Lower gap values indicate better alignment with required competency
            levels
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <IconDownload className="size-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <IconDownload className="size-4 mr-2" />
                    Export PDF
                  </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <IconFileBarcode className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No gap data available for the selected assessment
              </p>
            </div>
          ) : (
            <Card className="max-h-[500px] overflow-scroll">
              <CardContent>
                {/* < className="max-h-[500px] overflow-y-auto overflow-x-auto  "> */}
                <Table >
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        Competency
                      </TableHead>
                      {grades.map((grade) => (
                        <TableHead
                          key={grade}
                          className="text-center font-semibold"
                        >
                          {grade}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold">
                        Average Gap
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody >
                    {data.map((competency, idx) => {
                      const avgGap = calculateAverageGap(competency);
                      const gapColor = getGapColor(avgGap);

                      return (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {competency.Competency}
                          </TableCell>
                          {grades.map((grade) => {
                            const gapValue = getGradeValue(competency, grade);

                            return (
                              <TableCell key={grade} className="text-center">
                                {gapValue !== null ? (
                                  (() => {
                                    const color = getGapColor(gapValue);
                                    return (
                                      <Badge
                                        variant="outline"
                                        className={`${color.badge} ${color.text} border-0`}
                                      >
                                        {gapValue.toFixed(2)}
                                      </Badge>
                                    );
                                  })()
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`${gapColor.badge} ${gapColor.text} border-0 font-semibold`}
                            >
                              {avgGap.toFixed(2)}
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

      {/* Legend */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gap Interpretation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  gap: 0.1,
                  label: "Minimal Gap",
                  color: "bg-green-100",
                  textColor: "text-green-700",
                },
                {
                  gap: 0.5,
                  label: "Low Gap",
                  color: "bg-yellow-100",
                  textColor: "text-yellow-700",
                },
                {
                  gap: 0.65,
                  label: "Medium Gap",
                  color: "bg-orange-100",
                  textColor: "text-orange-700",
                },
                {
                  gap: 0.85,
                  label: "High Gap",
                  color: "bg-red-100",
                  textColor: "text-red-700",
                },
              ].map((item) => (
                <div key={item.gap} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${item.color} ${item.textColor} border-0`}
                  >
                    {item.gap.toFixed(2)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
