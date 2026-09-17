"use client"

import { useEffect, useState, useCallback } from "react"
import {
  mailQueueAPI,
  settingAPI,
  type MailBatchProgress,
  type MailQueueConfig,
  type MailJobRecord,
  type MailJobStatus,
} from "@/lib/api"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  IconRefresh,
  IconMailFast,
  IconReload,
  IconX,
  IconClock,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { format } from "date-fns"

// English-only, matching the audit-log admin page — this is an operator
// utility, not a client-facing screen. Sidebar label is still translated.

const STATUS_VARIANT: Record<MailJobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  SENT: "default",
  SENDING: "secondary",
  PENDING: "secondary",
  FAILED: "destructive",
  CANCELLED: "outline",
}

// Batches drain in the background; poll so the numbers stay live without the
// admin re-loading. 10s matches the audit-log cache TTL and is well below the
// 5-minute drain cron, so progress visibly advances.
const POLL_MS = 10_000

function formatType(t: string): string {
  return t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// "~N day(s)" for a backlog that can't clear today, given the daily cap.
function etaLabel(pending: number, dailyCap: number): string | null {
  if (pending <= 0 || !dailyCap) return null
  const days = Math.ceil(pending / dailyCap)
  if (days <= 1) return null
  return `~${days} days at ${dailyCap}/day`
}

export default function MailQueuePage() {
  const [batches, setBatches] = useState<MailBatchProgress[]>([])
  const [config, setConfig] = useState<MailQueueConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDraining, setIsDraining] = useState(false)
  const [busyBatch, setBusyBatch] = useState<string | null>(null)

  // Sending-limits editor (per-client override of the daily cap / rate,
  // stored in the Setting table — see resolveMailQueueConfig on the backend).
  const [capInput, setCapInput] = useState("")
  const [rateInput, setRateInput] = useState("")
  const [limitsInit, setLimitsInit] = useState(false)
  const [savingLimits, setSavingLimits] = useState(false)

  const [detailBatch, setDetailBatch] = useState<MailBatchProgress | null>(null)
  const [detailJobs, setDetailJobs] = useState<MailJobRecord[]>([])
  const [detailStatus, setDetailStatus] = useState<MailJobStatus | "ALL">("FAILED")
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchBatches = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoading(true)
      const result = await mailQueueAPI.listBatches()
      setBatches(result.data)
      setConfig(result.config)
      // Prefill the editor once, from the values actually in effect. Not on
      // every poll — that would fight the admin mid-edit.
      setLimitsInit((done) => {
        if (!done) {
          setCapInput(String(result.config.dailyCap))
          setRateInput(String(result.config.ratePerSecond))
        }
        return true
      })
    } catch (error) {
      console.error(error)
      if (showSpinner) toast.error("Failed to load mail queue.")
    } finally {
      if (showSpinner) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBatches(true)
    const id = setInterval(() => fetchBatches(false), POLL_MS)
    return () => clearInterval(id)
  }, [fetchBatches])

  const handleDrainNow = async () => {
    try {
      setIsDraining(true)
      const result = await mailQueueAPI.drain()
      if (result.quotaExceeded) {
        toast.warning(result.reason || "Sending limit reached — the rest stays queued and resumes automatically.")
      } else if (result.sent === 0 && result.failed === 0) {
        toast.info(result.reason || "Nothing to send right now.")
      } else {
        toast.success(`Sent ${result.sent}${result.failed ? `, ${result.failed} failed` : ""}. ${result.remaining} still queued.`)
      }
      fetchBatches(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to drain the queue.")
    } finally {
      setIsDraining(false)
    }
  }

  const handleSaveLimits = async () => {
    // Blank = clear the override and fall back to the server default (env var).
    const cap = capInput.trim() === "" ? null : Number.parseInt(capInput, 10)
    const rate = rateInput.trim() === "" ? null : Number.parseInt(rateInput, 10)
    if (cap !== null && (!Number.isFinite(cap) || cap < 1)) {
      toast.error("Daily cap must be a whole number ≥ 1, or blank for the server default.")
      return
    }
    if (rate !== null && (!Number.isFinite(rate) || rate < 1)) {
      toast.error("Rate must be a whole number ≥ 1, or blank for the server default.")
      return
    }
    try {
      setSavingLimits(true)
      const payload = { mailDailyCap: cap, mailRatePerSecond: rate }
      const settings = await settingAPI.getAll()
      if (settings && settings.length > 0) {
        await settingAPI.update(settings[0].id, payload)
      } else {
        await settingAPI.create(payload)
      }
      toast.success("Sending limits saved. New sends use them within a few minutes.")
      fetchBatches(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to save limits.")
    } finally {
      setSavingLimits(false)
    }
  }

  const handleRetry = async (batch: MailBatchProgress) => {
    try {
      setBusyBatch(batch.batchId)
      const { requeued } = await mailQueueAPI.retryBatch(batch.batchId)
      toast.success(requeued > 0 ? `Requeued ${requeued} failed email(s).` : "No failed emails to retry.")
      fetchBatches(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to retry.")
    } finally {
      setBusyBatch(null)
    }
  }

  const handleCancel = async (batch: MailBatchProgress) => {
    try {
      setBusyBatch(batch.batchId)
      const { cancelled } = await mailQueueAPI.cancelBatch(batch.batchId)
      toast.success(cancelled > 0 ? `Cancelled ${cancelled} pending email(s). Sent emails are unaffected.` : "No pending emails to cancel.")
      fetchBatches(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to cancel.")
    } finally {
      setBusyBatch(null)
    }
  }

  const openDetail = async (batch: MailBatchProgress) => {
    setDetailBatch(batch)
    // Default to whichever view is most useful: failures if any, else all.
    const initial: MailJobStatus | "ALL" = batch.failed > 0 ? "FAILED" : "ALL"
    setDetailStatus(initial)
    loadDetailJobs(batch.batchId, initial)
  }

  const loadDetailJobs = async (batchId: string, status: MailJobStatus | "ALL") => {
    try {
      setDetailLoading(true)
      const jobs = await mailQueueAPI.getBatchJobs(batchId, status === "ALL" ? undefined : status)
      setDetailJobs(jobs)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load batch details.")
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mail Queue</h1>
          <p className="text-muted-foreground">
            Bulk emails (staff notifications, imports, assessment reminders) are sent in the
            background at the provider&apos;s allowed rate. Track progress and retry failures here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Cap {config.dailyCap}/day · {config.ratePerSecond}/sec
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchBatches(true)} disabled={isLoading}>
            <IconRefresh className="mr-1 size-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleDrainNow} disabled={isDraining}>
            <IconMailFast className="mr-1 size-4" />
            {isDraining ? "Sending…" : "Send now"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sending limits</CardTitle>
          <CardDescription>
            Per-client override of how fast this deployment sends. Raise these when the client
            moves to a paid email plan — no redeploy needed. Leave a field blank to use the
            server default. The email provider and its credentials are still set via environment
            variables, not here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="cap">Daily cap (emails/day)</Label>
              <Input
                id="cap"
                type="number"
                min={1}
                className="w-40"
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                placeholder="server default"
              />
              {config?.dailyCapSource === "env" && (
                <p className="text-[11px] text-muted-foreground">Using server default ({config.dailyCap}).</p>
              )}
              {config?.dailyCapSource === "client" && (
                <p className="text-[11px] text-muted-foreground">Client override active.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="rate">Rate (emails/sec)</Label>
              <Input
                id="rate"
                type="number"
                min={1}
                className="w-40"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder="server default"
              />
              {config?.ratePerSecondSource === "env" && (
                <p className="text-[11px] text-muted-foreground">Using server default ({config.ratePerSecond}).</p>
              )}
              {config?.ratePerSecondSource === "client" && (
                <p className="text-[11px] text-muted-foreground">Client override active.</p>
              )}
            </div>
            <Button onClick={handleSaveLimits} disabled={savingLimits}>
              {savingLimits ? "Saving…" : "Save limits"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>
            Each row is one bulk send. Progress advances automatically; this list refreshes every few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing queued yet. Bulk emails you send will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="min-w-[220px]">Progress</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => {
                    const goal = b.total - b.cancelled
                    const pct = goal > 0 ? Math.round((b.sent / goal) * 100) : 100
                    const eta = etaLabel(b.pending, config?.dailyCap ?? 0)
                    const busy = busyBatch === b.batchId
                    return (
                      <TableRow
                        key={b.batchId}
                        className="cursor-pointer"
                        onClick={() => openDetail(b)}
                      >
                        <TableCell className="font-medium max-w-[220px] truncate">
                          {b.batchLabel || "(untitled)"}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(b.createdAt), "d MMM yyyy, HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatType(b.mailType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {b.sent}/{goal}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {b.pending > 0 && (
                              <Badge variant="secondary" className="text-[10px]">
                                <IconClock className="mr-0.5 size-3" />{b.pending} queued
                              </Badge>
                            )}
                            {b.failed > 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                <IconAlertTriangle className="mr-0.5 size-3" />{b.failed} failed
                              </Badge>
                            )}
                            {b.cancelled > 0 && (
                              <Badge variant="outline" className="text-[10px]">{b.cancelled} cancelled</Badge>
                            )}
                            {eta && (
                              <span className="text-[10px] text-muted-foreground self-center">{eta}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(b.lastActivityAt), "d MMM, HH:mm")}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {b.failed > 0 && (
                              <Button variant="outline" size="sm" disabled={busy} onClick={() => handleRetry(b)}>
                                <IconReload className="mr-1 size-3.5" />
                                Retry
                              </Button>
                            )}
                            {b.pending > 0 && (
                              <Button variant="ghost" size="sm" disabled={busy} onClick={() => handleCancel(b)}>
                                <IconX className="mr-1 size-3.5" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailBatch} onOpenChange={(open) => !open && setDetailBatch(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="truncate">{detailBatch?.batchLabel || "Batch"}</DialogTitle>
            <DialogDescription>
              {detailBatch && (
                <>
                  {detailBatch.sent} sent · {detailBatch.pending} queued · {detailBatch.failed} failed
                  {detailBatch.cancelled > 0 ? ` · ${detailBatch.cancelled} cancelled` : ""}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1">
            {(["FAILED", "PENDING", "SENT", "CANCELLED", "ALL"] as const).map((s) => (
              <Button
                key={s}
                variant={detailStatus === s ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDetailStatus(s)
                  if (detailBatch) loadDetailJobs(detailBatch.batchId, s)
                }}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {detailLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : detailJobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No emails in this view.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailJobs.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="text-sm">
                        <div className="font-medium">{j.staffName || j.recipient}</div>
                        {j.staffName && <div className="text-xs text-muted-foreground">{j.recipient}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[j.status]} className="text-[10px]">{j.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px]">
                        {j.status === "FAILED" && j.lastError
                          ? <span className="text-destructive break-words">{j.lastError}</span>
                          : j.status === "SENT" && j.sentAt
                          ? `Sent ${format(new Date(j.sentAt), "d MMM, HH:mm")}`
                          : j.attempts > 0
                          ? `${j.attempts} attempt(s)`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
