"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { positionCompetencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconTarget, IconTrophy, IconBook } from "@tabler/icons-react"
import { CompetencyDetailDialog } from "@/features/staff/competencies/components/competency-detail-dialog"

interface PositionCompetency {
  id: string
  positionId: string
  competencyId: string
  level?: number  // RCL (Required Competency Level)
  position: {
    id: string
    name: string
  }
  competency: {
    id: string
    name: string
    code: string
    cluster: {
      id: string
      name: string
      color?: string
      level?: number
    }
  }
}

export default function MyCompetencies() {
  const t = useTranslations('StaffCompetenciesPage')
  const [competencies, setCompetencies] = useState<PositionCompetency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userPositionId, setUserPositionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedCompetency, setSelectedCompetency] = useState<PositionCompetency | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const handleCompetencyClick = (competency: PositionCompetency) => {
    setSelectedCompetency(competency)
    setIsDetailDialogOpen(true)
  }

  useEffect(() => {
    // Get user position from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (userData.positionId) {
          setUserPositionId(userData.positionId)
          fetchCompetencies(userData.positionId, userData.unitId ?? null)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchCompetencies = async (positionId: string, unitId: string | null = null) => {
    try {
      setIsLoading(true)

      // Fetch position competencies
      const positionCompetenciesData = await positionCompetencyAPI.getEffective(positionId, unitId)
      
      // Fetch all competencies with cluster info to enrich the data
      const competencyAPI = (await import("@/lib/api")).competencyAPI
      const allCompetencies = await competencyAPI.getAll()
      
      // Enrich position competencies with full competency data (including cluster)
      const enrichedData = positionCompetenciesData.map((pc: any) => {
        const fullCompetency = allCompetencies.find((c: any) => c.id === pc.competencyId)
        return {
          ...pc,
          competency: fullCompetency || pc.competency
        }
      })
      
      setCompetencies(enrichedData)
    } catch (error) {
      console.error("Failed to fetch competencies:", error)
      toast.error("Failed to load competencies")
    } finally {
      setIsLoading(false)
    }
  }

  // Group competencies by cluster
  const groupedByCluster = competencies.reduce((acc, pc) => {
    const clusterName = pc.competency.cluster?.name || "Uncategorized"
    if (!acc[clusterName]) {
      acc[clusterName] = []
    }
    acc[clusterName].push(pc)
    return acc
  }, {} as Record<string, PositionCompetency[]>)

  // Count by cluster
  const clusterCounts = competencies.reduce((acc, pc) => {
    const clusterName = pc.competency.cluster?.name || "Uncategorized"
    acc[clusterName] = (acc[clusterName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get unique clusters with their colors and sort by level
  const clusters = Array.from(
    new Map(
      competencies
        .map(pc => [
          pc.competency.cluster?.name || "Uncategorized",
          {
            name: pc.competency.cluster?.name || "Uncategorized",
            color: pc.competency.cluster?.color || "#6b7280",
            level: pc.competency.cluster?.level || 999
          }
        ])
    ).values()
  ).sort((a, b) => (a.level || 999) - (b.level || 999))

  // Auto-activate first tab when clusters are loaded
  useEffect(() => {
    if (clusters.length > 0 && activeTab === "all") {
      setActiveTab(clusters[0].name)
    }
  }, [clusters.length, activeTab])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="grid gap-4">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">{t('loading')}</div>
            </CardContent>
          </Card>
        </div>
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
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${clusters.length}, minmax(0, 1fr))` }}>
            {clusters.map((cluster) => (
              <TabsTrigger key={cluster.name} value={cluster.name} className="gap-2">
                <div 
                  className="hidden sm:block size-3 sm:size-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: cluster.color }}
                />
                <span className="hidden sm:inline">{cluster.name} ({clusterCounts[cluster.name] || 0})</span>
                <span className="sm:hidden">{cluster.name.split(' ')[0]} ({clusterCounts[cluster.name] || 0})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        {clusters.map((cluster) => (
          <TabsContent key={cluster.name} value={cluster.name} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="size-4 sm:size-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <CardTitle className="text-base sm:text-lg">{cluster.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{t('competenciesBadge', { count: clusterCounts[cluster.name] || 0 })}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedByCluster[cluster.name]?.map((pc) => (
                    <div
                      key={pc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleCompetencyClick(pc)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{pc.competency.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {pc.competency.code}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-xs text-muted-foreground">{t('rclLabel')}</p>
                          <p className="text-sm font-semibold">
                            {pc.level !== undefined && pc.level !== null ? pc.level : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
        </Tabs>
      </div>

      <CompetencyDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        competency={selectedCompetency}
      />
    </div>
  )
}