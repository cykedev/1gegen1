import Link from "next/link"
import { redirect } from "next/navigation"
import { Trophy } from "lucide-react"
import { getAuthSession } from "@/lib/auth-helpers"
import { getCompetitionsForManagement, getEventWithSeries } from "@/lib/competitions/queries"
import { getStandingsForCompetition } from "@/lib/standings/queries"
import { getPlayoffBracket } from "@/lib/playoffs/queries"
import { rankEventParticipants } from "@/lib/scoring/rankEventParticipants"
import { StandingsTable } from "@/components/app/standings/StandingsTable"
import { PlayoffBracket } from "@/components/app/playoffs/PlayoffBracket"
import { EventRankingTable } from "@/components/app/series/EventRankingTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── DashboardPage ───────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const competitions = await getCompetitionsForManagement()
  const active = competitions.filter((c) => c.status === "ACTIVE")
  const activeLeagues = active.filter((c) => c.type === "LEAGUE")
  const activeNonLeagues = active.filter((c) => c.type !== "LEAGUE")

  const [leagueData, nonLeagueData] = await Promise.all([
    Promise.all(
      activeLeagues.map(async (c) => ({
        competition: c,
        standings: await getStandingsForCompetition(c.id),
        bracket: await getPlayoffBracket(c.id),
      }))
    ),
    Promise.all(
      activeNonLeagues.map(async (c) => {
        const data = await getEventWithSeries(c.id)
        const ranked = data
          ? rankEventParticipants(data.series, {
              scoringMode: data.competition.scoringMode,
              targetValue: data.competition.targetValue,
              targetValueType: data.competition.targetValueType,
              discipline: data.competition.discipline,
            })
          : []
        return { competition: c, ranked }
      })
    ),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Aktive Wettbewerbe auf einen Blick</p>
      </div>

      {active.length === 0 ? (
        <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
          Keine aktiven Wettbewerbe vorhanden.
        </p>
      ) : (
        <div className="space-y-10">
          {/* Liga-Wettbewerbe: Tabelle / Playoffs */}
          {leagueData.map(({ competition, standings, bracket }) => {
            const playoffsStarted =
              bracket.quarterFinals.length + bracket.semiFinals.length > 0 || bracket.final !== null

            return (
              <div key={competition.id} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{competition.name}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {competition.discipline?.name ?? "Gemischt"}
                  </Badge>
                </div>

                {playoffsStarted ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      Playoffs
                    </div>
                    <PlayoffBracket bracket={bracket} isAdmin={false} compact={true} />
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/competitions/${competition.id}/playoffs`}>Details →</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <StandingsTable rows={standings} />
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/competitions/${competition.id}/schedule`}>Details →</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Events / Saisons: Rangliste */}
          {nonLeagueData.map(({ competition: c, ranked }) => (
            <div key={c.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {c.discipline?.name ?? "Gemischt"}
                </Badge>
              </div>
              <div className="space-y-2">
                <EventRankingTable
                  entries={ranked}
                  scoringMode={c.scoringMode}
                  isMixed={!c.discipline}
                />
                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/competitions/${c.id}/ranking`}>Rangliste →</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
