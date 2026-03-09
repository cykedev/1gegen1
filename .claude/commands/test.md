Führe nur die Vitest-Tests aus (ohne Lint, Format-Check oder TSC).

```
docker compose -f docker-compose.dev.yml run --rm app npx vitest run
```

Danach bestätigen:

- Wie viele Tests bestehen / schlagen fehl?
- Falls Fehler: vollständige Fehlermeldung mit Dateiname und Zeile ausgeben
- Keine Code-Änderungen vorschlagen, bis die Fehlerursache klar ist
