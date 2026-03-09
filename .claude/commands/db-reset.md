Setzt die Dev-Datenbank vollständig zurück (alle Daten gehen verloren).

Nur in der lokalen Entwicklungsumgebung verwenden – niemals in Produktion.

Führe diese Schritte aus:

```
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d db
```

Dann warten bis die DB bereit ist, Migrationen laufen und optional seeden:

```
docker compose -f docker-compose.dev.yml run --rm migrate
docker compose -f docker-compose.dev.yml run --rm app npx prisma db seed
```

Danach die App starten:

```
docker compose -f docker-compose.dev.yml up app
```

Oder alles auf einmal via Watch-Modus (über launch.json / `preview_start`).

Bestätigen: Login mit Seed-Admin-Account funktioniert.
