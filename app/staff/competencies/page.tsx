"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { positionCompetencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconTarget, IconTrophy, IconBook } from "@tabler/icons-react"
import { CompetencyDetailDialog } from "./competency-detail-dialog"

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
    }
  }
}

export default function MyCompetencies() {
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
          fetchCompetencies(userData.positionId)
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

  const fetchCompetencies = async (positionId: string) => {
    try {
      setIsLoading(true)
      
      // Fetch position competencies
      const positionCompetenciesData = await positionCompetencyAPI.getByPosition(positionId)
      
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

  // Get unique clusters with their colors
  const clusters = Array.from(
    new Map(
      competencies
        .map(pc => [
          pc.competency.cluster?.name || "Uncategorized",
          {
            name: pc.competency.cluster?.name || "Uncategorized",
            color: pc.competency.cluster?.color || "#6b7280"
          }
        ])
    ).values()
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Competencies</h1>
          <p className="text-muted-foreground">
            View your assigned competencies and proficiency levels
          </p>
        </div>
        <div className="grid gap-4">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary">My Competencies</h1>
        <p className="text-muted-foreground">
          View your assigned competencies and proficiency levels
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        {clusters.map((cluster) => (
          <Card key={cluster.name}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div 
                  className="size-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cluster.color}20` }}
                >
                  <div 
                    className="size-6 rounded-full"
                    style={{ backgroundColor: cluster.color }}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{cluster.name}</p>
                  <p className="text-2xl font-bold">{clusterCounts[cluster.name] || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {clusterCounts[cluster.name] === 1 ? 'competency' : 'competencies'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {clusters.length === 0 && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-500/10 rounded-lg">
                    <IconBook className="size-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">competencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${clusters.length + 1}, minmax(0, 1fr))` }}>
          <TabsTrigger value="all">
            All ({competencies.length})
          </TabsTrigger>
          {clusters.map((cluster) => (
            <TabsTrigger key={cluster.name} value={cluster.name} className="gap-2">
              <div 
                className="size-3 rounded-full"
                style={{ backgroundColor: cluster.color }}
              />
              {cluster.name} ({clusterCounts[cluster.name] || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {!userPositionId ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No position assigned. Please contact your administrator.
                </div>
              </CardContent>
            </Card>
          ) : competencies.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No competencies assigned to your position yet
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByCluster).map(([clusterName, clusterCompetencies]) => (
              <Card key={clusterName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {clusters.find(c => c.name === clusterName) && (
                        <div 
                          className="size-4 rounded-full"
                          style={{ backgroundColor: clusters.find(c => c.name === clusterName)?.color }}
                        />
                      )}
                      <CardTitle>{clusterName}</CardTitle>
                    </div>
                    <Badge variant="outline">{clusterCompetencies.length} Competencies</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clusterCompetencies.map((pc) => (
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
                            <p className="text-xs text-muted-foreground">RCL</p>
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
            ))
          )}
        </TabsContent>

        {clusters.map((cluster) => (
          <TabsContent key={cluster.name} value={cluster.name} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="size-4 rounded-full"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <CardTitle>{cluster.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{clusterCounts[cluster.name] || 0} Competencies</Badge>
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
                          <p className="text-xs text-muted-foreground">RCL</p>
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

      <CompetencyDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        competency={selectedCompetency}
      />
    </div>
  )
}