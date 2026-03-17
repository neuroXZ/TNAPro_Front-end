"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  SelectValue 
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
  staffAPI, 
  unitAPI,
  dashboardAPI,
  gradeAPI 
} from "@/lib/api"
import { 
  IconUsers, 
  IconBuilding,
  IconSearch,
  IconDownload,
  IconFilter,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconRefresh,
  IconChevronLeft,
  IconArrowLeft,
  IconTrendingUp,
  IconSchool
} from "@tabler/icons-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface Staff {
  id: string
  name: string
  staffOrgId: string
  email?: string
  phone?: string
  gender?: string
  unit?: {
    id: string
    name: string
  }
  unitId?: string
  gradeId?: string // Add this field
  position?: {
    id: string
    name: string
  }
  grade?: {
    id: string
    name: string
    level?: number
  }
  supervisor?: {
    id: string
    name: string
  }
}

interface Grade {
  id: string
  name: string
  level?: number
  description?: string
}

interface GradeWithStaff {
  grade: Grade
  staff: Staff[]
  totalStaff: number
}

export default function GradeDistributionDetailPage() {
  const t = useTranslations('AdminAnalyticsGradeDistributionPage')
  const [gradeStaffData, setGradeStaffData] = useState<GradeWithStaff[]>([])
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get basic data and dashboard overview
      const [unitsData, gradesData, dashboardData] = await Promise.all([
        unitAPI.getAll(),
        gradeAPI.getAll(),
        dashboardAPI.getOverview()
      ])
      
      setUnits(unitsData)
      setGrades(gradesData)
      
      // Now staff API should include grade relationship via position.grade
      const staffData = await staffAPI.getAll()
      setAllStaff(staffData)
      
      console.log('Staff data sample with position.grade:', staffData.slice(0, 2))
      
      const gradeMap = new Map<string, Grade>(
        gradesData.map((grade: Grade) => [grade.id, grade])
      )
      
      const gradeStaffMap = new Map<string, Staff[]>()
      
      // Initialize all grades
      gradesData.forEach((grade: Grade) => {
        gradeStaffMap.set(grade.id, [])
      })
      
      // Add "No Grade" category  
      const noGradeKey = 'no-grade'
      gradeMap.set(noGradeKey, {
        id: noGradeKey,
        name: 'No Grade Assigned'
      })
      gradeStaffMap.set(noGradeKey, [])
      
      // Process staff to group by grade (through position.grade) 
      staffData.forEach((staff: Staff) => {
        // Access grade through position.grade relationship
        const staffGrade = (staff as any)?.position?.grade
        
        if (staffGrade?.id && gradeStaffMap.has(staffGrade.id)) {
          const existingStaff = gradeStaffMap.get(staffGrade.id) || []
          gradeStaffMap.set(staffGrade.id, [...existingStaff, staff])
        } else {
          // Staff without grade (no position or position without grade)
          const existingStaff = gradeStaffMap.get(noGradeKey) || []
          gradeStaffMap.set(noGradeKey, [...existingStaff, staff])
        }
      })
      
      // Convert to array format
      const gradeStaffArray: GradeWithStaff[] = Array.from(gradeMap.values())
        .map(grade => ({
          grade,
          staff: gradeStaffMap.get(grade.id) || [],
          totalStaff: (gradeStaffMap.get(grade.id) || []).length
        }))
      
      // Sort by level first, then by total staff count (descending)
      gradeStaffArray.sort((a, b) => {
        // Sort "No Grade" last
        if (a.grade.id === 'no-grade') return 1
        if (b.grade.id === 'no-grade') return -1
        
        // Sort by level if both have levels
        if (a.grade.level && b.grade.level) {
          return a.grade.level - b.grade.level
        }
        if (a.grade.level && !b.grade.level) return -1
        if (!a.grade.level && b.grade.level) return 1
        return b.totalStaff - a.totalStaff
      })
      
      setGradeStaffData(gradeStaffArray)
      
    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    let filteredData = gradeStaffData

    // Filter by selected grade
    if (selectedGrade !== "all") {
      filteredData = filteredData.filter(item => item.grade.id === selectedGrade)
    }

    // Filter by selected unit
    if (selectedUnit !== "all") {
      filteredData = filteredData.map(item => ({
        ...item,
        staff: item.staff.filter(staff => staff.unitId === selectedUnit)
      })).filter(item => item.staff.length > 0)
    }

    // Filter by search term
    if (searchTerm) {
      filteredData = filteredData.map(item => ({
        ...item,
        staff: item.staff.filter(staff => 
          staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.staffOrgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (staff.position?.name && staff.position.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (staff.unit?.name && staff.unit.name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      })).filter(item => item.staff.length > 0)
    }

    return filteredData
  }

  const filteredData = getFilteredData()
  const totalStaffCount = allStaff.length
  const totalGradesCount = grades.length
  // Count grades that actually have staff
  const gradesWithStaffCount = gradeStaffData.filter(item => item.totalStaff > 0).length
  // Count total grades including empty ones
  const totalGradesInSystem = gradeStaffData.length

  const handleExportCSV = () => {
    // Generate CSV content
    const csvHeaders = [
      'Grade', 
      'Level',
      'Staff Org ID', 
      'Name', 
      'Unit',
      'Position', 
      'Email', 
      'Phone', 
      'Gender', 
      'Supervisor'
    ]
    
    const csvRows = []
    csvRows.push(csvHeaders.join(','))
    
    filteredData.forEach(item => {
      item.staff.forEach(staff => {
        const row = [
          `"${item.grade.name}"`,
          `"${item.grade.level || ''}"`,
          `"${staff.staffOrgId}"`,
          `"${staff.name}"`,
          `"${staff.unit?.name || ''}"`,
          `"${staff.position?.name || ''}"`,
          `"${staff.email || ''}"`,
          `"${staff.phone || ''}"`,
          `"${staff.gender || ''}"`,
          `"${staff.supervisor?.name || ''}"`
        ]
        csvRows.push(row.join(','))
      })
    })
    
    // Download CSV
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `grade_distribution_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
        
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/analytics">
          <Button variant="outline" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            {t('backToAnalytics')}
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statTotalStaff')}</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaffCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('statTotalStaffDesc')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statTotalGrades')}</CardTitle>
            <IconSchool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGradesInSystem}</div>
            <p className="text-xs text-muted-foreground">
              {t('statTotalGradesDesc', { count: gradesWithStaffCount })}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statAvgPerGrade')}</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradesWithStaffCount > 0 ? Math.round(totalStaffCount / gradesWithStaffCount) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('statAvgPerGradeDesc')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statFilteredResults')}</CardTitle>
            <IconFilter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredData.reduce((sum, item) => sum + item.staff.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('statCurrentlyShowing')}
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconRefresh className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            {t('filtersTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="w-full md:w-[200px]">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectUnit')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allUnits')}</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-[200px]">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectGrade')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allGrades')}</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleExportCSV} variant="outline">
              <IconDownload className="h-4 w-4 mr-2" />
              {t('exportCsv')}
            </Button>
            
            <Button onClick={fetchData} variant="outline">
              <IconRefresh className="h-4 w-4 mr-2" />
              {t('refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Data Accordion */}
      <div className="space-y-4">
        {filteredData.length === 0 && !loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {t('noStaffFound')}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {filteredData.map((item) => (
              <AccordionItem key={item.grade.id} value={item.grade.id} className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <IconSchool className={`h-5 w-5 ${item.staff.length > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">
                          {item.grade.name}
                          {item.grade.level && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              {t('levelLabel', { level: item.grade.level })}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.staff.length !== 1 ? t('staffCountMultiple', { count: item.staff.length }) : t('staffCountSingle', { count: item.staff.length })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={item.staff.length > 0 ? "default" : "secondary"} 
                      className="text-lg px-3 py-1 ml-4"
                    >
                      {item.staff.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="px-6 pb-6">
                    {item.staff.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('noStaffInGrade')}
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">{t('colStaffId')}</TableHead>
                              <TableHead className="font-semibold">{t('colName')}</TableHead>
                              <TableHead className="font-semibold">{t('colUnit')}</TableHead>
                              <TableHead className="font-semibold">{t('colPosition')}</TableHead>
                              <TableHead className="font-semibold">{t('colEmail')}</TableHead>
                              <TableHead className="font-semibold">{t('colPhone')}</TableHead>
                              <TableHead className="font-semibold">{t('colSupervisor')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.staff.map((staff, index) => (
                              <TableRow key={staff.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                                <TableCell className="font-medium">{staff.staffOrgId}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <IconUser className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <div className="font-medium">{staff.name}</div>
                                      {staff.gender && (
                                        <div className="text-sm text-muted-foreground capitalize">{staff.gender}</div>
                                      )}
                                    </div>
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
                                        className="text-blue-600 hover:underline text-sm max-w-[200px] truncate block"
                                        title={staff.email}
                                      >
                                        {staff.email}
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {staff.phone ? (
                                    <div className="flex items-center gap-2">
                                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{staff.phone}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {staff.supervisor ? (
                                    <div className="flex items-center gap-2">
                                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{staff.supervisor.name}</span>
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
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}