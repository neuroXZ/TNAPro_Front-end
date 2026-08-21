import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { IconEye, IconEyeOff, IconUpload, IconX, IconUser } from "@tabler/icons-react"
import { positionAPI, unitAPI, staffAPI } from "@/lib/api"
import { Staff } from "./columns"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface StaffFormData {
  staffOrgId: string
  name: string
  email: string
  image?: string
  gender?: string
  password?: string
  positionId?: string
  unitId?: string
  supervisorId?: string
}

interface StaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingStaff: Staff | null
  onSubmit: (data: StaffFormData) => Promise<void>
}

interface Position {
  id: string
  name: string
  grade?: { name: string | null } | null
}

interface Unit {
  id: string
  name: string
}

export function StaffFormDialog({
  open,
  onOpenChange,
  editingStaff,
  onSubmit,
}: StaffFormDialogProps) {
  const t = useTranslations('AdminStaffPage')
  const tc = useTranslations('Common')
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<StaffFormData>({
    staffOrgId: editingStaff?.staffOrgId || "",
    name: editingStaff?.name || "",
    email: editingStaff?.email || "",
    image: editingStaff?.image || "",
    gender: editingStaff?.gender || "",
    password: "",
    positionId: editingStaff?.positionId || "",
    unitId: editingStaff?.unitId || "",
    supervisorId: editingStaff?.supervisorId || "",
  })

  // Fetch positions, units on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsData, unitsData] = await Promise.all([
          positionAPI.getAll(),
          unitAPI.getAll(),
        ])
        setPositions(positionsData)
        setUnits(unitsData)
      } catch (error) {
        console.error("Failed to fetch form data:", error)
      }
    }
    fetchData()
  }, [])

  // Update form when editingStaff or open state changes
  useEffect(() => {
    if (editingStaff) {
      setFormData({
        staffOrgId: editingStaff.staffOrgId,
        name: editingStaff.name,
        email: editingStaff.email || "",
        image: editingStaff.image || "",
        gender: editingStaff.gender || "",
        password: "",
        positionId: editingStaff.positionId || "",
        unitId: editingStaff.unitId || "",
        supervisorId: editingStaff.supervisorId || "",
      })
      setPreviewUrl(editingStaff.image || null)
    } else {
      setFormData({
        staffOrgId: "",
        name: "",
        email: "",
        image: "",
        gender: "",
        password: "",
        positionId: "",
        unitId: "",
        supervisorId: "",
      })
      setPreviewUrl(null)
    }
  }, [editingStaff, open])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('invalidFileType'))
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'))
      return
    }

    setIsUploading(true)
    try {
      // Upload file
      const result = await staffAPI.uploadPhoto(file)
      
      // Update form data with the uploaded image path
      setFormData({ ...formData, image: result.photoPath })
      setPreviewUrl(result.photoPath)
      
      toast.success(t('photoUploadSuccess'))
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(t('photoUploadError'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = () => {
    setFormData({ ...formData, image: "" })
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? t('editStaffTitle') : t('addNewStaffTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? t('updateStaffInfoDesc')
                : t('addStaffDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            <div className="grid gap-2">
              <Label htmlFor="name">{t('fieldFullNameRequired')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t('placeholderFullName')}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staffOrgId">{t('fieldStaffIdRequired')}</Label>
                <Input
                  id="staffOrgId"
                  value={formData.staffOrgId}
                  onChange={(e) =>
                    setFormData({ ...formData, staffOrgId: e.target.value })
                  }
                  placeholder={t('placeholderStaffId')}
                  required
                  disabled={!!editingStaff}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('fieldEmailRequired')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t('placeholderEmail')}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">{t('fieldGender')}</Label>
                <Select
                  value={formData.gender || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholderGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('genderMale')}</SelectItem>
                    <SelectItem value="female">{t('genderFemale')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {editingStaff ? t('fieldPasswordOptional') : t('fieldPasswordRequired')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={t('placeholderPassword')}
                    required={!editingStaff}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <IconEyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <IconEye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">{t('fieldProfilePhoto')}</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt={t('previewImageAlt')} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <IconUser className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      <IconUpload className="h-4 w-4" />
                      {isUploading ? t('uploadingPhoto') : t('uploadPhoto')}
                    </Button>
                    {previewUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        <IconX className="h-4 w-4" />
                        {tc('remove')}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('uploadHelpText')}
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="positionId">{t('fieldPosition')}</Label>
              <Combobox
                options={positions.map((position) => ({
                  value: position.id,
                  label: position.grade?.name
                    ? `${position.name} — ${position.grade.name}`
                    : position.name,
                }))}
                value={formData.positionId}
                onChange={(value) => setFormData({ ...formData, positionId: value })}
                placeholder={t('placeholderPosition')}
                searchPlaceholder={t('searchPositions')}
                emptyText={t('noPositionFound')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitId">{t('fieldUnit')}</Label>
              <Combobox
                options={units.map((unit) => ({ value: unit.id, label: unit.name }))}
                value={formData.unitId}
                onChange={(value) => setFormData({ ...formData, unitId: value })}
                placeholder={t('placeholderUnit')}
                searchPlaceholder={t('searchUnits')}
                emptyText={t('noUnitFound')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? tc('saving') : editingStaff ? tc('update') : tc('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  )
}

export type { StaffFormData }
