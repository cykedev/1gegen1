"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth-helpers"
import type { ActionResult } from "@/lib/types"
import type { CompetitionStatus } from "@/generated/prisma/client"

// ─── Shared helpers ────────────────────────────────────────────────────────

function parseDate(value: string | null | undefined): Date | null {
  if (!value || value.trim() === "") return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function revalidateCompetitionPaths(): void {
  revalidatePath("/competitions")
  revalidatePath("/competitions", "layout")
}

// ─── Schemas ───────────────────────────────────────────────────────────────

const BaseSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(100, "Name zu lang"),
  scoringMode: z.enum(
    [
      "RINGTEILER",
      "RINGS",
      "RINGS_DECIMAL",
      "TEILER",
      "DECIMAL_REST",
      "TARGET_ABSOLUTE",
      "TARGET_UNDER",
    ],
    { message: "Ungültiger Wertungsmodus" }
  ),
  shotsPerSeries: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .pipe(z.number().min(1).max(100)),
  disciplineId: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v !== "mixed" ? v : null)),
  // Liga
  hinrundeDeadline: z.string().nullable().optional(),
  rueckrundeDeadline: z.string().nullable().optional(),
  // Event
  eventDate: z.string().nullable().optional(),
  allowGuests: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v === "true" || v === "on"),
  teamSize: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? parseInt(v, 10) : null)),
  targetValue: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null)),
  targetValueType: z
    .enum(["TEILER", "RINGS", "RINGS_DECIMAL"])
    .nullable()
    .optional()
    .transform((v) => v || null),
  // Saison
  minSeries: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? parseInt(v, 10) : null)),
  seasonStart: z.string().nullable().optional(),
  seasonEnd: z.string().nullable().optional(),
})

const CreateSchema = BaseSchema.extend({
  type: z.enum(["LEAGUE", "EVENT", "SEASON"], { message: "Ungültiger Wettbewerbstyp" }),
})

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

export async function createCompetition(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getAuthSession()
  if (!session) return { error: "Nicht angemeldet" }
  if (session.user.role !== "ADMIN") return { error: "Keine Berechtigung" }

  const parsed = CreateSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    scoringMode: formData.get("scoringMode"),
    shotsPerSeries: formData.get("shotsPerSeries"),
    disciplineId: formData.get("disciplineId"),
    hinrundeDeadline: formData.get("hinrundeDeadline"),
    rueckrundeDeadline: formData.get("rueckrundeDeadline"),
    eventDate: formData.get("eventDate"),
    allowGuests: formData.get("allowGuests"),
    teamSize: formData.get("teamSize"),
    targetValue: formData.get("targetValue"),
    targetValueType: formData.get("targetValueType"),
    minSeries: formData.get("minSeries"),
    seasonStart: formData.get("seasonStart"),
    seasonEnd: formData.get("seasonEnd"),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { type, name, scoringMode, shotsPerSeries, disciplineId } = parsed.data

  if (disciplineId) {
    const discipline = await db.discipline.findUnique({
      where: { id: disciplineId },
      select: { id: true },
    })
    if (!discipline) return { error: "Disziplin nicht gefunden." }
  }

  const competition = await db.competition.create({
    data: {
      name,
      type,
      scoringMode,
      shotsPerSeries,
      disciplineId,
      hinrundeDeadline: parseDate(parsed.data.hinrundeDeadline),
      rueckrundeDeadline: parseDate(parsed.data.rueckrundeDeadline),
      eventDate: parseDate(parsed.data.eventDate),
      allowGuests: type === "EVENT" ? parsed.data.allowGuests : null,
      teamSize: type === "EVENT" ? (parsed.data.teamSize ?? null) : null,
      targetValue: type === "EVENT" ? (parsed.data.targetValue ?? null) : null,
      targetValueType: type === "EVENT" ? (parsed.data.targetValueType ?? null) : null,
      minSeries: type === "SEASON" ? (parsed.data.minSeries ?? null) : null,
      seasonStart: type === "SEASON" ? parseDate(parsed.data.seasonStart) : null,
      seasonEnd: type === "SEASON" ? parseDate(parsed.data.seasonEnd) : null,
      createdByUserId: session.user.id,
    },
    select: { id: true },
  })

  revalidateCompetitionPaths()
  return { success: true, data: { id: competition.id } }
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

export async function updateCompetition(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getAuthSession()
  if (!session) return { error: "Nicht angemeldet" }
  if (session.user.role !== "ADMIN") return { error: "Keine Berechtigung" }

  const competition = await db.competition.findUnique({
    where: { id },
    select: { id: true, type: true },
  })
  if (!competition) return { error: "Wettbewerb nicht gefunden." }

  const parsed = BaseSchema.safeParse({
    name: formData.get("name"),
    scoringMode: formData.get("scoringMode"),
    shotsPerSeries: formData.get("shotsPerSeries"),
    disciplineId: formData.get("disciplineId"),
    hinrundeDeadline: formData.get("hinrundeDeadline"),
    rueckrundeDeadline: formData.get("rueckrundeDeadline"),
    eventDate: formData.get("eventDate"),
    allowGuests: formData.get("allowGuests"),
    teamSize: formData.get("teamSize"),
    targetValue: formData.get("targetValue"),
    targetValueType: formData.get("targetValueType"),
    minSeries: formData.get("minSeries"),
    seasonStart: formData.get("seasonStart"),
    seasonEnd: formData.get("seasonEnd"),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const type = competition.type

  await db.competition.update({
    where: { id },
    data: {
      name: parsed.data.name,
      scoringMode: parsed.data.scoringMode,
      shotsPerSeries: parsed.data.shotsPerSeries,
      hinrundeDeadline: parseDate(parsed.data.hinrundeDeadline),
      rueckrundeDeadline: parseDate(parsed.data.rueckrundeDeadline),
      eventDate: type === "EVENT" ? parseDate(parsed.data.eventDate) : undefined,
      allowGuests: type === "EVENT" ? parsed.data.allowGuests : undefined,
      teamSize: type === "EVENT" ? (parsed.data.teamSize ?? null) : undefined,
      targetValue: type === "EVENT" ? (parsed.data.targetValue ?? null) : undefined,
      targetValueType: type === "EVENT" ? (parsed.data.targetValueType ?? null) : undefined,
      minSeries: type === "SEASON" ? (parsed.data.minSeries ?? null) : undefined,
      seasonStart: type === "SEASON" ? parseDate(parsed.data.seasonStart) : undefined,
      seasonEnd: type === "SEASON" ? parseDate(parsed.data.seasonEnd) : undefined,
    },
  })

  revalidateCompetitionPaths()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────

/** Erlaubte Statusübergänge */
const ALLOWED_TRANSITIONS: Record<CompetitionStatus, CompetitionStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: ["ARCHIVED", "ACTIVE"],
  ARCHIVED: ["COMPLETED"],
}

export async function setCompetitionStatus(
  id: string,
  status: CompetitionStatus
): Promise<ActionResult> {
  const session = await getAuthSession()
  if (!session) return { error: "Nicht angemeldet" }
  if (session.user.role !== "ADMIN") return { error: "Keine Berechtigung" }

  const competition = await db.competition.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!competition) return { error: "Wettbewerb nicht gefunden." }

  if (!ALLOWED_TRANSITIONS[competition.status].includes(status)) {
    return {
      error: `Statuswechsel von ${competition.status} nach ${status} ist nicht erlaubt.`,
    }
  }

  await db.competition.update({ where: { id }, data: { status } })
  revalidateCompetitionPaths()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

/** Löschen nur ohne abhängige Daten (Teilnehmer, Paarungen, Playoffs). */
export async function deleteCompetition(id: string): Promise<ActionResult> {
  const session = await getAuthSession()
  if (!session) return { error: "Nicht angemeldet" }
  if (session.user.role !== "ADMIN") return { error: "Keine Berechtigung" }

  const competition = await db.competition.findUnique({ where: { id }, select: { id: true } })
  if (!competition) return { error: "Wettbewerb nicht gefunden." }

  const [participantCount, matchupCount, playoffCount] = await Promise.all([
    db.competitionParticipant.count({ where: { competitionId: id } }),
    db.matchup.count({ where: { competitionId: id } }),
    db.playoffMatch.count({ where: { competitionId: id } }),
  ])

  if (participantCount > 0 || matchupCount > 0 || playoffCount > 0) {
    return {
      error:
        "Wettbewerb kann nicht gelöscht werden — es sind bereits Daten verknüpft. Bitte archivieren.",
    }
  }

  await db.competition.delete({ where: { id } })
  revalidateCompetitionPaths()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// FORCE DELETE (mit allen Abhängigkeiten)
// ─────────────────────────────────────────────────────────────

/** Endgültiges Löschen eines Wettbewerbs inkl. aller abhängigen Daten. */
export async function forceDeleteCompetition(
  competitionId: string,
  confirmationName: string
): Promise<ActionResult> {
  const session = await getAuthSession()
  if (!session) return { error: "Nicht angemeldet" }
  if (session.user.role !== "ADMIN") return { error: "Keine Berechtigung" }

  const competition = await db.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, name: true },
  })
  if (!competition) return { error: "Wettbewerb nicht gefunden." }

  if (confirmationName.trim() !== competition.name) {
    return { error: "Der eingegebene Name stimmt nicht mit dem Wettbewerb-Namen überein." }
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. IDs sammeln für Bottom-up-Löschung
      const matchups = await tx.matchup.findMany({
        where: { competitionId },
        select: { id: true },
      })
      const matchupIds = matchups.map((m) => m.id)

      const playoffMatches = await tx.playoffMatch.findMany({
        where: { competitionId },
        select: { id: true },
      })
      const playoffMatchIds = playoffMatches.map((pm) => pm.id)

      // 2. Playoff-Struktur löschen
      if (playoffMatchIds.length > 0) {
        const playoffDuels = await tx.playoffDuel.findMany({
          where: { playoffMatchId: { in: playoffMatchIds } },
          select: { id: true },
        })
        const playoffDuelIds = playoffDuels.map((pd) => pd.id)

        if (playoffDuelIds.length > 0) {
          await tx.playoffDuelResult.deleteMany({
            where: { duelId: { in: playoffDuelIds } },
          })
          await tx.playoffDuel.deleteMany({
            where: { id: { in: playoffDuelIds } },
          })
        }

        await tx.playoffMatch.deleteMany({
          where: { id: { in: playoffMatchIds } },
        })
      }

      // 3. Liga-Serien (via matchupId)
      if (matchupIds.length > 0) {
        await tx.series.deleteMany({
          where: { matchupId: { in: matchupIds } },
        })
      }

      await tx.matchup.deleteMany({ where: { competitionId } })

      // 4. Event/Saison-Serien (via competitionId)
      await tx.series.deleteMany({ where: { competitionId } })

      // 5. AuditLog + Teilnehmer + Wettbewerb
      await tx.auditLog.deleteMany({ where: { competitionId } })
      await tx.competitionParticipant.deleteMany({ where: { competitionId } })
      await tx.competition.delete({ where: { id: competitionId } })
    })
  } catch (error) {
    console.error("Fehler beim endgültigen Löschen des Wettbewerbs:", error)
    return { error: "Wettbewerb konnte nicht gelöscht werden." }
  }

  revalidateCompetitionPaths()
  return { success: true }
}
