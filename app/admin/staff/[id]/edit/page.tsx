"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  staffAPI, 
  positionAPI, 
  unitAPI,
  staffAPI as staffApiForUpdate 
} from "@/lib/api"
import { toast } from "sonner"
import { 
  IconArrowLeft, 
  IconDeviceFloppy,
  IconUser,
  IconMail,
  IconPhone,
  IconBriefcase,
  IconBuilding
} from "@tabler/icons-react"

interface Staff {
  id: string
  name: string
  email: string
  staffOrgId: string
  photo?: string
  phoneNumber?: string
  positionId?: string
  unitId?: string
  supervisorId?: string
}

interface Position {
  id: string
  name: string
  grade?: {
    name: string
  }
}

interface Unit {
  id: string
  name: string
  unitType?: {
    name: string
  }
}

export default function EditStaffPage() {
  const params = useParams()
  const router = useRouter()
  const staffId = params.id as string

  const [staff, setStaff] = useState<Staff | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [supervisors, setSupervisors] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    staffOrgId: '',
    phoneNumber: '',
    positionId: '',
    unitId: '',
    supervisorId: ''
  })

  useEffect(() => {
    fetchData()
  }, [staffId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      const [staffData, positionsData, unitsData, allStaff] = await Promise.all([
        staffAPI.getById(staffId),
        positionAPI.getAll(),
        unitAPI.getAll(),
        staffAPI.getAll()
      ])

      setStaff(staffData)
      setPositions(positionsData)
      setUnits(unitsData)
      setSupervisors(allStaff.filter((s: Staff) => s.id !== staffId)) // Exclude self

      // Initialize form
      setFormData({
        name: staffData.name || '',
        email: staffData.email || '',
        staffOrgId: staffData.staffOrgId || '',
        phoneNumber: staffData.phoneNumber || '',
        positionId: staffData.positionId || '',
        unitId: staffData.unitId || '',
        supervisorId: staffData.supervisorId || ''
      })

    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load staff data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Basic validation
      if (!formData.name.trim()) {
        toast.error("Name is required")
        return
      }
      
      if (!formData.email.trim()) {
        toast.error("Email is required")
        return
      }

      if (!formData.staffOrgId.trim()) {
        toast.error("Staff Organization ID is required")
        return
      }

      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        staffOrgId: formData.staffOrgId.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        positionId: formData.positionId || undefined,
        unitId: formData.unitId || undefined,
        supervisorId: formData.supervisorId || undefined
      }

      await staffApiForUpdate.update(staffId, updateData)
      toast.success("Staff profile updated successfully!")
      
      // Redirect back to profile page
      router.push(`/admin/staff/${staffId}`)

    } catch (error: any) {
      console.error("Failed to update staff:", error)
      const errorMessage = error.response?.data?.error || "Failed to update staff profile"
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Staff not found</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <IconArrowLeft className="size-4 mr-2" />
          Back to Profile
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <IconDeviceFloppy className="size-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Staff Profile</CardTitle>
            <CardDescription>
              Update staff information and assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <IconUser className="size-5" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="staffOrgId">Staff Organization ID *</Label>
                  <Input
                    id="staffOrgId"
                    value={formData.staffOrgId}
                    onChange={(e) => handleInputChange('staffOrgId', e.target.value)}
                    placeholder="Enter staff org ID"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <IconMail className="size-5" />
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Work Assignments */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <IconBriefcase className="size-5" />
                <h3 className="text-lg font-semibold">Work Assignments</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="positionId">Position</Label>
                  <Select 
                    value={formData.positionId} 
                    onValueChange={(value) => handleInputChange('positionId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Position</SelectItem>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                          {position.grade && ` (${position.grade.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unitId">Unit</Label>
                  <Select 
                    value={formData.unitId} 
                    onValueChange={(value) => handleInputChange('unitId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Unit</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                          {unit.unitType && ` (${unit.unitType.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorId">Supervisor</Label>
                <Select 
                  value={formData.supervisorId} 
                  onValueChange={(value) => handleInputChange('supervisorId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Supervisor</SelectItem>
                    {supervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.staffOrgId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              * Required fields
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}