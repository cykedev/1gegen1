"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Pencil,
  CheckCircle,
  Archive,
  ArchiveRestore,
  RotateCcw,
  ScrollText,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { setLeagueStatus, deleteLeague } from "@/lib/leagues/actions"
import type { LeagueListItem } from "@/lib/leagues/types"
import type { LeagueStatus } from "@/generated/prisma/client"

interface Props {
  league: LeagueListItem
}

interface PendingStatus {
  status: LeagueStatus
  label: string
}

export function LeagueActions({ league }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleStatusChange() {
    if (!pendingStatus) return
    startTransition(async () => {
      const result = await setLeagueStatus(league.id, pendingStatus.status)
      if ("error" in result) {
        toast.error(typeof result.error === "string" ? result.error : "Fehler beim Statuswechsel.")
      }
      setPendingStatus(null)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLeague(league.id)
      if ("error" in result) {
        toast.error(typeof result.error === "string" ? result.error : "Fehler beim Löschen.")
      }
      setDeleteOpen(false)
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Aktionen</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/leagues/${league.id}/audit-log`)}>
            <ScrollText className="mr-2 h-4 w-4" />
            Protokoll
          </DropdownMenuItem>

          {league.status !== "ARCHIVED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/leagues/${league.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </DropdownMenuItem>
            </>
          )}

          {league.status === "ACTIVE" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setPendingStatus({ status: "COMPLETED", label: "als abgeschlossen markieren" })
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Als abgeschlossen markieren
              </DropdownMenuItem>
            </>
          )}

          {league.status === "COMPLETED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setPendingStatus({ status: "ACTIVE", label: "wieder öffnen" })}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Wieder öffnen
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPendingStatus({ status: "ARCHIVED", label: "archivieren" })}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archivieren
              </DropdownMenuItem>
            </>
          )}

          {league.status === "ARCHIVED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setPendingStatus({
                    status: "COMPLETED",
                    label: "wiederherstellen (als abgeschlossen)",
                  })
                }
              >
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Wiederherstellen
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status-Änderung bestätigen */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liga {pendingStatus?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Liga „${league.name}" wird ${pendingStatus?.label}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>Bestätigen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Löschen bestätigen */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liga löschen?</AlertDialogTitle>
            <AlertDialogDescription>{`Liga „${league.name}" wirklich löschen?`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
