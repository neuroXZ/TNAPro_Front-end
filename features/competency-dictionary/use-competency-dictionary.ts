"use client"

import { useCallback, useEffect, useState } from "react"
import { competencyAPI, levelAPI } from "@/lib/api"
import type { DictionaryCompetency, GlobalLevel } from "./types"

/** Loads one competency's dictionary entry plus the global Level labels. */
export function useCompetencyDictionary(competencyId: string | null | undefined) {
  const [competency, setCompetency] = useState<DictionaryCompetency | null>(null)
  const [levels, setLevels] = useState<GlobalLevel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    if (!competencyId) return
    setIsLoading(true)
    setError(null)
    try {
      const [dictionary, levelList] = await Promise.all([
        competencyAPI.getDictionary<DictionaryCompetency>(competencyId),
        levelAPI.getAll(),
      ])
      setCompetency(dictionary)
      setLevels(levelList ?? [])
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [competencyId])

  useEffect(() => {
    setCompetency(null)
    load()
  }, [load])

  return { competency, levels, isLoading, error, reload: load, setCompetency }
}
