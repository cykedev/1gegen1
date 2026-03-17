import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, BarChart2, Users } from "lucide-react"
import { getAuthSession } from "@/lib/auth-helpers"
import { getCompetitionById } from "@/lib/competitions/queries"
import { getCompetitionParticipants } from "@/lib/competitionParticipants/queries"
import { db } from "@/lib/db"
import { EventSeriesDialog } from "@/components/app/series/EventSeriesDialog"
import { DeleteEventSeriesButton } from "@/components/app/series/DeleteEventSeriesButton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventSeriesPage({ params }: Props) {
  const { id } = await params

  const [session, competition, participants] = await Promise.all([
    getAuthSession(),
    getCompetitionById(id),
    getCompetitionParticipants(id),
  ])

  if (session?.user.role !== "ADMIN") redirect("/")
  if (!competition) notFound()
  if (competition.type !== "EVENT") redirect(`/competitions/${id}/schedule`)

  // Bestehende Serien laden
  const existingSeries = await db.series.findMany({
    where: { competitionId: id },
    select: { id: true, participantId: true, rings: true, teiler: true },
  })

  const seriesMap = new Map(
    existingSeries.map((s) => [
      s.participantId,
      { id: s.id, rings: s.rings.toNumber(), teiler: s.teiler.toNumber() },
    ])
  )

  const activeParticipants = participants.filter((p) => p.status === "ACTIVE")

  const isMixed = !competition.disciplineId

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/competitions">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Wettbewerbe
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{competition.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {competition.discipline?.name ?? "Gemischt"} · Serien erfassen
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="icon" className="h-9 w-9">
              <Link href={`/competitions/${id}/participants`} title="Teilnehmer">
                <Users className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="icon" className="h-9 w-9">
              <Link href={`/competitions/${id}/ranking`} title="Rangliste">
                <BarChart2 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {activeParticipants.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Noch keine Teilnehmer eingeschrieben.{" "}
          <Link href={`/competitions/${id}/participants`} className="underline">
            Teilnehmer einschreiben
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="divide-y">
            {activeParticipants.map((cp) => {
              const series = seriesMap.get(cp.participant.id)

              return (
                <div key={cp.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {cp.participant.lastName}, {cp.participant.firstName}
                      </span>
                      {cp.isGuest && (
                        <Badge variant="outline" className="text-xs">
                          Gast
                        </Badge>
                      )}
                      {isMixed && cp.discipline && (
                        <Badge variant="secondary" className="text-xs">
                          {cp.discipline.name}
                        </Badge>
                      )}
                    </div>
                    {series ? (
                      <p className="text-xs text-muted-foreground">
                        {series.rings} Ringe · Teiler {series.teiler.toFixed(1)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Noch kein Ergebnis</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <EventSeriesDialog
                      competitionId={id}
                      participantId={cp.participant.id}
                      participantName={`${cp.participant.firstName} ${cp.participant.lastName}`}
                      existingSeries={series}
                    />
                    {series && <DeleteEventSeriesButton seriesId={series.id} competitionId={id} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {existingSeries.length} von {activeParticipants.length} Ergebnissen erfasst
      </p>
    </div>
  )
}
