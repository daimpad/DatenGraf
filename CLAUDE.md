# CLAUDE.md – DatenGraf

Dieses Dokument beschreibt Architektur, Konventionen und wichtige Implementierungsdetails für AI-gestützte Entwicklung.

---

## Projektübersicht

**DatenGraf** ist eine browserbasierte Single-Page-Application (SPA) zur Kartierung und Analyse von Datenflüssen in Organisationen. Kein Backend, kein Build-Prozess, kein Framework — nur HTML, CSS und Vanilla JS.

- **Einstiegspunkt:** `index.html`
- **Styles:** `css/styles.css` (~2930 Zeilen)
- **Logik:** `js/app.js` (~2690 Zeilen, eine einzige Datei)
- **Beispieldaten:** `data/sample-*.csv`, `data/template.csv`
- **Design-Referenz:** `docs/design-system.html` (interaktive Token-Übersicht, Quelle der Dark-Theme-Farben)
- **Aktuelle Version:** `v64` (Script-Tag: `<script src="js/app.js?v=64">`)

---

## Lokale Entwicklung

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

`file://` funktioniert nicht, da `fetch()` für CSV-Beispieldaten nötig ist. Kein `npm install`, kein Bundler, keine Build-Pipeline zur Laufzeit.

**Tests:** `http://localhost:8080/test.html` — prüft die reinen Funktionen und meldet oben, ob alles bestanden ist. Details siehe Abschnitt *Tests*.

**Cache-Busting:** Nach Änderungen an `app.js` die Versionsnummer im Script-Tag in `index.html` erhöhen — **und** die sichtbare Version im Footer (`.footer-version`) mitziehen:
```html
<span class="footer-version">v64</span>
<script src="js/app.js?v=64"></script>
```

**Fonts/Icons/Libs:** Alles lokal — Inter + Font Awesome 6.7.2 unter `assets/fonts/`, Cytoscape und LZ-String unter `assets/vendor/`. Zur Laufzeit gibt es keine externen Aufrufe.

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
| `networkChart` | `cytoscape \| null` | Aktuelle Cytoscape-Instanz; `null` wenn keine Daten **oder Bibliothek nicht geladen** |
| `activeFilters` | `Object` | Aktive Filterwerte (Sets + Strings) |
| `editIndex` | `number` | Index in `allData` des gerade bearbeiteten Eintrags; `-1` = neuer Eintrag |
| `wizardStep` | `number` | Aktueller Wizard-Schritt (0-basiert) |
| `wizardData` | `Object` | Zwischenspeicher der Wizard-Eingaben |
| `wizardDuplicateConfirmed` | `boolean` | `true` nachdem User Duplikat-Warnung bestätigt hat |
| `colorByOrg` | `boolean` | Org-Farben-Modus aktiv |
| `orgHierarchyMode` | `boolean` | Compound-Node-Modus (Org-Hierarchie) aktiv |
| `pendingFileText` | `string \| null` | Zwischenspeicher für FileReader-Ergebnis |
| `frequencyVisMode` | `boolean` | Häufigkeits-Visualisierung auf Kanten aktiv |
| `edgeLabelsVisible` | `boolean` | Kantenbeschriftungen sichtbar (Toggle via „Labels"-Button) |
| `activeRelFilter` | `string \| null` | Aktiver Beziehungstyp-Filter (Klick auf Rel-Legende); `null` = kein Filter |
| `cachedTopoRisks` | `{hubs: Set, gatekeepers: Set} \| null` | Cache für `computeTopologyRisks()`; wird einmal pro `renderNetwork()` berechnet; `null` wenn keine Daten |
| `undoStack` | `Row[][]` | Undo-Stack (max. 20 Einträge); Push vor jeder Mutation; `Ctrl+Z` → `performUndo()` |
| `lastBriefing` | `{findings, vs} \| null` | Cache letztes Briefing-Ergebnis für PDF-Export |

Das Theme hält keinen JS-State: Quelle der Wahrheit ist `document.documentElement[data-theme]`, gespiegelt in LocalStorage.

### LocalStorage-Schlüssel

| Konstante | Schlüssel | Inhalt |
|---|---|---|
| `LS_KEY` | `datengraf_data` | Aktueller Datensatz (JSON) |
| `LS_SNAP_PREFIX` | `datengraf_snap_` | Snapshot-Prefix (+ Name) |
| `LS_BASELINE_KEY` | `datengraf_baseline` | Key des aktiven Baseline-Snapshots |
| `LS_API_KEY` | `datengraf_api_key` | Anthropic API-Key (opt-in) |
| `LS_FILTERS_KEY` | `datengraf_filters` | Persistierte Filter-Einstellungen (JSON) |
| `LS_THEME_KEY` | `datengraf_theme` | `'light'` \| `'dark'` |

### CSV-Spalten (Row-Schema)

```
Quelle, QuelleAbteilung, QuelleBereich, QuelleOrganisation, QuelleRolle,
Beziehung, Ziel, ZielOrganisation, Datentyp, Häufigkeit, Format, Schutzbedarf,
Erfassungsart, Anmerkungen, Ansprechpartner
```

15 Spalten. `Ansprechpartner` ist DSGVO-Art.-30-relevant und Pflichtfeld für DSGVO-Flüsse im Vollständigkeits-Score.

**`ZielOrganisation` (seit v63):** Das Schema beschrieb bis dahin nur die Quellseite reichhaltig; ein reiner Empfänger konnte keine Organisation tragen. Vorrangregel in `prepareElements()`: Eine Quellzeile ist die maßgebliche Erfassung eines Akteurs und überschreibt eine Organisation, die nur nebenbei als `ZielOrganisation` notiert wurde (`orgFromSource`-Flag). Umgekehrt füllt `ZielOrganisation` nur Lücken. Der Organisationsfilter greift, wenn **Quelle oder Ziel** zur gewählten Organisation gehören.

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

Immer Design-Tokens verwenden, nie hardcodierte Farben:
```css
color: var(--c-accent);      /* light #420093 · dark #9b6dff */
color: var(--c-muted);       /* light #6a6580 · dark #9d97b5 */
color: var(--c-text);
border: 1px solid var(--c-border-s);
background: var(--glass-bg);
box-shadow: var(--shadow-md);
border-radius: var(--radius);
```

**Fläche ≠ Schrift.** Semantische Farben existieren in zwei Ausprägungen, weil derselbe Farbwert als Text den Kontrast verfehlt:

| Zweck | Token | Verwendung |
|---|---|---|
| Fläche, Balken, Punkt | `--c-success` / `--c-warn` / `--c-danger` | `background`, Legendenpunkte |
| Schrift | `--ink-success` / `--ink-warn` / `--ink-danger` | `color` |

**Schrift auf Akzentfläche** immer `var(--on-accent)`, nie `#fff`: im Dark Theme ist der Akzent hell, dort schaltet das Token auf dunkle Tinte um.

Weitere abgeleitete Tokens: `--page-grad` (Body-Verlauf), `--surface-solid` (opake Modals), `--surface-alt` (Abschnittsflächen), `--field-bg` / `--field-bg-focus`, `--surface-2` / `--surface-3`, `--btn-sec-bg` / `--btn-sec-bg-h`, `--badge-*` und `--sector-*` (getönte Chips).

### Theme-Umschaltung

- Tokens: `:root` (hell) und `:root[data-theme="dark"]` in `css/styles.css`, Werte aus `docs/design-system.html`.
- Ein Inline-Script im `<head>` setzt `data-theme` **vor** dem Stylesheet — sonst flackert die Seite beim Laden.
- Ohne gespeicherte Wahl entscheidet `prefers-color-scheme`.
- `toggleTheme()` schreibt Attribut + LocalStorage, tauscht das Icon (Mond/Sonne) und färbt ein offenes Netzwerk neu ein.

> **Cytoscape ist kein CSS.** Graph-Styles kennen keine CSS-Variablen. Themeabhängige Werte gehören in `buildCyStyle()`, und jede Theme-Änderung muss `networkChart.style(buildCyStyle()).update()` auslösen.

### Hidden-Pattern

Kein globales `.hidden` — jede Komponente definiert ihre eigene Regel:
```css
.meine-komponente.hidden { display: none; }
```

### `networkChart` Guards

`networkChart` ist `null`, wenn keine Daten geladen sind **oder Cytoscape nicht verfügbar ist**. Immer prüfen:
```js
if (networkChart) networkChart.zoom(...);
```

### Datenmutations-Reihenfolge

Bei jeder Änderung an `allData` immer in dieser Reihenfolge aufrufen:
```js
pushUndo();              // 0. Zustand für Ctrl+Z sichern
buildSidebarFilters();   // 1. Filter-UI neu aufbauen
applyFilters();          // 2. filteredData berechnen + renderAll()
```
Nie umgekehrt — `applyFilters()` nutzt die von `buildSidebarFilters()` aufgebauten Selects.

### CSV-Trennzeichen

`detectDelimiter(csv)` leitet das Trennzeichen aus der **Kopfzeile** ab (Komma, Semikolon, Tabulator) und ignoriert dabei alles in Anführungszeichen. Grund: Deutsches Excel exportiert standardmäßig mit Semikolon — ohne Erkennung landet die gesamte Zeile in einer einzigen Spalte, und der Import „gelingt" scheinbar mit unbrauchbaren Daten. Ein UTF-8-BOM entfernt bereits das vorhandene `trim()` (U+FEFF zählt für JavaScript als Whitespace).

`usableRowCount(rows)` zählt Zeilen mit Quelle, Ziel und Beziehung. Ergibt ein Import **null** verwertbare Zeilen, weisen beide Import-Buttons ihn mit einer erklärenden Meldung ab, statt den bestehenden Datensatz zu überschreiben.

### toCSV / Falsy-Werte

`toCSV` prüft `v == null || v === ''` (nicht `!v`). Geschützt wird damit die **Zahl** `0`: Der String `'0'` ist truthy und war nie gefährdet, die Zahl `0` ist es nicht. Zahlen können über geteilte Links oder LocalStorage in den Datensatz geraten, ein `!v`-Guard würde dort stillschweigend leere Zellen schreiben. Der Testfall dazu steht in `test.html`.

### Barrierefreiheit

Textfarben erfüllen in beiden Themes WCAG 2.1 AA (4.5:1, große Schrift 3:1). Bei neuen Farbkombinationen den Kontrast prüfen, statt Werte zu schätzen — besonders bei getönten Chips (transparente Fläche über wechselndem Grund) und bei Text auf Akzentflächen.

**Fokus in Dialogen:** Ein `MutationObserver` auf der `.hidden`-Klasse der fünf Backdrops (`MODAL_BACKDROP_IDS`) setzt beim Öffnen den Fokus ins Modal und gibt ihn beim Schließen zurück; ein globaler Tab-Handler hält ihn im obersten offenen Dialog. Der Observer-Ansatz ist bewusst gewählt, damit er unabhängig von der öffnenden Code-Stelle greift — auch beim Theorie-Modal und bei `Esc`. Neue Modals nur in `MODAL_BACKDROP_IDS` eintragen, sonst nichts zu tun.

**Canvas-Alternative:** Die Netzwerkkarte ist für Screenreader nicht erschließbar. `#network-container` trägt deshalb `role="img"` mit Textalternative, darunter verweist `.network-a11y-note` sichtbar auf die Listenansicht. Listenansicht und Briefing müssen inhaltlich gleichwertig bleiben — die Karte darf nie der einzige Zugang zu einer Information werden.

**Statusmeldungen:** `#status-message` ist `role="status"` mit `aria-live="polite"`.

---

## Cytoscape-Integration

- **Library:** Cytoscape.js v3.23.0 — lokal unter `assets/vendor/cytoscape.min.js`, kein CDN
- **Layout:** CoSE (force-directed), Konfiguration in `COSE_OPTS`
- **Stylesheet:** `CY_STYLE` ist die **Basis-Konstante**; `buildCyStyle()` leitet daraus die themeabhängige Variante ab und wird an `cytoscape({ style })` übergeben. `CY_STYLE` selbst wird dabei nicht mutiert.
- **Themeabhängig in `buildCyStyle()`:** Compound-Node-Label und -Rahmen (`:parent`), Kantenlabel-Hintergrund und -Schrift, Knoten-Rahmenfarbe
- **Knotenfarbe:** `data(orgColor)` / `data(orgOutlineColor)` — Default `#7a6fa8`/`#5c5080`; via `applyOrgColors()` überschreibbar
- **Klassen-Priorität:** `.highlighted` > `.path-node` > `data(orgColor)`
- **Pfadsuche:** `cy.elements().aStar({ root, goal, directed: true })`
- **PNG-Export:** `cy.png({ output: 'base64uri', full: true, scale: 2, bg: '#f0edf8' })` — synchron; bewusst **immer hell**, da Exporte in Dokumenten und im Druck landen
- **SVG-Export:** `cy.svg({ full: true })` — synchron; benötigt die registrierte Erweiterung `cytoscape-svg`, der Button prüft `typeof networkChart.svg === 'function'`
- **Pathfinder-Bar:** wird NUR bei leeren Daten (`!data.length`) versteckt — nicht bei jedem Re-Render

### Verhalten bei fehlender Bibliothek

Seit v62 werden Cytoscape und LZ-String lokal ausgeliefert, der Normalfall ist also „vorhanden". Die Guards bleiben trotzdem bestehen, falls eine Datei fehlt oder blockiert wird:

`renderNetwork()` prüft `typeof cytoscape === 'undefined'` und zeigt dann einen erklärenden Empty-State, statt zu werfen. Vor diesem Guard riss die Exception die gesamte Kette nach `applyFilters()` ab — kein Briefing, kein Statustext, kein Tab-Wechsel. `share-link-btn` prüft analog `typeof LZString === 'undefined'`.

> Neue externe Abhängigkeiten gehören nach `assets/vendor/`, nicht an ein CDN. Die Offline-Fähigkeit ist ein Produktversprechen, kein Zufall.

---

## Analyse-Briefing (3 Schichten)

### Schicht 1 – `runAnalysis(data)` (regelbasiert)

Gibt `findings[]` zurück. Jedes Finding: `{ type, severity, icon, title, text, explain?, nodes?, action? }`.

| Typ | Bedeutung |
|---|---|
| `hub` | Knoten mit überdurchschnittlich vielen Verbindungen |
| `gatekeeper` | Hohe Betweenness — struktureller Flaschenhals |
| `isolated` | Teilgraphen ohne Verbindung zum Hauptnetz (BFS-Komponentenanalyse) |
| `dsgvo_no_owner` | DSGVO-relevante Flüsse ohne Ansprechpartner |
| `missing_schutz` | Fehlende Schutzklasse |
| `missing_datentyp` | Fehlender Datentyp |
| `no_org` | Fehlende Organisationsangabe |
| `diff_changes` | Neue/entfallene Verbindungen gegenüber der Vergleichsbasis |
| `diff_topology` | Knoten, die seit der Basis zu Hub/Gatekeeper wurden |

Wichtige Hilfsfunktionen:
- `betweennessCentrality(nodes, adj)` — eigene Implementierung (Brandes)
- `computeTopologyRisks(data)` — gibt `{ hubs: Set, gatekeepers: Set }` zurück (für Diff-Vergleich)

### Schicht 2 – Snapshot-Diff

- `listSnapshots()` — liest alle `datengraf_snap_*` aus localStorage
- `getBaselineSnapshot()` — gibt markierte Basis oder neuesten Snapshot zurück
- `diffSnapshots(prev, curr)` — gibt `{ added, removed, schutzChanged }` zurück (nicht `changed`)
- `formatSnapAge(savedAt)` — menschenlesbare Altersanzeige

### Schicht 3 – `generateNarrativeLLM(data, findings, vs)` (async)

- Liest `LS_API_KEY` aus localStorage; gibt `null` zurück wenn kein Key
- Ruft `https://api.anthropic.com/v1/messages` direkt aus dem Browser auf
- Benötigt Header `anthropic-dangerous-direct-browser-access: true`
- Modell: `claude-haiku-4-5-20251001`, max_tokens: 400
- Template-Narrativ bleibt Fallback; LLM-Text ersetzt es in-place nach dem Laden
- Fehlerbehandlung: 401/auth → `updateKeyStatus('error')`; andere Fehler → silent `null`

### Vollständigkeits-Score

`calcVollstaendigkeit(data)` → `{ score: 0–100, gaps: [], categories: [] }`

| Kategorie | Gewicht | Prüfung |
|---|---|---|
| Schutzklasse | 25 | `Schutzbedarf` gesetzt |
| Ansprechpartner (DSGVO) | 25 | bei `Schutzbedarf === 'DSGVO-relevant'` ein `Ansprechpartner` gesetzt; ohne DSGVO-Zeilen volle Punktzahl |
| Datentyp | 20 | `Datentyp` gesetzt |
| Erfassungsart | 15 | `Erfassungsart` gesetzt |
| Organisation | 15 | `QuelleOrganisation` gesetzt |

`categories` enthält alle fünf Kategorien (`{ label, weight, ok, missing, pct }`), `gaps` nur die mit `missing > 0`, absteigend sortiert.

---

## Tests

`test.html` prüft die reinen Funktionen aus `app.js`. Aufruf über HTTP: `http://localhost:8080/test.html`.

**Wie es funktioniert:** Die Seite lädt `index.html` unsichtbar in einem Iframe und testet die echten Funktionen über `iframe.contentWindow` — keine Kopie des Codes, kein Build-Schritt, keine Abhängigkeit. Passt damit zur Projektphilosophie.

Abgedeckt sind `parseCSV` (State-Machine: Quotes, `""`-Escapes, CRLF, Zeilenumbrüche im Feld), `toCSV` inklusive Round-Trip, `esc`, `calcVollstaendigkeit`, `betweennessCentrality`, `labelPropagation`, `computeTopologyRisks`, `diffSnapshots`, `findDuplicate`, `formatSnapAge` und `buildCyStyle` (inkl. der Zusicherung, dass `CY_STYLE` nicht mutiert wird).

**Beim Schreiben neuer Tests beachten:**
- `instanceof` trägt **nicht** über die Iframe-Grenze. Für Objekte aus der App `win.Set` statt `Set` verwenden.
- Top-Level-`const` (z. B. `CY_STYLE`) liegen nicht auf `window`; über `win.eval('CY_STYLE')` zugreifen. Funktions-Deklarationen sind dagegen direkt erreichbar.
- Für automatisierte Aufrufe steht das Ergebnis in `window.__testResults` (`{passed, failed, total, failures}`), der Titel beginnt mit `✓` oder `✗`.

Ein neuer Test sollte nachweislich fehlschlagen können — beim Anlegen einmal die geprüfte Stelle testweise brechen und sehen, ob der Test anschlägt.

---

## Feature-Übersicht

| Feature | Schlüsselfunktionen | Schlüssel-IDs |
|---|---|---|
| Wizard | `openWizard(prefill, editIdx)`, `closeWizard()`, `renderWizardStep()`, `collectWizardStep()` | `#wizard-backdrop`, `#wizard-next`, `#wizard-back` |
| Duplikat-Erkennung | `findDuplicate(data, candidate, skipIndex)` | `#wizard-dup-warning`, `#wizard-dup-text` |
| Listenansicht | `renderList(data)` | `#list-content`, `[data-edit]`, `[data-dupe]`, `[data-del]` |
| Netzwerk | `renderNetwork(data)`, `prepareElements(data)`, `buildCyStyle()` | `#network-container`, `#node-detail` |
| Knoten-Detail | `showNodeDetail(nodeId, data)` | `#nd-name`, `#nd-metrics`, `#nd-flows`, `#nd-show-in-list` |
| Knoten-Tooltip | Hover-Handler in `renderNetwork()` | `#cy-tooltip` |
| Knotensuche | Handler auf `#network-node-search` (`Strg+F`) | `#network-node-search` |
| Pfadfinder | `populatePathfinderSelects()`, `clearPath()` | `#pathfinder-bar`, `#path-from`, `#path-to` |
| Org-Farben | `applyOrgColors()`, `clearOrgColors()`, `buildOrgColorMap()` | `#btn-color-by-org`, `#org-legend` |
| Org-Hierarchie | `prepareElements(data, true)` | `#btn-toggle-hierarchy`, `#hier-legend` |
| Häufigkeits-Vis | `applyFrequencyVis()`, `clearFrequencyVis()`, `FREQ_VIS` | `#btn-freq-vis`, `#freq-legend` |
| Rel-Legende (klickbar) | `renderRelLegend(data)`, `activeRelFilter` | `#rel-legend` |
| Hub/Gatekeeper | `computeTopologyRisks(data)`, `cachedTopoRisks` | `#topo-legend` |
| Kantenlabel-Toggle | `applyEdgeLabelToggle()` | `#btn-edge-labels` |
| Legenden-Stapelung | `stackLegends(offset)` | `#org-legend`, `#freq-legend`, `#rel-legend` |
| Insights | `renderInsights(data)`, `labelPropagation(nodes, adj)` | `#insights-grid` |
| Filter | `applyFilters()`, `buildSidebarFilters()`, `clearFilters()`, `restoreFilters()` | `#sidebar`, `.chip`, `.filter-group` |
| Analyse-Briefing | `showAnalyseBriefing()`, `runAnalysis()`, `calcVollstaendigkeit()` | `#analyse-briefing`, `#briefing-findings` |
| Snapshots | `listSnapshots()`, `getBaselineSnapshot()`, `diffSnapshots()` | `#snapshot-backdrop`, `#snapshot-list` |
| LLM-Narrativ | `generateNarrativeLLM(data, findings, vs)` | `.briefing-narrative-text` |
| Settings Modal | `openSettingsModal()`, `closeSettingsModal()`, `updateKeyStatus()` | `#settings-backdrop`, `#settings-api-key` |
| FAQ Modal | `openFaqModal()`, `closeFaqModal()` | `#faq-backdrop`, `#faq-btn` |
| Theorie Modal | — | `#theory-backdrop`, `#open-theory-btn` |
| Theme-Toggle | `toggleTheme()`, `applyThemeIcon()`, `isDarkTheme()` | `#theme-toggle-btn` |
| Fokus-Management | `focusablesIn()`, `openModalBackdrops()`, `MODAL_BACKDROP_IDS` | alle `*-backdrop` |
| Canvas-Alternative | — | `#network-a11y-to-list`, `.network-a11y-note` |
| Undo | `pushUndo()`, `performUndo()` | — (`Strg+Z`) |
| Mobile-Nav | — | `#mobile-nav`, `#mobile-nav-btn`, `.mobile-nav-tab` |
| CSV-Import | `parseCSV(csv)`, `detectDelimiter(csv)`, `usableRowCount(rows)` — State-Machine über den gesamten String; Quotes, `""`-Escapes, CRLF, BOM und Komma/Semikolon/Tabulator | `#import-body`, `#csv-input` |
| Import-Vorschau | `showCSVPreview(text)` | `#csv-preview` |
| CSV-Export | `toCSV(data)` | `#export-csv-btn` |
| PNG/SVG-Export | `downloadBlob(blob, filename)` | `#btn-export-png`, `#btn-export-svg` |
| PDF-Bericht | `buildReportHTML(networkImgUri)` | `#pdf-report-btn` |
| Share-Link | `loadFromShareHash()` | `#share-link-btn` |
| Beispieldaten | `loadExample(key)`, `showExampleInfo(ex)`, `EXAMPLES` | `.sample-card`, `#example-info` |
| LocalStorage | — | `#save-local-btn`, `#load-local-btn` |

### Tastenkürzel

| Kürzel | Wirkung | Bedingung |
|---|---|---|
| `Strg`/`Cmd` + `N` | Wizard öffnen | kein Modal offen, Fokus nicht im Eingabefeld |
| `Strg`/`Cmd` + `Z` | `performUndo()` | wie oben |
| `Strg`/`Cmd` + `F` | Knotensuche fokussieren | nur bei aktivem `#panel-network` |
| `Esc` | Oberstes offenes Modal schließen | — |

---

## Seitenaufbau (Landingpage)

Reihenfolge unterhalb der App-Shell:

1. `.cta-section` — lila Band „Was steckt hinter Netzwerkanalysen?" → Theorie-Modal
2. `.feature-duo-section` — heller Container mit Datenatlas und DatenLotse (Logo-Platzhalter mit Hover-Effekt)
3. `.contact-cta-section` — dunkles Band (`#18181b`) → nozilla-Kontakt
4. `.site-footer` — Brand links, Links rechtsbündig, Versionsnummer

Im Hero sitzt unter den drei Karten das SEO-Akkordeon `.about-accordion` („Mehr über den DatenGraf erfahren"), ein natives `<details>` ohne JS. Der Inhalt bleibt im DOM und damit indexierbar.

Die Filter-Sidebar und der Hamburger-Button liegen seit v59 **rechts** (`order: 1`, `border-left`, Kollaps nach `translateX(+w)`).

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

### Lokal eingecheckt (`assets/vendor/`)

```html
<script src="assets/vendor/cytoscape.min.js"></script>
<script src="assets/vendor/cytoscape-svg.js"></script>
<script src="assets/vendor/lz-string.min.js"></script>
```

**`cy.svg()` braucht eine Registrierung.** Die SVG-Erweiterung wird per `cytoscape.use(cytoscapeSvg)` angemeldet (in `app.js` direkt vor `isDarkTheme()`). Ohne diese Zeile existiert `networkChart.svg` schlicht nicht — genau das war bis v64 der Fall, der SVG-Button warf still einen TypeError.

Keine externen Aufrufe zur Laufzeit. Die Versionen stehen in `package.json`; `npm run vendor` aktualisiert die Dateien (zur Laufzeit wird nichts installiert).

LZString: `LZString.compressToEncodedURIComponent` (Share-Link) und `decompressFromEncodedURIComponent` (`loadFromShareHash`).

### Lokal (`assets/fonts/`)

```html
<link rel="stylesheet" href="assets/fonts/inter/inter.css">
<link rel="stylesheet" href="assets/fonts/fa/all.min.css">
```

Font Awesome CSS referenziert Webfonts relativ: `../webfonts/fa-*.woff2` → `assets/fonts/webfonts/`.

---

## Bekannte Fallstricke

- **GitHub Pages CDN-Cache:** Nach Änderungen an `app.js` unbedingt `?v=N` erhöhen (aktuell v64) — und `.footer-version` mitziehen
- **`file://`-Protokoll:** `fetch()` schlägt fehl → Beispieldaten nicht ladbar, CSV-Paste funktioniert
- **Fehlende Bibliothek:** Ohne Cytoscape/LZString bleiben Netzwerkkarte und Share-Link aus; alles andere muss weiterlaufen. Neue Aufrufe dieser Bibliotheken immer guarden. Keine neuen CDN-Abhängigkeiten einführen — Vendor-Dateien nach `assets/vendor/`
- **Cytoscape-Styles sind kein CSS:** Themeabhängige Graph-Farben gehören in `buildCyStyle()`; `CY_STYLE` bleibt unmutiert (die Ableitung nutzt `map` + Spread)
- **Theme-Wechsel bei offenem Graph:** ohne `networkChart.style(...).update()` bleiben die alten Farben stehen
- **Kontrast bei neuen Farben:** getönte Chips und Text auf Akzentflächen brauchen eigene Hell-/Dunkel-Werte (`--badge-*`, `--sector-*`, `--ink-*`, `--on-accent`)
- **`networkChart = null`:** Nach `renderNetwork([])` und ohne Cytoscape korrekt gesetzt; alle Handler mit `if (networkChart)` schützen
- **Datenmutationsreihenfolge:** Immer `pushUndo()` → `buildSidebarFilters()` → `applyFilters()`
- **Squash-Merge-Konflikte:** Jeder PR-Merge erzeugt Squash-Commits; beim nächsten Branch-Merge entstehen scheinbare Konflikte. Auflösung: `git fetch origin main && git merge origin/main` → Konflikte → `git checkout --ours index.html js/app.js css/styles.css` → `git add` → `git commit` → `git push`. Alternativ den Branch auf `origin/main` zurücksetzen (`git checkout -B <branch> origin/main`), wenn er keine unveröffentlichten Commits trägt
- **`showAnalyseBriefing()` ≠ `renderAll()`:** Das Briefing operiert auf `allData` und wird nicht automatisch bei Filter-Änderungen aktualisiert. Ein `filterNote`-Hinweis erscheint wenn `filterCount > 0`
- **Share-Link-Größe:** Bei > 15 KB URL-Länge wird CSV-Export empfohlen; typische Datensätze (30–50 Zeilen) sind problemlos
- **PDF in Chrome:** `document.close()` löst `load` synchron aus → `readyState === 'complete'`-Check vor `addEventListener`
- **Tests laufen gegen den echten Code:** `test.html` lädt `index.html` per Iframe. Nach Umbenennen einer Funktion die Tests mitziehen — sie schlagen sonst mit „ist keine Funktion" fehl
- **PDF-Bericht ist eigenständig:** läuft im Print-Window ohne Zugriff auf `css/styles.css` — dort **keine** CSS-Variablen verwenden, sondern feste Werte
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
| v26 | `isolated`-Finding (BFS-Komponentenanalyse für isolierte Teilgraphen), PDF-Bericht mit Briefing-Sektion (Score + Findings), Filter-Persistenz via `LS_FILTERS_KEY` |
| v27 | Häufigkeits-Visualisierung: Kanten nach Häufigkeit in Dicke, Linienstil und Transparenz kodiert; Toggle-Button + SVG-Legende; `stackLegends()` für Org- und Häufigkeits-Legende gleichzeitig |
| v28 | Fix: Hierarchie-Compound-Nodes waren solid lila (rgba-Bug in Cytoscape `background-opacity`) |
| v29 | Automatische Beziehungstyp-Legende (`rel-legend`) aus Datensatz-Werten |
| v30–31 | Hierarchie-Erklärungslegende (`hier-legend`); Fix compound-node tap zeigt nicht mehr `_p_`-Detail |
| v32 | Fix: Org-Farben-Legende zeigte `—` für Knoten ohne Organisation |
| v33 | FAQ-Modal: `?`-Button öffnet 9 klappbare Einträge zu Kantenfarben, Hierarchie, Import, Briefing, Snapshots etc. |
| v34 | Klickbare Rel-Legende (Netzwerk auf Beziehungstyp filtern); Knotensuche in Toolbar (`Strg+F`) |
| v35 | Escape schließt alle Modals; Hub-Knoten (gold) + Gatekeeper (rot) visuell markiert; Topo-Legende |
| v36 | Doppelklick auf Knoten öffnet Wizard im Bearbeitungsmodus; Hub/Gatekeeper-Badge im Knotendetail |
| v37 | Performance: `cachedTopoRisks` (1× statt 3×); Edge-Label-Toggle; Statistik-Chip; `Strg+N`/`Strg+F` |
| v38 | Export filtert mit (gefilterte Daten wenn Filter aktiv); Netzwerk-Empty-States; Briefing-Stale-Punkt |
| v39 | Undo (`Ctrl+Z`, max. 20 Schritte); Wizard-Validierung Quelle ≠ Ziel; CLAUDE.md aktualisiert |
| v40 | Listensortierung; „In Listenansicht zeigen"-Button im Knotendetail |
| v41 | 4 Bugfixes aus Code-Review |
| v42 | CSV-Import-Vorschau (`showCSVPreview`); Knoten-Hover-Tooltip (`#cy-tooltip`) |
| v43 | FAQ-Modal: solider Hintergrund, mobiles Scrolling; erste CTA-Sektion |
| v44 | 2 Bug-Fixes: Tooltip-Reset in `renderNetwork()`, Zeilenzählung in `showCSVPreview` |
| v45 | Fix: `bereich` fehlte in den Cytoscape-`nodeData` → Tooltip zeigte `undefined` |
| v46 | Kontakt-CTA auf die Hauptseite verschoben; FAQ-Mobile-Fix (`display: block`) |
| v47 | Hero-Steps: Icon im Kreis + Nummern-Badge; FAQ-Höhe mobil; CTA-Band dunkel |
| v48 | 3 Bug-Fixes: `pushUndo()` vor CSV-Import/Append, `.node-detail` Overflow |
| v49 | CTA-Sektionen vereinheitlicht: Stack-Layout, linksbündig, Button unten |
| v50 | SEO: Titel, Meta-Description, Open Graph, Twitter Card, JSON-LD, canonical, `robots.txt`, `sitemap.xml`, `social-preview.svg` |
| v51 | About-Bereich als gestaltete Karte; Settings-Modal mit solidem Hintergrund |
| v52 | „Nächster-Schritt"-Brücke im Analyse-Briefing (`.briefing-next`) |
| v53 | About-Text als Akkordeon unter den Hero-Cards (`.about-accordion`) |
| v54 | Neues Maskottchen-Logo; kreisförmiger Hero-Rahmen entfernt |
| v55 | `logo.svg`-`viewBox` eng auf die Figur gecroppt; Logo kleiner, wieder im Kreis; Abstände balanciert |
| v56 | Footer-Links rechtsbündig; Akkordeon auf volle Breite |
| v57 | Feature-Duo Datenatlas & DatenLotse (`.feature-duo-section`) mit Logo-Platzhaltern und Hover-Effekt |
| v58 | Lotse-Button aus der lila CTA entfernt; Feature-Überschrift linksbündig |
| v59 | Hamburger-Button und Filter-Sidebar nach **rechts** verlegt (Desktop + Mobile) |
| v60 | Dark Theme mit Umschalter; Tokens aus `docs/design-system.html`; ~44 hartcodierte Flächen tokenisiert |
| v61 | CDN-Ausfallsicherheit (`renderNetwork`/Share-Link guarden); `buildCyStyle()` für themeabhängige Graph-Farben; Kontrast auf WCAG AA in beiden Themes (`--ink-*`, `--on-accent`, `--badge-*`, `--sector-*`, `--c-muted` nachgeschärft) |
| v62 | Cytoscape und LZ-String lokal unter `assets/vendor/` (kein CDN mehr, App vollständig offline-fähig); Barrierefreiheit: Fokus-Trap und Fokus-Rückgabe in allen Modals, `aria-live` für Statusmeldungen, Textalternative und sichtbarer Listen-Verweis unter der Netzwerkkarte |
| v63 | Test-Harness `test.html`: 48 Tests für die reinen Funktionen, läuft im Browser ohne Build; dabei zwei Doku-Fehler gefunden (`diffSnapshots` liefert `schutzChanged`, und der Falsy-Guard in `toCSV` schützt die Zahl `0`, nicht den String `'0'`) |
| v63 | Spalte `ZielOrganisation`: reine Empfänger können jetzt eine Organisation tragen (vorher farblos in der Org-Ansicht). Quellangaben behalten Vorrang. Vorlage und Beispieldaten um `ZielOrganisation` **und** das bislang fehlende `Ansprechpartner` ergänzt |
| v64 | Testrunde über die gesamte App (151 Prüfungen). Drei Fehler behoben: SVG-Export war seit jeher kaputt (Erweiterung `cytoscape-svg` fehlte), Semikolon- und Tabulator-CSV wurden nicht erkannt (deutsches Excel), und unbrauchbare Importe meldeten Erfolg statt Fehler |
