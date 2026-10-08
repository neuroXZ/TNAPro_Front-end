"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { IconArrowDown, IconArrowUp, IconPlus, IconX } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import type { DictionaryIndicator, DictionaryLevelRow } from "./types"

/** Editable draft: level value -> ordered bullet texts. */
export type IndicatorDraft = Record<number, string[]>

export function draftFromIndicators(indicators: DictionaryIndicator[]): IndicatorDraft {
  const draft: IndicatorDraft = {}
  const sorted = [...indicators].sort(
    (a, b) => a.level - b.level || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  for (const ind of sorted) (draft[ind.level] ??= []).push(ind.text)
  return draft
}

export function indicatorsFromDraft(draft: IndicatorDraft): { level: number; text: string }[] {
  return Object.keys(draft)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((level) =>
      draft[level].map((text) => text.trim()).filter(Boolean).map((text) => ({ level, text }))
    )
}

// Leading bullet glyphs/numbering as they come out of PDFs and Word docs
// ( = Symbol-font bullet, � = bullet lost in PDF text extraction).
const BULLET_PREFIX = /^\s*(?:[•●▪■◦·\-–—*�]|\d+[.)])\s+/

/**
 * One bullet per pasted item. When the text has bullet markers, lines without
 * one are treated as a PDF line-wrap and joined onto the previous bullet;
 * plain text with no markers is split one line per bullet.
 */
function splitPastedLines(text: string): string[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (!lines.some((line) => BULLET_PREFIX.test(line))) {
    return lines.map((line) => line.trim())
  }
  const items: string[] = []
  for (const line of lines) {
    if (BULLET_PREFIX.test(line) || items.length === 0) {
      items.push(line.replace(BULLET_PREFIX, "").trim())
    } else {
      items[items.length - 1] += " " + line.trim()
    }
  }
  return items.filter(Boolean)
}

interface LevelIndicatorEditorProps {
  rows: DictionaryLevelRow[]
  draft: IndicatorDraft
  onChange: (draft: IndicatorDraft) => void
  disabled?: boolean
}

export function LevelIndicatorEditor({ rows, draft, onChange, disabled }: LevelIndicatorEditorProps) {
  const t = useTranslations("CompetencyDictionary")

  const setLevel = (level: number, items: string[]) => onChange({ ...draft, [level]: items })

  const handlePaste = (level: number, index: number, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const raw = e.clipboardData.getData("text")
    if (!/\r?\n/.test(raw.trim())) return
    const lines = splitPastedLines(raw)
    if (lines.length === 0) return
    // Multi-line paste: one bullet per item, replacing the field pasted into
    // when it was empty, otherwise inserted after it.
    e.preventDefault()
    const items = [...(draft[level] ?? [])]
    const replaceCurrent = !items[index]?.trim()
    items.splice(replaceCurrent ? index : index + 1, replaceCurrent ? 1 : 0, ...lines)
    setLevel(level, items)
  }

  return (
    <ol className="divide-y rounded-lg border">
      {rows.map((row) => {
        const items = draft[row.value] ?? []
        return (
          <li key={row.value} className="grid gap-3 p-4 sm:grid-cols-[10rem_1fr]">
            <div className="flex items-start gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {row.value}
              </span>
              <div className="leading-tight">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("levelLabel", { value: row.value })}
                </div>
                {row.name && <div className="text-sm font-semibold uppercase">{row.name}</div>}
                {!row.inMaster && (
                  <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t("levelNotInMaster")}</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-sm italic text-muted-foreground">{t("noIndicators")}</p>
              )}
              {items.map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <Textarea
                    value={text}
                    rows={1}
                    disabled={disabled}
                    placeholder={t("indicatorPlaceholder")}
                    className="min-h-9 resize-y py-1.5 text-sm"
                    onChange={(e) => {
                      const next = [...items]
                      next[i] = e.target.value
                      setLevel(row.value, next)
                    }}
                    onPaste={(e) => handlePaste(row.value, i, e)}
                  />
                  <div className="flex shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={disabled || i === 0}
                      aria-label={t("moveUp")}
                      onClick={() => {
                        const next = [...items]
                        ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                        setLevel(row.value, next)
                      }}
                    >
                      <IconArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={disabled || i === items.length - 1}
                      aria-label={t("moveDown")}
                      onClick={() => {
                        const next = [...items]
                        ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
                        setLevel(row.value, next)
                      }}
                    >
                      <IconArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      disabled={disabled}
                      aria-label={t("removeIndicator")}
                      onClick={() => setLevel(row.value, items.filter((_, j) => j !== i))}
                    >
                      <IconX className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setLevel(row.value, [...items, ""])}
              >
                <IconPlus className="mr-1 size-4" />
                {t("addIndicator")}
              </Button>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
