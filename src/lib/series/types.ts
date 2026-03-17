export type EventSeriesItem = {
  id: string
  participantId: string
  disciplineId: string
  discipline: {
    name: string
    teilerFaktor: number
  }
  participant: {
    id: string
    firstName: string
    lastName: string
  }
  isGuest: boolean
  rings: number
  teiler: number
  ringteiler: number
  shots: number[]
  shotCount: number
  sessionDate: Date
}

export type SaveEventSeriesInput = {
  competitionId: string
  participantId: string
  disciplineId: string
  rings: number
  teiler: number
  shotCount: number
}
