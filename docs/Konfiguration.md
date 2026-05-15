# Konfiguration & Filter

← [Zurück zur Übersicht](Home.md)

---

## Filter-Sidebar

Die Sidebar ist standardmäßig **versteckt** und wird über den ☰ Button oben links geöffnet.

### Verfügbare Filter

| Filter | Typ | Beschreibung |
|---|---|---|
| **Beziehungstyp** | Chips (Mehrfach) | übergibt / nutzt / erstellt / empfängt / verarbeitet |
| **Schutzbedarf** | Chips (Mehrfach) | DSGVO-relevant / Intern / Öffentlich |
| **Erfassungsart** | Chips (Mehrfach) | Manuell / Automatisiert |
| **Organisation** | Dropdown | Alle Organisationen aus den Daten |
| **Abteilung** | Dropdown | Alle Abteilungen aus den Daten |
| **Häufigkeit** | Dropdown | täglich / wöchentlich / monatlich / … |
| **Format** | Dropdown | CSV / PDF / WFS / … |
| **Suche** | Textfeld | Akteur-Namen (Quelle oder Ziel) |

Alle Filter wirken gleichzeitig und aktualisieren **sofort** alle drei Ansichten.  
**Zurücksetzen** setzt alle Filter auf den Ausgangszustand.

---

## Ansichten

### Listenansicht
Alle gefilterten Datenflüsse als Karten mit Quelle → Ziel, Metadaten und Badges für Schutzbedarf und Erfassungsart.

### Netzwerkkarte

| Button | Aktion |
|---|---|
| **Layout neu** | COSE-Layout neu berechnen |
| **+** | Hineinzoomen |
| **−** | Herauszoomen |
| **=** | Zoom auf alle Knoten anpassen |
| **⛶** | Vollbildmodus |

### Netzwerk-Insights
Dashboard mit 6 automatisch berechneten Analyse-Karten (siehe [Algorithmen](Algorithmen.md)).

---

## Datenverwaltung

| Aktion | Beschreibung |
|---|---|
| **Im Browser speichern** | Daten im LocalStorage ablegen (überlebt Browser-Neustart) |
| **Aus Browser laden** | Gespeicherte Daten wiederherstellen |
| **CSV exportieren** | Alle Daten als `.csv` herunterladen |
| **Zu vorhandenen hinzufügen** | CSV-Import im Append-Modus |

---

## Design-Tokens (für Entwickler)

Alle Designwerte sind als CSS Custom Properties in `css/styles.css` unter `:root` definiert:

| Token | Wert | Verwendung |
|---|---|---|
| `--c-accent` | `#420093` | Primär-Buttons, Akzente |
| `--c-surface` | `rgba(255,255,255,0.72)` | Glasmorphismus-Flächen |
| `--c-border` | `rgba(255,255,255,0.4)` | Subtile Ränder |
| `--radius` | `10px` | Border-Radius |
| `--shadow-md` | `0 4px 24px rgba(66,0,147,0.10)` | Mittlere Schatten |
| `--rel-übergibt` | `#6c8ebf` | Kantenfarbe übergibt |
| `--rel-nutzt` | `#5fa878` | Kantenfarbe nutzt |
| `--rel-erstellt` | `#c4a23a` | Kantenfarbe erstellt |
| `--rel-empfängt` | `#bf6c6c` | Kantenfarbe empfängt |
| `--rel-verarbeitet` | `#9b72b8` | Kantenfarbe verarbeitet |
