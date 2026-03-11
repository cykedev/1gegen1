"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react"
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
import { setDisciplineArchived, deleteDiscipline } from "@/lib/disciplines/actions"
import type { Discipline } from "@/generated/prisma/client"

interface Props {
  discipline: Discipline
}

export function DisciplineActions({ discipline }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleArchive(archive: boolean) {
    startTransition(async () => {
      const result = await setDisciplineArchived(discipline.id, archive)
      if ("error" in result) {
        toast.error(typeof result.error === "string" ? result.error : "Fehler beim Archivieren.")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDiscipline(discipline.id)
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
          {!discipline.isArchived && (
            <DropdownMenuItem onClick={() => router.push(`/disciplines/${discipline.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </DropdownMenuItem>
          )}
          {!discipline.isArchived ? (
            <DropdownMenuItem onClick={() => handleArchive(true)}>
              <Archive className="mr-2 h-4 w-4" />
              Archivieren
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleArchive(false)}>
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Wiederherstellen
            </DropdownMenuItem>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disziplin löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Disziplin „${discipline.name}" wirklich löschen?`}
            </AlertDialogDescription>
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
