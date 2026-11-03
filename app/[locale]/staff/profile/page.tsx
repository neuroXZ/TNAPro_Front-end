"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconUser, IconMail, IconBriefcase, IconBuilding, IconEdit, IconUsers, IconLock } from "@tabler/icons-react"
import { authAPI, staffAPI, assessorAPI } from "@/lib/api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"

interface ProfileData {
  id: string
  name: string
  email: string
  staffOrgId: string
  gender: string
  image?: string
  position?: {
    id: string
    name: string
  }
  unit?: {
    id: string
    name: string
  }
  // Who rates this staff member as superior (Assessor mappings), and the profile supervisor
  // as the reporting line only when that is someone else.
  superiorAssessors?: Array<{
    id: string
    name: string
    position?: { name: string }
  }>
  reportsTo?: {
    id: string
    name: string
    position?: { name: string }
  } | null
  subordinates?: Array<{
    id: string
    name: string
    position?: { name: string }
  }>
}

export default function MyProfile() {
  const t = useTranslations('StaffProfilePage')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)

      // First, try to get user data from localStorage for immediate display
      const storedUser = localStorage.getItem('user')
      let userData = null

      if (storedUser) {
        try {
          userData = JSON.parse(storedUser)
        } catch (parseError) {
          console.error("Failed to parse stored user:", parseError)
        }
      }

      // If no stored user data, redirect to login
      if (!userData) {
        toast.error("Please login to view your profile")
        window.location.href = "/login"
        return
      }

      // Try to fetch from staff API directly since auth API doesn't exist
      if (userData.id) {
        try {
          const [fullProfile, allStaff, allAssessors] = await Promise.all([
            staffAPI.getById(userData.id),
            staffAPI.getAll(),
            assessorAPI.getAll(),
          ])

          console.log('Staff API fullProfile:', fullProfile) // Debug log
          console.log('All staff data sample:', allStaff.slice(0, 2)) // Debug log

          // Find position, unit, supervisor from all staff data
          const staffWithRelations = allStaff.find((s: any) => s.id === userData.id)
          console.log('Staff with relations:', staffWithRelations) // Debug log

          // Find subordinates: staff where current user is the superior assessor
          const subordinateAssessors = allAssessors.filter(
            (a: any) => a.assessorId === userData.id && a.type === 'superior'
          )
          const subordinates = subordinateAssessors
            .map((a: any) => {
              const subordinateStaff = allStaff.find((s: any) => s.id === a.staffId)
              return subordinateStaff ? {
                id: subordinateStaff.id,
                name: subordinateStaff.name,
                position: subordinateStaff.position
              } : null
            })
            .filter(Boolean)

          // Superior assessors, one per person, with their position from the staff list
          const superiorAssessors = allAssessors
            .filter((a: any) => a.staffId === userData.id && a.type === 'superior' && a.assessorId)
            .map((a: any) => allStaff.find((s: any) => s.id === a.assessorId))
            .filter((s: any, i: number, list: any[]) => s && list.findIndex((o: any) => o?.id === s.id) === i)
            .map((s: any) => ({ id: s.id, name: s.name, position: s.position }))

          // The reporting line, only when it is not one of the assessors
          const supervisor = staffWithRelations?.supervisor
          const reportsTo = supervisor && !superiorAssessors.some((a: any) => a.id === supervisor.id)
            ? {
                id: supervisor.id,
                name: supervisor.name,
                position: allStaff.find((s: any) => s.id === supervisor.id)?.position,
              }
            : null

          if (staffWithRelations) {
            const enrichedProfile = {
              ...fullProfile,
              position: staffWithRelations.position,
              unit: staffWithRelations.unit,
              superiorAssessors,
              reportsTo,
              subordinates,
            }
            console.log('Final enriched profile:', enrichedProfile) // Debug log
            setProfile(enrichedProfile)
            updateFormData(enrichedProfile)
          } else {
            // If staff relation not found, use fullProfile with the assessors found
            const basicProfile = {
              ...fullProfile,
              superiorAssessors,
              reportsTo,
              subordinates,
            }
            console.log('Basic profile:', basicProfile) // Debug log
            setProfile(basicProfile)
            updateFormData(basicProfile)
          }
          return
        } catch (staffError: any) {
          console.error("Staff API failed:", staffError)
          // Last fallback: use stored user data as-is
          setProfile(userData)
          updateFormData(userData)
          toast.warning("Some profile data may be limited. Please refresh the page if issues persist.")
          return
        }
      } else {
        // Use stored user data as-is
        setProfile(userData)
        updateFormData(userData)
        toast.warning("Profile loaded from local storage. Some data may be outdated.")
        return
      }
    } catch (error: unknown) {
      console.error("Unexpected error in fetchProfile:", error)
      toast.error("Failed to load profile data")

      // Final fallback to avoid white screen
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setProfile(userData)
          updateFormData(userData)
          toast.warning("Showing cached profile data")
        } catch (parseError) {
          toast.error("Unable to load profile. Please login again.")
          setTimeout(() => {
            window.location.href = "/login"
          }, 2000)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (data: ProfileData) => {
    setFormData({
      name: data.name || "",
      email: data.email || "",
      gender: data.gender || "",
    })
  }

  const handleSaveChanges = async () => {
    if (!profile?.id) return

    try {
      await staffAPI.update(profile.id, formData)
      toast.success("Profile updated successfully")
      setIsEditing(false)
      // Refresh profile data
      fetchProfile()
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(t('passwordFieldsRequired'))
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(t('passwordTooShort'))
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }

    try {
      setIsChangingPassword(true)
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success(t('passwordChangeSuccess'))
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ""
      toast.error(message || t('passwordChangeError'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      setIsUploadingPhoto(true)
      const result = await staffAPI.uploadPhoto(file)

      console.log('Upload result:', result) // Debug log

      // Get the image URL from response (check multiple possible fields)
      const imageUrl = result.photoPath || result.path || result.url || result.secure_url
      console.log('Extracted image URL:', imageUrl) // Debug log

      // Update profile with new image URL in database
      if (profile && imageUrl) {
        console.log('Updating profile with image URL:', imageUrl) // Debug log
        await staffAPI.update(profile.id, { image: imageUrl })

        // Add timestamp to force image refresh and avoid cache issues
        const imageUrlWithTimestamp = `${imageUrl}?t=${Date.now()}`

        setProfile({
          ...profile,
          image: imageUrlWithTimestamp
        })
        console.log('Profile updated with new image:', imageUrlWithTimestamp) // Debug log

        // Also refresh the page data to ensure sync
        setTimeout(() => fetchProfile(), 1000)
      }

      toast.success('Photo uploaded and saved successfully!')
    } catch (error: unknown) {
      console.error('Photo upload error:', error)
      const isAxios = axios.isAxiosError(error)
      const status = isAxios ? error.response?.status : undefined
      const data = isAxios ? (error.response?.data as { error?: string; message?: string } | undefined) : undefined
      const message = isAxios ? error.message : error instanceof Error ? error.message : ""

      if (status === 400) {
        toast.error('Invalid image file or file too large (max 5MB)')
      } else if (status === 401) {
        toast.error('Please login again to upload photo')
      } else {
        toast.error(data?.error || data?.message || message || 'Failed to upload photo. Please try again.')
      }
    } finally {
      setIsUploadingPhoto(false)
      // Reset file input
      event.target.value = ''
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          <IconEdit className="mr-2 size-4" />
          {isEditing ? t('cancelBtn') : t('editBtn')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{t('profilePictureTitle')}</CardTitle>
            <CardDescription>
              {t('profilePictureDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <img
              src={
                profile?.image ||
                (profile?.gender?.toLowerCase() === 'female'
                  ? '/female-avatar.svg'
                  : '/male-avatar.svg')
              }
              alt={profile?.name || 'Profile'}
              className="size-32 rounded-full object-cover border-2 border-gray-200"
              onLoad={() => {
                console.log('Image loaded successfully:', profile?.image)
                setImageLoadError(false)
              }}
              onError={(e) => {
                console.error('Image failed to load:', profile?.image)
                setImageLoadError(true)
                // Fallback to default avatar
                e.currentTarget.src = profile?.gender?.toLowerCase() === 'female'
                  ? '/female-avatar.svg'
                  : '/male-avatar.svg'
              }}
            />
            {imageLoadError && profile?.image && (
              <p className="text-xs text-red-500 mt-1">
                {t('imageError')}
              </p>
            )}

            <div className="mt-4">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={!isEditing || isUploadingPhoto}
              />
              <Button
                variant="outline"
                disabled={!isEditing || isUploadingPhoto}
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                {isUploadingPhoto ? t('uploading') : t('changePhoto')}
              </Button>
            </div>
            <Card className="mt-6 w-full p-2 gap-2">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="position">{t('labelPosition')}</Label>
                  <IconBriefcase className="size-4 text-muted-foreground" />
                  <Input
                    id="position"
                    value={profile?.position?.name || "-"}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="unit">{t('labelUnit')}</Label>
                  <IconBuilding className="size-4 text-muted-foreground" />
                  <Input
                    id="unit"
                    value={profile?.unit?.name || "-"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </Card>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('personalInfoTitle')}</CardTitle>
            <CardDescription>
              {t('personalInfoDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('labelFullName')}</Label>
              <div className="flex items-center gap-2">
                <IconUser className="size-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={isEditing ? formData.name : (profile?.name || "-")}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('labelEmail')}</Label>
              <div className="flex items-center gap-2">
                <IconMail className="size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={isEditing ? formData.email : (profile?.email || "-")}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staffId">{t('labelStaffId')}</Label>
              <Input
                id="staffId"
                value={profile?.staffOrgId || "-"}
                disabled
                readOnly
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">{t('labelGender')}</Label>
              {isEditing ? (
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={t('genderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{t('genderMale')}</SelectItem>
                    <SelectItem value="Female">{t('genderFemale')}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="gender"
                  value={profile?.gender || "-"}
                  disabled
                  readOnly
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('changePasswordTitle')}</CardTitle>
          <CardDescription>
            {t('changePasswordDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">{t('labelCurrentPassword')}</Label>
              <div className="flex items-center gap-2">
                <IconLock className="size-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  disabled={isChangingPassword}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">{t('labelNewPassword')}</Label>
              <div className="flex items-center gap-2">
                <IconLock className="size-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  disabled={isChangingPassword}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t('labelConfirmPassword')}</Label>
              <div className="flex items-center gap-2">
                <IconLock className="size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  disabled={isChangingPassword}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? t('changingPassword') : t('changePasswordBtn')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('supervisorTitle')}</CardTitle>
          <CardDescription>
            {t('supervisorDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.superiorAssessors?.length || profile?.reportsTo ? (
            <div className="space-y-2">
              {[
                ...(profile.superiorAssessors ?? []).map((person) => ({ person, role: t('assessorRole') })),
                ...(profile.reportsTo ? [{ person: profile.reportsTo, role: t('reportsToRole') }] : []),
              ].map(({ person, role }) => (
                <div key={`${role}-${person.id}`} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconUsers className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium break-words">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-right">{person.position?.name || '-'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('noSupervisor')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('subordinatesTitle')}</CardTitle>
          <CardDescription>
            {t('subordinatesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.subordinates && profile.subordinates.length > 0 ? (
            <div className="space-y-2">
              {profile.subordinates.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{sub.name}</span>
                  <span className="text-muted-foreground">
                    {sub.position?.name || '-'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('noSubordinates')}</p>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            setIsEditing(false)
            // Reset form data to original profile data
            if (profile) updateFormData(profile)
          }}>
            {t('cancelBtn')}
          </Button>
          <Button onClick={handleSaveChanges}>
            {t('saveBtn')}
          </Button>
        </div>
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-5 w-[300px] mt-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[120px]" />
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Skeleton className="size-32 rounded-full" />
            <Skeleton className="h-10 w-[120px] mt-4" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[180px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[180px]" />
          <Skeleton className="h-4 w-[220px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
