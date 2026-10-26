<img width="auto" height="150" alt="DatenGraf Logo" src="https://raw.githubusercontent.com/daimpad/datengraf/2801b4cba50ec2c874d1c671005cac0ad8c5bd3b/logo.svg" />

# DatenGraf – der Datenökosystem-Mapper

**DatenGraf** ist ein browserbasiertes, datenbankfreies Werkzeug zur Kartierung und Analyse von Datenflüssen innerhalb von Organisationen. Es unterstützt Datenschutzbeauftragte, Architekten und Analysten dabei, Datenökosysteme sichtbar zu machen – ohne Server, ohne Login, ohne Cloud.

<br>

[![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20JS-420093?style=flat-square&logo=javascript&logoColor=white)](https://github.com/daimpad/DatenGraf)
[![Lizenz](https://img.shields.io/badge/Lizenz-GPL--3.0-420093?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-aktiv-420093?style=flat-square)](https://github.com/daimpad/DatenGraf)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-bereit-420093?style=flat-square&logo=github&logoColor=white)](https://daimpad.github.io/datengraf)
[![Privacy](https://img.shields.io/badge/Privacy-Local--First-420093?style=flat-square&logo=shield&logoColor=white)](https://github.com/daimpad/DatenGraf)
[![Barrierefrei](https://img.shields.io/badge/Barrierefreiheit-WCAG%20AA-420093?style=flat-square)](https://github.com/daimpad/DatenGraf)
[![Tests](https://img.shields.io/badge/Tests-93%20im%20Browser-420093?style=flat-square)](test.html)
[![Zero Server](https://img.shields.io/badge/Zero--Server-100%25%20lokal-black?style=flat-square)](https://nozilla.de)
[![nozilla](https://img.shields.io/badge/by-nozilla-00FF9C?style=flat-square)](https://nozilla.de)

<br>

[**→ Jetzt starten**](https://datengraf.nozilla.net) · [Hintergrund](https://datengraf.nozilla.net/theorie.html) · [Fragen & Antworten](https://datengraf.nozilla.net/faq.html) · [Datenschutz](https://datengraf.nozilla.net/datenschutz.html) · [Sicherheit](SECURITY.md) · [Mitmachen](.github/CONTRIBUTING.md)

---

## Features

### Erfassen & Importieren

| | Feature | Beschreibung |
|---|---|---|
| 🧭 | **Schritt-für-Schritt-Wizard** | Strukturierte Erfassung neuer Datenflüsse in geführten Schritten – mit Duplikat-Erkennung und Validierung (Quelle ≠ Ziel) vor dem Speichern |
| ✏️ | **Bearbeiten & duplizieren** | Einträge direkt in der Listenansicht bearbeiten oder als Vorlage klonen; Doppelklick auf einen Knoten öffnet den Wizard im Bearbeitungsmodus |
| 📥 | **Flexibler CSV-Import** | Einfügen per Paste, Laden per URL oder Dateiupload; Komma, Semikolon und Tabulator werden automatisch erkannt – plus CSV-Vorlage zum Download |
| 👀 | **Import-Vorschau** | Vor dem Übernehmen zeigt eine Tabelle die ersten Zeilen, markiert Pflichtspalten und warnt bei fehlenden Feldern |
| 🪄 | **Normalisierungsprüfung** | Findet uneinheitliche Schreibweisen (`Kämmerei` / `Kaemmerei`, `Uebergibt` / `übergibt`) vor dem Import und vereinheitlicht sie auf Wunsch – sonst würde daraus je ein eigener Knoten |
| ↩️ | **Undo** | `Strg`/`Cmd` + `Z` macht die letzten 20 Datenänderungen rückgängig |

### Visualisieren

| | Feature | Beschreibung |
|---|---|---|
| 🗺️ | **Netzwerkkarte** | Interaktive Graphvisualisierung mit Cytoscape.js – Zoom, Pan, Knoten-Highlight, Vollbild |
| 🔎 | **Knoten-Detailpanel** | Klick auf einen Knoten zeigt alle ein- und ausgehenden Verbindungen sowie Hub-/Gatekeeper-Status |
| 🔦 | **Knotensuche** | Knoten in der Karte per Namenssuche finden und fokussieren (`Strg`/`Cmd` + `F`) |
| 🛤️ | **Pfadfinder** | Kürzesten Pfad zwischen zwei Knoten suchen und hervorheben (A\*-Algorithmus) |
| 🎯 | **Hub- & Gatekeeper-Markierung** | Strukturell kritische Knoten werden farblich markiert und in einer Topologie-Legende erklärt |
| 🎨 | **Org-Farben** | Knoten nach Organisation einfärben mit automatischer Legende |
| 🏛️ | **Org-Hierarchie** | Knoten als Compound-Nodes nach Bereich gruppieren, inklusive Erklärungslegende |
| 📶 | **Häufigkeits-Visualisierung** | Kanten kodieren die Übertragungshäufigkeit über Dicke, Linienstil und Transparenz |
| 🏷️ | **Beziehungs-Legende** | Automatisch aus dem Datensatz erzeugt und klickbar – filtert die Karte auf einen Beziehungstyp |
| 💬 | **Knoten-Tooltip** | Hover zeigt Organisation, Abteilung und Bereich ohne Klick |

### Analysieren

| | Feature | Beschreibung |
|---|---|---|
| 🧠 | **Analyse-Briefing (3 Schichten)** | Regelbasierte Befunde → Snapshot-Differenzanalyse → optionales LLM-Narrativ |
| 📈 | **Vollständigkeits-Score** | Bewertet den Datensatz über fünf gewichtete Kategorien und zeigt gezielt, wo Angaben fehlen |
| 📊 | **Netzwerk-Insights** | Out-/In-Degree, Betweenness Centrality und Community Cluster |
| 🔍 | **Filter-Sidebar** | Filtern nach Beziehungstyp, Schutzbedarf, Erfassungsart, Organisation, Abteilung, Häufigkeit, Format und Freitextsuche – Einstellungen bleiben erhalten |
| 📸 | **Snapshots & Vergleichsbasis** | Datenstände benennen und speichern; Vergleichsbasis für die Diff-Analyse festlegen |
| 🤖 | **KI-Narrativ (opt-in)** | Mit eigenem Anthropic API-Key formuliert Claude ein Netzwerk-Narrativ. Übertragen werden nur Kennzahlen und die Namen der drei größten Hubs – nicht der Datensatz ([Details](SECURITY.md)) |
| 🧪 | **5 Beispieldatensätze** | Wirtschaft, Zivilgesellschaft, Verwaltung, Wissenschaft, Medien – jeweils mit Analyse-Infopanel |

### Teilen & Exportieren

| | Feature | Beschreibung |
|---|---|---|
| 📤 | **Mehrfach-Export** | CSV, PNG- und SVG-Netzwerkbild sowie PDF-Bericht (Stats, Graph, Briefing, Tabelle) |
| 🔗 | **Sharable Link** | Datensatz als komprimierten URL-Hash teilen – kein Backend nötig |
| 🎚️ | **Filterbewusster Export** | Sind Filter aktiv, wird der gefilterte Stand exportiert – nicht versehentlich alles |

### Oberfläche & Grundsätze

| | Feature | Beschreibung |
|---|---|---|
| 🔒 | **Local-First / No-Database** | Alle Daten bleiben im Browser (LocalStorage) – kein Backend, kein Account |
| 🛡️ | **Datenschutz-Dimensionen** | Schutzbedarf (DSGVO-relevant / Intern / Öffentlich), Erfassungsart, Ansprechpartner (Art. 30) |
| 🧭 | **Geführter Rundgang** | 15 Schritte durch alle Bereiche – startet über den Kompass oben, lädt bei Bedarf ein Beispiel und ersetzt nie eigene Daten |
| 🌗 | **Hell & Dunkel** | Umschaltbares Theme, das die Auswahl merkt und beim Erststart der Systemeinstellung folgt |
| ♿ | **Barrierefreiheit** | AA-Kontraste in beiden Themes, Fokusführung in Dialogen, Textalternative zur Karte (siehe unten) |
| 🧯 | **Bibliotheken lokal** | Cytoscape, SVG-Erweiterung und LZ-String liegen im Projekt – die Anwendung läuft auch in Netzen, die CDNs sperren |
| ❓ | **Eigene Inhaltsseiten** | [Hintergrund zur Netzwerkanalyse](https://datengraf.nozilla.net/theorie.html), [Fragen &amp; Antworten](https://datengraf.nozilla.net/faq.html) und [Datenschutz](https://datengraf.nozilla.net/datenschutz.html) als eigenständige, verlinkbare Seiten |
| 📱 | **Mobile-Navigation** | Responsives Layout mit mobilem Menü-Dropdown für Tab-Wechsel und Wizard-Zugang |

---

## Tastenkürzel

| Kürzel | Wirkung |
|---|---|
| `Strg`/`Cmd` + `N` | Wizard öffnen – neuen Datenfluss erfassen |
| `Strg`/`Cmd` + `Z` | Letzte Datenänderung rückgängig machen (bis zu 20 Schritte) |
| `Strg`/`Cmd` + `F` | Knotensuche fokussieren (in der Netzwerkansicht) |
| `Esc` | Offenes Modal oder den Rundgang schließen |
| `→` / `←` | Im Rundgang vor- und zurückblättern |

---

## Quick Start

### Option A – direkt im Browser

```
https://datengraf.nozilla.net
```

Zum Einstieg zeigt der **Rundgang** (Kompass oben rechts oder „Rundgang starten“ unter den Hero-Buttons) in rund zwei Minuten alle Bereiche. Danach: **Beispieldaten entdecken** für einen der 5 Sektordatensätze, oder **Datenfluss erfassen** für eigene Einträge. Die Filter-Sidebar öffnest du über das Menü-Symbol oben rechts.

### Option B – lokal ausführen

```bash
git clone https://github.com/daimpad/DatenGraf.git
cd DatenGraf
python3 -m http.server 8080
# → http://localhost:8080
```

> **Hinweis:** `index.html` muss über HTTP(S) geöffnet werden, damit `fetch()` die CSV-Beispieldaten laden kann. Ein direktes Öffnen als `file://` startet die App leer – CSV-Import per Paste funktioniert jedoch immer.

Die Testsuite erreichst du unter `localhost:8080/test.html` – siehe [Qualitätssicherung](#qualitätssicherung).

### Option C – eigene CSV-Daten verwenden

```
Quelle,QuelleAbteilung,QuelleBereich,QuelleOrganisation,QuelleRolle,
Beziehung,Ziel,ZielOrganisation,Datentyp,Häufigkeit,Format,Schutzbedarf,Erfassungsart,
Anmerkungen,Ansprechpartner
```

`ZielOrganisation` ist nur nötig, wenn der Empfänger einer anderen Organisation angehört oder nirgends selbst als Quelle auftaucht – etwa ein Archiv, eine Aufsichtsbehörde oder ein externer Dienstleister. Ohne die Angabe bliebe ein solcher Akteur ohne Organisationszuordnung und damit farblos in der Org-Ansicht.

Als Trennzeichen werden **Komma, Semikolon und Tabulator** automatisch erkannt – eine aus deutschem Excel exportierte Datei funktioniert also ohne Umwandlung. Ein UTF-8-BOM stört nicht.

Importiere deine Datei über den **CSV-Import-Bereich** (Einfügen / URL / Datei), oder nutze den **Wizard** für die manuelle Einzelerfassung. Eine Vorlage zum kollaborativen Befüllen steht direkt in der App zum Download bereit.

---

## Analyse-Briefing

Das Analyse-Briefing ist das Kernstück der automatischen Netzwerkanalyse und arbeitet in drei Schichten:

**Schicht 1 – Regelbasierte Befunde**
Erkennt automatisch Hubs (Knoten mit überdurchschnittlich vielen Verbindungen), Gatekeeper (hohe Betweenness), isolierte Teilgraphen sowie Lücken in der Dokumentation – fehlende Ansprechpartner bei DSGVO-relevanten Flüssen, fehlende Schutzklasse, fehlender Datentyp, fehlende Organisationsangabe. Jeder Befund ist aufklappbar und nennt betroffene Knoten und eine Empfehlung.

**Schicht 2 – Snapshot-Differenzanalyse**
Vergleicht den aktuellen Datensatz mit einem gespeicherten Snapshot (Vergleichsbasis). Meldet neue und entfallene Verbindungen sowie Knoten, die seit dem letzten Stand zu Hubs oder Gatekeepern geworden sind.

**Schicht 3 – LLM-Narrativ (opt-in)**
Mit einem eigenen Anthropic API-Key (`sk-ant-…`) in den Einstellungen (Zahnrad-Icon) generiert Claude ein deutschsprachiges Fließtext-Narrativ, das den Zustand des Netzwerks einordnet. Der Key wird ausschließlich im Browser-LocalStorage gespeichert und direkt an die Anthropic-API gesendet – kein DatenGraf-Backend ist beteiligt. Ohne Key bleibt ein Template-Narrativ aktiv.

### Vollständigkeits-Score

Ergänzend bewertet ein Score von 0–100, wie belastbar die Dokumentation ist. Er stützt sich auf fünf gewichtete Kategorien – **Datentyp**, **Schutzklasse**, **Organisation**, **Erfassungsart** und **Ansprechpartner (DSGVO Art. 30)** – und schlüsselt auf, in welcher Kategorie wie viele Einträge fehlen.

> Das Briefing bewertet immer den vollständigen Datensatz, nicht die gefilterte Ansicht. Sind Filter aktiv, weist ein Hinweis darauf hin.

---

## Barrierefreiheit

Die Textfarben erfüllen in **beiden Themes** die Kontrastschwellen nach WCAG 2.1 AA (4.5:1 für Fließtext, 3:1 für große Schrift). Geprüft wurde automatisiert über alle sichtbaren Textelemente, inklusive Auflösung transparenter Ebenen.

Dafür trennt das Design-System bewusst zwischen **Flächenfarben** (`--c-success`, `--c-warn`, `--c-danger`) und **Schriftfarben** (`--ink-*`): dieselbe semantische Farbe braucht als Text einen dunkleren beziehungsweise im Dark Mode helleren Wert als für Balken und Punkte. Text auf Akzentflächen nutzt `--on-accent`, das im Dark Mode auf dunkle Tinte umschaltet, weil der Akzent dort hell ist.

**Tastatur und Fokus.** Dialoge übernehmen den Fokus beim Öffnen, halten ihn per Tab und Shift+Tab im Dialog und geben ihn beim Schließen an das auslösende Element zurück. Alle Modals lassen sich mit `Esc` schließen. Statusmeldungen sind als `aria-live`-Region ausgezeichnet und werden von Screenreadern angesagt.

**Struktur.** Jede Seite hat genau eine `h1`, und die Überschriftenebenen laufen ohne Sprung – wer per Überschrift navigiert, bekommt die inhaltliche Gliederung und nicht die Schriftgrößen des Layouts.

**Alternative zur Netzwerkkarte.** Die Karte ist ein Canvas und damit für Screenreader nicht erschließbar. Dieselben Daten stehen deshalb gleichwertig in der **Listenansicht**, und das **Analyse-Briefing** beschreibt alle Befunde als Fließtext. Unter der Karte verweist ein sichtbarer Link direkt auf die Listenansicht – die Karte ist eine visuelle Ergänzung, kein exklusiver Zugang zum Inhalt.

---

## Qualitätssicherung

`test.html` prüft **93 Fälle** über die reinen Funktionen – aufrufbar im Browser unter `localhost:8080/test.html`, ohne Build-Schritt und ohne Abhängigkeiten.

Der Kniff: Die Seite lädt `index.html` unsichtbar in einem Iframe und testet die **echten** Funktionen über `contentWindow`. Es gibt also keine Kopie des Codes, die auseinanderlaufen könnte.

| Bereich | Schwerpunkt |
|---|---|
| **CSV-Parser** | Quotes, `""`-Escapes, CRLF, Zeilenumbrüche im Feld, BOM, leere Zeilen |
| **Trennzeichen** | Erkennung von Komma, Semikolon und Tabulator; Trennzeichen in Anführungszeichen zählen nicht |
| **Export** | Round-Trip `parseCSV(toCSV(x)) === x`, Sonderzeichen, Falsy-Werte |
| **Import-Validierung** | Erkennen unbrauchbarer Dateien vor dem Überschreiben |
| **Normalisierung** | Vergleichsschlüssel, Erkennen abweichender Schreibweisen, Wahl der kanonischen Fassung |
| **Score** | Gewichtung, Grenzfälle, DSGVO-Sonderregel |
| **Graph-Algorithmen** | Betweenness, Label Propagation, Hub-/Gatekeeper-Schwellen |
| **Rundgang** | Jedes Tour-Ziel existiert auf der Seite, Platzierung der Erklärkarte in sieben Lagen |
| **Weiteres** | Snapshot-Diff, Duplikat-Erkennung, XSS-Escaping, Theme-abhängige Graph-Farben |

Ein Test muss nachweislich fehlschlagen können. Beim Anlegen wird deshalb einmal die geprüfte Stelle testweise gebrochen – wenn der Test dann nicht anschlägt, misst er nichts.

Ergänzend läuft vor größeren Änderungen ein Durchgang im echten Browser – zuletzt **345 Prüfungen** in sechs Blöcken:

| Block | Was geprüft wird |
|---|---|
| Struktur, SEO, Links | Canonical und `og:url` deckungsgleich, Titel- und Description-Längen, JSON-LD parst, Sitemap vollständig und ohne tote Ziele, jeder interne Link auflösbar |
| Seiten | Alle vier Seiten in hellem und dunklem Theme, in drei Breiten, ohne horizontalen Überlauf und ohne Konsolenfehler |
| Barrierefreiheit | Eine `h1` je Seite, keine Ebenensprünge, Alternativtexte, Fokusübernahme und -rückgabe in Dialogen |
| Anwendung | Import, Tabs, Filter, alle Netzwerk-Werkzeuge, Knotendetail, Undo, Tastenkürzel, XSS-Nutzdaten durch Liste und Karte |
| Exporte | PNG, SVG, PDF-Bericht und CSV – jeweils von jedem Tab aus, weil der Bericht sonst ein leeres Bild enthalten kann |
| Kontrast | Alle sichtbaren Textelemente auf vier Seiten in zwei Themes, mit Auflösung transparenter Ebenen |

---

## Technischer Stack

| Technologie | Version | Zweck |
|---|---|---|
| **[Cytoscape.js](https://cytoscape.org/)** | 3.23 | Graphvisualisierung, Netzwerkrendering, A\*-Pfadsuche |
| **[cytoscape-svg](https://github.com/kinimesi/cytoscape-svg)** | 0.4 | Vektor-Export der Netzwerkkarte |
| **[LZ-String](https://pieroxy.net/blog/pages/lz-string/index.html)** | 1.5 | URL-sichere Komprimierung für Sharable Links |
| **Vanilla JS** | ES2020+ | Gesamte Anwendungslogik ohne Framework |
| **CSS Custom Properties** | — | Design-System mit Glasmorphismus und Theme-Umschaltung |
| **Inter** | 6.x (lokal) | Schriftart (latin + latin-ext, 400/500/600/700) |
| **Font Awesome** | 6.7.2 (lokal) | Icon-Library (solid, regular, brands) |
| **FileReader API** | — | Lokaler Dateiimport ohne Upload |
| **LocalStorage API** | — | Persistenz ohne Backend |
| **Fetch API** | — | CSV-Import per URL, Beispieldaten, Anthropic API |
| **Clipboard API** | — | Link-Teilen mit Fallback auf `prompt()` |

> Keine Build-Tools, kein npm-Workflow zur Laufzeit, keine Transpiler — nur HTML, CSS und JS.

**Keine fremden Bibliotheken zur Laufzeit.** Cytoscape.js, die SVG-Erweiterung und LZ-String liegen als geprüfte Kopien unter `assets/vendor/`, Inter und Font Awesome unter `assets/fonts/`. Die Anwendung lädt keinen Programmcode von fremden Servern – sie funktioniert damit auch in Netzen, die CDNs sperren. Sollte eine Bibliothek dennoch fehlen, erklärt die App das und arbeitet mit Liste, Insights und Briefing weiter.

Einzige externe Verbindung im Normalbetrieb ist die cookiefreie Reichweitenmessung über GoatCounter; sie zählt den Seitenaufruf, nicht Ihre Daten, und ist `async` eingebunden – ein blockierter Aufruf beeinträchtigt nichts. Details in der [Sicherheitsrichtlinie](SECURITY.md).

Zum Aktualisieren der Vendor-Dateien dient `npm run vendor`; zur Laufzeit wird nichts installiert.

### Persistenz im Browser

| Schlüssel | Inhalt |
|---|---|
| `datengraf_data` | Aktueller Datensatz |
| `datengraf_snap_*` | Benannte Snapshots |
| `datengraf_baseline` | Aktive Vergleichsbasis |
| `datengraf_filters` | Persistierte Filter-Einstellungen |
| `datengraf_theme` | Hell/Dunkel-Auswahl |
| `datengraf_api_key` | Anthropic API-Key (nur bei opt-in) |

---

## Algorithmen

<details>
<summary><strong>Gradzentralität (Degree Centrality)</strong></summary>

Der **Out-Degree** eines Knotens *v* gibt an, wie viele Datenflüsse von ihm ausgehen – ein Maß für seine Rolle als *Datenproduzent*. Der **In-Degree** misst die eingehenden Flüsse und identifiziert *Datensammler*:

```
C_D(v) = deg(v) / (|V| - 1)
```

</details>

<details>
<summary><strong>Betweenness Centrality (Brandes 2001)</strong></summary>

Misst, wie häufig ein Knoten *v* auf dem kürzesten Pfad zwischen zwei anderen Knoten liegt. Hohe Werte markieren *Flaschenhälse* und *Gatekeeper*:

```
C_B(v) = Σ (σ_st(v) / σ_st)   für alle s ≠ v ≠ t
```

</details>

<details>
<summary><strong>Community Detection (Label Propagation, Raghavan et al. 2007)</strong></summary>

Zur Erkennung von *Datensilos*: Jeder Knoten übernimmt iterativ das häufigste Label seiner Nachbarn, bis das Netzwerk in stabile Gemeinschaften konvergiert.

</details>

<details>
<summary><strong>Komponentenanalyse (BFS)</strong></summary>

Eine Breitensuche über den ungerichteten Graphen findet Teilgraphen ohne Verbindung zum Hauptnetz. Solche *isolierten Inseln* deuten auf Datensilos oder unvollständige Erfassung hin und erscheinen als eigener Befund im Briefing.

</details>

<details>
<summary><strong>Kürzester Pfad (A*, Cytoscape.js)</strong></summary>

Der Pfadfinder nutzt den A\*-Algorithmus von Cytoscape.js (`cy.elements().aStar()`) auf dem gerichteten Graphen. Gefundene Pfade werden grün hervorgehoben; alle anderen Knoten werden ausgeblendet.

</details>

---

## Dateistruktur

```
DatenGraf/
├── index.html                        # Einstiegspunkt – HTML-Struktur
├── css/
│   └── styles.css                    # Styles & Design-Tokens (~3230 Zeilen)
├── js/
│   └── app.js                        # Gesamte Anwendungslogik (~3420 Zeilen)
├── assets/
│   ├── vendor/
│   │   ├── cytoscape.min.js          # Cytoscape.js 3.23.0 (lokal, kein CDN)
│   │   ├── cytoscape-svg.js          # SVG-Export-Erweiterung 0.4.0
│   │   └── lz-string.min.js          # LZ-String 1.5.0 (lokal, kein CDN)
│   └── fonts/
│       ├── fa/all.min.css            # Font Awesome 6.7.2 CSS
│       ├── webfonts/                 # Font Awesome woff2-Dateien (solid/regular/brands)
│       └── inter/                    # Inter-Schriftdateien (woff2) + inter.css
├── data/
│   ├── template.csv                  # Leere Vorlage für eigene Erfassung
│   ├── sample-wirtschaft.csv         # Beispiel: Globex Handels GmbH
│   ├── sample-zivilgesellschaft.csv  # Beispiel: Nachbarschaftshilfe e.V.
│   ├── sample-verwaltung.csv         # Beispiel: Stadtverwaltung Musterstadt
│   ├── sample-wissenschaft.csv       # Beispiel: Institut für Klimaforschung
│   └── sample-medien.csv             # Beispiel: Tagesblatt Regional GmbH
├── theorie.html                      # Hintergrund zur Netzwerkanalyse (6 Muster)
├── datenschutz.html                  # Datenschutzerklärung (Local Storage, GoatCounter, KI-Opt-in)
├── faq.html                          # Fragen & Antworten (FAQPage-Schema)
├── test.html                         # Testsuite (im Browser aufrufbar, kein Build nötig)
├── docs/
│   ├── design-system.html            # Interaktive Referenz aller Design-Tokens
│   ├── Features.md                   # Feature-Dokumentation
│   ├── Algorithmen.md                # Vertiefung der Analyseverfahren
│   ├── CSV-Format.md                 # Spaltenreferenz
│   ├── Installation.md               # Einrichtung
│   ├── Konfiguration.md              # Konfigurationsoptionen
│   ├── Entwicklung.md                # Entwicklungshinweise
│   ├── FAQ.md                        # Häufige Fragen
│   └── Home.md                       # Wiki-Startseite
├── .github/
│   ├── workflows/
│   │   ├── static.yml                # GitHub Pages Deployment
│   │   └── main.yml                  # FTP-Deployment
│   └── CONTRIBUTING.md               # Beitragsrichtlinien
├── robots.txt                        # Crawler-Regeln + Sitemap-Verweis
├── sitemap.xml                       # Sitemap
├── social-preview.svg                # Vorschaubild für Social Media (Open Graph)
├── site.webmanifest                  # PWA-Manifest
├── CLAUDE.md                         # AI-Entwicklungs-Kontext & Architektur
├── DOCS.md                           # Technische Dokumentation
├── SECURITY.md                       # Sicherheitsrichtlinie
├── LICENSE                           # GPL-3.0
└── README.md                         # Diese Datei
```

---

## Weiter mit deinen Daten

DatenGraf beantwortet, **wie** die Datenflüsse einer Organisation aussehen und wo die Schwachstellen liegen. Für die Schritte danach gibt es zwei Anschlusswerkzeuge:

- **[Datenatlas](https://datenatlas.de)** – Inspiration, welche Daten sich sektorspezifisch veröffentlichen lassen.
- **[DatenLotse](https://datenlotse.nozilla.net)** – führt von der fertigen Kartierung in die Umsetzung: Dateninventar nach DCAT-AP.de, Risiko-Clearing und datenschutzkonforme Aufbereitung.

---

## Lizenz

Dieses Projekt steht unter der [GNU General Public License v3.0](LICENSE).

---

<div align="center">

Ein Projekt von **[nozilla](https://nozilla.de)** — bits & bytes mit ❤

</div>
