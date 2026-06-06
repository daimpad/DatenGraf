# DatenGraf – Entwicklerdokumentation

## Architektur-Überblick

Single-Page Application (SPA) ohne Build-Schritt, kein Framework, kein Backend.

| Datei | Verantwortung |
|---|---|
| `index.html` | DOM-Struktur, alle IDs, keine Inline-Logik |
| `css/styles.css` | Design-Tokens, Komponenten, Responsive |
| `js/app.js` | Gesamte Anwendungslogik (Daten, Render, Analyse) |
| `data/*.csv` | Beispieldatensätze + Vorlage |

**Cache-Busting:** `<script src="js/app.js?v=N">` – bei jedem Deploy erhöhen.  
**Aktuelle Version:** v15

---

## Zustandsvariablen (app.js)

| Variable | Typ | Bedeutung |
|---|---|---|
| `allData` | `Array<Object>` | Alle geladenen Zeilen (ungefiltert) |
| `filteredData` | `Array<Object>` | Nach `activeFilters` gefilterter Stand |
| `networkChart` | `cytoscape \| null` | Aktive Cytoscape-Instanz |
| `activeFilters` | `Object` | Aktiver Filterstatus (Sets + Strings) |
| `editIndex` | `number` | Index in `allData` beim Bearbeiten (-1 = neu) |
| `wizardStep` | `number` | Aktueller Wizard-Schritt (0–3) |
| `wizardData` | `Object` | Formular-Akkumulator des Wizards |
| `wizardDuplicateConfirmed` | `boolean` | Duplikat-Warnung bestätigt |
| `colorByOrg` | `boolean` | Org-Farben aktiv |
| `orgHierarchyMode` | `boolean` | Compound-Node-Hierarchie aktiv |
| `pendingFileText` | `string \| null` | Gelesener Dateiinhalt vor Import |

---

## CSV-Schema

```
Quelle, QuelleAbteilung, QuelleBereich, QuelleOrganisation, QuelleRolle,
Beziehung, Ziel, Datentyp, Häufigkeit, Format,
Schutzbedarf, Erfassungsart, Anmerkungen, Ansprechpartner
```

`toCSV()` und der Parser sind an diese Reihenfolge gebunden.  
Der Parser (`parseCSV`) ist zeichenweise und behandelt `""` escaped Quotes und mehrzeilige Felder.

---

## XSS-Konventionen

- **`esc(str)`** für alle Werte in `innerHTML`
- **Rohe Werte** für `textContent` – `esc()` dort erzeugt `&amp;`-Doppelkodierung
- **`data-*`-Attribute**: `esc()` ist korrekt, Browser dekodiert HTML-Entities beim Lesen via `dataset`

---

## Cytoscape-Integration

- Instanz: `networkChart` (null wenn kein Graph)
- Style: `CY_STYLE` – enthält `data(orgColor)`, `data(orgOutlineColor)` sowie Klassen `.highlighted`, `.faded`, `.path-node`, `.path-edge`, `:parent`
- Compound Nodes: aktiviert über `orgHierarchyMode`, Parent-IDs mit `_p_`-Präfix
- Alle Guards: `if (networkChart)` vor jedem Zugriff

---

## Kontextanalyse – Konzept & Roadmap

### Philosophie

DatenGraf soll nicht nur visualisieren, sondern **interpretieren**. Das Analyse-System ist in drei Schichten aufgebaut, die aufeinander aufbauen:

```
Schicht 1: Rule-based (jetzt)     → deterministisch, lokal, sofort
Schicht 2: Snapshot-Diff (bald)   → temporal, lokal, kein Backend
Schicht 3: LLM-Narrativ (später)  → kontextuell, opt-in, API-Key nötig
```

---

### Schicht 1 – Rule-based Analyse (implementiert in v15)

**Einstiegspunkt:** `showAnalyseBriefing()` – wird nach jedem Datenladen aufgerufen.  
**Analyse-Engine:** `runAnalysis(data)` – gibt max. 5 priorisierte Findings zurück.

#### Finding-Struktur

```js
{
  type: string,           // Eindeutiger Bezeichner, z. B. 'hub', 'gatekeeper'
  severity: 'high' | 'medium' | 'low',
  icon: string,           // Font Awesome class, z. B. 'fa-arrows-to-dot'
  title: string,          // Kurze Überschrift (esc'd beim Rendern)
  text: string,           // Erklärung (esc'd beim Rendern)
  action: {
    label: string,        // Button-Text
    type: 'highlight' | 'filter-schutz' | 'tab',
    nodeId?: string,      // für type: 'highlight'
    value?: string,       // für type: 'filter-schutz'
    tab?: string,         // für type: 'tab'
  } | null
}
```

#### Implementierte Regeln

| Regel | Typ | Schwellwert | Aktion |
|---|---|---|---|
| `hub` | Structural | out-degree ≥ max(4, 2× Ø) | Netzwerk-Highlight |
| `gatekeeper` | Structural | Betweenness > 3× Ø | Netzwerk-Highlight |
| `dsgvo_no_owner` | Compliance | DSGVO ohne Ansprechpartner | Filter setzen |
| `missing_schutz` | Hygiene | Schutzbedarf leer | Insights-Tab |
| `no_org` | Vollständigkeit | 0% mit QuelleOrganisation | — |
| `missing_datentyp` | Vollständigkeit | >30% ohne Datentyp | Listen-Tab |

#### Neue Regeln hinzufügen

In `runAnalysis(data)` ein neues Finding-Objekt in `findings` pushen, dann in `runAnalysis` am Ende durch `slice(0, 5)` automatisch priorisiert (Sortierung nach `severity`).

---

### Schicht 2 – Snapshot-Differenzanalyse (geplant)

**Voraussetzung:** Snapshots (bereits implementiert in v14).

**Konzept:** Beim Laden eines Datensatzes mit vorhandenem Snapshot wird automatisch ein Diff berechnet:
- Neue Flüsse seit letztem Snapshot
- Weggefallene Flüsse
- Veränderte Schutzklassen
- Neue kritische Knoten (Gatekeeper/Hub die vorher nicht da waren)

**Umsetzung:**
```js
function diffSnapshots(prev, curr) {
  // Returns { added, removed, schutzChanged, newHubs }
}
```

Findings aus dem Diff werden mit Icon `fa-clock-rotate-left` und Typ `diff_*` in das Briefing integriert.

---

### Schicht 3 – LLM-Narrativ (konzept, opt-in)

**Ziel:** Aus den rule-based Befunden und der Netzwerktopologie eine natürlichsprachige Analyse generieren:
> *„Euer Netzwerk zeigt ein klassisches Sterntopologie-Muster mit Warenwirtschaft als Single Point of Failure. Besonders kritisch: 6 DSGVO-Flüsse haben keine verantwortliche Person – das ist eine Compliance-Lücke nach Art. 30 DSGVO."*

**Privacy-Ansatz:** Nur anonymisierte Metriken senden (keine Klarnamen), oder opt-in mit vollständigem Kontext + eigenem API-Key.

**Input-Struktur (komprimiert, ~500 Token):**
```js
{
  nodeCount, edgeCount, dsgvoCount,
  topHubs: [{ id: 'A', out: 9 }],     // keine Klarnamen = privacy-safe
  topGatekeepers: [...],
  missingFields: { schutz: 4, ansprechpartner: 2 },
  findings: runAnalysis(data).map(f => f.type)
}
```

**Technische Anforderungen:**
- Minimaler Backend-Proxy (API-Key nicht im Browser) oder User-seitig via Settings-Modal
- Streaming-Response für UX (kein 5s-Blank-Screen)
- Fallback: wenn kein API-Key → zeige nur rule-based Findings

---

## Vollständigkeits-Score (geplant)

Ein `[0–100%]`-Score berechnet aus:
- Schutzbedarf gesetzt: 25 Punkte (gewichtet)
- Erfassungsart gesetzt: 15 Punkte
- Datentyp gesetzt: 20 Punkte
- Ansprechpartner bei DSGVO: 25 Punkte
- QuelleOrganisation gesetzt: 15 Punkte

Anzeige als Progress-Bar im Briefing-Header oder in den Insights.

---

## Bekannte Einschränkungen / Pitfalls

- `renderNetwork([])` muss `networkChart = null` setzen – sonst stale reference
- `textContent = esc(val)` → Doppelkodierung – immer raw values für textContent
- `buildChipGroup` restauriert jetzt active-State aus `activeFilters` (seit v15)
- Org-Farben überschreiben `data(orgColor)` direkt – Klassen `.highlighted`/`.faded` haben höhere Spezifität im CY_STYLE
- Compound Nodes: Parent-IDs müssen `_p_`-Präfix haben um Kollision mit echten Node-IDs zu vermeiden
- `wizardDuplicateConfirmed` muss bei jedem Back/Cancel/Close zurückgesetzt werden
