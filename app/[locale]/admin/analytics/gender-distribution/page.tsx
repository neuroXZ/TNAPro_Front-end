"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { staffAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  IconArrowLeft,
  IconBuilding,
  IconDownload,
  IconFilter,
  IconMail,
  IconMapPin,
  IconRefresh,
  IconSearch,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"

interface Staff {
  id: string
  name: string
  staffOrgId: string
  email?: string
  gender?: string
  unit?: {
    id: string
    name: string
  }
  unitId?: string
  position?: {
    id: string
    name: string
  }
}

interface GenderGroup {
  key: string
  label: string
  staff: Staff[]
  totalStaff: number
}

export default function GenderDistributionDetailPage() {
  const t = useTranslations("AdminAnalyticsGenderDistributionPage")
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGender, setSelectedGender] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const getGenderMeta = (gender?: string) => {
    const value = gender?.trim()

    if (!value) {
      return { key: "unspecified", label: t("genderUnspecified") }
    }

    const normalized = value.toLowerCase()

    if (["male", "lelaki", "m"].includes(normalized)) {
      return { key: "male", label: t("genderMale") }
    }

    if (["female", "perempuan", "f"].includes(normalized)) {
      return { key: "female", label: t("genderFemale") }
    }

    return {
      key: normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other",
      label: value,
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const staffData = await staffAPI.getAll()
      setAllStaff(staffData)
    } catch (err: any) {
      console.error("Failed to fetch gender distribution data:", err)
      setError(err.response?.data?.error || "Failed to load gender distribution data")
    } finally {
      setLoading(false)
    }
  }

  const buildGenderGroups = (staffList: Staff[]) => {
    const groupMap = new Map<string, GenderGroup>()

    staffList.forEach((staff) => {
      const meta = getGenderMeta(staff.gender)
      const existingGroup = groupMap.get(meta.key)

      if (existingGroup) {
        existingGroup.staff.push(staff)
        existingGroup.totalStaff += 1
        return
      }

      groupMap.set(meta.key, {
        key: meta.key,
        label: meta.label,
        staff: [staff],
        totalStaff: 1,
      })
    })

    const orderedKeys = ["male", "female", "unspecified"]

    return Array.from(groupMap.values())
      .map((group) => ({
        ...group,
        staff: [...group.staff].sort((firstStaff, secondStaff) =>
          firstStaff.name.localeCompare(secondStaff.name),
        ),
      }))
      .sort((firstGroup, secondGroup) => {
        const firstIndex = orderedKeys.indexOf(firstGroup.key)
        const secondIndex = orderedKeys.indexOf(secondGroup.key)

        if (firstIndex !== -1 || secondIndex !== -1) {
          if (firstIndex === -1) return 1
          if (secondIndex === -1) return -1
          return firstIndex - secondIndex
        }

        return secondGroup.totalStaff - firstGroup.totalStaff
      })
  }

  const baseGroups = buildGenderGroups(allStaff)

  const filteredGroups = baseGroups
    .filter((group) => selectedGender === "all" || group.key === selectedGender)
    .map((group) => ({
      ...group,
      staff: group.staff.filter((staff) => {
        if (!searchTerm) return true

        const keyword = searchTerm.toLowerCase()
        return (
          staff.name.toLowerCase().includes(keyword) ||
          staff.staffOrgId.toLowerCase().includes(keyword) ||
          staff.email?.toLowerCase().includes(keyword) ||
          staff.unit?.name?.toLowerCase().includes(keyword) ||
          staff.position?.name?.toLowerCase().includes(keyword)
        )
      }),
    }))
    .filter((group) => group.staff.length > 0)
    .map((group) => ({
      ...group,
      totalStaff: group.staff.length,
    }))

  const filteredStaffCount = filteredGroups.reduce(
    (total, group) => total + group.totalStaff,
    0,
  )

  const maleCount = baseGroups.find((group) => group.key === "male")?.totalStaff || 0
  const femaleCount = baseGroups.find((group) => group.key === "female")?.totalStaff || 0

  const handleExportCSV = () => {
    const csvHeaders = ["Gender", "Staff ID", "Name", "Unit", "Position", "Email"]
    const csvRows = [csvHeaders.join(",")]

    filteredGroups.forEach((group) => {
      group.staff.forEach((staff) => {
        const row = [
          `"${group.label}"`,
          `"${staff.staffOrgId}"`,
          `"${staff.name}"`,
          `"${staff.unit?.name || ""}"`,
          `"${staff.position?.name || ""}"`,
          `"${staff.email || ""}"`,
        ]

        csvRows.push(row.join(","))
      })
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `gender_distribution_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-[220px]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-[120px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
          <Link href="/admin/analytics" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              {t("backToAnalytics")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("statTotalStaff")}</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allStaff.length}</div>
            <p className="text-xs text-muted-foreground">{t("statTotalStaffDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("statGenderGroups")}</CardTitle>
            <IconFilter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{baseGroups.length}</div>
            <p className="text-xs text-muted-foreground">{t("statGenderGroupsDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("statMale")}</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maleCount}</div>
            <p className="text-xs text-muted-foreground">{t("statMaleDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("statFemale")}</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{femaleCount}</div>
            <p className="text-xs text-muted-foreground">{t("statFemaleDesc")}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconRefresh className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            {t("filtersTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="w-full md:w-[220px]">
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectGender")}></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allGenders")}</SelectItem>
                  {baseGroups.map((group) => (
                    <SelectItem key={group.key} value={group.key}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExportCSV} variant="outline">
              <IconDownload className="mr-2 h-4 w-4" />
              {t("exportCsv")}
            </Button>

            <Button onClick={fetchData} variant="outline">
              <IconRefresh className="mr-2 h-4 w-4" />
              {t("refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("resultsTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("filteredResults", { count: filteredStaffCount })}
          </p>
        </CardHeader>
        <CardContent>
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{t("noStaffFound")}</div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {filteredGroups.map((group) => (
                <AccordionItem key={group.key} value={group.key} className="rounded-lg border">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="mr-4 flex w-full items-center justify-between">
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{group.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.totalStaff === 1
                            ? t("staffCountSingle", { count: group.totalStaff })
                            : t("staffCountMultiple", { count: group.totalStaff })}
                        </p>
                      </div>
                      <Badge variant="default" className="ml-4 px-3 py-1 text-lg">
                        {group.totalStaff}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="px-6 pb-6">
                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">{t("colStaffId")}</TableHead>
                              <TableHead className="font-semibold">{t("colName")}</TableHead>
                              <TableHead className="font-semibold">{t("colUnit")}</TableHead>
                              <TableHead className="font-semibold">{t("colPosition")}</TableHead>
                              <TableHead className="font-semibold">{t("colEmail")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.staff.map((staff, index) => (
                              <TableRow
                                key={staff.id}
                                className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                              >
                                <TableCell className="font-medium">{staff.staffOrgId}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <IconUser className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">{staff.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {staff.unit?.name ? (
                                    <div className="flex items-center gap-2">
                                      <IconBuilding className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{staff.unit.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {staff.position?.name ? (
                                    <div className="flex items-center gap-2">
                                      <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{staff.position.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {staff.email ? (
                                    <div className="flex items-center gap-2">
                                      <IconMail className="h-4 w-4 text-muted-foreground" />
                                      <a
                                        href={`mailto:${staff.email}`}
                                        className="block max-w-60 truncate text-sm text-blue-600 hover:underline"
                                        title={staff.email}
                                      >
                                        {staff.email}
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}