"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { positionCompetencyAPI } from "@/lib/api"
import { toast } from "sonner"
import { IconTarget, IconTrophy, IconBook } from "@tabler/icons-react"

interface PositionCompetency {
  id: string
  positionId: string
  competencyId: string
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
    }
    level: {
      id: string
      name: string
    }
  }
}

export default function MyCompetencies() {
  const [competencies, setCompetencies] = useState<PositionCompetency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userPositionId, setUserPositionId] = useState<string | null>(null)

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
      const data = await positionCompetencyAPI.getByPosition(positionId)
      setCompetencies(data)
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

  // Count by level
  const levelCounts = competencies.reduce((acc, pc) => {
    const levelName = pc.competency.level?.name || "Unknown"
    acc[levelName] = (acc[levelName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const beginnerCount = levelCounts["Beginner"] || 0
  const intermediateCount = levelCounts["Intermediate"] || 0
  const advancedCount = levelCounts["Advanced"] || 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">My Competencies</h1>
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
        <h1 className="text-3xl font-bold">My Competencies</h1>
        <p className="text-muted-foreground">
          View your assigned competencies and proficiency levels
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <IconBook className="size-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Beginner</p>
                <p className="text-2xl font-bold">{beginnerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <IconTarget className="size-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Intermediate</p>
                <p className="text-2xl font-bold">{intermediateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <IconTrophy className="size-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Advanced</p>
                <p className="text-2xl font-bold">{advancedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Position Competencies</CardTitle>
                  <CardDescription>
                    Competencies required for your position
                  </CardDescription>
                </div>
                <Badge variant="outline">0 Total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No competencies assigned to your position yet
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByCluster).map(([clusterName, clusterCompetencies]) => (
            <Card key={clusterName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{clusterName}</CardTitle>
                    <CardDescription>
                      Competencies in this cluster
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{clusterCompetencies.length} Competencies</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clusterCompetencies.map((pc) => (
                    <div
                      key={pc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
                        <Badge 
                          variant={
                            pc.competency.level?.name === "Beginner" 
                              ? "default" 
                              : pc.competency.level?.name === "Intermediate"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {pc.competency.level?.name || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}