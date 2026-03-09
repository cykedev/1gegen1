Führe den Datenbank-Seed manuell aus (nur nach `/db-reset` nötig).

Im Normalbetrieb läuft der Seed automatisch beim ersten App-Start via `src/lib/startup.ts`
(aufgerufen aus `src/app/layout.tsx`). Manuell nur nach einem DB-Reset erforderlich.

Der Seed legt an (falls noch nicht vorhanden):

1. Admin-User aus `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`
2. Standard-Disziplinen: LP, LG, LPA, LGA

```
docker compose -f docker-compose.dev.yml run --rm app npx prisma db seed
```

Danach bestätigen:

- Wurde der Admin-User angelegt (oder war er bereits vorhanden)?
- Wurden die Disziplinen angelegt (oder bereits vorhanden)?
- Falls Fehler: vollständige Fehlermeldung ausgeben
