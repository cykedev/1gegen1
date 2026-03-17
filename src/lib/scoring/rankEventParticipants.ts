import type { ScoringMode, ScoringType, TargetValueType } from "@/generated/prisma/client"
import type { EventSeriesItem } from "@/lib/series/types"
import { calculateScore, calculateCorrectedTeiler } from "./calculateScore"
import { rankByScore } from "./rankParticipants"

const MAX_RINGS: Record<ScoringType, number> = { WHOLE: 100, DECIMAL: 109 }

export type EventRankedEntry = {
  rank: number
  participantId: string
  participantName: string
  disciplineName: string
  isGuest: boolean
  rings: number
  teiler: number
  correctedTeiler: number
  ringteiler: number
  score: number
  seriesId: string
}

type EventConfig = {
  scoringMode: ScoringMode
  targetValue: number | null
  targetValueType: TargetValueType | null
  discipline: { scoringType: ScoringType } | null
}

/**
 * Berechnet die Rangliste für ein Event.
 * Jede Series entspricht einem Teilnehmer (eine Serie pro Teilnehmer).
 */
export function rankEventParticipants(
  series: EventSeriesItem[],
  config: EventConfig
): EventRankedEntry[] {
  if (series.length === 0) return []

  const entries = series.map((s) => {
    const faktor = s.discipline.teilerFaktor
    // scoringType aus der Teilnehmer-Disziplin ableiten — fallback auf WHOLE
    const scoringType: ScoringType = config.discipline?.scoringType ?? "WHOLE"
    const maxRings = MAX_RINGS[scoringType]
    const correctedTeiler = calculateCorrectedTeiler(s.teiler, faktor)

    const measuredValue = buildMeasuredValue(s, faktor, config.targetValueType)

    const score = calculateScore(config.scoringMode, {
      rings: s.rings,
      teiler: s.teiler,
      faktor,
      maxRings,
      targetValue: config.targetValue ?? undefined,
      measuredValue,
      shots: s.shots,
    })

    return {
      participantId: s.participantId,
      participantName: `${s.participant.firstName} ${s.participant.lastName}`,
      disciplineName: s.discipline.name,
      isGuest: s.isGuest,
      rings: s.rings,
      teiler: s.teiler,
      correctedTeiler,
      ringteiler: s.ringteiler,
      score,
      seriesId: s.id,
    }
  })

  const ranked = rankByScore(
    entries.map((e) => ({ participantId: e.participantId, score: e.score })),
    config.scoringMode
  )

  return ranked.map((r) => {
    const entry = entries.find((e) => e.participantId === r.participantId)!
    return { ...entry, rank: r.rank }
  })
}

/**
 * Ermittelt den Messwert für TARGET-Modi.
 * Basis ist targetValueType: TEILER → korrigierter Teiler; RINGS / RINGS_DECIMAL → Ringe.
 */
function buildMeasuredValue(
  s: EventSeriesItem,
  faktor: number,
  targetValueType: TargetValueType | null
): number {
  if (!targetValueType) return s.rings
  switch (targetValueType) {
    case "TEILER":
      return calculateCorrectedTeiler(s.teiler, faktor)
    case "RINGS":
    case "RINGS_DECIMAL":
      return s.rings
  }
}
