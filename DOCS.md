# Technische Dokumentation – Datengraf

## Dateistruktur

```
datengraf/
├── index.html          # HTML-Einstiegspunkt (nur Struktur, kein Inline-Code)
├── css/
│   └── styles.css      # Gesamtes Stylesheet inkl. Design-Tokens
├── js/
│   └── app.js          # Gesamte Anwendungslogik
├── data/
│   └── sample.csv      # Beispieldatensatz (32 Datenflüsse, LBV.SH-Demo)
├── .github/
│   └── CONTRIBUTING.md # Beitragsrichtlinien
├── DOCS.md             # Diese Datei
├── LICENSE             # GNU GPL v3.0
└── README.md           # Projektübersicht für GitHub
```

---

## Architektur

Datengraf ist eine **Single-Page Application (SPA)** ohne Build-Schritt. Die Architektur folgt dem Prinzip *separation of concerns*:

| Schicht | Datei | Verantwortung |
|---|---|---|
| Markup | `index.html` | DOM-Struktur, semantisches HTML |
| Stil | `css/styles.css` | Layout, Komponenten, Design-Tokens |
| Logik | `js/app.js` | Datenmodell, Rendering, Algorithmen |
| Daten | `data/sample.csv` | Demonstrationsdaten |

### Datenfluss

```
CSV (paste / URL / file)
        │
        ▼
   parseCSV()          → allData[]
        │
        ▼
  applyFilters()       → filteredData[]
        │
   ┌────┴────────────┐
   ▼                 ▼
renderList()    renderNetwork()    renderInsights()
(DOM)           (Cytoscape.js)     (DOM + Algorithmen)
```

---

## CSS-Architektur (`css/styles.css`)

### Design-Tokens (CSS Custom Properties)

Alle globalen Designwerte sind als Custom Properties in `:root` definiert:

| Token | Wert | Verwendung |
|---|---|---|
| `--c-bg` | `#f0f2f5` | Seitenhintergrund |
| `--c-surface` | `#ffffff` | Karten, Sidebar, Topbar |
| `--c-accent` | `#1a1a1a` | Primär-Buttons, aktive Tabs |
| `--c-accent-h` | `#3b78e7` | Hover-Zustand für Buttons |
| `--c-danger` | `#c0392b` | Fehlermeldungen |
| `--c-success` | `#27ae60` | Erfolgsmeldungen |
| `--sidebar-w` | `280px` | Sidebar-Breite |
| `--radius` | `6px` | Einheitlicher Border-Radius |
| `--rel-übergibt` | `#4285F4` | Kantenfarbe „übergibt" |
| `--rel-nutzt` | `#34A853` | Kantenfarbe „nutzt" |
| `--rel-erstellt` | `#FBBC05` | Kantenfarbe „erstellt" |
| `--rel-empfängt` | `#EA4335` | Kantenfarbe „empfängt" |
| `--rel-verarbeitet` | `#8F44AD` | Kantenfarbe „verarbeitet" |
| `--schutz-dsgvo` | `#EA4335` | Badge DSGVO-relevant |
| `--schutz-intern` | `#e67e22` | Badge Intern |
| `--schutz-oeffentlich` | `#34A853` | Badge Öffentlich |

### Layout

Das Haupt-Layout ist ein flexibler Zweispalter:

```
┌──────────────┬──────────────────────────────────────┐
│   Sidebar    │  Topbar (sticky)                      │
│   (280px)    ├──────────────────────────────────────┤
│              │  Content                              │
│              │  ┌─────────────────┐                 │
│              │  │  Import-Panel   │                 │
│              │  └─────────────────┘                 │
│              │  ┌──────────────────────────────────┐ │
│              │  │  Tab: Liste / Netzwerk / Insights │ │
│              │  └──────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

---

## JavaScript-Architektur (`js/app.js`)

### Globaler Zustand

```js
let allData      = [];   // alle importierten/erfassten Zeilen
let filteredData = [];   // nach activeFilters gefilterte Teilmenge
let networkChart = null; // Cytoscape-Instanz
let activeFilters = {
  relation: new Set(), schutz: new Set(), erfassung: new Set(),
  organization: 'all', department: 'all',
  frequency: 'all', format: 'all', search: ''
};
```

### Wichtige Funktionen

| Funktion | Beschreibung |
|---|---|
| `parseCSV(csv)` | Parst CSV-Text inkl. Anführungszeichen-Escaping |
| `toCSV(data)` | Serialisiert `allData` zurück zu CSV |
| `applyFilters()` | Filtert `allData` → `filteredData`, triggert `renderAll()` |
| `buildSidebarFilters()` | Befüllt Chips und Dropdowns aus `allData` |
| `renderList(data)` | Rendert Listenansicht als DOM-Elemente |
| `renderNetwork(data)` | Erstellt Cytoscape-Instanz mit COSE-Layout |
| `renderInsights(data)` | Berechnet Metriken und rendert Dashboard-Karten |
| `betweennessCentrality(nodes, adj)` | Brandes-Algorithmus (O(V·E)) |
| `labelPropagation(nodes, adj)` | Community Detection, max. 10 Iterationen |
| `openWizard(prefill)` | Öffnet den 4-Schritt-Wizard |
| `renderWizardStep()` | Rendert den aktuellen Wizard-Schritt |

### CSV-Schema

```
Spalte            Typ       Beschreibung
──────────────────────────────────────────────────────────────
Quelle            string    Name des sendenden Akteurs
QuelleAbteilung   string    Organisationseinheit des Akteurs
QuelleBereich     string    Übergeordneter Bereich
QuelleOrganisation string   Organisation (z. B. LBV.SH)
QuelleRolle       enum      Datenproduzent | Datenkonsument | …
Beziehung         enum      übergibt | nutzt | erstellt | empfängt | verarbeitet
Ziel              string    Name des empfangenden Akteurs
Datentyp          string    Inhaltliche Beschreibung der Daten
Häufigkeit        string    täglich | wöchentlich | jährlich | …
Format            string    Technisches Format (CSV, PDF, WFS, …)
Schutzbedarf      enum      DSGVO-relevant | Intern | Öffentlich
Erfassungsart     enum      Manuell | Automatisiert
Anmerkungen       string    Freitextfeld
```

Felder ohne Wert werden als leerer String `""` behandelt. Alte CSVs ohne `Schutzbedarf`/`Erfassungsart` werden ohne Fehler geladen.

---

## Netzwerk-Algorithmen

### Betweenness Centrality (Brandes 2001)

Implementiert in `betweennessCentrality(nodes, adj)`:

1. Für jeden Startknoten *s*: BFS zur Berechnung der kürzesten Pfade (σ) und Distanzen.
2. Rückwärts-Akkumulation der Abhängigkeiten (δ).
3. Aufsummierung zu `bc[v]`.

Laufzeit: **O(V · E)** – geeignet für Graphen bis ~500 Knoten.

### Label Propagation (Raghavan et al. 2007)

Implementiert in `labelPropagation(nodes, adj)`:

1. Jeder Knoten erhält ein eindeutiges initiales Label.
2. In zufälliger Reihenfolge übernimmt jeder Knoten das häufigste Label seiner Nachbarn.
3. Iteration bis Konvergenz oder max. 10 Runden.
4. Knoten mit gleichem Label bilden einen Cluster.

Das Verfahren arbeitet auf dem **ungerichteten** Graphen (beide Kantenrichtungen werden berücksichtigt).

---

## GitHub Pages

`index.html` liegt im Repository-Wurzelverzeichnis und wird von GitHub Pages automatisch als Startseite geserved. Aktivierung unter:

**Repository → Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`**

Die App enthält Open-Graph-Metadaten für optimale Vorschau beim Teilen in sozialen Netzwerken.
