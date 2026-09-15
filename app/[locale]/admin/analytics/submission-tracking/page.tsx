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
import { assessmentAPI, submissionAPI } from "@/lib/api";
import {
  IconChevronLeft,
  IconRefresh,
  IconAlertTriangle,
  IconClipboardCheck,
  IconDownload,
  IconCircleCheck,
  IconClockHour4,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface Assessment {
  id: string;
  name: string;
}

interface StaffSubmissionStatus {
  staffId: string;
  staffName: string | null;
  positionName: string | null;
  assessorName: string | null;
  assessorType: string | null;
  isSubmitted: boolean;
  submissionDate: string | null;
}

interface SubmissionResponse {
  assessmentName: string | null;
  submissionList: StaffSubmissionStatus[];
}

export default function SubmissionTrackingPage() {
  const t = useTranslations("AdminAnalyticsSubmissionTrackingPage");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assessmentAPI.getAll()
      .then((a) => {
        setAssessments(a || []);
        if (a && a.length > 0) setAssessmentId(a[0].id);
      })
      .catch(() => setError(t("errorLoadSelectors")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!assessmentId) return;
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const handleGenerate = async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await submissionAPI.getReport(assessmentId);
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
      const response = await submissionAPI.exportCsv(assessmentId);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Submission_Report_${assessmentId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    }
  };

  const submittedCount = result?.submissionList.filter((s) => s.isSubmitted).length ?? 0;
  const totalCount = result?.submissionList.length ?? 0;
  const completionPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

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
            <IconClipboardCheck className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("selectAssessmentTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Select value={assessmentId} onValueChange={setAssessmentId}>
            <SelectTrigger className="w-full md:w-[300px]"><SelectValue placeholder={t("placeholderAssessment")} /></SelectTrigger>
            <SelectContent>
              {assessments.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} variant="outline" disabled={loading || !assessmentId} className="gap-2">
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("refreshButton")}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : result && (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="text-center py-4 px-2">
              <div className="text-2xl font-bold">{totalCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("summaryTotal")}</div>
            </Card>
            <Card className="text-center py-4 px-2">
              <div className="text-2xl font-bold text-green-600">{submittedCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("summarySubmitted")}</div>
            </Card>
            <Card className="text-center py-4 px-2">
              <div className="text-2xl font-bold text-orange-500">{totalCount - submittedCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("summaryPending")}</div>
            </Card>
            <Card className="text-center py-4 px-2">
              <div className="text-2xl font-bold text-sky-600">{completionPercent}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("summaryCompletion")}</div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("resultsTitle")}</CardTitle>
              <CardDescription className="flex items-center justify-between gap-4">
                <span>{result.assessmentName}</span>
                <Button variant="default" size="sm" onClick={handleExportCsv}>
                  <IconDownload className="size-4 mr-2" />
                  {t("exportCsv")}
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.submissionList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <IconClipboardCheck className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t("noData")}</p>
                </div>
              ) : (
                <Card className="max-h-[500px] overflow-scroll">
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">{t("colStaff")}</TableHead>
                          <TableHead className="font-semibold">{t("colPosition")}</TableHead>
                          <TableHead className="font-semibold">{t("colAssessorType")}</TableHead>
                          <TableHead className="font-semibold">{t("colAssessor")}</TableHead>
                          <TableHead className="text-center font-semibold">{t("colStatus")}</TableHead>
                          <TableHead className="text-center font-semibold">{t("colDate")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.submissionList.map((s, idx) => (
                          <TableRow key={`${s.staffId}-${s.assessorType}-${idx}`} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{s.staffName || "N/A"}</TableCell>
                            <TableCell className="text-muted-foreground">{s.positionName || "N/A"}</TableCell>
                            <TableCell className="capitalize">{s.assessorType || "N/A"}</TableCell>
                            <TableCell className="text-muted-foreground">{s.assessorName || "N/A"}</TableCell>
                            <TableCell className="text-center">
                              {s.isSubmitted ? (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-0 gap-1">
                                  <IconCircleCheck className="size-3.5" /> {t("statusSubmitted")}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-0 gap-1">
                                  <IconClockHour4 className="size-3.5" /> {t("statusPending")}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {s.submissionDate ? new Date(s.submissionDate).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
