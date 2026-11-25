"use client"

import { useMemo, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { IconLock, IconX } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { AssessorOption } from "../types"

interface AssessorMultiPickerProps {
  options: AssessorOption[]
  value: string[]
  onChange: (ids: string[]) => void
  /** Assessors who already rated this staff member: shown with a lock, can't be removed. */
  lockedIds?: string[]
  /** The staff member being assessed — never offered as their own superior. */
  excludeId?: string
  disabled?: boolean
  id?: string
}

/**
 * cmdk's default filter is fuzzy ("Rohana" also hits "Rosfarni ... Rahim"),
 * which is noise in a 700-staff list. Match every typed word as plain text.
 */
function matchAllWords(value: string, search: string): number {
  const haystack = value.toLowerCase()
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  return words.every((w) => haystack.includes(w)) ? 1 : 0
}

/**
 * Searchable multi-select of staff, used to pick a staff member's superior
 * assessors (Penilai). Shared by the Staff form and Assessor Management.
 */
export function AssessorMultiPicker({
  options,
  value,
  onChange,
  lockedIds = [],
  excludeId,
  disabled,
  id,
}: AssessorMultiPickerProps) {
  const t = useTranslations("AssessorPicker")
  const [open, setOpen] = useState(false)

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])
  const sorted = useMemo(
    () => options
      .filter((o) => o.id !== excludeId)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [options, excludeId],
  )
  const locked = new Set(lockedIds)

  const toggle = (optionId: string) => {
    if (value.includes(optionId)) {
      if (locked.has(optionId)) return
      onChange(value.filter((v) => v !== optionId))
    } else {
      onChange([...value, optionId])
    }
  }

  const label = (o: AssessorOption | undefined, fallbackId: string) =>
    o ? (o.staffOrgId ? `${o.name} (${o.staffOrgId})` : o.name) : fallbackId

  return (
    <div className="grid gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => {
            const isLocked = locked.has(v)
            return (
              <Badge
                key={v}
                variant="secondary"
                className="max-w-full gap-1 py-1 pl-2 pr-1 font-normal"
                title={isLocked ? t("lockedHint") : undefined}
              >
                {isLocked && <IconLock className="size-3 shrink-0" />}
                <span className="truncate">{label(byId.get(v), v)}</span>
                {!isLocked && !disabled && (
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                    onClick={() => toggle(v)}
                    aria-label={t("remove")}
                  >
                    <IconX className="size-3" />
                  </button>
                )}
              </Badge>
            )
          })}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full min-w-0 justify-between font-normal text-muted-foreground"
          >
            <span className="w-0 flex-1 truncate text-left">
              {value.length === 0 ? t("placeholder") : t("addMore")}
            </span>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command filter={matchAllWords}>
            <CommandInput placeholder={t("search")} />
            <CommandList className="max-h-[240px] overflow-y-auto">
              <CommandEmpty>{t("noResults")}</CommandEmpty>
              <CommandGroup>
                {sorted.map((o) => {
                  const selected = value.includes(o.id)
                  return (
                    <CommandItem
                      key={o.id}
                      // Search matches name, staff no. and detail (unit/position).
                      value={`${o.name} ${o.staffOrgId ?? ""} ${o.detail ?? ""} ${o.id}`}
                      onSelect={() => toggle(o.id)}
                      disabled={selected && locked.has(o.id)}
                    >
                      <CheckIcon className={cn("mr-2 h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                      <div className="min-w-0">
                        <div className="truncate">{label(o, o.id)}</div>
                        {o.detail && <div className="truncate text-xs text-muted-foreground">{o.detail}</div>}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {lockedIds.some((l) => value.includes(l)) && (
        <p className="text-xs text-muted-foreground">{t("lockedHint")}</p>
      )}
    </div>
  )
}
