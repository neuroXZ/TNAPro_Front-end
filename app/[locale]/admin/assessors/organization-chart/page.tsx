"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { assessorAPI, staffAPI } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { IconRefresh, IconZoomIn, IconZoomOut } from "@tabler/icons-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

type Staff = {
  id: string
  name: string
  image?: string
  position?: {
    id: string
    name: string
  }
}

type AssessorRel = {
  id: string
  staffId?: string
  assessorId?: string
  type?: string
  staff?: { id: string; name: string }
  assessor?: { id: string; name: string }
}

type OrgNode = {
  id: string
  children: OrgNode[]
}

function buildTree(params: {
  rootId: string
  childrenById: Map<string, string[]>
  visited: Set<string>
}): OrgNode {
  const { rootId, childrenById, visited } = params
  if (visited.has(rootId)) return { id: rootId, children: [] }

  const nextVisited = new Set(visited)
  nextVisited.add(rootId)

  const childrenIds = childrenById.get(rootId) ?? []
  return {
    id: rootId,
    children: childrenIds.map((childId) =>
      buildTree({ rootId: childId, childrenById, visited: nextVisited })
    ),
  }
}

function OrgNodeCard({
  name,
  positionName,
  imageUrl,
}: {
  name: string
  positionName: string
  imageUrl?: string
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

  return (
    <div className="rounded-md border bg-card px-3 py-2 text-center shadow-sm min-w-[180px]">
      <div className="flex justify-center pb-2">
        <Avatar className="size-10">
          {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
          <AvatarFallback className="text-xs font-medium">{initials || "?"}</AvatarFallback>
        </Avatar>
      </div>
      <div className="text-sm font-medium leading-5">{name}</div>
      <div className="text-xs text-muted-foreground leading-4">{positionName}</div>
    </div>
  )
}

function OrgNodeView({
  node,
  getName,
  getPositionName,
  getImageUrl,
  zoom,
}: {
  node: OrgNode
  getName: (id: string) => string
  getPositionName: (id: string) => string
  getImageUrl: (id: string) => string | undefined
  zoom: number
}) {
  const children = node.children

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard
        name={getName(node.id)}
        positionName={getPositionName(node.id)}
        imageUrl={getImageUrl(node.id)}
      />

      {children.length > 0 && (
        <>
          <div className="h-6 w-[2px] bg-blue-600" />
          <OrgChildrenRow
            childrenNodes={children}
            getName={getName}
            getPositionName={getPositionName}
            getImageUrl={getImageUrl}
            zoom={zoom}
          />
        </>
      )}
    </div>
  )
}

function OrgChildrenRow({
  childrenNodes,
  getName,
  getPositionName,
  getImageUrl,
  zoom,
}: {
  childrenNodes: OrgNode[]
  getName: (id: string) => string
  getPositionName: (id: string) => string
  getImageUrl: (id: string) => string | undefined
  zoom: number
}) {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const firstRef = useRef<HTMLDivElement | null>(null)
  const lastRef = useRef<HTMLDivElement | null>(null)
  const [lineStyle, setLineStyle] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (childrenNodes.length <= 1) {
      setLineStyle(null)
      return
    }

    const update = () => {
      const rowEl = rowRef.current
      const firstEl = firstRef.current
      const lastEl = lastRef.current
      if (!rowEl || !firstEl || !lastEl) return

      const left = firstEl.offsetLeft + firstEl.offsetWidth / 2
      const right = lastEl.offsetLeft + lastEl.offsetWidth / 2
      const width = Math.max(0, right - left)

      setLineStyle({ left, width })
    }

    requestAnimationFrame(update)

    const ro = new ResizeObserver(update)
    const rowEl = rowRef.current
    const firstEl = firstRef.current
    const lastEl = lastRef.current
    if (rowEl) ro.observe(rowEl)
    if (firstEl) ro.observe(firstEl)
    if (lastEl) ro.observe(lastEl)

    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("resize", update)
      ro.disconnect()
    }
  }, [childrenNodes.length, zoom])

  return (
    <div ref={rowRef} className="relative flex items-start justify-center gap-8">
      {childrenNodes.length > 1 && lineStyle ? (
        <div
          className="absolute top-0 h-[2px] bg-blue-600"
          style={{ left: lineStyle.left, width: lineStyle.width }}
        />
      ) : null}

      {childrenNodes.map((child, index) => (
        <div
          key={child.id}
          ref={
            index === 0
              ? firstRef
              : index === childrenNodes.length - 1
                ? lastRef
                : undefined
          }
          className="flex flex-col items-center"
        >
          <div className="h-6 w-[2px] bg-blue-600" />
          <OrgNodeView
            node={child}
            getName={getName}
            getPositionName={getPositionName}
            getImageUrl={getImageUrl}
            zoom={zoom}
          />
        </div>
      ))}
    </div>
  )
}

export default function AdminAssessorOrganizationChartPage() {
  const t = useTranslations("AdminAssessorOrgChartPage")
  const [isLoading, setIsLoading] = useState(true)
  const [staff, setStaff] = useState<Staff[]>([])
  const [assessors, setAssessors] = useState<AssessorRel[]>([])
  const [zoom, setZoom] = useState(1)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const [chartSize, setChartSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [staffData, assessorData] = await Promise.all([
          staffAPI.getAll(),
          assessorAPI.getAll(),
        ])
        setStaff(staffData)
        setAssessors(assessorData)
      } catch (error: unknown) {
        toast.error(t("fetchError"))
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [t])

  const { roots, childrenById, staffById, fallbackNameById } = useMemo(() => {
    const staffMap = new Map<string, Staff>()
    for (const s of staff) staffMap.set(s.id, s)

    const fallbackNames = new Map<string, string>()
    for (const a of assessors) {
      if (a.staff?.id && a.staff?.name) fallbackNames.set(a.staff.id, a.staff.name)
      if (a.assessor?.id && a.assessor?.name) fallbackNames.set(a.assessor.id, a.assessor.name)
    }

    const superiorRels = assessors.filter(
      (a) =>
        a.type?.toLowerCase() === "superior" &&
        !!a.assessorId &&
        !!a.staffId
    )

    const childrenMap = new Map<string, string[]>()
    const parentSets = new Map<string, Set<string>>()

    for (const rel of superiorRels) {
      const superiorId = rel.assessorId as string
      const subordinateId = rel.staffId as string

      const list = childrenMap.get(superiorId) ?? []
      if (!list.includes(subordinateId)) list.push(subordinateId)
      childrenMap.set(superiorId, list)

      const parents = parentSets.get(subordinateId) ?? new Set<string>()
      parents.add(superiorId)
      parentSets.set(subordinateId, parents)
    }

    for (const [key, value] of childrenMap.entries()) {
      value.sort((a, b) => {
        const an = staffMap.get(a)?.name ?? fallbackNames.get(a) ?? a
        const bn = staffMap.get(b)?.name ?? fallbackNames.get(b) ?? b
        return an.localeCompare(bn)
      })
      childrenMap.set(key, value)
    }

    const superiorIds = Array.from(childrenMap.keys())
    const rootIds = superiorIds.filter((id) => !(parentSets.get(id)?.size))

    rootIds.sort((a, b) => {
      const an = staffMap.get(a)?.name ?? fallbackNames.get(a) ?? a
      const bn = staffMap.get(b)?.name ?? fallbackNames.get(b) ?? b
      return an.localeCompare(bn)
    })

    return {
      roots: rootIds,
      childrenById: childrenMap,
      staffById: staffMap,
      fallbackNameById: fallbackNames,
    }
  }, [assessors, staff])

  const trees = useMemo(() => {
    return roots.map((rootId) =>
      buildTree({ rootId, childrenById, visited: new Set() })
    )
  }, [roots, childrenById])

  const getName = (id: string) => {
    return staffById.get(id)?.name ?? fallbackNameById.get(id) ?? id
  }

  const getPositionName = (id: string) => {
    return staffById.get(id)?.position?.name ?? t("noPosition")
  }

  const getImageUrl = (id: string) => {
    return staffById.get(id)?.image
  }

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
  const zoomIn = () => setZoom((z) => clamp(Math.round((z + 0.1) * 10) / 10, 0.5, 2))
  const zoomOut = () => setZoom((z) => clamp(Math.round((z - 0.1) * 10) / 10, 0.5, 2))
  const zoomReset = () => setZoom(1)

  useLayoutEffect(() => {
    const el = chartRef.current
    if (!el) return

    const update = () => {
      const width = el.scrollWidth
      const height = el.scrollHeight
      setChartSize({ width, height })
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("resize", update)
      ro.disconnect()
    }
  }, [trees.length])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("subtitle")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <IconZoomOut className="size-4" />
              </Button>
              <div className="w-14 text-center text-xs text-muted-foreground tabular-nums">
                {Math.round(zoom * 100)}%
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={zoomIn}
                disabled={zoom >= 2}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <IconZoomIn className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={zoomReset}
                disabled={zoom === 1}
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                <IconRefresh className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              <span>{t("loading")}</span>
            </div>
          ) : trees.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("empty")}</div>
          ) : (
            <ScrollArea className="w-full rounded-md border">
              <div className="p-6">
                <div
                  className="relative inline-block align-top"
                  style={{
                    width: chartSize.width * zoom,
                    height: chartSize.height * zoom,
                  }}
                >
                  <div
                    ref={chartRef}
                    className="inline-block min-w-max space-y-10 origin-top-left"
                    style={{ transform: `scale(${zoom})` }}
                  >
                    {trees.map((tree) => (
                      <div key={tree.id} className="flex justify-center">
                        <OrgNodeView
                          node={tree}
                          getName={getName}
                          getPositionName={getPositionName}
                          getImageUrl={getImageUrl}
                          zoom={zoom}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
