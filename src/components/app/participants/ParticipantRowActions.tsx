"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setParticipantActive } from "@/lib/participants/actions"

interface Props {
  participantId: string
  isActive: boolean
}

export function ParticipantRowActions({ participantId, isActive }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setParticipantActive(participantId, !isActive)
      if ("error" in result) {
        alert(typeof result.error === "string" ? result.error : "Fehler beim Statuswechsel.")
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
        <DropdownMenuItem onClick={() => router.push(`/participants/${participantId}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggleActive}>
          {isActive ? (
            <>
              <UserX className="mr-2 h-4 w-4" />
              Deaktivieren
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Aktivieren
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
