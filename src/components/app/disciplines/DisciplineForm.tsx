"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Discipline } from "@/generated/prisma/client"
import type { ActionResult } from "@/lib/types"

interface Props {
  discipline?: Discipline
  action: (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>
}

export function DisciplineForm({ discipline, action }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, null)

  useEffect(() => {
    if (state && "success" in state && state.success) {
      router.push("/disciplines")
    }
  }, [state, router])

  const fieldErrors =
    state && "error" in state && typeof state.error === "object" ? state.error : null
  const generalError =
    state && "error" in state && typeof state.error === "string" ? state.error : null

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={discipline?.name ?? ""}
          placeholder="z.B. Luftpistole"
          disabled={isPending}
        />
        {fieldErrors?.name && <p className="text-sm text-destructive">{fieldErrors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="scoringType">Wertungsart</Label>
        <Select
          name="scoringType"
          defaultValue={discipline?.scoringType ?? "WHOLE"}
          disabled={isPending}
        >
          <SelectTrigger id="scoringType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WHOLE">Ganzringe (max. 100/Serie)</SelectItem>
            <SelectItem value="DECIMAL">Zehntelringe (max. 109/Serie)</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors?.scoringType && (
          <p className="text-sm text-destructive">{fieldErrors.scoringType[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="teilerFaktor">Teiler-Faktor</Label>
        <Input
          id="teilerFaktor"
          name="teilerFaktor"
          type="number"
          step="0.001"
          min="0.001"
          max="9.999"
          defaultValue={discipline?.teilerFaktor?.toString() ?? "1.0"}
          placeholder="z.B. 0.333"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Korrekturfaktor für gemischte Wertungen. Teiler wird mit diesem Faktor multipliziert.
        </p>
        {fieldErrors?.teilerFaktor && (
          <p className="text-sm text-destructive">{fieldErrors.teilerFaktor[0]}</p>
        )}
      </div>

      {generalError && <p className="text-sm text-destructive">{generalError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
