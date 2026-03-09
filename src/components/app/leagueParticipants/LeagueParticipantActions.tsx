"use client"

import { useTransition } from "react"
import { MoreHorizontal, UserMinus, UserCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  withdrawParticipant,
  revokeWithdrawal,
  unenrollParticipant,
} from "@/lib/leagueParticipants/actions"
import type { LeagueParticipantListItem } from "@/lib/leagueParticipants/types"

interface Props {
  entry: LeagueParticipantListItem
}

export function LeagueParticipantActions({ entry }: Props) {
  const [isPending, startTransition] = useTransition()
  const fullName = `${entry.participant.firstName} ${entry.participant.lastName}`

  function handleWithdraw() {
    const reason = prompt(`Begründung für Rückzug von ${fullName} (optional):`)
    if (reason === null) return // user pressed Cancel
    if (!confirm(`${fullName} zurückziehen? Alle Ergebnisse werden aus der Wertung genommen.`))
      return
    startTransition(async () => {
      const fd = new FormData()
      fd.append("reason", reason)
      const result = await withdrawParticipant(entry.id, null, fd)
      if ("error" in result) {
        alert(typeof result.error === "string" ? result.error : "Fehler beim Rückzug.")
      }
    })
  }

  function handleRevokeWithdrawal() {
    if (!confirm(`Rückzug von ${fullName} rückgängig machen?`)) return
    startTransition(async () => {
      const result = await revokeWithdrawal(entry.id)
      if ("error" in result) {
        alert(typeof result.error === "string" ? result.error : "Fehler beim Rückgängigmachen.")
      }
    })
  }

  function handleUnenroll() {
    if (!confirm(`${fullName} aus der Liga entfernen?`)) return
    startTransition(async () => {
      const result = await unenrollParticipant(entry.id)
      if ("error" in result) {
        alert(typeof result.error === "string" ? result.error : "Fehler beim Entfernen.")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Aktionen</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {entry.status === "ACTIVE" && (
          <DropdownMenuItem onClick={handleWithdraw}>
            <UserMinus className="mr-2 h-4 w-4" />
            Zurückziehen
          </DropdownMenuItem>
        )}

        {entry.status === "WITHDRAWN" && (
          <DropdownMenuItem onClick={handleRevokeWithdrawal}>
            <UserCheck className="mr-2 h-4 w-4" />
            Rückzug rückgängig
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleUnenroll}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Aus Liga entfernen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
