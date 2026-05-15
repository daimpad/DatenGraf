# CSV-Format

← [Zurück zur Übersicht](Home.md)

---

DatenGraf importiert CSV-Dateien mit folgendem Schema (RFC 4180, UTF-8).

## Spaltenübersicht

| Spalte | Typ | Beschreibung | Beispiel |
|---|---|---|---|
| `Quelle` | string | Name des sendenden Akteurs | `Controlling` |
| `QuelleAbteilung` | string | Organisationseinheit | `Finanzen` |
| `QuelleBereich` | string | Übergeordneter Bereich | `GB 1 Verwaltung` |
| `QuelleOrganisation` | string | Organisation | `Behörde 3` |
| `QuelleRolle` | enum | Rolle des Akteurs | siehe unten |
| `Beziehung` | enum | Art des Datenflusses | `übergibt` |
| `Ziel` | string | Name des empfangenden Akteurs | `Buchhaltung` |
| `Datentyp` | string | Inhalt der Daten | `Jahresabschluss` |
| `Häufigkeit` | string | Wie oft? | `monatlich` |
| `Format` | string | Technisches Format | `CSV`, `PDF`, `WFS` |
| `Schutzbedarf` | enum | Datenschutz-Klassifikation | `DSGVO-relevant` |
| `Erfassungsart` | enum | Wie erfasst? | `Manuell` |
| `Anmerkungen` | string | Freitextfeld | |

---

## Enum-Werte

### QuelleRolle
- `Datenproduzent`
- `Datenkonsument`
- `Datenverarbeiter`
- `Datenverwalter`
- `Datenersteller`
- `Datennutzer`

### Beziehung
- `übergibt`
- `nutzt`
- `erstellt`
- `empfängt`
- `verarbeitet`

### Schutzbedarf
- `DSGVO-relevant` → rot dargestellt
- `Intern` → gold dargestellt
- `Öffentlich` → grün dargestellt

### Erfassungsart
- `Manuell`
- `Automatisiert`

---

## Beispiel

```csv
Quelle,QuelleAbteilung,QuelleBereich,QuelleOrganisation,QuelleRolle,Beziehung,Ziel,Datentyp,Häufigkeit,Format,Schutzbedarf,Erfassungsart,Anmerkungen
Controlling,Finanzen,GB 1 Verwaltung,Behörde 3,Datenproduzent,übergibt,Buchhaltung,Jahresabschluss,jährlich,XLSX,Intern,Manuell,
Buchhaltung,Finanzen,GB 1 Verwaltung,Behörde 3,Datennutzer,nutzt,Controlling,Kostenstellen,monatlich,CSV,Intern,Automatisiert,
```

---

## Hinweise

- Leere Felder: einfach leer lassen (`,,`)
- Felder mit Kommas oder Anführungszeichen in `"..."` einschließen
- Anführungszeichen innerhalb von Feldern als `""` escapen (RFC 4180)
- Alte CSVs ohne `Schutzbedarf`/`Erfassungsart` werden ohne Fehler geladen
- Zeichenkodierung: **UTF-8** empfohlen
