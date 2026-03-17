import { describe, it, expect } from "vitest"
import { rankEventParticipants } from "./rankEventParticipants"
import type { EventSeriesItem } from "@/lib/series/types"

function makeSeries(
  overrides: Partial<EventSeriesItem> & {
    participantId: string
    rings: number
    teiler: number
    ringteiler?: number
  }
): EventSeriesItem {
  return {
    id: overrides.participantId + "-series",
    participantId: overrides.participantId,
    disciplineId: overrides.disciplineId ?? "disc-1",
    discipline: overrides.discipline ?? { name: "LG", teilerFaktor: 1.0 },
    participant: overrides.participant ?? {
      id: overrides.participantId,
      firstName: overrides.participantId,
      lastName: "Müller",
    },
    isGuest: overrides.isGuest ?? false,
    rings: overrides.rings,
    teiler: overrides.teiler,
    ringteiler: overrides.ringteiler ?? 100 - overrides.rings + overrides.teiler * 1.0,
    shots: overrides.shots ?? [],
    shotCount: 10,
    sessionDate: new Date("2026-03-17"),
  }
}

const BASE_CONFIG = {
  scoringMode: "RINGTEILER" as const,
  targetValue: null,
  targetValueType: null,
  discipline: { scoringType: "WHOLE" as const },
}

describe("rankEventParticipants", () => {
  it("leere Liste zurückgeben wenn keine Serien", () => {
    const result = rankEventParticipants([], BASE_CONFIG)
    expect(result).toEqual([])
  })

  it("RINGTEILER: niedrigster Ringteiler gewinnt", () => {
    const series = [
      makeSeries({ participantId: "A", rings: 90, teiler: 15.0, ringteiler: 25.0 }),
      makeSeries({ participantId: "B", rings: 95, teiler: 5.0, ringteiler: 10.0 }),
      makeSeries({ participantId: "C", rings: 88, teiler: 8.0, ringteiler: 20.0 }),
    ]
    const result = rankEventParticipants(series, BASE_CONFIG)
    expect(result[0].participantId).toBe("B") // Ringteiler 10.0
    expect(result[1].participantId).toBe("C") // Ringteiler 20.0
    expect(result[2].participantId).toBe("A") // Ringteiler 25.0
    expect(result[0].rank).toBe(1)
    expect(result[2].rank).toBe(3)
  })

  it("RINGS: höchste Ringe gewinnen", () => {
    const series = [
      makeSeries({ participantId: "A", rings: 88, teiler: 5.0 }),
      makeSeries({ participantId: "B", rings: 95, teiler: 20.0 }),
      makeSeries({ participantId: "C", rings: 91, teiler: 10.0 }),
    ]
    const result = rankEventParticipants(series, { ...BASE_CONFIG, scoringMode: "RINGS" })
    expect(result[0].participantId).toBe("B") // 95 Ringe
    expect(result[1].participantId).toBe("C") // 91 Ringe
    expect(result[2].participantId).toBe("A") // 88 Ringe
  })

  it("TEILER: niedrigster korrigierter Teiler gewinnt", () => {
    const series = [
      makeSeries({ participantId: "A", rings: 90, teiler: 3.7 }),
      makeSeries({ participantId: "B", rings: 90, teiler: 5.2 }),
      makeSeries({ participantId: "C", rings: 90, teiler: 2.1 }),
    ]
    const result = rankEventParticipants(series, { ...BASE_CONFIG, scoringMode: "TEILER" })
    expect(result[0].participantId).toBe("C") // Teiler 2.1
    expect(result[1].participantId).toBe("A") // Teiler 3.7
    expect(result[2].participantId).toBe("B") // Teiler 5.2
  })

  it("TEILER: Faktor-Korrektur bei gemischten Disziplinen", () => {
    const series = [
      makeSeries({
        participantId: "LG",
        rings: 90,
        teiler: 10.0,
        discipline: { name: "LG", teilerFaktor: 1.0 }, // korrigiert: 10.0
      }),
      makeSeries({
        participantId: "LP",
        rings: 90,
        teiler: 25.0,
        discipline: { name: "LP", teilerFaktor: 0.333 }, // korrigiert: 8.325
      }),
    ]
    const result = rankEventParticipants(series, { ...BASE_CONFIG, scoringMode: "TEILER" })
    // LP hat korrigierten Teiler 25 * 0.333 = 8.325 < 10.0
    expect(result[0].participantId).toBe("LP")
    expect(result[1].participantId).toBe("LG")
  })

  it("TARGET_ABSOLUTE: geringste Abweichung vom Zielwert gewinnt", () => {
    const series = [
      makeSeries({ participantId: "A", rings: 95, teiler: 5.0 }), // Abw. 5
      makeSeries({ participantId: "B", rings: 98, teiler: 5.0 }), // Abw. 2
      makeSeries({ participantId: "C", rings: 88, teiler: 5.0 }), // Abw. 12
    ]
    const result = rankEventParticipants(series, {
      ...BASE_CONFIG,
      scoringMode: "TARGET_ABSOLUTE",
      targetValue: 100,
      targetValueType: "RINGS",
    })
    expect(result[0].participantId).toBe("B") // Abweichung 2
    expect(result[1].participantId).toBe("A") // Abweichung 5
    expect(result[2].participantId).toBe("C") // Abweichung 12
  })

  it("TARGET_UNDER: Teilnehmer unter Zielwert vor Teilnehmern drüber", () => {
    // Zielwert 90 Ringe
    const series = [
      makeSeries({ participantId: "A", rings: 92, teiler: 5.0 }), // über Ziel → schlechtere Tier
      makeSeries({ participantId: "B", rings: 89, teiler: 5.0 }), // unter Ziel, Abw. 1
      makeSeries({ participantId: "C", rings: 87, teiler: 5.0 }), // unter Ziel, Abw. 3
      makeSeries({ participantId: "D", rings: 91, teiler: 5.0 }), // über Ziel, Abw. 1
    ]
    const result = rankEventParticipants(series, {
      ...BASE_CONFIG,
      scoringMode: "TARGET_UNDER",
      targetValue: 90,
      targetValueType: "RINGS",
    })
    // Erst unter-Ziel (B, C): B Abw. 1, C Abw. 3
    // Dann über-Ziel (D, A): D Abw. 1, A Abw. 2
    expect(result[0].participantId).toBe("B")
    expect(result[1].participantId).toBe("C")
    expect(result[2].participantId).toBe("D")
    expect(result[3].participantId).toBe("A")
  })

  it("Rangnummern sind korrekt 1-basiert", () => {
    const series = [
      makeSeries({ participantId: "A", rings: 90, teiler: 5.0, ringteiler: 15.0 }),
      makeSeries({ participantId: "B", rings: 95, teiler: 3.0, ringteiler: 8.0 }),
    ]
    const result = rankEventParticipants(series, BASE_CONFIG)
    expect(result.find((r) => r.participantId === "B")?.rank).toBe(1)
    expect(result.find((r) => r.participantId === "A")?.rank).toBe(2)
  })

  it("Teilnehmername korrekt zusammengesetzt", () => {
    const series = [
      makeSeries({
        participantId: "x",
        rings: 90,
        teiler: 5.0,
        participant: { id: "x", firstName: "Hans", lastName: "Gruber" },
      }),
    ]
    const result = rankEventParticipants(series, BASE_CONFIG)
    expect(result[0].participantName).toBe("Hans Gruber")
  })
})
