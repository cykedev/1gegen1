import Link from "next/link"
import { Plus } from "lucide-react"
import { getUsers } from "@/lib/users/queries"
import { getAdminLoginRateLimitInsights } from "@/lib/admin/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRowActions } from "@/components/app/users/UserRowActions"
import { AdminLoginRateLimitTable } from "@/components/app/admin/AdminLoginRateLimitTable"
import { AdminLoginRateLimitInsightsPanel } from "@/components/app/admin/AdminLoginRateLimitInsights"

export default async function AdminUsersPage() {
  const [users, rateLimitInsights] = await Promise.all([
    getUsers(),
    getAdminLoginRateLimitInsights(),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nutzerverwaltung</h1>
          <p className="mt-1 text-sm text-muted-foreground">App-Zugänge verwalten</p>
        </div>
        <Button asChild size="sm" className="self-start">
          <Link href="/admin/users/new">
            <Plus className="mr-1 h-4 w-4" />
            Neuer Nutzer
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        {users.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Keine Nutzer vorhanden.
          </p>
        ) : (
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {user.name ?? <span className="text-muted-foreground italic">Kein Name</span>}
                    </span>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.role === "ADMIN" ? "Admin" : "Benutzer"}
                    </Badge>
                    {!user.isActive && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Inaktiv
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <UserRowActions userId={user.id} isActive={user.isActive} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Aktive Login-Sperren ({rateLimitInsights.activeBlockedBuckets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminLoginRateLimitTable buckets={rateLimitInsights.activeBlockedBuckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login-Rate-Limit Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminLoginRateLimitInsightsPanel insights={rateLimitInsights} />
        </CardContent>
      </Card>
    </div>
  )
}
