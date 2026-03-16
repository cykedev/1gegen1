# Funktionale Anforderungen – Ringwerk

---

## Rollen & Berechtigungen

| Rolle                 | Berechtigungen                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrator (ADMIN) | Vollzugriff: Nutzerverwaltung, Wettbewerbe, Teilnehmer, Force-Delete                                                                              |
| Manager (MANAGER)     | Wettbewerbe erstellen/verwalten, Ergebnisse erfassen, Teilnehmer/Disziplinen verwalten — **kein** Zugriff auf Nutzerverwaltung, kein Force-Delete |
| Benutzer (USER)       | Ergebnisse und Tabellen einsehen (read-only)                                                                                                      |
| Gastteilnehmer        | Nimmt an einzelnen Events teil; kein Login erforderlich                                                                                           |

### Berechtigungsmatrix

| Aktion                              | ADMIN | MANAGER  | USER |
| ----------------------------------- | ----- | -------- | ---- |
| Wettbewerbe erstellen/bearbeiten    | Ja    | Ja       | Nein |
| Ergebnisse erfassen/korrigieren     | Ja    | Ja       | Nein |
| Teilnehmer verwalten                | Ja    | Ja       | Nein |
| Disziplinen verwalten               | Ja    | Ja       | Nein |
| Playoffs starten/verwalten          | Ja    | Ja       | Nein |
| Wettbewerb archivieren/abschliessen | Ja    | Ja       | Nein |
| Audit-Log einsehen                  | Ja    | Ja       | Nein |
| **Nutzerverwaltung** (/admin/\*)    | Ja    | **Nein** | Nein |
| **Force-Delete**                    | Ja    | **Nein** | Nein |
| **Rollen zuweisen**                 | Ja    | **Nein** | Nein |
| Ergebnisse/Tabellen ansehen         | Ja    | Ja       | Ja   |

---

## Disziplinen

- Mehrere Disziplinen parallel verfuegbar
- Parameter je Disziplin: Name, Kuerzel, Wertungsart (Ganz-/Zehntelringe), Max.Ringe/Schuss, teilerFaktor
- **teilerFaktor: Decimal(4,3)** mit Default 1.0 — Korrekturfaktor fuer gemischte Wertungen
  - Gueltige Range: 0.001 bis 9.999 (min. 0.001, max. 9.999)
  - Wird beim Erstellen/Bearbeiten in der UI als "Teiler-Faktor" angezeigt
  - In Disziplin-Listen: Badge mit "Faktor X.XXX" (z.B. "Faktor 0.333")
- Vorinstallierte Systemdisziplinen (automatisch angelegt beim ersten Start):

| Kuerzel | Name                | Wertungsart  | teilerFaktor    |
| ------- | ------------------- | ------------ | --------------- |
| LP      | Luftpistole         | Ganzringe    | 0.333 (/3)      |
| LG      | Luftgewehr          | Ganzringe    | 1.0             |
| LPA     | Luftpistole Auflage | Zehntelringe | 0.6 (/3 \* 1.8) |
| LGA     | Luftgewehr Auflage  | Zehntelringe | 1.8             |

- Admin: Disziplinen anlegen, bearbeiten, Faktor konfigurieren
- Loeschen nur ohne Wettbewerbsergebnisse; sonst **archivieren**
- Disziplin-Faktor jederzeit aenderbar (Aenderung wirkt auf zukuenftige Berechnungen)

---

## Wettbewerbe

### Ueberblick

Ringwerk kennt drei Wettbewerbstypen. Alle teilen dieselbe Scoring-Engine und den Teilnehmerpool.

| Typ                 | Ablauf                                        | Ergebnis                                     |
| ------------------- | --------------------------------------------- | -------------------------------------------- |
| **Liga** (LEAGUE)   | Spielplan → Gruppenphase → Tabelle → Playoffs | Meister + Platzierungen                      |
| **Event** (EVENT)   | Anmeldung → Schiessen → Rangliste             | Rangliste (ggf. mit Zielwert)                |
| **Saison** (SEASON) | Serien ueber Monate → Auswertung              | Mehrfach-Ranking (Ringe, Teiler, Ringteiler) |

### Gemeinsame Konfiguration

Jeder Wettbewerb hat:

- **Name** und **Status** (Entwurf → Aktiv → Abgeschlossen → Archiviert)
- **Wertungsmodus** (ScoringMode) — bestimmt wie Ergebnisse verglichen werden
- **Schusszahl pro Serie** (default 10, konfigurierbar, z.B. 5 fuer Kurz-Kranzl)
- **Disziplin** — fix (alle schiessen dieselbe) oder **gemischt** (jeder waehlt seine Disziplin, Faktor-Korrektur aktiv)

### Wertungsmodi (Scoring-Engine)

| Modus           | Formel                                | Gewinner    | Faktor              |
| --------------- | ------------------------------------- | ----------- | ------------------- |
| RINGTEILER      | MaxRinge - Ringe + (Teiler \* Faktor) | Niedrigster | Ja                  |
| RINGS           | Gesamtringe (ganzzahlig)              | Hoechster   | Nein                |
| RINGS_DECIMAL   | Gesamtringe (Zehntelwertung)          | Hoechster   | Nein                |
| TEILER          | Teiler \* Faktor                      | Niedrigster | Ja                  |
| DECIMAL_REST    | Nachkommastelle der Ringe summiert    | Hoechster   | Nein                |
| TARGET_ABSOLUTE | Abweichung vom Zielwert               | Geringste   | Wenn Teiler-basiert |
| TARGET_UNDER    | ≤ Zielwert bevorzugt, dann Abweichung | Geringste   | Wenn Teiler-basiert |

Formeln und Details: siehe `data-model.md` → Berechnungsregeln.

---

## Liga-Modus (LEAGUE)

### Konfiguration

Eine Liga ist an **eine Disziplin gebunden** (oder gemischt mit Faktor-Korrektur).
Konfigurierbare Regelsets pro Liga:

| Parameter            | Default    | Beschreibung                              |
| -------------------- | ---------- | ----------------------------------------- |
| scoringMode          | RINGTEILER | Wertung Gruppenphase                      |
| shotsPerSeries       | 10         | Schuss pro Seite                          |
| playoffBestOf        | 3          | Siege zum Weiterkommen (3 = Best-of-Five) |
| playoffQualThreshold | 8          | Ab dieser TN-Zahl → VF statt HF           |
| playoffQualTopN1     | 4          | Qualifikanten fuer HF                     |
| playoffQualTopN2     | 8          | Qualifikanten fuer VF                     |
| finaleScoringMode    | RINGS      | Wertung Finale                            |
| finaleHasSuddenDeath | true       | Sudden Death bei Gleichstand              |

Regelset ist **nach Spielplan-Generierung gesperrt** — Aenderungen nur vor dem ersten Spieltag.

### Spielplan-Generierung

- **Doppelrunden-Spielplan (Round Robin):** Hin- und Rueckrunde
- Rueckrunde spiegelt Hinrunde (Heimrecht getauscht)
- Ungerade Teilnehmerzahl → jeder bekommt einmal Freilos (2 Punkte)
- Mindest-Teilnehmerzahl: 4
- Regenerierung moeglich solange keine abgeschlossenen Paarungen

### Heimrecht

- Zuerst genannte Person ist verantwortlich fuer Terminabsprache
- Mehrere Duelle an einem Abend moeglich
- **Kein Vorschiessen** — beide Schuetzen muessen nebeneinander am Stand antreten

### Ergebniserfassung (Liga)

- Pro Paarung: beide Teilnehmer schiessen je eine Serie
- **Pflichtfelder:** Gesamtringe + bester Teiler pro Teilnehmer
- **Optional:** Einzelschusswerte (Schuss 1–N) fuer Statistiken
- Automatische Berechnung des Ringteilers
- Nachtraegliche Korrektur: nur durch Admin oder Schiedsrichter (AuditLog)

### Validierungsregeln

| Wertungsart  | Gueltige Einzelwerte                                      |
| ------------ | --------------------------------------------------------- |
| Ganzringe    | 0–10, ganzzahlig                                          |
| Zehntelringe | 0.0 oder 1.0–10.9 (eine Dezimalstelle; 0.1–0.9 ungueltig) |

- Seriensumme ≤ Schussanzahl × Max.Ringe/Schuss
- Teiler: 0.0–9999.9 (Dezimalwert)

### Tabelle & Rangliste

Sortierung absteigend:

1. Punkte
2. Direkter Vergleich (bei Punktgleichstand)
3. Bestes individuelles Ergebnis (niedrigster Ringteiler)

Anzeigespalten: Pl., Name, Spiele, Siege, Niederlagen, Punkte, bestes Ergebnis
Zurueckgezogene Teilnehmer → Tabellenende mit Vermerk

### Playoff-Phase (K.O.-System)

#### Qualifikation

| Teilnehmer | Qualifikanten      | Einstieg      |
| ---------- | ------------------ | ------------- |
| 4–7        | Top N1 (default 4) | Halbfinale    |
| 8+         | Top N2 (default 8) | Viertelfinale |

Seeding: 1 vs. letzter, 2 vs. vorletzter, usw.

#### Start-Voraussetzungen

- Liga muss ACTIVE sein
- Playoffs noch nicht gestartet
- Mindestens 4 aktive Teilnehmer
- Keine PENDING-Paarungen in der Gruppenphase

#### Best-of-N (VF & HF)

- Wer zuerst `playoffBestOf` Duelle gewinnt, zieht weiter (default 3 = Best-of-Five)
- Pro Duell: eine Serie je Teilnehmer, Wertung gemaess `scoringMode`
- Bei Unentschieden: naechstes Duell wird automatisch angelegt
- Admin legt jedes Duell manuell an

#### Rundenfortschritt

- Nach Abschluss aller Matches: Admin loest naechste Runde manuell aus
- Re-Seeding nach Original-Gruppenrang

#### Finale (Sondermodus)

| Regel            | Beschreibung                                                       |
| ---------------- | ------------------------------------------------------------------ |
| Wertung          | gemaess `finaleScoringMode` (default: nur Ringe, hoechste gewinnt) |
| Gleichstand      | wenn `finaleHasSuddenDeath`: weiteres Duell bis Entscheid          |
| Einrichtungszeit | 3 Minuten                                                          |
| Probeschuss      | Keiner                                                             |
| Ansage           | Jeder Schuss einzeln                                               |
| Zeit pro Schuss  | 75 Sekunden                                                        |

App-Umfang: **nur Ergebniserfassung** (keine Zeitnahme oder Ansage-Unterstuetzung)

#### Korrekturen & Loeschungen

- **canCorrect-Flag:** Korrekturen erlaubt solange Folgerunde keine Duelle hat
- Korrektur: Siegstand wird neu berechnet; leere Folge-Matches kaskadierend geloescht
- Loeschen des letzten Duells: nur bei canCorrect

#### Guards

- **Rueckzug:** nach Playoff-Start gesperrt
- **Spielplan-Editierung:** nach Playoff-Start gesperrt

### Meyton-Import

- **Via URL:** System ruft Meyton-URL ab, parst Ergebnis
- **Via PDF-Upload:** Textbasiertes PDF, kein OCR
- Sicherheitsgrenzen: Timeout 15s, max. 10 MB; PDF max. 2 MB/Stream, 8 MB gesamt

---

## Event-Modus (EVENT)

### Konzept

Ein Event bildet ein einmaliges Schiessen ab (z.B. Kranzlschiessen, Pokalschiessen, Spassschiessen).
Alle Teilnehmer schiessen, eine Rangliste wird erstellt.

### Konfiguration

| Parameter       | Beschreibung                                               |
| --------------- | ---------------------------------------------------------- |
| scoringMode     | Wertungsmodus (alle 7 Modi moeglich)                       |
| shotsPerSeries  | Schusszahl pro Serie (default 10, z.B. 5 fuer Kurz-Kranzl) |
| disciplineId    | null = gemischt (Faktor aktiv), oder fixe Disziplin        |
| eventDate       | Veranstaltungsdatum                                        |
| allowGuests     | Gastteilnehmer zugelassen                                  |
| teamSize        | null = Einzel; 2+ = Teamgroesse                            |
| targetValue     | Zielwert fuer TARGET-Modi (z.B. 512 oder 76.0)             |
| targetValueType | TEILER, RINGS oder RINGS_DECIMAL                           |

### Teilnehmer & Gaeste

- Vereinsmitglieder werden aus dem Teilnehmerpool eingeschrieben
- Gaeste: werden als Participant angelegt mit `isGuest: true` auf CompetitionParticipant
- Bei gemischten Disziplinen: jeder Teilnehmer waehlt seine Disziplin bei der Anmeldung

### Serien-Erfassung

- Jeder Teilnehmer schiesst **eine Serie** pro Event
- Admin erfasst: Gesamtringe + Teiler (+ optional Einzelschuesse)
- Bei DECIMAL_REST-Modus: Einzelschuesse sind **Pflicht** (Nachkommastellen benoetigt)

### Rangliste

- Berechnung gemaess scoringMode mit Faktor-Korrektur (bei gemischten Disziplinen)
- Anzeige: Platzierung, Name, Disziplin, Ringe, Teiler (korrigiert), Ergebniswert

### Zielwert-Modus

Nur bei Events. Zwei Varianten:

**TARGET_ABSOLUTE:** Moeglichst nah an den Zielwert — ob drueber oder drunter ist egal.

**TARGET_UNDER:** ≤ Zielwert wird bevorzugt.

- Erst alle die den Zielwert nicht ueberschritten haben (sortiert nach Naehe)
- Dann alle die drueber sind (sortiert nach Naehe)

Bei Teiler-basiertem Zielwert: Faktor-Korrektur wird auf den gemessenen Teiler angewendet. Der Zielwert ist im korrigierten Raum definiert.

### Team-Erweiterung (spaetere Phase)

- teamSize auf Competition setzen (z.B. 2 fuer Zweierteams)
- Admin teilt Teams ein
- Jedes Teammitglied schiesst eine Serie
- Team-Ergebnis = Summe der Einzelergebnisse
- Ranking nach Team-Ergebnis

---

## Saison-Modus (SEASON)

### Konzept

Ein Saison-Wettbewerb laeuft ueber mehrere Monate (z.B. Jahrespreisschiessen).
Teilnehmer schiessen viele Serien ueber die Saison hinweg. Die besten Einzelserien zaehlen.
Serien werden "gekauft" — jede geschossene Serie zaehlt als gekauft.

### Konfiguration

| Parameter      | Beschreibung                                                            |
| -------------- | ----------------------------------------------------------------------- |
| scoringMode    | Primaerer Wertungsmodus (fuer die Hauptsortierung)                      |
| shotsPerSeries | Schusszahl pro Serie                                                    |
| disciplineId   | Immer null (gemischt) — Teilnehmer koennen Disziplin pro Serie wechseln |
| minSeries      | Mindestanzahl Serien fuer Wertung (default 20)                          |
| seasonStart    | Saisonbeginn                                                            |
| seasonEnd      | Saisonende                                                              |

### Serien-Erfassung

- Ueber mehrere Schiessabende hinweg
- Pro Eintrag: Gesamtringe, Teiler, Disziplin, Datum
- Teilnehmer kann Disziplin pro Serie frei waehlen
- Keine Begrenzung der Serienanzahl nach oben

### Mehrfach-Wertung

Die Saison-Tabelle zeigt **drei Bestwerte** pro Teilnehmer (jeweils aus einer einzelnen Serie):

| Kategorie         | Berechnung                                         | Gewinner    |
| ----------------- | -------------------------------------------------- | ----------- |
| Beste Ringe       | Hoechste Ringzahl einer einzelnen Serie            | Hoechster   |
| Bester Teiler     | Niedrigster korrigierter Teiler (Teiler \* Faktor) | Niedrigster |
| Bester Ringteiler | Niedrigster Ringteiler einer einzelnen Serie       | Niedrigster |

**Wichtig:** Beste Ringe und bester Teiler koennen aus **verschiedenen Serien** stammen.
Ringteiler muss aus **derselben Serie** stammen (Ringe und Teiler gehoeren zusammen).

### Mindestserien-Pruefung

- Nur Teilnehmer mit ≥ minSeries geschossenen Serien erscheinen in der Wertung
- Teilnehmer mit weniger Serien werden angezeigt, aber ausgegraut / nicht gewertet
- Fortschrittsanzeige: "12 / 20 Serien geschossen"

---

## Teilnehmerverwaltung

- Felder: Name, Vorname, Kontaktmoeglichkeit (E-Mail oder Telefon, Pflicht)
- Teilnahme in mehreren Wettbewerben gleichzeitig moeglich
- Startnummer pro Wettbewerb (optional)

### Gastschuetzen

- Koennen an Events teilnehmen (wenn `allowGuests` aktiviert)
- Werden als Participant im System angelegt (wiederverwendbar fuer zukuenftige Events)
- Markierung via `isGuest` auf CompetitionParticipant
- Kein Login erforderlich — Ergebnisse werden vom Admin erfasst

### Rueckzug (nur Liga)

- Jederzeit moeglich (auch nach gespielten Runden)
- Alle Ergebnisse des Teilnehmers rueckwirkend aus der Wertung
- Tabelle wird neu berechnet
- Rueckzug rueckgaengig machbar (solange Playoffs nicht begonnen)
- Protokollierung im Audit-Log

---

## Visualisierung & Auswertung

- **Liga:** Interaktive Tabelle, K.O.-Bracket, Punkteverlauf (Liniendiagramm)
- **Event:** Rangliste mit Disziplin, Ergebniswert und Faktor-Korrektur
- **Saison:** Mehrfach-Tabelle (Ringe, Teiler, Ringteiler), Serien-Verlauf, Fortschrittsanzeige
- **Alle:** Paarungsplan/Serienliste, Profil-Seite je Teilnehmer
- Export: Spielplan + Tabelle als druckoptimiertes PDF

---

## Nutzerverwaltung & Zugriffskontrolle

- Konten ausschliesslich durch Admins erstellt (kein Self-Signup)
- Rollen: Administrator (Vollzugriff) | Benutzer (eingeschraenkt)
- Admin: Nutzer anlegen, bearbeiten, Passwoerter zuruecksetzen
- Eigenes Passwort aendern: nur eingeloggt + aktuelles Passwort
- Passwort vergessen: nur Admin-Reset, kein E-Mail-Flow
- Alle Wettbewerbs-, Teilnehmer- und Disziplindaten sind vereinsweit sichtbar; Zugangskontrolle via Rolle, nicht via userId

### Archivieren statt Loeschen

- Disziplinen mit Ergebnissen → archivieren
- Wettbewerbe mit Ergebnissen → archivieren
- Archivierte Objekte: nicht in Auswahlfeldern; historische Daten abrufbar
- Explizite Loeschung: nur ohne abhaengige Daten
- Force Delete (Admin): Wettbewerb inkl. aller Daten loeschen (Bestaetigung durch Namenseingabe)

---

## Audit-Log (Protokoll)

- Alle sicherheits- und verwaltungsrelevanten Aktionen werden protokolliert
- `competitionId` statt `leagueId` als Referenz
- Ereignistypen (erweiterbar fuer Event/Saison):

| Ereignis                 | Ausloeser                          |
| ------------------------ | ---------------------------------- |
| PARTICIPANT_WITHDRAWN    | Rueckzug eines Teilnehmers         |
| WITHDRAWAL_REVOKED       | Rueckzug rueckgaengig              |
| RESULT_ENTERED           | Ergebnis eingetragen               |
| RESULT_CORRECTED         | Ergebnis korrigiert                |
| PLAYOFFS_STARTED         | Playoff-Phase gestartet            |
| PLAYOFF_RESULT_ENTERED   | Playoff-Duell-Ergebnis eingetragen |
| PLAYOFF_RESULT_CORRECTED | Playoff-Duell korrigiert           |
| PLAYOFF_DUEL_DELETED     | Playoff-Duell geloescht            |

- Details-JSON als Snapshot (denormalisiert, kein Verweis)
- Liga-Protokoll: per Wettbewerb; Globales Protokoll: alle Wettbewerbe

---

## Datenschutz

- Personenbezogene Daten nur fuer Vereinsverwaltung
- Keine Weitergabe an Dritte
- On-Premise auf TrueNAS, kein Cloud-Dienst
- HTTPS in Produktion zwingend
