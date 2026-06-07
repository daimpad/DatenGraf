# CLAUDE.md – DatenGraf

Dieses Dokument beschreibt Architektur, Konventionen und wichtige Implementierungsdetails für AI-gestützte Entwicklung.

---

## Projektübersicht

**DatenGraf** ist eine browserbasierte Single-Page-Application (SPA) zur Kartierung und Analyse von Datenflüssen in Organisationen. Kein Backend, kein Build-Prozess, kein Framework — nur HTML, CSS und Vanilla JS.

- **Einstiegspunkt:** `index.html`
- **Styles:** `css/styles.css` (~2100 Zeilen)
- **Logik:** `js/app.js` (~2070 Zeilen, eine einzige Datei)
- **Beispieldaten:** `data/sample-*.csv`, `data/template.csv`
- **Aktuelle Version:** `v25` (Script-Tag: `<script src="js/app.js?v=25">`)

---

## Lokale Entwicklung

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

`file://` funktioniert nicht, da `fetch()` für CSV-Beispieldaten nötig ist. Kein `npm install`, kein Bundler, keine Build-Pipeline zur Laufzeit.

**Cache-Busting:** Nach Änderungen an `app.js` die Versionsnummer im Script-Tag in `index.html` erhöhen:
```html
<script src="js/app.js?v=25"></script>
```

**Fonts/Icons:** Lokal unter `assets/fonts/` — kein CDN mehr. Inter (woff2, 400/500/600/700) + Font Awesome 6.7.2 (solid/regular/brands).

---

## Architektur

### Datenfluss

```
CSV-Import / Wizard
       ↓
  allData (Array<Row>)
       ↓
  applyFilters() → filteredData
       ↓
  renderAll()
   ├── renderList(filteredData)
   ├── renderNetwork(filteredData)
   └── renderInsights(filteredData)

  showAnalyseBriefing()       ← operiert auf allData (nicht filteredData!)
   ├── runAnalysis(allData)   ← Schicht 1: regelbasiert
   ├── diffSnapshots()        ← Schicht 2: Snapshot-Diff
   └── generateNarrativeLLM() ← Schicht 3: async, opt-in via API-Key
```

> **Wichtig:** `showAnalyseBriefing()` wird NICHT von `applyFilters()`/`renderAll()` aufgerufen. Es läuft nur bei Datenladen-Events (Import, Snapshot-Load, Beispieldaten, LocalStorage-Load). Das Briefing zeigt immer den vollständigen `allData`-Stand; ein Hinweis erscheint wenn Filter aktiv sind.

### Globaler State

| Variable | Typ | Bedeutung |
|---|---|---|
| `allData` | `Row[]` | Vollständiger Datensatz |
| `filteredData` | `Row[]` | Gefilterter Datensatz (Subset von `allData`) |
| `networkChart` | `cytoscape \| null` | Aktuelle Cytoscape-Instanz; `null` wenn keine Daten |
| `activeFilters` | `Object` | Aktive Filterwerte (Sets + Strings) |
| `editIndex` | `number` | Index in `allData` des gerade bearbeiteten Eintrags; `-1` = neuer Eintrag |
| `wizardStep` | `number` | Aktueller Wizard-Schritt (0-basiert) |
| `wizardData` | `Object` | Zwischenspeicher der Wizard-Eingaben |
| `wizardDuplicateConfirmed` | `boolean` | `true` nachdem User Duplikat-Warnung bestätigt hat |
| `colorByOrg` | `boolean` | Org-Farben-Modus aktiv |
| `orgHierarchyMode` | `boolean` | Compound-Node-Modus (Org-Hierarchie) aktiv |
| `pendingFileText` | `string \| null` | Zwischenspeicher für FileReader-Ergebnis |

### LocalStorage-Schlüssel

| Konstante | Schlüssel | Inhalt |
|---|---|---|
| `LS_KEY` | `datengraf_data` | Aktueller Datensatz (JSON) |
| `LS_SNAP_PREFIX` | `datengraf_snap_` | Snapshot-Prefix (+ Name) |
| `LS_BASELINE_KEY` | `datengraf_baseline` | Key des aktiven Baseline-Snapshots |
| `LS_API_KEY` | `datengraf_api_key` | Anthropic API-Key (opt-in) |

### CSV-Spalten (Row-Schema)

```
Quelle, QuelleAbteilung, QuelleBereich, QuelleOrganisation, QuelleRolle,
Beziehung, Ziel, Datentyp, Häufigkeit, Format, Schutzbedarf, Erfassungsart,
Anmerkungen, Ansprechpartner
```

`Ansprechpartner` ist die 14. Spalte (DSGVO Art. 30 – Pflichtfeld für DSGVO-relevante Flüsse im Vollständigkeits-Score).

---

## Wichtige Konventionen

### XSS-Schutz

**Immer `esc(value)` für User-Daten in `innerHTML` verwenden:**
```js
card.innerHTML = `<div>${esc(row.Quelle)}</div>`;
```

**Niemals `esc()` in `textContent` verwenden** — `textContent` ist bereits sicher und `esc()` würde HTML-Entities literal anzeigen:
```js
el.textContent = row.Quelle;        // ✓ korrekt
el.textContent = esc(row.Quelle);   // ✗ zeigt "&amp;" statt "&"
```

`esc()` escaped `&`, `<`, `>`, `"`. Die `esc()`-Funktion in `buildReportHTML()` heißt intern `e()` und ist lokal definiert, da sie im Print-Window-Kontext läuft.

### CSS-Variablen

Immer Design-Tokens verwenden, nie hardcoded Farben:
```css
color: var(--c-accent);      /* #420093 */
color: var(--c-muted);       /* #7a7591 */
color: var(--c-success);     /* #2e9e60 */
color: var(--c-danger);      /* #c0392b */
color: var(--c-warn);        /* #d4820a */
border: 1px solid var(--c-border-s);
background: var(--glass-bg);
box-shadow: var(--shadow-md);
border-radius: var(--radius);
```

### Hidden-Pattern

Kein globales `.hidden` — jede Komponente definiert ihre eigene Regel:
```css
.meine-komponente.hidden { display: none; }
```

### `networkChart` Guards

`networkChart` ist `null` wenn keine Daten geladen sind. Immer prüfen:
```js
if (networkChart) networkChart.zoom(...);
```

### Datenmutations-Reihenfolge

Bei jeder Änderung an `allData` immer in dieser Reihenfolge aufrufen:
```js
buildSidebarFilters();   // 1. Filter-UI neu aufbauen
applyFilters();          // 2. filteredData berechnen + renderAll()
```
Nie umgekehrt — `applyFilters()` nutzt die von `buildSidebarFilters()` aufgebauten Selects.

### toCSV / Falsy-Werte

`toCSV` prüft `v == null || v === ''` (nicht `!v`) — damit wird der String `"0"` korrekt als Zellwert exportiert.

---

## Cytoscape-Integration

- **Library:** Cytoscape.js v3.23 (CDN — einzige verbleibende externe Abhängigkeit zur Laufzeit)
- **Layout:** CoSE (force-directed), Konfiguration in `COSE_OPTS`
- **Stylesheet:** `CY_STYLE` — node/edge-Basis, `.highlighted`, `.faded`, `.path-node`, `.path-edge`
- **Knotenfarbe:** `data(orgColor)` / `data(orgOutlineColor)` — Default `#7a6fa8`/`#5c5080`; via `applyOrgColors()` überschreibbar
- **Klassen-Priorität:** `.highlighted` > `.path-node` > `data(orgColor)`
- **Pfadsuche:** `cy.elements().aStar({ root, goal, directed: true })`
- **PNG-Export:** `cy.png({ output: 'base64uri', full: true, scale: 2, bg: '#f0edf8' })` — synchron
- **SVG-Export:** `cy.svg({ full: true })` — synchron
- **Pathfinder-Bar:** wird NUR bei leeren Daten (`!data.length`) versteckt — nicht bei jedem Re-Render

---

## Analyse-Briefing (3 Schichten)

### Schicht 1 – `runAnalysis(data)` (regelbasiert)

Gibt `findings[]` zurück. Jedes Finding: `{ type, severity, icon, title, text, action? }`.

Finding-Typen: `hub`, `gatekeeper`, `isolated`, `dsgvo_gap`, `duplicate_relations`, `diff_changes`, `diff_topology`.

Wichtige Hilfsfunktionen:
- `betweennessCentrality(nodes, adj)` — eigene Implementierung (Brandes)
- `computeTopologyRisks(data)` — gibt `{ hubs: Set, gatekeepers: Set }` zurück (für Diff-Vergleich)

### Schicht 2 – Snapshot-Diff

- `listSnapshots()` — liest alle `datengraf_snap_*` aus localStorage
- `getBaselineSnapshot()` — gibt markierte Basis oder neuesten Snapshot zurück
- `diffSnapshots(oldData, newData)` — gibt `{ added, removed, changed }` zurück
- `formatSnapAge(savedAt)` — menschenlesbare Altersanzeige

### Schicht 3 – `generateNarrativeLLM(data, findings, vs)` (async)

- Liest `LS_API_KEY` aus localStorage; gibt `null` zurück wenn kein Key
- Ruft `https://api.anthropic.com/v1/messages` direkt aus dem Browser auf
- Benötigt Header `anthropic-dangerous-direct-browser-access: true`
- Modell: `claude-haiku-4-5-20251001`, max_tokens: 400
- Template-Narrativ bleibt Fallback; LLM-Text ersetzt es in-place nach dem Laden
- Fehlerbehandlung: 401/auth → `updateKeyStatus('error')`; andere Fehler → silent `null`

### Vollständigkeits-Score

`calcVollstaendigkeit(data)` → `{ score: 0–100, gaps: [] }`

- 5 gewichtete Prüfkategorien (Pflichtfelder, Organisationsangabe, DSGVO-Klassifikation, Beziehungstyp, Ansprechpartner)
- `gaps` enthält Kategorien mit `ok < weight`, jeweils `{ label, weight, ok, missing, pct }`

---

## Feature-Übersicht

| Feature | Schlüsselfunktionen | Schlüssel-IDs |
|---|---|---|
| Wizard | `openWizard(prefill, editIdx)`, `closeWizard()`, `renderWizardStep()`, `collectWizardStep()` | `#wizard-backdrop`, `#wizard-next`, `#wizard-back` |
| Duplikat-Erkennung | `findDuplicate(data, candidate, skipIndex)` | `#wizard-dup-warning`, `#wizard-dup-text` |
| Listenansicht | `renderList(data)` | `#list-content`, `[data-edit]`, `[data-dupe]`, `[data-del]` |
| Netzwerk | `renderNetwork(data)`, `prepareElements(data)` | `#network-container`, `#node-detail` |
| Knoten-Detail | `showNodeDetail(nodeId, data)` | `#nd-name`, `#nd-metrics`, `#nd-flows` |
| Pfadfinder | `populatePathfinderSelects()`, `clearPath()` | `#pathfinder-bar`, `#path-from`, `#path-to` |
| Org-Farben | `applyOrgColors()`, `clearOrgColors()`, `buildOrgColorMap()` | `#btn-color-by-org`, `#org-legend` |
| Insights | `renderInsights(data)` | `#insights-grid` |
| Filter | `applyFilters()`, `buildSidebarFilters()`, `clearFilters()` | `#sidebar`, `.chip`, `.filter-group` |
| Analyse-Briefing | `showAnalyseBriefing()`, `runAnalysis()`, `calcVollstaendigkeit()` | `#analyse-briefing`, `#briefing-findings` |
| Snapshots | `listSnapshots()`, `getBaselineSnapshot()`, `diffSnapshots()` | `#snapshot-backdrop`, `#snapshot-list` |
| LLM-Narrativ | `generateNarrativeLLM(data, findings, vs)` | `.briefing-narrative-text` |
| Settings Modal | `openSettingsModal()`, `closeSettingsModal()`, `updateKeyStatus()` | `#settings-backdrop`, `#settings-api-key` |
| Mobile-Nav | — | `#mobile-nav`, `#mobile-nav-btn`, `.mobile-nav-tab` |
| CSV-Import | `parseCSV(text)`, `splitCSVLine(line)` | `#import-body`, `#csv-input` |
| CSV-Export | `toCSV(data)` | `#export-csv-btn` |
| PNG/SVG-Export | `downloadBlob(blob, filename)` | `#btn-export-png`, `#btn-export-svg` |
| PDF-Bericht | `buildReportHTML(networkImgUri)` | `#pdf-report-btn` |
| Share-Link | `loadFromShareHash()` | `#share-link-btn` |
| Beispieldaten | `loadExample(key)`, `showExampleInfo(ex)`, `EXAMPLES` | `.sample-card`, `#example-info` |
| LocalStorage | — | `#save-local-btn`, `#load-local-btn` |

---

## Beispieldatensätze

Alle in `data/sample-*.csv`, geladen via `fetch()`:

| Datei | Organisation | Analyseschwerpunkt |
|---|---|---|
| `sample-wirtschaft.csv` | Globex Handels GmbH | Warenwirtschaft als Hub, Marketing↔Logistik-Silo |
| `sample-zivilgesellschaft.csv` | Nachbarschaftshilfe e.V. | Spaghetti-Netzwerk, Spendenverwaltung isoliert |
| `sample-verwaltung.csv` | Stadtverwaltung Musterstadt | Sterntopologie Bürgermeisterbüro, Sozialamt↔Jugendamt-Lücke |
| `sample-wissenschaft.csv` | Institut für Klimaforschung | Drittmittelverwaltung als Bottleneck, Ethikkommission-Blocker |
| `sample-medien.csv` | Tagesblatt Regional GmbH | CMS als Hub, Lesermarkt von Redaktion isoliert |

---

## Libraries

### CDN (zur Laufzeit)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.23.0/cytoscape.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js"></script>
```

LZString: `LZString.compressToEncodedURIComponent` (Share-Link) und `decompressFromEncodedURIComponent` (loadFromShareHash).

### Lokal (`assets/fonts/`)

```html
<link rel="stylesheet" href="assets/fonts/inter/inter.css">
<link rel="stylesheet" href="assets/fonts/fa/all.min.css">
```

Font Awesome CSS referenziert Webfonts relativ: `../webfonts/fa-*.woff2` → `assets/fonts/webfonts/`.

---

## Bekannte Fallstricke

- **GitHub Pages CDN-Cache:** Nach Änderungen an `app.js` unbedingt `?v=N` erhöhen (aktuell v25)
- **`file://`-Protokoll:** `fetch()` schlägt fehl → Beispieldaten nicht ladbar, CSV-Paste funktioniert
- **`networkChart = null`:** Nach `renderNetwork([])` korrekt gesetzt; alle Handler mit `if (networkChart)` schützen
- **Datenmutationsreihenfolge:** Immer `buildSidebarFilters()` vor `applyFilters()` — nie umgekehrt
- **Squash-Merge-Konflikte:** Jeder PR-Merge erzeugt Squash-Commits; beim nächsten Branch-Merge entstehen scheinbare Konflikte. Auflösung: `git fetch origin main && git merge origin/main` → Konflikte → `git checkout --ours index.html js/app.js css/styles.css` → `git add` → `git commit` → `git push`
- **`showAnalyseBriefing()` ≠ `renderAll()`:** Das Briefing operiert auf `allData` und wird nicht automatisch bei Filter-Änderungen aktualisiert. Ein `filterNote`-Hinweis erscheint wenn `filterCount > 0`
- **Ziel-only Knoten:** Erhalten `org: ''` auch wenn sie in anderen Zeilen als Quelle mit Organisation auftauchen — bekanntes Pre-existing-Issue
- **Share-Link-Größe:** Bei > 15 KB URL-Länge wird CSV-Export empfohlen; typische Datensätze (30–50 Zeilen) sind problemlos
- **PDF in Chrome:** `document.close()` löst `load` synchron aus → `readyState === 'complete'`-Check vor `addEventListener`
- **LLM-Key-Validierung:** `sk-ant-` Prefix wird client-seitig geprüft; 401-Antwort setzt Key-Status auf `error`; andere HTTP-Fehler führen zu `null`-Rückgabe (kein UI-Fehler)

---

## Erledigte Entwicklungsschritte (Chronologie)

| Version | Was wurde gemacht |
|---|---|
| v15 | Analyse-Briefing mit regelbasierten Findings (Schicht 1) |
| v16 | Snapshot-Differenzanalyse (Schicht 2) |
| v17 | Vollständigkeits-Score + Template-Narrativ |
| v18 | Mobile-Navigation: Tab-Dropdown, Sidebar-Resize-Fix |
| v19 | 5 Bug-Fixes (Code-Review-Runde) |
| v20 | Vergleichsbasis für Snapshots + `diff_topology` Finding |
| v21 | LLM-Narrativ via opt-in Anthropic API-Key (Schicht 3) + Settings-Modal |
| v22 | `LS_API_KEY`-Fix (Squash-Merge-Verlust) + Inter & FA lokal hosten |
| v23 | 8 Bugs aus Max-Effort Code-Review: toCSV "0"-Bug, delete-Reihenfolge, Pathfinder-Bar, localStorage try/catch, switchTab in shareHash, wizard-back guard, mobile-nav-settings CSS |
| v24 | Settings-Modal CSS wiederhergestellt (Squash-Merge-Verlust) + Zahnrad-Button nach rechts |
| v25 | Analyse-Briefing: Finding-Karten klappbar (Erklärung + Knoten-Chips + Empfehlung), Score-Aufschlüsselung mit allen 5 Kategorien |
