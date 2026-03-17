import { db } from "@/lib/db"
import type { CompetitionDetail, CompetitionListItem } from "@/lib/competitions/types"
import type { EventSeriesItem } from "@/lib/series/types"

const disciplineSelect = {
  id: true,
  name: true,
  scoringType: true,
  teilerFaktor: true,
} as const

const listSelect = {
  id: true,
  name: true,
  type: true,
  status: true,
  scoringMode: true,
  shotsPerSeries: true,
  discipline: { select: { id: true, name: true, scoringType: true } },
  hinrundeDeadline: true,
  rueckrundeDeadline: true,
  eventDate: true,
  allowGuests: true,
  seasonStart: true,
  seasonEnd: true,
  createdAt: true,
  _count: { select: { participants: true } },
} as const

/** Alle aktiven Wettbewerbe mit Disziplin und Teilnehmeranzahl — für allgemeine Ansicht. */
export async function getCompetitions(): Promise<CompetitionListItem[]> {
  const rows = await db.competition.findMany({
    where: { status: "ACTIVE" },
    select: listSelect,
    orderBy: { name: "asc" },
  })
  return rows as unknown as CompetitionListItem[]
}

/** Alle Wettbewerbe (alle Status) — für Admin-Verwaltungsansicht. */
export async function getCompetitionsForManagement(): Promise<CompetitionListItem[]> {
  const rows = await db.competition.findMany({
    select: listSelect,
    orderBy: [{ status: "asc" }, { name: "asc" }],
  })
  return rows as unknown as CompetitionListItem[]
}

/** Einzelner Wettbewerb mit allen Feldern — für Edit-Seite und Detail-Pages. */
export async function getCompetitionById(id: string): Promise<CompetitionDetail | null> {
  const row = await db.competition.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      scoringMode: true,
      shotsPerSeries: true,
      disciplineId: true,
      discipline: { select: disciplineSelect },
      hinrundeDeadline: true,
      rueckrundeDeadline: true,
      eventDate: true,
      allowGuests: true,
      teamSize: true,
      targetValue: true,
      targetValueType: true,
      minSeries: true,
      seasonStart: true,
      seasonEnd: true,
      createdAt: true,
    },
  })
  if (!row) return null
  return {
    ...row,
    discipline: row.discipline
      ? { ...row.discipline, teilerFaktor: row.discipline.teilerFaktor.toNumber() }
      : null,
    targetValue: row.targetValue ? row.targetValue.toNumber() : null,
  }
}

/** Event-Wettbewerb mit allen Serien (inkl. Teilnehmer + Disziplin) — für Rangliste. */
export async function getEventWithSeries(id: string): Promise<{
  competition: CompetitionDetail
  series: EventSeriesItem[]
} | null> {
  const competition = await getCompetitionById(id)
  if (!competition || competition.type !== "EVENT") return null

  const rows = await db.series.findMany({
    where: { competitionId: id },
    select: {
      id: true,
      participantId: true,
      disciplineId: true,
      discipline: { select: { name: true, teilerFaktor: true } },
      participant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          competitions: {
            where: { competitionId: id },
            select: { isGuest: true },
            take: 1,
          },
        },
      },
      rings: true,
      teiler: true,
      ringteiler: true,
      shots: true,
      shotCount: true,
      sessionDate: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const series: EventSeriesItem[] = rows.map((s) => ({
    id: s.id,
    participantId: s.participantId,
    disciplineId: s.disciplineId,
    discipline: { name: s.discipline.name, teilerFaktor: s.discipline.teilerFaktor.toNumber() },
    participant: {
      id: s.participant.id,
      firstName: s.participant.firstName,
      lastName: s.participant.lastName,
    },
    isGuest: s.participant.competitions[0]?.isGuest ?? false,
    rings: s.rings.toNumber(),
    teiler: s.teiler.toNumber(),
    ringteiler: s.ringteiler.toNumber(),
    shots: Array.isArray(s.shots) ? (s.shots as string[]).map(Number) : [],
    shotCount: s.shotCount,
    sessionDate: s.sessionDate,
  }))

  return { competition, series }
}
