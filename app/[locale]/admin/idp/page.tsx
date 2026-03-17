"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  staffAPI,
  assessmentAPI,
  idpAPI,
  unitAPI,
  competencyAPI,
} from "@/lib/api";
import { toast } from "sonner";
import { IconCheck, IconSelector } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  IconFileText,
  IconDownload,
  IconUserCheck,
  IconTarget,
  IconTrendingUp,
  IconInfoCircle,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface Staff {
  id: string;
  name: string;
  staffOrgId: string;
  unitId?: string;
  unit?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
}

interface Assessment {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Unit {
  id: string;
  name: string;
}

interface Cluster {
  id: string;
  name: string;
}

interface CompetencyAnalysis {
  competencyId: string;
  competencyName: string;
  trainingName?: string;
  requiredLevel: number;
  selfScore: number;
  superiorScore: number;
  totalScore: number;
  gap: number;
  clusterId?: string;
  clusterName?: string;
  developmentStrategies: {
    training: boolean;
    coaching: boolean;
    selfLearning: boolean;
    workExperience: boolean;
  };
}

interface IdpResult {
  staffId: string;
  staffName: string;
  positionName: string;
  competencyAnalysis: CompetencyAnalysis[];
  generatedAt: string;
}

export default function AdminIdpPage() {
  const t = useTranslations('AdminIdpPage');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaffList, setFilteredStaffList] = useState<Staff[]>([]);
  const [unitList, setUnitList] = useState<Unit[]>([]);
  const [clusterList, setClusterList] = useState<Cluster[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedResultCluster, setSelectedResultCluster] =
    useState<string>("all");
  const [competenciesData, setCompetenciesData] = useState<any[]>([]);
  const [idpResult, setIdpResult] = useState<IdpResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTrainingPopupOpen, setIsTrainingPopupOpen] = useState(false);
  const [openStaffCombobox, setOpenStaffCombobox] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Filter staff based on selected unit
    if (selectedUnit === "all") {
      setFilteredStaffList(staffList);
    } else {
      const filtered = staffList.filter(
        (staff) => staff.unitId === selectedUnit,
      );
      setFilteredStaffList(filtered);
    }

    // Reset selected staff if not in filtered list
    if (selectedStaff && selectedUnit !== "all") {
      const isSelectedStaffInFiltered = filteredStaffList.some(
        (staff) => staff.id === selectedStaff,
      );
      if (!isSelectedStaffInFiltered) {
        setSelectedStaff("");
      }
    }
  }, [selectedUnit, staffList]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [staffData, assessmentsData, unitsData, competenciesData] =
        await Promise.all([
          staffAPI.getAll(),
          assessmentAPI.getAll(),
          unitAPI.getAll(),
          competencyAPI.getAll(),
        ]);

      // Extract unique clusters from competency data
      const clusters: Cluster[] = [];
      const seenClusterIds = new Set<string>();

      competenciesData.forEach((competency: any) => {
        // Try different possible cluster reference paths
        const cluster =
          competency.cluster ||
          (competency.clusterId && {
            id: competency.clusterId,
            name: competency.clusterName,
          }) ||
          null;

        if (cluster && !seenClusterIds.has(cluster.id)) {
          clusters.push({
            id: cluster.id,
            name: cluster.name,
          });
          seenClusterIds.add(cluster.id);
        }
      });

      setStaffList(staffData);
      setFilteredStaffList(staffData);
      setUnitList(unitsData);
      setClusterList(clusters);
      setCompetenciesData(competenciesData);
      setAssessments(assessmentsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error(t('loadDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateIdp = async () => {
    if (!selectedStaff) {
      toast.error(t('selectStaffError'));
      return;
    }

    try {
      setIsGenerating(true);

      const payload: any = {
        staffId: selectedStaff,
      };

      if (selectedAssessment && selectedAssessment !== "latest") {
        payload.assessmentId = selectedAssessment;
      }

      console.log("Generating IDP with payload:", payload);
      const result = await idpAPI.generate(payload);
      console.log("IDP Result:", result);

      // Backend returns { message, data } structure
      if (result.data) {
        setIdpResult(result.data);
        toast.success(result.message || t('generateSuccess'));
      } else {
        // Fallback if backend returns data directly
        setIdpResult(result);
        toast.success(t('generateSuccess'));
      }
    } catch (error: any) {
      console.error("Failed to generate IDP - Full error:", error);
      console.error("Error response:", error.response);

      // Better error message extraction
      let errorMessage = t('generateError');

      if (error.response?.data) {
        const data = error.response.data;
        errorMessage = data.error || data.message || JSON.stringify(data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      // User-friendly error messages
      if (errorMessage.includes("assessment score missing")) {
        const staff = staffList.find((s) => s.id === selectedStaff);
        toast.error(
          t('assessmentIncompleteError', { name: staff?.name || "this staff" }),
          { duration: 5000 },
        );
      } else if (errorMessage.includes("No assessment results found")) {
        toast.error(
          t('noAssessmentResultsError'),
          { duration: 5000 },
        );
      } else if (errorMessage.includes("No competencies defined")) {
        toast.error(
          t('noCompetenciesDefinedError'),
          { duration: 5000 },
        );
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getStrategyBadges = (
    strategies: CompetencyAnalysis["developmentStrategies"],
  ) => {
    const badges = [];
    if (strategies.training)
      badges.push({ label: "Training", color: "bg-red-600" });
    if (strategies.coaching)
      badges.push({ label: "Coaching", color: "bg-orange-600" });
    if (strategies.selfLearning)
      badges.push({ label: "Self Learning", color: "bg-blue-600" });
    if (strategies.workExperience)
      badges.push({ label: "Work Experience", color: "bg-green-600" });
    return badges;
  };

  const getGapColor = (gap: number) => {
    if (gap >= 1.5) return "text-red-600 font-bold";
    if (gap >= 1.0) return "text-purple-600 font-semibold";
    if (gap > 0) return "text-yellow-600";
    return "text-green-600";
  };

  const handleExportCSV = async () => {
    if (!idpResult || !selectedStaff) return;

    try {
      toast.info(t('exportingCsv'));

      const response = await idpAPI.exportCsv({
        staffId: selectedStaff,
        assessmentId: selectedAssessment || undefined,
      });

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `IDP_${idpResult.staffName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('exportCsvSuccess'));
    } catch (error) {
      console.error("CSV Export Error:", error);
      toast.error(t('exportCsvError'));
    }
  };

  const handleExportPDF = async () => {
    if (!idpResult || !selectedStaff) return;

    try {
      toast.info(t('exportingPdf'));

      const response = await idpAPI.exportPdf({
        staffId: selectedStaff,
        assessmentId: selectedAssessment || undefined,
      });

      // response.data is already a Blob when using responseType: 'blob'
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `IDP_${idpResult.staffName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('exportPdfSuccess'));
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error(t('exportPdfError'));
    }
  };

  const getFilteredCompetencies = () => {
    if (!idpResult) return [];

    if (selectedResultCluster === "all") {
      return idpResult.competencyAnalysis;
    }

    return idpResult.competencyAnalysis.filter((comp) => {
      // Find the competency data to get cluster info
      const competencyData = competenciesData.find(
        (c) => c.id === comp.competencyId,
      );

      // Try different possible cluster reference paths
      let clusterId = null;
      if (competencyData) {
        clusterId =
          competencyData.clusterId ||
          competencyData.cluster?.id ||
          competencyData.clusterID ||
          competencyData.cluster_id;
      }

      return clusterId === selectedResultCluster;
    });
  };

  const filteredCompetencies = getFilteredCompetencies();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">{t('loading')}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('generateCardTitle')}</CardTitle>
          <CardDescription>
            {t('generateCardDesc')}
            {selectedUnit && selectedUnit !== "all" && (
              <span className="block mt-1 text-primary font-medium">
                {t('showingStaffFromUnit', { count: filteredStaffList.length })}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="unit">{t('filterByUnit')}</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue placeholder="All Units" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[300px]">
                  <SelectItem value="all">{t('allUnits')}</SelectItem>
                  {unitList.map((unit) => (
                    <SelectItem
                      key={unit.id}
                      value={unit.id}
                      className="max-w-[280px]"
                    >
                      <span className="truncate block">{unit.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">{t('staffMemberLabel')}</Label>
              <Popover
                open={openStaffCombobox}
                onOpenChange={setOpenStaffCombobox}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStaffCombobox}
                    className="w-full justify-between font-normal"
                  >
                    {selectedStaff ? (
                      <span className="truncate">
                        {(() => {
                          const staff = filteredStaffList.find(
                            (s) => s.id === selectedStaff,
                          );
                          return staff
                            ? `${staff.name} (${staff.staffOrgId}) - ${staff.position?.name || t('noPosition')}`
                            : t('selectStaffMember');
                        })()}
                      </span>
                    ) : (
                      t('selectStaffMember')
                    )}
                    <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0">
                  <Command>
                    <CommandInput placeholder={t('searchStaff')} />
                    <CommandList>
                      <CommandEmpty>{t('noStaffFound')}</CommandEmpty>
                      <CommandGroup>
                        {filteredStaffList.map((staff) => (
                          <CommandItem
                            key={staff.id}
                            value={`${staff.name} ${staff.staffOrgId} ${staff.position?.name || ""}`}
                            onSelect={() => {
                              setSelectedStaff(staff.id);
                              setOpenStaffCombobox(false);
                            }}
                          >
                            <IconCheck
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStaff === staff.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="truncate">
                              {staff.name} ({staff.staffOrgId}) -{" "}
                              {staff.position?.name || t('noPosition')}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment">{t('assessmentLabel')}</Label>
              <Select
                value={selectedAssessment || "latest"}
                onValueChange={(v) =>
                  setSelectedAssessment(v === "latest" ? "" : v)
                }
              >
                <SelectTrigger id="assessment" className="w-full">
                  <SelectValue
                    placeholder={t('useLatest')}
                    className="truncate"
                  />
                </SelectTrigger>
                <SelectContent className="max-w-[400px]">
                  <SelectItem value="latest">{t('useLatest')}</SelectItem>
                  {assessments.map((assessment) => (
                    <SelectItem
                      key={assessment.id}
                      value={assessment.id}
                      className="max-w-[380px]"
                    >
                      <span className="truncate block">
                        {assessment.name} (
                        {format(new Date(assessment.startDate), "dd MMM yyyy")})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleGenerateIdp}
              disabled={isGenerating || !selectedStaff}
            >
              {isGenerating ? (
                <>{t('generating')}</>
              ) : (
                <>
                  <IconFileText className="size-4 mr-2" />
                  {t('generateButton')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {idpResult && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconUserCheck className="size-5" />
                    {idpResult.staffName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {idpResult.positionName}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {t('generatedLabel')}{" "}
                  {format(new Date(idpResult.generatedAt), "dd MMM yyyy HH:mm")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {t('totalCompetencies')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {idpResult.competencyAnalysis.length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {t('needsTraining')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {
                        filteredCompetencies.filter(
                          (c) => c.developmentStrategies.training,
                        ).length
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {t('averageGap')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {filteredCompetencies.length > 0
                        ? (
                            filteredCompetencies.reduce(
                              (sum, c) => sum + c.gap,
                              0,
                            ) / filteredCompetencies.length
                          ).toFixed(1)
                        : "0.0"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('competencyGapAnalysis')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedResultCluster}
                    onValueChange={setSelectedResultCluster}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t('filterByCluster')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allClusters')}</SelectItem>
                      {clusterList.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog
                    open={isTrainingPopupOpen}
                    onOpenChange={setIsTrainingPopupOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <IconTarget className="size-4 mr-2" />
                        {t('recommendedTraining')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{t('recommendedTrainingTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('recommendedTrainingDesc', { staffName: idpResult?.staffName })}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto  scroll-auto max-h-[500px]">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium">
                                    {t('colCompetencyRec')}
                                  </th>
                                  <th className="px-3 py-3 text-center text-sm font-medium">
                                    {t('colGapRec')}
                                  </th>
                                  <th className="px-3 py-3 text-left text-sm font-medium">
                                    {t('colTrainingProgram')}
                                  </th>
                                  <th className="px-3 py-3 text-center text-sm font-medium">
                                    {t('colPriority')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredCompetencies
                                  .filter(
                                    (comp) =>
                                      comp.developmentStrategies.training,
                                  )
                                  .sort((a, b) => b.gap - a.gap)
                                  .map((comp, index) => (
                                    <tr
                                      key={comp.competencyId}
                                      className="border-t hover:bg-muted/50"
                                    >
                                      <td className="px-4 py-3 text-sm font-medium">
                                        {comp.competencyName}
                                      </td>
                                      <td
                                        className={`px-3 py-3 text-sm text-center font-medium ${getGapColor(comp.gap)}`}
                                      >
                                        {comp.gap.toFixed(1)}
                                      </td>
                                      <td className="px-3 py-3 text-sm">
                                        {comp.trainingName ||
                                          `${comp.competencyName} Training Program`}
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <Badge
                                          variant={
                                            comp.gap >= 2
                                              ? "destructive"
                                              : comp.gap >= 1.5
                                                ? "default"
                                                : "default"
                                          }
                                        >
                                          {comp.gap >= 2
                                            ? t('priorityHigh')
                                            : comp.gap >= 1.5
                                              ? t('priorityMedium')
                                              : t('priorityLow')}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                {filteredCompetencies.filter(
                                  (comp) => comp.developmentStrategies.training,
                                ).length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={4}
                                      className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                      {t('noTrainingRec')}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <IconDownload className="size-4 mr-2" />
                    {t('exportCsv')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <IconDownload className="size-4 mr-2" />
                    {t('exportPdf')}
                  </Button>
                </div>
              </div>
              {selectedResultCluster !== "all" && (
                <div className="text-sm text-muted-foreground">
                  {t('showingFiltered', { count: filteredCompetencies.length, total: idpResult.competencyAnalysis.length })}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th
                          rowSpan={2}
                          className="px-4 py-3 text-left text-sm font-medium border-r align-middle"
                        >
                          {t('colCompetency')}
                        </th>
                        <th
                          rowSpan={2}
                          className="px-3 py-3 text-center text-sm font-medium border-r align-middle"
                        >
                          {t('colRcl')}
                        </th>
                        <th
                          colSpan={3}
                          className="px-3 py-2 text-center text-sm font-medium border-r border-b"
                        >
                          {t('colAssessmentResult')}
                        </th>
                        <th
                          colSpan={4}
                          className="px-3 py-2 text-center text-sm font-medium"
                        >
                          {t('colDevelopmentStrategy')}
                        </th>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 text-center text-sm font-medium">
                          {t('colSelf')}
                        </th>
                        <th className="px-3 py-2 text-center text-sm font-medium">
                          {t('colSuperior')}
                        </th>
                        <th className="px-3 py-2 text-center text-sm font-medium border-r">
                          {t('colGap')}
                        </th>
                        <th className="px-3 py-2 text-center text-sm font-medium">
                          {t('colTraining')}
                        </th>
                        <th className="px-3 py-2 text-center text-sm font-medium">
                          {t('colCoaching')}
                        </th>
                        <th className="px-3 py-2 text-center text-sm font-medium">
                          {t('colSelfLearning')}
                        </th>
                        <th className="px-3 py-2 text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <span>{t('colWorkExperience')}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <IconInfoCircle className="size-3.5 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {t('workExperienceTooltip')}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompetencies.map((comp, index) => {
                        // Find competency cluster info for debugging
                        const competencyData = competenciesData.find(
                          (c) => c.id === comp.competencyId,
                        );

                        // Try different possible cluster reference paths
                        let clusterId = null;
                        if (competencyData) {
                          clusterId =
                            competencyData.clusterId ||
                            competencyData.cluster?.id ||
                            competencyData.clusterID ||
                            competencyData.cluster_id;
                        }

                        const clusterInfo = clusterList.find(
                          (cl) => cl.id === clusterId,
                        );

                        return (
                          <tr
                            key={comp.competencyId}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="px-4 py-3 text-sm font-medium border-r">
                              {comp.competencyName}
                            </td>
                            <td className="px-3 py-3 text-sm text-center border-r">
                              {comp.requiredLevel}
                            </td>
                            <td className="px-3 py-3 text-sm text-center">
                              {comp.selfScore !== undefined
                                ? comp.selfScore
                                : "N/A"}
                            </td>
                            <td className="px-3 py-3 text-sm text-center">
                              {comp.superiorScore !== undefined
                                ? comp.superiorScore
                                : "N/A"}
                            </td>
                            <td
                              className={`px-3 py-3 text-sm text-center border-r font-medium ${getGapColor(comp.gap)}`}
                            >
                              {comp.gap.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.training && (
                                <span className="text-green-600 text-lg">
                                  ✓
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.coaching && (
                                <span className="text-green-600 text-lg">
                                  ✓
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.selfLearning && (
                                <span className="text-green-600 text-lg">
                                  ✓
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {comp.developmentStrategies.workExperience && (
                                <span className="text-green-600 text-lg">
                                  ✓
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCompetencies.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-8 text-center text-muted-foreground"
                          >
                            {t('noCompetenciesFound')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconTrendingUp className="size-4" />
                {t('legendTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-red-600">{t('colTraining')}</Badge>
                  <span className="text-muted-foreground">
                    {t('legendTraining')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-purple-600">{t('colCoaching')}</Badge>
                  <span className="text-muted-foreground">
                    {t('legendCoaching')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-blue-600">{t('colSelfLearning')}</Badge>
                  <span className="text-muted-foreground">
                    {t('legendSelfLearning')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-green-600">{t('colWorkExperience')}</Badge>
                  <span className="text-muted-foreground">
                    {t('legendWorkExperience')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
