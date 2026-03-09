"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, UserCheck, UserX } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { setUserActive } from "@/lib/users/actions"

interface Props {
  userId: string
  isActive: boolean
}

export function UserRowActions({ userId, isActive }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setUserActive(userId, !isActive)
      if ("error" in result) {
        alert(result.error)
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
        <DropdownMenuItem onClick={() => router.push(`/admin/users/${userId}/edit`)}>
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
