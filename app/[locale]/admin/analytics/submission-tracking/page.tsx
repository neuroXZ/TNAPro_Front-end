"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  IconCircleDashed,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface Assessment {
  id: string;
  name: string;
}

type SubmissionState = "SUBMITTED" | "DRAFT" | "NOT_STARTED";

interface StaffSubmissionStatus {
  staffId: string;
  staffName: string | null;
  staffOrgId: string | null;
  positionName: string | null;
  unitName: string | null;
  assessorName: string | null;
  assessorType: string | null;
  status: SubmissionState;
  isSubmitted: boolean;
  submissionDate: string | null;
  startedDate: string | null;
}

interface TypeSummary {
  type: string;
  total: number;
  submitted: number;
  draft: number;
  notStarted: number;
}

interface SubmissionResponse {
  assessmentName: string | null;
  summaryByType: TypeSummary[];
  submissionList: StaffSubmissionStatus[];
}

const ALL = "all";
const KNOWN_TYPES = ["self", "superior", "peer"];

const STATUS_STYLE: Record<SubmissionState, { badge: string; number: string; icon: typeof IconCircleCheck }> = {
  SUBMITTED: { badge: "bg-green-100 text-green-700", number: "text-green-600", icon: IconCircleCheck },
  DRAFT: { badge: "bg-amber-100 text-amber-700", number: "text-amber-600", icon: IconClockHour4 },
  NOT_STARTED: { badge: "bg-red-100 text-red-700", number: "text-red-600", icon: IconCircleDashed },
};

const STATUS_ORDER: SubmissionState[] = ["SUBMITTED", "DRAFT", "NOT_STARTED"];

export default function SubmissionTrackingPage() {
  const t = useTranslations("AdminAnalyticsSubmissionTrackingPage");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentId, setAssessmentId] = useState("");
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [unitFilter, setUnitFilter] = useState(ALL);
  const tableRef = useRef<HTMLDivElement>(null);

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

  const typeLabel = (type: string | null) =>
    type && KNOWN_TYPES.includes(type) ? t(`type_${type}`) : type || "N/A";
  const statusLabel = (s: SubmissionState) => t(`status_${s}`);

  const list = result?.submissionList ?? [];

  const unitOptions = useMemo(
    () => [...new Set(list.map((s) => s.unitName).filter((u): u is string => !!u))].sort((a, b) => a.localeCompare(b)),
    [list],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((s) => {
      if (typeFilter !== ALL && s.assessorType !== typeFilter) return false;
      if (statusFilter !== ALL && s.status !== statusFilter) return false;
      if (unitFilter !== ALL && s.unitName !== unitFilter) return false;
      if (!q) return true;
      return [s.staffName, s.staffOrgId, s.assessorName, s.positionName]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [list, search, typeFilter, statusFilter, unitFilter]);

  const filtersActive = search !== "" || typeFilter !== ALL || statusFilter !== ALL || unitFilter !== ALL;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter(ALL);
    setStatusFilter(ALL);
    setUnitFilter(ALL);
  };

  // Clicking a number on a summary card lists exactly those rows.
  const showRows = (type: string, status: SubmissionState) => {
    setSearch("");
    setUnitFilter(ALL);
    setTypeFilter(type);
    setStatusFilter(status);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

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
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={assessmentId} onValueChange={setAssessmentId}>
            <SelectTrigger className="w-full md:w-[300px]"><SelectValue placeholder={t("placeholderAssessment")} /></SelectTrigger>
            <SelectContent>
              {assessments.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} variant="outline" disabled={loading || !assessmentId} className="gap-2 self-start sm:self-auto">
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
          {(result.summaryByType?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <div className="grid gap-4 md:grid-cols-2">
                {result.summaryByType.map((s) => {
                  const percent = s.total > 0 ? Math.round((s.submitted / s.total) * 100) : 0;
                  const counts: Record<SubmissionState, number> = {
                    SUBMITTED: s.submitted,
                    DRAFT: s.draft,
                    NOT_STARTED: s.notStarted,
                  };
                  return (
                    <Card key={s.type}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {KNOWN_TYPES.includes(s.type) ? t(`typeTitle_${s.type}`) : s.type}
                        </CardTitle>
                        <CardDescription>
                          {t("typeCountLine", { submitted: s.submitted, total: s.total, percent })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <Progress value={percent} className="h-2.5" />
                        <div className="grid grid-cols-3 gap-2">
                          {STATUS_ORDER.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => showRows(s.type, status)}
                              className="rounded-md border px-2 py-2 text-center transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              title={t("clickToList")}
                            >
                              <div className={`text-2xl font-bold ${STATUS_STYLE[status].number}`}>{counts[status]}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{statusLabel(status)}</div>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{t("statusHint")}</p>
            </div>
          )}

          <div ref={tableRef} className="scroll-mt-4">
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
              <CardContent className="flex flex-col gap-4">
                {list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <IconClipboardCheck className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{t("noData")}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                      <div className="relative w-full md:w-[260px]">
                        <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={t("searchPlaceholder")}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full md:w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>{t("filterAllTypes")}</SelectItem>
                          {(result.summaryByType ?? []).map((s) => (
                            <SelectItem key={s.type} value={s.type}>{typeLabel(s.type)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[170px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>{t("filterAllStatuses")}</SelectItem>
                          {STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {unitOptions.length > 0 && (
                        <Select value={unitFilter} onValueChange={setUnitFilter}>
                          <SelectTrigger className="w-full md:w-[220px] [&>span]:truncate"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ALL}>{t("filterAllUnits")}</SelectItem>
                            {unitOptions.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {filtersActive && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 self-start md:self-auto">
                          <IconX className="size-4" />
                          {t("clearFilters")}
                        </Button>
                      )}
                      <span className="text-sm text-muted-foreground md:ml-auto">
                        {t("showingCount", { shown: filtered.length, total: list.length })}
                      </span>
                    </div>

                    <div className="max-h-[560px] overflow-auto rounded-md border">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background">
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">{t("colStaff")}</TableHead>
                            <TableHead className="font-semibold">{t("colAssessorType")}</TableHead>
                            <TableHead className="text-center font-semibold">{t("colStatus")}</TableHead>
                            <TableHead className="text-center font-semibold">{t("colDate")}</TableHead>
                            <TableHead className="font-semibold">{t("colAssessor")}</TableHead>
                            <TableHead className="font-semibold">{t("colUnit")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                {t("noMatch")}
                              </TableCell>
                            </TableRow>
                          ) : filtered.map((s, idx) => {
                            const StatusIcon = STATUS_STYLE[s.status].icon;
                            return (
                              <TableRow key={`${s.staffId}-${s.assessorType}-${idx}`} className="hover:bg-muted/50">
                                <TableCell className="min-w-[200px]">
                                  <div className="font-medium">{s.staffName || "N/A"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {[s.staffOrgId, s.positionName].filter(Boolean).join(" · ") || "—"}
                                  </div>
                                </TableCell>
                                <TableCell>{typeLabel(s.assessorType)}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className={`${STATUS_STYLE[s.status].badge} border-0 gap-1 whitespace-nowrap`}>
                                    <StatusIcon className="size-3.5" /> {statusLabel(s.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground whitespace-nowrap">
                                  {s.status === "SUBMITTED"
                                    ? formatDate(s.submissionDate)
                                    : s.status === "DRAFT"
                                      ? t("startedOn", { date: formatDate(s.startedDate) })
                                      : "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground min-w-[160px]">{s.assessorName || "N/A"}</TableCell>
                                <TableCell className="text-muted-foreground min-w-[180px]">{s.unitName || "—"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
