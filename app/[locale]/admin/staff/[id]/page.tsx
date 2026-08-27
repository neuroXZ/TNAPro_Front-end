"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    staffAPI,
    positionAPI,
    unitAPI,
    positionCompetencyAPI,
    competencyAPI,
    clusterAPI,
    levelAPI,
    assessorAPI
} from "@/lib/api"
import { toast } from "sonner"
import {
    IconArrowLeft,
    IconMail,
    IconPhone,
    IconBuilding,
    IconBriefcase,
    IconUser,
    IconTarget,
    IconTrophy,
    IconEdit,
    IconAlertTriangle
} from "@tabler/icons-react"
import { format } from "date-fns"
import { StaffFormDialog, type StaffFormData } from "@/features/admin/staff/components/staff-form-dialog"
import { useTranslations } from "next-intl"

interface Staff {
    id: string
    name: string
    email: string
    staffOrgId: string
    image?: string
    gender?: string
    positionId?: string
    unitId?: string
    supervisorId?: string
    password?: string
    createdAt: string
    updatedAt: string
    position?: {
        id: string
        name: string
        grade?: {
            id: string
            name: string
        }
    }
    unit?: {
        id: string
        name: string
        unitType?: {
            id: string
            name: string
        }
    }
    supervisor?: {
        id: string
        name: string
    }
    superior?: {
        id: string
        name: string
        position?: string
    }
    subordinates?: {
        id: string
        name: string
        position?: string
    }[]
}

interface PositionCompetency {
    id: string
    positionId: string
    competencyId: string
    level: number
    isOrphaned?: boolean
    competency: {
        id: string
        name: string
        code: string
        description: string
        cluster: {
            id: string
            name: string
        }
    }
}

export default function StaffProfilePage() {
    const t = useTranslations('AdminStaffDetailPage')
    const params = useParams()
    const router = useRouter()
    const staffId = params.id as string

    const [staff, setStaff] = useState<Staff | null>(null)
    const [positionCompetencies, setPositionCompetencies] = useState<PositionCompetency[]>([])
    const [levels, setLevels] = useState<any[]>([])
    const [superior, setSuperior] = useState<any>(null)
    const [subordinates, setSubordinates] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    useEffect(() => {
        fetchStaffData()
    }, [staffId])

    const fetchStaffData = async () => {
        try {
            setIsLoading(true)

            const [staffData, levelsData, allAssessors, allStaff] = await Promise.all([
                staffAPI.getById(staffId),
                levelAPI.getAll(),
                assessorAPI.getAll(),
                staffAPI.getAll()
            ])

            console.log("=== DEBUG STAFF DATA ===")
            console.log("Full staff data:", JSON.stringify(staffData, null, 2))
            console.log("Staff ID:", staffData.id)
            console.log("Staff name:", staffData.name)
            console.log("Staff image field:", staffData.image)
            console.log("Staff position field:", staffData.position)
            console.log("Staff positionId:", staffData.positionId)
            console.log("Staff unit field:", staffData.unit)
            console.log("Staff unitId:", staffData.unitId)
            console.log("Staff supervisor field:", staffData.supervisor)
            console.log("Staff supervisorId:", staffData.supervisorId)

            // Check if we need to manually fetch position and unit data
            if (!staffData.position && staffData.positionId) {
                console.log("⚠️ Position data missing, need to fetch separately")
            }
            if (!staffData.unit && staffData.unitId) {
                console.log("⚠️ Unit data missing, need to fetch separately")
            }
            console.log("========================")

            // Manually fetch position and unit data if missing from staff data
            let enrichedStaffData = { ...staffData }

            if (!staffData.position && staffData.positionId) {
                try {
                    console.log("Fetching position data for ID:", staffData.positionId)
                    const positionData = await positionAPI.getById(staffData.positionId)
                    enrichedStaffData.position = positionData
                    console.log("Position data fetched:", positionData)
                } catch (error) {
                    console.error("Failed to fetch position data:", error)
                }
            }

            if (!staffData.unit && staffData.unitId) {
                try {
                    console.log("Fetching unit data for ID:", staffData.unitId)
                    const unitData = await unitAPI.getById(staffData.unitId)
                    enrichedStaffData.unit = unitData
                    console.log("Unit data fetched:", unitData)
                } catch (error) {
                    console.error("Failed to fetch unit data:", error)
                }
            }

            // Find superior (who assesses this staff member)
            const superiorAssessor = allAssessors.find(
                (a: any) => a.staffId === staffId && a.type === 'superior'
            )

            let superiorData = null
            if (superiorAssessor) {
                const superiorStaff = allStaff.find((s: any) => s.id === superiorAssessor.assessorId)
                if (superiorStaff) {
                    superiorData = {
                        id: superiorStaff.id,
                        name: superiorStaff.name,
                        position: superiorStaff.position?.name || t('noPosition'),
                        image: superiorStaff.image,
                        gender: superiorStaff.gender
                    }
                }
            }
            setSuperior(superiorData)

            // Find subordinates (staff members this person assesses)
            const subordinateAssessors = allAssessors.filter(
                (a: any) => a.assessorId === staffId && a.type === 'superior'
            )

            const subordinatesData = subordinateAssessors
                .map((a: any) => {
                    const subordinateStaff = allStaff.find((s: any) => s.id === a.staffId)
                    return subordinateStaff ? {
                        id: subordinateStaff.id,
                        name: subordinateStaff.name,
                        position: subordinateStaff.position?.name || t('noPosition'),
                        image: subordinateStaff.image,
                        gender: subordinateStaff.gender
                    } : null
                })
                .filter(Boolean)

            setSubordinates(subordinatesData)

            setStaff(enrichedStaffData)
            setLevels(levelsData)

            // Fetch position competencies if staff has a position
            if (enrichedStaffData.positionId) {
                const [rawPositionCompetencies, allCompetencies, allClusters] = await Promise.all([
                    positionCompetencyAPI.getEffective(enrichedStaffData.positionId!, enrichedStaffData.unitId ?? null),
                    competencyAPI.getAll(),
                    clusterAPI.getAll()
                ])

                // Enrich competencies with cluster data. A mapping row whose
                // competency no longer exists (deleted from the master list
                // after this mapping was created) must be shown as such, not
                // silently rendered with a blank name / "N/A" cluster that
                // looks like a bug rather than a deleted-competency mapping.
                const enrichedCompetencies = rawPositionCompetencies.map((pc: any) => {
                    const fullCompetency = allCompetencies.find((c: any) => c.id === pc.competencyId)
                    const cluster = allClusters.find((cl: any) => cl.id === fullCompetency?.clusterId)
                    const isOrphaned = !pc.competencyId || !fullCompetency

                    return {
                        ...pc,
                        isOrphaned,
                        competency: {
                            ...pc.competency,
                            ...fullCompetency,
                            name: isOrphaned ? t('competencyDeleted') : (fullCompetency?.name ?? pc.competency?.name),
                            cluster: cluster || { id: '', name: isOrphaned ? t('competencyDeleted') : t('uncategorizedCluster') }
                        }
                    }
                })

                setPositionCompetencies(enrichedCompetencies)
            }

        } catch (error) {
            console.error("Failed to fetch staff data:", error)
            toast.error(t('fetchError'))
        } finally {
            setIsLoading(false)
        }
    }

    const getLevelName = (levelValue: number) => {
        const level = levels.find(l => l.value === levelValue)
        return level ? level.name : `Level ${levelValue}`
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getAvatarImage = () => {
        if (staff?.image) return staff.image
        if (staff?.gender?.toLowerCase() === 'female') return '/female-avatar.svg'
        return '/male-avatar.svg'
    }

    const getStaffAvatarImage = (staffMember: any) => {
        if (staffMember?.image) return staffMember.image
        if (staffMember?.gender?.toLowerCase() === 'female') return '/female-avatar.svg'
        return '/male-avatar.svg'
    }

    const handleFormSubmit = async (formData: StaffFormData) => {
        try {
            const submitData = {
                name: formData.name,
                email: formData.email,
                staffOrgId: formData.staffOrgId,
                gender: formData.gender || undefined,
                image: formData.image || undefined,
                password: formData.password,
                positionId: formData.positionId || undefined,
                unitId: formData.unitId || undefined,
                supervisorId: formData.supervisorId || undefined,
            }

            // Remove password if empty (for edit)
            if (!submitData.password) {
                delete submitData.password
            }

            await staffAPI.update(staffId, submitData)
            toast.success(t('saveSuccess'))
            setIsEditDialogOpen(false)
            // Refresh data
            fetchStaffData()
        } catch (error: unknown) {
            console.error("Failed to update staff:", error)

            const getErrorMessage = (err: unknown) => {
                if (axios.isAxiosError(err)) {
                    const data = err.response?.data as { message?: string; error?: string } | undefined
                    return data?.message || data?.error || err.message || ""
                }
                if (err instanceof Error) return err.message || ""
                return ""
            }

            const errorMessage = getErrorMessage(error) || t('updateProfileErrorFallback')

            if (errorMessage.includes('Subscription limit reached')) {
                toast.error(errorMessage)
            } else {
                toast.error(errorMessage)
            }
        }
    }

    // Group competencies by cluster
    const groupedCompetencies = positionCompetencies.reduce((acc, pc) => {
        const clusterName = pc.competency?.cluster?.name || t('uncategorizedCluster')
        if (!acc[clusterName]) {
            acc[clusterName] = []
        }
        acc[clusterName].push(pc)
        return acc
    }, {} as Record<string, PositionCompetency[]>)

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <IconArrowLeft className="size-4 mr-2" />
                    {t('back')}
                </Button>
                <div className="grid gap-6">
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-muted-foreground">{t('loading')}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!staff) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <IconArrowLeft className="size-4 mr-2" />
                    {t('back')}
                </Button>
                <div className="grid gap-6">
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-muted-foreground">{t('notFound')}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()}>
                    <IconArrowLeft className="size-4 mr-2" />
                    {t('backToStaff')}
                </Button>
                <Button onClick={() => setIsEditDialogOpen(true)}>
                    <IconEdit className="size-4 mr-2" />
                    {t('editProfile')}
                </Button>
            </div>

            {/* Staff Profile Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="h-24 w-24 aspect-square">
                            <AvatarImage
                                src={getAvatarImage()}
                                alt={staff.name}
                                className="object-cover w-full h-full"
                                onError={(e) => console.log("Image load error:", e)}
                            />
                            <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                                {getInitials(staff.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-primary">{staff.name}</h1>
                                <p className="text-lg text-muted-foreground">{t('staffId')} {staff.staffOrgId}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {staff.email && (
                                    <div className="flex items-center gap-2">
                                        <IconMail className="size-4 text-muted-foreground" />
                                        <span className="text-sm">{staff.email}</span>
                                    </div>
                                )}



                                <div className="flex items-center gap-2">
                                    <IconBriefcase className="size-4 text-muted-foreground" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm">
                                            {staff.position?.name || (staff.positionId ? t('positionAssigned') : t('noPosition'))}
                                        </span>
                                        {staff.position?.grade?.name && (
                                            <Badge variant="secondary" className="text-xs text-white">
                                                {staff.position.grade.name}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <IconBuilding className="size-4 text-muted-foreground" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm">
                                            {staff.unit?.name || (staff.unitId ? t('unitAssigned') : t('noUnit'))}
                                        </span>
                                        {staff.unit?.unitType?.name && (
                                            <Badge >
                                                {staff.unit.unitType.name}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {(staff.supervisor?.name || staff.supervisorId) && (
                                    <div className="flex items-center gap-2">
                                        <IconUser className="size-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {t('reportsTo')} {staff.supervisor?.name || t('supervisorAssigned')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Joined: {format(new Date(staff.createdAt), "dd MMM yyyy")}</span>
                                <span>Updated: {format(new Date(staff.updatedAt), "dd MMM yyyy")}</span>
                            </div> */}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-[30%_68%]">
                {/* Statistics */}
                <div className="grid gap-4 w-full ">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">{t('totalCompetencies')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{positionCompetencies.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('requiredForPosition')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">{t('competencyClusters')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Object.keys(groupedCompetencies).length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('differentClusters')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">{t('averageRcl')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {positionCompetencies.length > 0
                                    ? (positionCompetencies.reduce((sum, pc) => sum + pc.level, 0) / positionCompetencies.length).toFixed(1)
                                    : '0'
                                }
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('requiredCompetencyLevel')}
                            </p>
                        </CardContent>
                    </Card>


                </div>
                <div className="grid gap-4">
                    {/* Position Competencies */}
                    {positionCompetencies.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IconTarget className="size-5" />
                                    {t('positionCompetencies')}
                                </CardTitle>
                                <CardDescription>
                                    {t('requiredCompetenciesFor', { position: staff.position?.name ?? '' })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue={Object.keys(groupedCompetencies)[0]} className="w-full">
                                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(groupedCompetencies).length}, minmax(0, 1fr))` }}>
                                        {Object.entries(groupedCompetencies).map(([clusterName, competencies], index) => (
                                            <TabsTrigger key={`tab-trigger-${clusterName}-${index}`} value={clusterName} className="gap-2">
                                                <span>{clusterName}</span>
                                                <Badge className="ml-1 text-xs text-white">
                                                    {competencies.length}
                                                </Badge>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {Object.entries(groupedCompetencies).map(([clusterName, competencies], index) => (
                                        <TabsContent key={`tab-content-${clusterName}-${index}`} value={clusterName} className="mt-4">
                                            <div className="space-y-3">
                                                {competencies.map((pc) => (
                                                    <div key={`competency-${pc.id}-${pc.competencyId}`} className={`flex items-center justify-between p-4 border border-l-4 rounded-lg transition-colors ${pc.isOrphaned ? 'border-l-destructive bg-destructive/5' : 'border-l-primary bg-muted/20 hover:bg-muted/40'}`}>
                                                        <div className="flex items-center gap-3">
                                                            {pc.isOrphaned ? (
                                                                <IconAlertTriangle className="size-4 text-destructive" />
                                                            ) : (
                                                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                            )}
                                                            <h4 className={`font-medium ${pc.isOrphaned ? 'text-destructive italic' : ''}`}>{pc.competency.name}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <IconTrophy className="size-4 text-primary" />
                                                            <span className="text-sm font-medium">{t('rclLabel', { level: pc.level })}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {getLevelName(pc.level)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* No Position Assigned */}
                {!staff.positionId && (
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center space-y-2">
                                <IconBriefcase className="size-12 mx-auto text-muted-foreground" />
                                <h3 className="text-lg font-semibold">{t('noPositionAssigned')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('noPositionAssignedDesc')}
                                </p>
                                <Button variant="outline" className="mt-4" onClick={() => router.push(`/admin/staff/${staffId}/edit`)}>
                                    {t('assignPosition')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}


            </div>
            <div>
                {/* Superior & Subordinates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <IconUser className="size-4" />
                            {t('reportingStructure')}
                        </CardTitle>
                    </CardHeader>
                    <CardDescription className="px-6 text-xs text-muted-foreground">
                        {t('reportingStructureDesc')}
                    </CardDescription>
                    <CardContent className="gap-6">
                        <Card className="gap-2 p-4 bg-muted-foreground/3">
                            {/* Superior */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">{t('superior')}</p>
                                {superior ? (
                                    <div className=" flex items-center justify-between p-2 rounded border">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="size-9 aspect-square">
                                                <AvatarImage
                                                    src={getStaffAvatarImage(superior)}
                                                    alt={superior.name}
                                                    className="object-cover w-full h-full"
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(superior.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-xs font-medium">{superior.name}</p>
                                        </div>
                                        <Badge>
                                            {superior.position}
                                        </Badge>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">{t('noSuperiorAssigned')}</p>
                                )}
                            </div>
                        </Card>
                        <Card className="gap-2 p-4 mt-4 bg-muted-foreground/3">
                            {/* Subordinates */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {t('subordinates', { count: subordinates.length })}
                                </p>
                                {subordinates.length > 0 ? (
                                    <div className="space-y-2">
                                        {subordinates.map((subordinate: any, index: number) => (
                                            <div key={`subordinate-${subordinate.id}-${index}`} className="flex items-center justify-between rounded p-2 border">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="size-9 aspect-square">
                                                        <AvatarImage
                                                            src={getStaffAvatarImage(subordinate)}
                                                            alt={subordinate.name}
                                                            className="object-cover w-full h-full"
                                                        />
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(subordinate.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <p className="text-xs font-medium">{subordinate.name}</p>
                                                </div>
                                                <Badge>
                                                    {subordinate.position}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">{t('noSubordinatesAssigned')}</p>
                                )}
                            </div>
                        </Card>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Edit Dialog */}
            <StaffFormDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editingStaff={staff}
                onSubmit={handleFormSubmit}
            />
        </div>
    )
}
