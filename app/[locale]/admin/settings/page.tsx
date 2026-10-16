"use client"

import { useState, useEffect } from "react"
import { settingAPI, dashboardAPI, developmentStrategyAPI, type DevelopmentStrategy, type SelfResultVisibility } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  IconSettings,
  IconPalette,
  IconDeviceFloppy,
  IconRefresh,
  IconUsers,
  IconBuilding,
  IconLicense,
  IconCalendar,
  IconTargetArrow,
  IconPlus,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { hexToOklch, oklchToHex } from "@/lib/color-utils"
import { applyThemeColors } from "@/lib/theme-loader"
import { useTranslations } from "next-intl"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

interface Setting {
  id: string
  key?: string
  value?: string
  logoPath?: string
  primaryColor?: string
  secondaryColor?: string
  successColor?: string
  warningColor?: string
  dangerColor?: string
  infoColor?: string
  gapRatioFloorNegative?: boolean
  hideIdpFromStaff?: boolean
  selfResultVisibility?: SelfResultVisibility
  superiorCanViewSubordinateIdp?: boolean
}

interface DashboardSummary {
  totalStaff: number
  totalUnits: number
  licenseUsage: {
    used: number
    max: number
    percentage: number
    expiryDate: string | null
  }
}

export default function SettingsPage() {
  const t = useTranslations('AdminSettingsPage');
  const { flags: featureFlags } = useFeatureFlags()
  const [settings, setSettings] = useState<Setting | null>(null)
  const [gapRatioFloorNegative, setGapRatioFloorNegative] = useState(false)
  const [hideIdpFromStaff, setHideIdpFromStaff] = useState(false)
  const [selfResultVisibility, setSelfResultVisibility] = useState<SelfResultVisibility>('OFF')
  const [superiorCanViewSubordinateIdp, setSuperiorCanViewSubordinateIdp] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form states
  const [companyName, setCompanyName] = useState("")
  const [logoPath, setLogoPath] = useState("")
  
  // Theme colors
  const [primaryColor, setPrimaryColor] = useState("#3B82F6")
  const [secondaryColor, setSecondaryColor] = useState("#8B5CF6")
  const [successColor, setSuccessColor] = useState("#10B981")
  const [warningColor, setWarningColor] = useState("#F59E0B")
  const [dangerColor, setDangerColor] = useState("#EF4444")
  const [infoColor, setInfoColor] = useState("#06B6D4")

  // Development strategies (IDP gap thresholds)
  const [strategies, setStrategies] = useState<DevelopmentStrategy[]>([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)
  const [isSavingStrategy, setIsSavingStrategy] = useState(false)
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<DevelopmentStrategy | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DevelopmentStrategy | null>(null)
  const [strategyName, setStrategyName] = useState("")
  const [strategyMinGap, setStrategyMinGap] = useState("")
  const [strategyColor, setStrategyColor] = useState("#DC2626")
  const [strategyIsTrainingLinked, setStrategyIsTrainingLinked] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchDashboardData()
    fetchStrategies()
  }, [])

  const fetchStrategies = async () => {
    try {
      setIsLoadingStrategies(true)
      const data = await developmentStrategyAPI.getAll()
      setStrategies(data)
    } catch (error) {
      toast.error(t('devStrategyFetchError'))
      console.error(error)
    } finally {
      setIsLoadingStrategies(false)
    }
  }

  const openAddStrategyDialog = () => {
    setEditingStrategy(null)
    setStrategyName("")
    setStrategyMinGap("")
    setStrategyColor("#DC2626")
    setStrategyIsTrainingLinked(false)
    setStrategyDialogOpen(true)
  }

  const openEditStrategyDialog = (strategy: DevelopmentStrategy) => {
    setEditingStrategy(strategy)
    setStrategyName(strategy.name)
    setStrategyMinGap(String(strategy.minGap))
    setStrategyColor(strategy.color)
    setStrategyIsTrainingLinked(strategy.isTrainingLinked)
    setStrategyDialogOpen(true)
  }

  const handleSaveStrategy = async () => {
    const minGap = parseFloat(strategyMinGap)
    if (!strategyName.trim() || Number.isNaN(minGap) || minGap < 0) {
      toast.error(t('devStrategyValidationError'))
      return
    }

    try {
      setIsSavingStrategy(true)
      const data = {
        name: strategyName.trim(),
        minGap,
        color: strategyColor,
        isTrainingLinked: strategyIsTrainingLinked,
        order: editingStrategy?.order ?? strategies.length + 1,
      }

      if (editingStrategy) {
        await developmentStrategyAPI.update(editingStrategy.id, data)
      } else {
        await developmentStrategyAPI.create(data)
      }

      toast.success(t('devStrategySaveSuccess'))
      setStrategyDialogOpen(false)
      await fetchStrategies()
    } catch (error) {
      toast.error(t('devStrategySaveError'))
      console.error(error)
    } finally {
      setIsSavingStrategy(false)
    }
  }

  const handleDeleteStrategy = async () => {
    if (!deleteTarget) return
    try {
      await developmentStrategyAPI.delete(deleteTarget.id)
      toast.success(t('devStrategyDeleteSuccess'))
      setDeleteTarget(null)
      await fetchStrategies()
    } catch (error) {
      toast.error(t('devStrategyDeleteError'))
      console.error(error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardAPI.getOverview()
      setDashboardData(data.summary)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const data = await settingAPI.getAll()
      
      // Assuming single settings record or first record
      if (data && data.length > 0) {
        const setting = data[0]
        setSettings(setting)
        
        // Parse key-value pairs
        if (setting.key === "company_name") setCompanyName(setting.value || "")
        
        // Set logo
        setLogoPath(setting.logoPath || "")
        
        // Convert OKLCH colors from database to HEX for color picker
        setPrimaryColor(setting.primaryColor ? oklchToHex(setting.primaryColor) : "#3B82F6")
        setSecondaryColor(setting.secondaryColor ? oklchToHex(setting.secondaryColor) : "#8B5CF6")
        setSuccessColor(setting.successColor ? oklchToHex(setting.successColor) : "#10B981")
        setWarningColor(setting.warningColor ? oklchToHex(setting.warningColor) : "#F59E0B")
        setDangerColor(setting.dangerColor ? oklchToHex(setting.dangerColor) : "#EF4444")
        setInfoColor(setting.infoColor ? oklchToHex(setting.infoColor) : "#06B6D4")
        setGapRatioFloorNegative(setting.gapRatioFloorNegative ?? false)
        setHideIdpFromStaff(setting.hideIdpFromStaff ?? false)
        setSelfResultVisibility(setting.selfResultVisibility ?? 'OFF')
        setSuperiorCanViewSubordinateIdp(setting.superiorCanViewSubordinateIdp ?? false)
      }
    } catch (error) {
      toast.error(t('fetchError'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('logoFileTypeError'))
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('logoFileSizeError'))
      return
    }

    try {
      setIsUploading(true)
      const response = await settingAPI.uploadLogo(file)
      
      if (response.logoPath) {
        setLogoPath(response.logoPath)
        toast.success(t('logoUploadSuccess'))
        await fetchSettings()
      }
    } catch (error) {
      toast.error(t('logoUploadError'))
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  };

  const handleSaveGeneral = async () => {
    try {
      setIsSaving(true)
      
      const data = {
        key: "company_name",
        value: companyName,
        logoPath,
      }

      if (settings?.id) {
        await settingAPI.update(settings.id, data)
      } else {
        await settingAPI.create(data)
      }
      
      toast.success(t('saveSuccess'))
      await fetchSettings()
    } catch (error) {
      toast.error(t('saveError'))
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleGapRatioFloorNegative = async (checked: boolean) => {
    setGapRatioFloorNegative(checked)
    try {
      if (settings?.id) {
        await settingAPI.update(settings.id, { gapRatioFloorNegative: checked })
      } else {
        await settingAPI.create({ gapRatioFloorNegative: checked })
      }
      toast.success(t('saveSuccess'))
      await fetchSettings()
    } catch (error) {
      setGapRatioFloorNegative(!checked)
      toast.error(t('saveError'))
      console.error(error)
    }
  }

  const handleToggleHideIdpFromStaff = async (checked: boolean) => {
    setHideIdpFromStaff(checked)
    try {
      if (settings?.id) {
        await settingAPI.update(settings.id, { hideIdpFromStaff: checked })
      } else {
        await settingAPI.create({ hideIdpFromStaff: checked })
      }
      toast.success(t('saveSuccess'))
      await fetchSettings()
    } catch (error) {
      setHideIdpFromStaff(!checked)
      toast.error(t('saveError'))
      console.error(error)
    }
  }

  const handleChangeSelfResultVisibility = async (value: SelfResultVisibility) => {
    const previous = selfResultVisibility
    setSelfResultVisibility(value)
    try {
      if (settings?.id) {
        await settingAPI.update(settings.id, { selfResultVisibility: value })
      } else {
        await settingAPI.create({ selfResultVisibility: value })
      }
      toast.success(t('saveSuccess'))
      await fetchSettings()
    } catch (error) {
      setSelfResultVisibility(previous)
      toast.error(t('saveError'))
      console.error(error)
    }
  }

  const handleToggleSuperiorCanViewSubordinateIdp = async (checked: boolean) => {
    setSuperiorCanViewSubordinateIdp(checked)
    try {
      if (settings?.id) {
        await settingAPI.update(settings.id, { superiorCanViewSubordinateIdp: checked })
      } else {
        await settingAPI.create({ superiorCanViewSubordinateIdp: checked })
      }
      toast.success(t('saveSuccess'))
      await fetchSettings()
    } catch (error) {
      setSuperiorCanViewSubordinateIdp(!checked)
      toast.error(t('saveError'))
      console.error(error)
    }
  }

  const handleSaveTheme = async () => {
    try {
      setIsSaving(true)
      
      // Convert HEX colors to OKLCH format before saving
      const data = {
        primaryColor: hexToOklch(primaryColor),
        secondaryColor: hexToOklch(secondaryColor),
        successColor: hexToOklch(successColor),
        warningColor: hexToOklch(warningColor),
        dangerColor: hexToOklch(dangerColor),
        infoColor: hexToOklch(infoColor),
      }

      if (settings?.id) {
        await settingAPI.update(settings.id, data)
      } else {
        await settingAPI.create(data)
      }
      
      // Apply theme immediately without page refresh
      applyThemeColors(data)
      
      toast.success(t('themeSuccess'))
      await fetchSettings()
    } catch (error) {
      toast.error(t('themeError'))
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const getLicenseStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const getLicenseStatusText = (percentage: number) => {
    if (percentage >= 90) return t('licenseStatusCritical')
    if (percentage >= 75) return t('licenseStatusWarning')
    return t('licenseStatusGood')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set"
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* System Summary Cards */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statTotalStaff')}</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalStaff}</div>
              <p className="text-xs text-muted-foreground">
                {t('statTotalStaffDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statTotalUnits')}</CardTitle>
              <IconBuilding className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalUnits}</div>
              <p className="text-xs text-muted-foreground">
                {t('statTotalUnitsDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statLicenseUsage')}</CardTitle>
              <IconLicense className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getLicenseStatusColor(dashboardData.licenseUsage.percentage)}`}>
                {dashboardData.licenseUsage.used}/{dashboardData.licenseUsage.max}
              </div>
              <div className="mt-2">
                <Progress 
                  value={dashboardData.licenseUsage.percentage} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(dashboardData.licenseUsage.percentage)}% used • {getLicenseStatusText(dashboardData.licenseUsage.percentage)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('statLicenseExpiry')}</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDate(dashboardData.licenseUsage.expiryDate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('statLicenseExpiryDesc')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:h-9 sm:grid-cols-3 sm:gap-0">
          <TabsTrigger value="general" className="gap-2">
            <IconSettings className="size-4" />
            {t('tabGeneral')}
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <IconPalette className="size-4" />
            {t('tabTheme')}
          </TabsTrigger>
          <TabsTrigger value="strategies" className="gap-2">
            <IconTargetArrow className="size-4" />
            {t('tabDevelopmentStrategies')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('generalCardTitle')}</CardTitle>
              <CardDescription>
                {t('generalCardDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">{t('labelCompanyName')}</Label>
                  <Input
                    id="companyName"
                    placeholder={t('placeholderCompanyName')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logoUpload">{t('labelUploadLogo')}</Label>
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('uploadLogoHint')}
                  </p>
                  {isUploading && (
                    <p className="text-sm text-blue-600">{t('uploading')}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logoPath">{t('labelLogoPath')}</Label>
                  <Input
                    id="logoPath"
                    placeholder={t('logoPathHint')}
                    value={logoPath}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('logoPathNote')}
                  </p>
                </div>

                {logoPath && (
                  <div className="grid gap-2">
                    <Label>{t('labelLogoPreview')}</Label>
                    <div className="rounded-md border p-4 flex items-center justify-center bg-muted">
                      <img 
                        src={logoPath} 
                        alt="Logo preview" 
                        className="max-h-24 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={fetchSettings}
                  disabled={isSaving}
                >
                  {t('resetButton')}
                </Button>
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isSaving}
                >
                  <IconDeviceFloppy className="mr-2 size-4" />
                  {isSaving ? t('saving') : t('saveButton')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t('preferencesCardTitle')}</CardTitle>
              <CardDescription>
                {t('preferencesCardDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureFlags.gapRatio && (
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="gapRatioFloorNegative">{t('labelGapRatioFloorNegative')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('gapRatioFloorNegativeHint')}
                    </p>
                  </div>
                  <Switch
                    id="gapRatioFloorNegative"
                    checked={gapRatioFloorNegative}
                    onCheckedChange={handleToggleGapRatioFloorNegative}
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="hideIdpFromStaff">{t('labelHideIdpFromStaff')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('hideIdpFromStaffHint')}
                  </p>
                </div>
                <Switch
                  id="hideIdpFromStaff"
                  checked={hideIdpFromStaff}
                  onCheckedChange={handleToggleHideIdpFromStaff}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="selfResultVisibility">{t('labelSelfResultVisibility')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('selfResultVisibilityHint')}
                  </p>
                </div>
                <Select
                  value={selfResultVisibility}
                  onValueChange={(value) => handleChangeSelfResultVisibility(value as SelfResultVisibility)}
                >
                  <SelectTrigger id="selfResultVisibility" className="w-full sm:w-[240px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFF">{t('selfResultVisibilityOff')}</SelectItem>
                    <SelectItem value="AFTER_SUPERIOR_SUBMIT">{t('selfResultVisibilityAfterSubmit')}</SelectItem>
                    <SelectItem value="ALWAYS">{t('selfResultVisibilityAlways')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="superiorCanViewSubordinateIdp">{t('labelSuperiorCanViewSubordinateIdp')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('superiorCanViewSubordinateIdpHint')}
                  </p>
                </div>
                <Switch
                  id="superiorCanViewSubordinateIdp"
                  checked={superiorCanViewSubordinateIdp}
                  onCheckedChange={handleToggleSuperiorCanViewSubordinateIdp}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('themeCardTitle')}</CardTitle>
              <CardDescription>
                {t('themeCardDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="primaryColor">{t('colorPrimary')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div 
                    className="h-12 rounded-md border"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="secondaryColor">{t('colorSecondary')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#8B5CF6"
                    />
                  </div>
                  <div 
                    className="h-12 rounded-md border"
                    style={{ backgroundColor: secondaryColor }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="successColor">{t('colorSuccess')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="successColor"
                      type="color"
                      value={successColor}
                      onChange={(e) => setSuccessColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={successColor}
                      onChange={(e) => setSuccessColor(e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                  <div 
                    className="h-12 rounded-md border"
                    style={{ backgroundColor: successColor }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="warningColor">{t('colorWarning')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="warningColor"
                      type="color"
                      value={warningColor}
                      onChange={(e) => setWarningColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={warningColor}
                      onChange={(e) => setWarningColor(e.target.value)}
                      placeholder="#F59E0B"
                    />
                  </div>
                  <div 
                    className="h-12 rounded-md border"
                    style={{ backgroundColor: warningColor }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dangerColor">{t('colorDanger')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dangerColor"
                      type="color"
                      value={dangerColor}
                      onChange={(e) => setDangerColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={dangerColor}
                      onChange={(e) => setDangerColor(e.target.value)}
                      placeholder="#EF4444"
                    />
                  </div>
                  <div 
                    className="h-12 rounded-md border"
                    style={{ backgroundColor: dangerColor }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="infoColor">{t('colorInfo')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="infoColor"
                      type="color"
                      value={infoColor}
                      onChange={(e) => setInfoColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={infoColor}
                      onChange={(e) => setInfoColor(e.target.value)}
                      placeholder="#06B6D4"
                    />
                  </div>
                  <div 
                    className="h-12 rounded-md border"
                    style={{ backgroundColor: infoColor }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={fetchSettings}
                  disabled={isSaving}
                >
                  <IconRefresh className="mr-2 size-4" />
                  {t('resetButton')}
                </Button>
                <Button
                  onClick={handleSaveTheme}
                  disabled={isSaving}
                >
                  <IconDeviceFloppy className="mr-2 size-4" />
                  {isSaving ? t('saving') : t('saveThemeButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t('devStrategyCardTitle')}</CardTitle>
                <CardDescription>
                  {t('devStrategyCardDesc')}
                </CardDescription>
              </div>
              <Button onClick={openAddStrategyDialog}>
                <IconPlus className="mr-2 size-4" />
                {t('addStrategy')}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingStrategies ? (
                <Skeleton className="h-40 w-full" />
              ) : strategies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t('noStrategiesFound')}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('labelStrategyName')}</TableHead>
                      <TableHead>{t('labelMinGap')}</TableHead>
                      <TableHead>{t('labelColor')}</TableHead>
                      <TableHead>{t('labelIsTrainingLinked')}</TableHead>
                      <TableHead className="text-right">{t('colActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((strategy) => (
                      <TableRow key={strategy.id}>
                        <TableCell className="font-medium">{strategy.name}</TableCell>
                        <TableCell>{strategy.minGap}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="size-5 rounded border"
                              style={{ backgroundColor: strategy.color }}
                            />
                            <span className="text-xs text-muted-foreground">{strategy.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {strategy.isTrainingLinked && (
                            <Badge variant="secondary">{t('trainingLinkedBadge')}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditStrategyDialog(strategy)}
                          >
                            <IconPencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(strategy)}
                          >
                            <IconTrash className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={strategyDialogOpen} onOpenChange={setStrategyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStrategy ? t('editStrategy') : t('addStrategy')}</DialogTitle>
            <DialogDescription>{t('devStrategyDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="strategyName">{t('labelStrategyName')}</Label>
              <Input
                id="strategyName"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder={t('placeholderStrategyName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="strategyMinGap">{t('labelMinGap')}</Label>
              <Input
                id="strategyMinGap"
                type="number"
                step="0.01"
                min="0"
                value={strategyMinGap}
                onChange={(e) => setStrategyMinGap(e.target.value)}
                placeholder="1.5"
              />
              <p className="text-xs text-muted-foreground">{t('minGapHint')}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="strategyColor">{t('labelColor')}</Label>
              <div className="flex gap-2">
                <Input
                  id="strategyColor"
                  type="color"
                  value={strategyColor}
                  onChange={(e) => setStrategyColor(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={strategyColor}
                  onChange={(e) => setStrategyColor(e.target.value)}
                  placeholder="#DC2626"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="strategyIsTrainingLinked"
                checked={strategyIsTrainingLinked}
                onCheckedChange={(checked) => setStrategyIsTrainingLinked(checked === true)}
              />
              <Label htmlFor="strategyIsTrainingLinked" className="font-normal">
                {t('labelIsTrainingLinked')}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">{t('isTrainingLinkedHint')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStrategyDialogOpen(false)} disabled={isSavingStrategy}>
              {t('cancelButton')}
            </Button>
            <Button onClick={handleSaveStrategy} disabled={isSavingStrategy}>
              {isSavingStrategy ? t('saving') : t('saveButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteStrategyConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteStrategyConfirmDesc', { name: deleteTarget?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStrategy}>
              {t('deleteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
