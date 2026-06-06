# CLAUDE.md – DatenGraf

Dieses Dokument beschreibt Architektur, Konventionen und wichtige Implementierungsdetails für AI-gestützte Entwicklung.

---

## Projektübersicht

**DatenGraf** ist eine browserbasierte Single-Page-Application (SPA) zur Kartierung und Analyse von Datenflüssen in Organisationen. Kein Backend, kein Build-Prozess, kein Framework — nur HTML, CSS und Vanilla JS.

- **Einstiegspunkt:** `index.html`
- **Styles:** `css/styles.css`
- **Logik:** `js/app.js` (eine einzige Datei, ~1200 Zeilen)
- **Beispieldaten:** `data/sample-*.csv`, `data/template.csv`

---

## Lokale Entwicklung

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

`file://` funktioniert nicht, da `fetch()` für CSV-Beispieldaten nötig ist. Kein `npm install`, kein Bundler, keine Build-Pipeline.

**Cache-Busting:** Nach Änderungen an `app.js` die Versionsnummer im Script-Tag erhöhen:
```html
<script src="js/app.js?v=13"></script>
```

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
```

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
| `pendingFileText` | `string \| null` | Zwischenspeicher für FileReader-Ergebnis |

### CSV-Spalten (Row-Schema)

```
Quelle, QuelleAbteilung, QuelleBereich, QuelleOrganisation, QuelleRolle,
Beziehung, Ziel, Datentyp, Häufigkeit, Format, Schutzbedarf, Erfassungsart, Anmerkungen
```

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

Die `esc()`-Funktion in `buildReportHTML()` heißt intern `e()` und ist lokal definiert, da sie im Print-Window-Kontext läuft.

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

`networkChart` ist `null` wenn keine Daten geladen sind (seit Fix: auch nach `renderNetwork([])` korrekt genullt). Immer prüfen:
```js
if (networkChart) networkChart.zoom(...);
```

---

## Cytoscape-Integration

- **Library:** Cytoscape.js v3.23 (CDN)
- **Layout:** CoSE (force-directed), Konfiguration in `COSE_OPTS`
- **Stylesheet:** `CY_STYLE` — node/edge-Basis, `.highlighted`, `.faded`, `.path-node`, `.path-edge`
- **Knotenfarbe:** `data(orgColor)` / `data(orgOutlineColor)` — Default `#7a6fa8`/`#5c5080`; via `applyOrgColors()` überschreibbar
- **Klassen-Priorität:** `.highlighted` > `.path-node` > `data(orgColor)` (CSS-Spezifität: class > type+data)
- **Pfadsuche:** `cy.elements().aStar({ root, goal, directed: true })`
- **PNG-Export:** `cy.png({ output: 'base64uri', full: true, scale: 2, bg: '#f0edf8' })` — synchron
- **SVG-Export:** `cy.svg({ full: true })` — synchron

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
| CSV-Import | `parseCSV(text)`, `splitCSVLine(line)` | `#import-body`, `#csv-textarea` |
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

## Externe Libraries (CDN)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.23.0/cytoscape.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:...">
```

LZString wird für `#share-link-btn` (`LZString.compressToEncodedURIComponent`) und `loadFromShareHash` (`decompressFromEncodedURIComponent`) verwendet.

---

## Bekannte Fallstricke

- **GitHub Pages CDN-Cache:** Nach Änderungen an `app.js` unbedingt `?v=N` erhöhen
- **`file://`-Protokoll:** `fetch()` schlägt fehl → Beispieldaten nicht ladbar, CSV-Paste funktioniert
- **`networkChart = null`:** Nach `renderNetwork([])` korrekt gesetzt; alle Handler mit `if (networkChart)` schützen
- **Ziel-only Knoten:** Erhalten `org: ''` auch wenn sie in anderen Zeilen als Quelle mit Organisation auftauchen — bekanntes Pre-existing-Issue, Workaround: Org-Farben zeigt sie als `—`
- **Share-Link-Größe:** Bei > 15 KB URL-Länge wird CSV-Export empfohlen; typische Datensätze (30–50 Zeilen) sind problemlos
- **PDF in Chrome:** `document.close()` löst `load` synchron aus → `readyState === 'complete'`-Check vor `addEventListener`
