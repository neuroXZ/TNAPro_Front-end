"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { IconRestore } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mappingTemplateAPI, type TemplateExclusion } from "@/lib/api"

interface TemplateExclusionsProps {
  exclusions: TemplateExclusion[]
  onChanged: () => void
}

export function TemplateExclusions({ exclusions, onChanged }: TemplateExclusionsProps) {
  const t = useTranslations("AdminMappingTemplatePage")
  const [busyId, setBusyId] = useState<string | null>(null)

  const reset = async (e: TemplateExclusion) => {
    try {
      setBusyId(e.id)
      const r = await mappingTemplateAPI.reset(e.positionId, e.competencyId)
      toast.success(t("resetDone", { level: r.level }))
      onChanged()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.error ?? t("resetError"))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("exclusionsTitle")}</CardTitle>
        <CardDescription>{t("exclusionsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {exclusions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("exclusionsEmpty")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {exclusions.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm">
                  <span className="font-medium">{e.position.name}</span> · {e.competency.name}
                </span>
                <Button variant="outline" size="sm" onClick={() => reset(e)} disabled={busyId === e.id}>
                  <IconRestore className="mr-2 size-4" />
                  {t("resetToTemplate")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
