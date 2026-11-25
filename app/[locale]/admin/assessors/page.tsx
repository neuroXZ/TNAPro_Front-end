"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { assessorAPI, staffAPI, unitAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  IconSearch,
  IconEdit,
  IconUserPlus,
  IconX,
  IconArrowsSort,
  IconArrowUp,
  IconArrowDown,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { AssessorTableSkeleton } from "@/features/admin/assessors/components/assessor-table-skeleton"
import { StaffAssessorDialog, type DialogStaff } from "@/features/admin/assessors/components/staff-assessor-dialog"
import { BulkAssignDialog, type BulkTarget } from "@/features/admin/assessors/components/bulk-assign-dialog"
import type { AssessorOption } from "@/features/admin/assessors/types"

interface StaffRecord {
  id: string
  name: string
  staffOrgId?: string | null
  unitId?: string | null
  supervisorId?: string | null
  unit?: { id: string; name: string } | null
  position?: { name: string } | null
  supervisor?: { id: string; name: string } | null
}

interface AssessorRecord {
  id: string
  staffId?: string | null
  assessorId?: string | null
  type?: string | null
  assessor?: { id: string; name: string } | null
}

interface UnitRecord {
  id: string
  name: string
  parentId?: string | null
}

/** One row per staff member: who rates them. */
interface StaffRow {
  id: string
  name: string
  staffOrgId: string
  unitId: string | null
  unitName: string
  positionName: string
  supervisor: { id: string; name: string } | null
  superiors: { id: string; name: string }[]
  peerCount: number
  hasSelf: boolean
}

type StatusFilter = "all" | "noSuperior" | "hasSuperior" | "noSelf" | "notReportsTo"
const ALL = "all"

export default function AssessorManagementPage() {
  const t = useTranslations("AdminAssessorsPage")
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [assessors, setAssessors] = useState<AssessorRecord[]>([])
  const [units, setUnits] = useState<UnitRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [unitFilter, setUnitFilter] = useState("")
  const [assessorFilter, setAssessorFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [editing, setEditing] = useState<DialogStaff | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const fetchAll = async () => {
    try {
      setIsLoading(true)
      const [staffData, assessorData, unitData] = await Promise.all([
        staffAPI.getAll(),
        assessorAPI.getAll(),
        unitAPI.getAll(),
      ])
      setStaff(staffData || [])
      setAssessors(assessorData || [])
      setUnits(unitData || [])
    } catch (error) {
      toast.error(t("fetchError"))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- derived data ----------
  const rows: StaffRow[] = useMemo(() => {
    const byStaff = new Map<string, AssessorRecord[]>()
    for (const a of assessors) {
      if (!a.staffId) continue
      const list = byStaff.get(a.staffId) ?? []
      list.push(a)
      byStaff.set(a.staffId, list)
    }
    return staff.map((s) => {
      const mine = byStaff.get(s.id) ?? []
      const superiors = new Map<string, string>()
      for (const a of mine) {
        if (a.type === "superior" && a.assessorId) superiors.set(a.assessorId, a.assessor?.name ?? "—")
      }
      return {
        id: s.id,
        name: s.name ?? "",
        staffOrgId: s.staffOrgId ?? "",
        unitId: s.unit?.id ?? s.unitId ?? null,
        unitName: s.unit?.name ?? "",
        positionName: s.position?.name ?? "",
        supervisor: s.supervisor ? { id: s.supervisor.id, name: s.supervisor.name } : null,
        superiors: [...superiors].map(([id, name]) => ({ id, name })),
        peerCount: mine.filter((a) => a.type === "peer").length,
        hasSelf: mine.some((a) => a.type === "self"),
      }
    })
  }, [staff, assessors])

  // A unit filter includes every unit below it (Felcra's tree is deep).
  const unitScope = useMemo(() => {
    if (!unitFilter) return null
    const children = new Map<string, string[]>()
    for (const u of units) {
      if (!u.parentId) continue
      const list = children.get(u.parentId) ?? []
      list.push(u.id)
      children.set(u.parentId, list)
    }
    const scope = new Set<string>()
    const stack = [unitFilter]
    while (stack.length) {
      const id = stack.pop() as string
      if (scope.has(id)) continue
      scope.add(id)
      stack.push(...(children.get(id) ?? []))
    }
    return scope
  }, [unitFilter, units])

  const counts = useMemo(() => ({
    total: rows.length,
    noSuperior: rows.filter((r) => r.superiors.length === 0).length,
    noSelf: rows.filter((r) => !r.hasSelf).length,
    notReportsTo: rows.filter((r) => r.supervisor && r.superiors.length > 0 && !r.superiors.some((s) => s.id === r.supervisor?.id)).length,
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (unitScope && !(r.unitId && unitScope.has(r.unitId))) return false
      if (assessorFilter && !r.superiors.some((s) => s.id === assessorFilter)) return false
      if (statusFilter === "noSuperior" && r.superiors.length > 0) return false
      if (statusFilter === "hasSuperior" && r.superiors.length === 0) return false
      if (statusFilter === "noSelf" && r.hasSelf) return false
      if (statusFilter === "notReportsTo" && !(r.supervisor && r.superiors.length > 0 && !r.superiors.some((s) => s.id === r.supervisor?.id))) return false
      if (!q) return true
      return r.name.toLowerCase().includes(q)
        || r.staffOrgId.toLowerCase().includes(q)
        || r.positionName.toLowerCase().includes(q)
        || r.superiors.some((s) => s.name.toLowerCase().includes(q))
    })
  }, [rows, search, unitScope, assessorFilter, statusFilter])

  const options: AssessorOption[] = useMemo(
    () => staff.map((s) => ({
      id: s.id,
      name: s.name,
      staffOrgId: s.staffOrgId,
      detail: [s.position?.name, s.unit?.name].filter(Boolean).join(" · ") || null,
    })),
    [staff],
  )

  // Only people who actually assess someone are worth offering in "Assessed by".
  const assessorFilterOptions = useMemo(() => {
    const ids = new Set(rows.flatMap((r) => r.superiors.map((s) => s.id)))
    return options
      .filter((o) => ids.has(o.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((o) => ({ value: o.id, label: o.staffOrgId ? `${o.name} (${o.staffOrgId})` : o.name }))
  }, [rows, options])

  const unitOptions = useMemo(
    () => [...units].sort((a, b) => a.name.localeCompare(b.name)).map((u) => ({ value: u.id, label: u.name })),
    [units],
  )

  const openEditor = (r: StaffRow) =>
    setEditing({
      id: r.id,
      name: r.name,
      staffOrgId: r.staffOrgId,
      detail: [r.positionName, r.unitName].filter(Boolean).join(" · "),
      supervisor: r.supervisor,
    })

  // ---------- table ----------
  const sortHeader = (label: string) =>
    // eslint-disable-next-line react/display-name
    ({ column }: { column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void } }) => (
      <Button variant="ghost" className="-ml-4" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        {label}
        {column.getIsSorted() === "asc" ? <IconArrowUp className="ml-2 size-4" />
          : column.getIsSorted() === "desc" ? <IconArrowDown className="ml-2 size-4" />
          : <IconArrowsSort className="ml-2 size-4" />}
      </Button>
    )

  const columns: ColumnDef<StaffRow>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label={t("selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label={t("selectRow")}
        />
      ),
      enableSorting: false,
    },
    {
      id: "name",
      accessorFn: (r) => r.name,
      header: sortHeader(t("colStaff")),
      cell: ({ row }) => (
        <div className="min-w-[180px] max-w-[260px] whitespace-normal">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {[row.original.staffOrgId, row.original.positionName].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      ),
    },
    {
      id: "unit",
      accessorFn: (r) => r.unitName,
      header: sortHeader(t("colUnit")),
      cell: ({ row }) => <div className="min-w-[120px] max-w-[200px] whitespace-normal text-muted-foreground">{row.original.unitName || "—"}</div>,
    },
    {
      id: "superiors",
      accessorFn: (r) => r.superiors.map((s) => s.name).join(", "),
      header: sortHeader(t("colAssessors")),
      cell: ({ row }) => {
        const r = row.original
        if (r.superiors.length === 0) {
          return (
            <Badge variant="outline" className="gap-1 border-0 bg-red-100 text-red-700">
              <IconAlertTriangle className="size-3.5" /> {t("noAssessor")}
            </Badge>
          )
        }
        return (
          <div className="flex min-w-[160px] max-w-[260px] flex-wrap gap-1">
            {r.superiors.map((s) => (
              <Badge key={s.id} variant="secondary" className="font-normal">{s.name}</Badge>
            ))}
            {r.peerCount > 0 && (
              <span className="text-xs text-muted-foreground">{t("peerCount", { count: r.peerCount })}</span>
            )}
          </div>
        )
      },
    },
    {
      id: "reportsTo",
      accessorFn: (r) => r.supervisor?.name ?? "",
      header: sortHeader(t("colReportsTo")),
      cell: ({ row }) => <div className="min-w-[110px] max-w-[170px] whitespace-normal text-muted-foreground">{row.original.supervisor?.name || "—"}</div>,
    },
    {
      id: "self",
      accessorFn: (r) => (r.hasSelf ? 1 : 0),
      header: t("colSelf"),
      cell: ({ row }) => row.original.hasSelf
        ? <span className="text-green-600">✓</span>
        : <Badge variant="outline" className="border-0 bg-amber-100 text-amber-700">{t("noSelf")}</Badge>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("colActions")}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); openEditor(row.original) }}
            aria-label={t("editTitle")}
          >
            <IconEdit className="size-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], [t])

  const table = useReactTable({
    data: filtered,
    columns,
    getRowId: (r) => r.id,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    autoResetPageIndex: true,
  })

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const bulkTargets: BulkTarget[] = rows
    .filter((r) => selectedIds.includes(r.id))
    .map((r) => ({ id: r.id, name: r.name, currentIds: r.superiors.map((s) => s.id) }))

  const filtersActive = search !== "" || unitFilter !== "" || assessorFilter !== "" || statusFilter !== "all"
  const clearFilters = () => {
    setSearch("")
    setUnitFilter("")
    setAssessorFilter("")
    setStatusFilter("all")
  }

  const summary: { key: StatusFilter; label: string; value: number; tone: string; show: boolean }[] = [
    { key: "all", label: t("summaryTotal"), value: counts.total, tone: "text-foreground", show: true },
    { key: "noSuperior", label: t("summaryNoAssessor"), value: counts.noSuperior, tone: counts.noSuperior > 0 ? "text-red-600" : "text-green-600", show: true },
    { key: "notReportsTo", label: t("summaryNotReportsTo"), value: counts.notReportsTo, tone: "text-sky-700", show: true },
    { key: "noSelf", label: t("summaryNoSelf"), value: counts.noSelf, tone: "text-amber-600", show: counts.noSelf > 0 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {summary.filter((s) => s.show).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatusFilter(s.key)}
              className={`rounded-xl border bg-card px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${statusFilter === s.key ? "ring-2 ring-primary" : ""}`}
            >
              <div className={`text-2xl font-bold ${s.tone}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="gap-3">
          <div>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
            <div className="relative w-full md:w-[240px]">
              <IconSearch className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-full md:w-[220px]">
              <Combobox
                options={unitOptions}
                value={unitFilter}
                onChange={setUnitFilter}
                placeholder={t("filterUnit")}
                searchPlaceholder={t("searchUnit")}
              />
            </div>
            <div className="w-full md:w-[220px]">
              <Combobox
                options={assessorFilterOptions}
                value={assessorFilter}
                onChange={setAssessorFilter}
                placeholder={t("filterAssessedBy")}
                searchPlaceholder={t("searchAssessor")}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("statusAll")}</SelectItem>
                <SelectItem value="noSuperior">{t("summaryNoAssessor")}</SelectItem>
                <SelectItem value="hasSuperior">{t("statusHasAssessor")}</SelectItem>
                <SelectItem value="notReportsTo">{t("summaryNotReportsTo")}</SelectItem>
                <SelectItem value="noSelf">{t("summaryNoSelf")}</SelectItem>
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 self-start md:self-auto">
                <IconX className="size-4" /> {t("clearFilters")}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {t("showingCount", { shown: filtered.length, total: rows.length })}
            </span>
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">{t("selectedCount", { count: selectedIds.length })}</span>
                <Button size="sm" onClick={() => setBulkOpen(true)} className="gap-1">
                  <IconUserPlus className="size-4" /> {t("bulkButton")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRowSelection({})}>
                  {t("clearSelection")}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AssessorTableSkeleton />
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          onClick={() => openEditor(row.original)}
                          className="cursor-pointer"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                          {t("noMatch")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {filtered.length > 0 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>

      <StaffAssessorDialog
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null) }}
        staff={editing}
        options={options}
        onSaved={fetchAll}
      />

      <BulkAssignDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        targets={bulkTargets}
        options={options}
        onDone={() => { setRowSelection({}); fetchAll() }}
      />
    </div>
  )
}
