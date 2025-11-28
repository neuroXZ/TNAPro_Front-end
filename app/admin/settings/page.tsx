"use client"

import { useState, useEffect } from "react"
import { settingAPI } from "@/lib/api"
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
import { IconSettings, IconPalette, IconDeviceFloppy, IconRefresh } from "@tabler/icons-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { hexToOklch, oklchToHex } from "@/lib/color-utils"
import { applyThemeColors } from "@/lib/theme-loader"

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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form states
  const [companyName, setCompanyName] = useState("")
  const [appTitle, setAppTitle] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [logoPath, setLogoPath] = useState("")
  
  // Theme colors
  const [primaryColor, setPrimaryColor] = useState("#3B82F6")
  const [secondaryColor, setSecondaryColor] = useState("#8B5CF6")
  const [successColor, setSuccessColor] = useState("#10B981")
  const [warningColor, setWarningColor] = useState("#F59E0B")
  const [dangerColor, setDangerColor] = useState("#EF4444")
  const [infoColor, setInfoColor] = useState("#06B6D4")

  useEffect(() => {
    fetchSettings()
  }, [])

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
        if (setting.key === "app_title") setAppTitle(setting.value || "")
        if (setting.key === "contact_email") setContactEmail(setting.value || "")
        
        // Set logo
        setLogoPath(setting.logoPath || "")
        
        // Convert OKLCH colors from database to HEX for color picker
        setPrimaryColor(setting.primaryColor ? oklchToHex(setting.primaryColor) : "#3B82F6")
        setSecondaryColor(setting.secondaryColor ? oklchToHex(setting.secondaryColor) : "#8B5CF6")
        setSuccessColor(setting.successColor ? oklchToHex(setting.successColor) : "#10B981")
        setWarningColor(setting.warningColor ? oklchToHex(setting.warningColor) : "#F59E0B")
        setDangerColor(setting.dangerColor ? oklchToHex(setting.dangerColor) : "#EF4444")
        setInfoColor(setting.infoColor ? oklchToHex(setting.infoColor) : "#06B6D4")
      }
    } catch (error) {
      toast.error("Failed to fetch settings")
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
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setIsUploading(true)
      const response = await settingAPI.uploadLogo(file)
      
      if (response.logoPath) {
        setLogoPath(response.logoPath)
        toast.success('Logo uploaded successfully')
        await fetchSettings()
      }
    } catch (error) {
      toast.error('Failed to upload logo')
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
      
      toast.success("General settings saved successfully")
      await fetchSettings()
    } catch (error) {
      toast.error("Failed to save general settings")
      console.error(error)
    } finally {
      setIsSaving(false)
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
      
      toast.success("Theme colors saved and applied successfully")
      await fetchSettings()
    } catch (error) {
      toast.error("Failed to save theme colors")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
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
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <p className="text-muted-foreground">
          Manage application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="gap-2">
            <IconSettings className="size-4" />
            General Settings
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-2">
            <IconPalette className="size-4" />
            Theme Colors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic application information and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="appTitle">Application Title</Label>
                  <Input
                    id="appTitle"
                    placeholder="Enter application title"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="Enter contact email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logoUpload">Upload Logo</Label>
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: PNG, JPG, GIF, WEBP, SVG (Max 5MB)
                  </p>
                  {isUploading && (
                    <p className="text-sm text-blue-600">Uploading...</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logoPath">Logo Path (Read Only)</Label>
                  <Input
                    id="logoPath"
                    placeholder="Logo will be uploaded and path will appear here"
                    value={logoPath}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    This path is automatically set after uploading a logo
                  </p>
                </div>

                {logoPath && (
                  <div className="grid gap-2">
                    <Label>Logo Preview</Label>
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
                  Reset
                </Button>
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isSaving}
                >
                  <IconDeviceFloppy className="mr-2 size-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>
                Customize the color scheme of your application. Colors are stored in OKLCH format for better color accuracy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
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
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
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
                  <Label htmlFor="successColor">Success Color</Label>
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
                  <Label htmlFor="warningColor">Warning Color</Label>
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
                  <Label htmlFor="dangerColor">Danger Color</Label>
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
                  <Label htmlFor="infoColor">Info Color</Label>
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
                  Reset
                </Button>
                <Button
                  onClick={handleSaveTheme}
                  disabled={isSaving}
                >
                  <IconDeviceFloppy className="mr-2 size-4" />
                  {isSaving ? "Saving..." : "Save & Apply Colors"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
