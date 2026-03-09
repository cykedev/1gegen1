"use client"

import { useTransition } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { advanceRound } from "@/lib/playoffs/actions"

interface Props {
  leagueId: string
  label: string
}

export function AdvanceRoundButton({ leagueId, label }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAdvance() {
    if (!confirm(`${label} anlegen?`)) return
    startTransition(async () => {
      const result = await advanceRound(leagueId)
      if ("error" in result) {
        alert(typeof result.error === "string" ? result.error : "Fehler beim Anlegen der Runde.")
      }
    })
  }

  return (
    <Button onClick={handleAdvance} disabled={isPending} size="sm">
      <ArrowRight className="mr-2 h-4 w-4" />
      {isPending ? "Anlegen…" : label}
    </Button>
  )
}
