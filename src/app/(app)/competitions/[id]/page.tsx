import { notFound, redirect } from "next/navigation"
import { getCompetitionById } from "@/lib/competitions/queries"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CompetitionPage({ params }: Props) {
  const { id } = await params
  const competition = await getCompetitionById(id)
  if (!competition) notFound()

  if (competition.type === "EVENT") {
    redirect(`/competitions/${id}/ranking`)
  }

  redirect(`/competitions/${id}/schedule`)
}
