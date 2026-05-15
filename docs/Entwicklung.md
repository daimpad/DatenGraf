# Entwicklung & Beitragen

← [Zurück zur Übersicht](Home.md)

---

## Projektstruktur

```
DatenGraf/
├── index.html          # HTML-Einstiegspunkt (nur Struktur)
├── css/
│   └── styles.css      # Gesamtes Stylesheet mit Design-Tokens
├── js/
│   └── app.js          # Gesamte Anwendungslogik
├── data/
│   └── sample.csv      # Demo-Datensatz (32 Datenflüsse)
├── docs/               # Diese Dokumentation
├── .github/
│   └── CONTRIBUTING.md # Beitragsrichtlinien
├── DOCS.md             # Technische Kurzreferenz
├── SECURITY.md         # Sicherheitsrichtlinie
└── LICENSE             # GNU GPL v3.0
```

Keine Build-Tools, kein npm, kein Transpiler – reines HTML/CSS/JS.

---

## Lokale Entwicklung

```bash
git clone https://github.com/daimpad/DatenGraf.git
cd DatenGraf
python3 -m http.server 8080
# → http://localhost:8080
```

Dateien direkt bearbeiten, Browser neu laden – fertig.

---

## Architektur

### Globaler Zustand (`js/app.js`)

```js
let allData      = [];   // alle importierten Zeilen
let filteredData = [];   // nach activeFilters gefilterte Teilmenge
let networkChart = null; // Cytoscape-Instanz
let activeFilters = {
  relation: new Set(), schutz: new Set(), erfassung: new Set(),
  organization: 'all', department: 'all',
  frequency: 'all', format: 'all', search: ''
};
```

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
```

---

## Wichtige Funktionen

| Funktion | Beschreibung |
|---|---|
| `parseCSV(csv)` | CSV-Text → Objekt-Array (RFC 4180 mit Quote-Escaping) |
| `applyFilters()` | Filtert allData → filteredData, triggert Re-Render |
| `renderList(data)` | Listenansicht als DOM-Elemente |
| `renderNetwork(data)` | Cytoscape-Instanz aufbauen |
| `renderInsights(data)` | Metriken berechnen + Dashboard-Karten rendern |
| `betweennessCentrality(nodes, adj)` | Brandes-Algorithmus O(V·E) |
| `labelPropagation(nodes, adj)` | Community Detection, max. 10 Iterationen |
| `openWizard(prefill)` | Wizard-Modal öffnen |
| `esc(str)` | XSS-Schutz: HTML-Sonderzeichen escapen |

---

## XSS-Schutz

Alle Benutzereingaben werden vor der DOM-Insertion durch `esc()` escaped:

```js
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
```

Kein `innerHTML` ohne vorheriges Escaping.

---

## Pull Requests

1. Fork erstellen
2. Feature-Branch anlegen: `git checkout -b feature/mein-feature`
3. Änderungen committen: `git commit -m 'feat: Beschreibung'`
4. Push: `git push origin feature/mein-feature`
5. Pull Request gegen `main` öffnen

Bitte lies [CONTRIBUTING.md](../.github/CONTRIBUTING.md) vor dem ersten PR.

---

## Lizenz

GNU General Public License v3.0 — siehe [LICENSE](../LICENSE).

---

> Ein Projekt von **[nozilla](https://nozilla.de)** — bits & bytes mit ❤
