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
│   └── sample.csv      # Beispieldatensatz (32 Datenflüsse, Behörde 3-Demo)
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
| `--c-accent` | `#420093` | Primär-Buttons, Akzente, violettes Brand-Element |
| `--c-accent-h` | `#000000` | Hover-Zustand für Buttons (sehr dunkel) |
| `--c-surface` | `rgba(255, 255, 255, 0.72)` | Halbdurchsichtige Karten, Sidebar, Topbar (Glasmorphismus) |
| `--c-border` | `rgba(255, 255, 255, 0.4)` | Subtile Grenzen für Glasmorphismus-Effekte |
| `--sidebar-w` | `280px` | Sidebar-Breite |
| `--radius` | `10px` | Einheitlicher Border-Radius für moderne Ästhetik |
| `--rel-übergibt` | `#6c8ebf` | Kantenfarbe „übergibt" (gedämpftes Blau) |
| `--rel-nutzt` | `#5fa878` | Kantenfarbe „nutzt" (gedämpftes Grün) |
| `--rel-erstellt` | `#c4a23a` | Kantenfarbe „erstellt" (gedämpftes Gold) |
| `--rel-empfängt` | `#bf6c6c` | Kantenfarbe „empfängt" (gedämpftes Rot) |
| `--rel-verarbeitet` | `#9b72b8` | Kantenfarbe „verarbeitet" (gedämpftes Violett) |
| `--schutz-dsgvo` | `#bf6c6c` | Badge DSGVO-relevant (gedämpftes Rot) |
| `--schutz-intern` | `#c4a23a` | Badge Intern (gedämpftes Gold) |
| `--schutz-oeffentlich` | `#5fa878` | Badge Öffentlich (gedämpftes Grün) |
| `--shadow-sm` | `0 2px 8px rgba(66, 0, 147, 0.06)` | Zarte Schatten (Accent-Farbe-basiert) |
| `--shadow-md` | `0 4px 24px rgba(66, 0, 147, 0.10)` | Mittlere Schatten für Elevation |
| `--shadow-lg` | `0 8px 40px rgba(66, 0, 147, 0.14)` | Große Schatten für Hervorhebung |
| `--ease-fluid` | `cubic-bezier(0.25, 1, 0.5, 1)` | Flüssige Easing-Funktion für Animationen |

### Glasmorphismus und visuelle Effekte

Die Benutzeroberfläche verwendet **Glasmorphismus** für moderne Ästhetik:

```css
backdrop-filter: blur(20px);
background-color: rgba(255, 255, 255, 0.72);
border: 1px solid rgba(255, 255, 255, 0.4);
```

Diese Effekte werden auf folgende Elemente angewendet:
- **Sidebar**: Einklappbare Filterpanel mit Glasmorphismus-Hintergrund
- **Topbar**: Sticky Header mit Brand und Navigations-Tabs
- **Import-Panel**: CSV-Import Bereich
- **Insight-Cards**: Dashboard-Karten im Insights-Tab

Die **Hero-Sektion** erscheint beim Start (wenn `allData.length === 0`) und wird ausgeblendet, sobald Daten geladen werden. Sie enthält eine Willkommensbotschaft mit drei Feature-Karten, die mit staggered Animation (`animation-delay`) in die Seite fahren.

Der **Seitenhintergrund** ist ein festes Lavender-Grau-Gradient:
```css
background: linear-gradient(135deg, #f5f3f9 0%, #e8e3f0 100%);
background-attachment: fixed;
```

### Layout

Das Haupt-Layout ist ein flexibler Zweispalter mit **einklappbarer Sidebar**:

```
┌──────────────────────────────────────────────────────┐
│  Topbar (sticky) mit Menu-Button (☰) und Brand     │
├──────────────┬──────────────────────────────────────┤
│   Sidebar    │  Content                              │
│   (280px)    │  ┌─────────────────┐                 │
│   versteckt  │  │  Hero-Sektion   │                 │
│   per        │  └─────────────────┘                 │
│   default    │  ┌─────────────────┐                 │
│   .collapsed │  │  Import-Panel   │                 │
│              │  └─────────────────┘                 │
│              │  ┌──────────────────────────────────┐ │
│              │  │  Tab: Liste / Netzwerk / Insights │ │
│              │  └──────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

**Sidebar-Verhalten:**
- Standardmäßig versteckt (Klasse `.collapsed` auf `<aside>`)
- Wird über das Menu-Symbol (☰) in der Topbar umgeschaltet
- Filtert Daten in Echtzeit: Änderungen in Chips, Dropdowns oder Suchfeld triggern `applyFilters()` und Re-Rendering
- Über "Zurücksetzen"-Button können alle Filter gleichzeitig zurückgesetzt werden

**Topbar-Elemente:**
- Menu-Toggle Button (☰) zum Öffnen/Schließen der Sidebar
- **DatenGraf**-Brand als Klickfläche (nutzer können die Seite neu laden)
- Tab-Navigation (Listenansicht, Netzwerkkarte, Netzwerk-Insights)
- "Datenfluss erfassen"-Button für Wizard

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
| `parseCSV(csv)` | Parst CSV-Text inkl. Anführungszeichen-Escaping und Validierung |
| `toCSV(data)` | Serialisiert `allData` zurück zu CSV |
| `applyFilters()` | Filtert `allData` → `filteredData`, triggert `renderAll()` |
| `buildSidebarFilters()` | Befüllt Chips und Dropdowns aus `allData` |
| `renderList(data)` | Rendert Listenansicht als DOM-Elemente mit Header-Info |
| `renderNetwork(data)` | Erstellt Cytoscape-Instanz mit COSE-Layout und abgestimmten Farben |
| `renderInsights(data)` | Berechnet Metriken und rendert Dashboard-Karten mit Echtzeit-Werten |
| `betweennessCentrality(nodes, adj)` | Brandes-Algorithmus (O(V·E)) zur Identifikation von Gatekeepern |
| `labelPropagation(nodes, adj)` | Community Detection, max. 10 Iterationen zur Erkennung von Silos |
| `updateHeroVisibility()` | Zeigt/versteckt Hero-Sektion basierend auf `allData.length > 0` |
| `openWizard(prefill)` | Öffnet den 4-Schritt-Wizard für neue Datenflüsse |
| `renderWizardStep()` | Rendert den aktuellen Wizard-Schritt mit Validierung |
| `esc(str)` | XSS-Schutz: escaped HTML-Sonderzeichen für sichere DOM-Einfügung |

### CSV-Schema

```
Spalte            Typ       Beschreibung
──────────────────────────────────────────────────────────────
Quelle            string    Name des sendenden Akteurs
QuelleAbteilung   string    Organisationseinheit des Akteurs
QuelleBereich     string    Übergeordneter Bereich
QuelleOrganisation string   Organisation (z. B. Behörde 3)
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
