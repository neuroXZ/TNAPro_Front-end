"use client"

import { useState, useEffect } from "react"
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
import { IconUser, IconMail, IconBriefcase, IconBuilding, IconEdit } from "@tabler/icons-react"
import { authAPI, staffAPI } from "@/lib/api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

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
  supervisor?: {
    id: string
    name: string
  }
}

export default function MyProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const data = await authAPI.getProfile()
      setProfile(data)
      updateFormData(data)
    } catch (error: any) {
      // Fallback: Try to get user data from localStorage
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          
          // If stored user has an id, fetch full staff details
          if (userData.id) {
            const [fullProfile, allStaff] = await Promise.all([
              staffAPI.getById(userData.id),
              staffAPI.getAll(), // Get all staff to find relations
            ])
            
            // Find position, unit, supervisor from all staff data
            const staffWithRelations = allStaff.find((s: any) => s.id === userData.id)
            if (staffWithRelations) {
              const enrichedProfile = {
                ...fullProfile,
                position: staffWithRelations.position,
                unit: staffWithRelations.unit,
                supervisor: staffWithRelations.supervisor,
              }
              setProfile(enrichedProfile)
              updateFormData(enrichedProfile)
            } else {
              setProfile(fullProfile)
              updateFormData(fullProfile)
            }
            return
          } else {
            // Use stored user data as-is
            setProfile(userData)
            updateFormData(userData)
            return
          }
        } catch (parseError) {
          console.error("Failed to load profile:", parseError)
          toast.error("Failed to load profile data")
        }
      } else {
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.")
          setTimeout(() => {
            window.location.href = "/login"
          }, 1500)
        } else {
          toast.error("Failed to fetch profile")
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

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile information
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          <IconEdit className="mr-2 size-4" />
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Your profile photo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {profile?.image ? (
              <img
                src={profile.image}
                alt={profile.name}
                className="size-32 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-32 items-center justify-center rounded-full bg-muted">
                <IconUser className="size-16 text-muted-foreground" />
              </div>
            )}
            <Button variant="outline" className="mt-4" disabled={!isEditing}>
              Change Photo
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="staffId">Staff ID</Label>
              <Input 
                id="staffId" 
                value={profile?.staffOrgId || "-"} 
                disabled 
                readOnly
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              {isEditing ? (
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
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
          <CardTitle>Work Information</CardTitle>
          <CardDescription>
            Your position and unit details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <div className="flex items-center gap-2">
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
              <Label htmlFor="unit">Unit</Label>
              <div className="flex items-center gap-2">
                <IconBuilding className="size-4 text-muted-foreground" />
                <Input 
                  id="unit" 
                  value={profile?.unit?.name || "-"} 
                  disabled 
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supervisor">Supervisor</Label>
            <Input 
              id="supervisor" 
              value={profile?.supervisor?.name || "-"} 
              disabled 
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            setIsEditing(false)
            // Reset form data to original profile data
            if (profile) updateFormData(profile)
          }}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>
            Save Changes
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