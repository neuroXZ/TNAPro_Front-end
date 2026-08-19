"use client"

import { useEffect, useState } from "react"
import { auditLogAPI, type AuditLogEntry } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { IconChevronLeft, IconChevronRight, IconEye, IconHistory } from "@tabler/icons-react"
import { toast } from "sonner"
import { format } from "date-fns"

const PAGE_SIZE = 25

const ACTION_BADGE_VARIANT: Record<AuditLogEntry["action"], "default" | "secondary" | "destructive"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [entityType, setEntityType] = useState("")
  const [entityId, setEntityId] = useState("")
  const [viewingEntry, setViewingEntry] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    fetchEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchEntries = async () => {
    try {
      setIsLoading(true)
      const result = await auditLogAPI.getAll({
        page,
        pageSize: PAGE_SIZE,
        entityType: entityType || undefined,
        entityId: entityId || undefined,
      })
      setEntries(result.data)
      setTotal(result.total)
    } catch (error) {
      toast.error("Failed to load audit log")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilter = () => {
    setPage(1)
    fetchEntries()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <IconHistory className="size-7" />
          Audit Log
        </h1>
        <p className="text-muted-foreground">
          Every create, update, and delete across the system, with who did it and what changed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Filter by entity type (e.g. Competency, PositionCompetency, Staff) or a specific record ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Entity type</label>
            <Input
              placeholder="e.g. Competency"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-56"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Entity ID</label>
            <Input
              placeholder="record id"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-56"
            />
          </div>
          <Button onClick={handleFilter}>Apply</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : entries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No audit log entries found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ACTION_BADGE_VARIANT[entry.action]}>{entry.action}</Badge>
                      </TableCell>
                      <TableCell>{entry.entityType}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.entityId ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.actorId ?? "—"}</TableCell>
                      <TableCell>{entry.actorRole ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewingEntry(entry)}>
                          <IconEye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {total} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <IconChevronLeft className="size-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <IconChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingEntry} onOpenChange={(open) => !open && setViewingEntry(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingEntry?.action} — {viewingEntry?.entityType}
            </DialogTitle>
            <DialogDescription>
              {viewingEntry && format(new Date(viewingEntry.createdAt), "dd MMM yyyy, HH:mm:ss")}
              {" · "}actor {viewingEntry?.actorId ?? "unknown"} ({viewingEntry?.actorRole ?? "unknown role"})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {viewingEntry?.before != null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Before</p>
                <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(viewingEntry.before, null, 2)}
                </pre>
              </div>
            )}
            {viewingEntry?.after != null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">After</p>
                <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(viewingEntry.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
