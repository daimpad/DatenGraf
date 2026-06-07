<img width="auto" height="150" alt="DatenGraf Logo" src="https://raw.githubusercontent.com/daimpad/datengraf/2801b4cba50ec2c874d1c671005cac0ad8c5bd3b/logo.svg" />

# DatenGraf – der Datenökosystem-Mapper

**DatenGraf** ist ein browserbasiertes, datenbankfreies Werkzeug zur Kartierung und Analyse von Datenflüssen innerhalb von Organisationen. Es unterstützt Datenschutzbeauftragte, Architekten und Analysten dabei, Datenökosysteme sichtbar zu machen – ohne Server, ohne Login, ohne Cloud.
<br>

[![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20JS-420093?style=flat-square&logo=javascript&logoColor=white)](https://github.com/daimpad/DatenGraf)
[![Lizenz](https://img.shields.io/badge/Lizenz-GPL--3.0-420093?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-aktiv-420093?style=flat-square)](https://github.com/daimpad/DatenGraf)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-bereit-420093?style=flat-square&logo=github&logoColor=white)](https://daimpad.github.io/datengraf)
[![Privacy](https://img.shields.io/badge/Privacy-Local--First-420093?style=flat-square&logo=shield&logoColor=white)](https://github.com/daimpad/DatenGraf)
[![Zero Server](https://img.shields.io/badge/Zero--Server-100%25%20lokal-black?style=flat-square)](https://nozilla.de)
[![nozilla](https://img.shields.io/badge/by-nozilla-00FF9C?style=flat-square)](https://nozilla.de)

<br>

[**→ Jetzt starten**](https://datengraf.nozilla.net) · [Sicherheit](SECURITY.md) · [Mitmachen](.github/CONTRIBUTING.md)

---

## Features

| | Feature | Beschreibung |
|---|---|---|
| 🧭 | **Schritt-für-Schritt-Wizard** | Strukturierte Erfassung neuer Datenflüsse in 4 geführten Schritten – mit Duplikat-Erkennung vor dem Speichern |
| ✏️ | **Einträge bearbeiten & duplizieren** | Bestehende Datenflüsse direkt in der Listenansicht bearbeiten oder als Vorlage für neue klonen |
| 🗺️ | **Netzwerkkarte** | Interaktive Graphvisualisierung mit Cytoscape.js – Zoom, Pan, Knoten-Highlight, Vollbild |
| 🔎 | **Knoten-Detailpanel** | Klick auf einen Knoten zeigt alle ein- und ausgehenden Verbindungen als Panel im Netzwerk |
| 🛤️ | **Pfadfinder** | Kürzesten Pfad zwischen zwei Knoten suchen und grün hervorheben (A*-Algorithmus) |
| 🎨 | **Org-Farben** | Knoten nach Organisation einfärben mit automatischer Legende (10-Farben-Palette) |
| 📊 | **Netzwerk-Insights** | Automatische Berechnung von Out-/In-Degree, Betweenness Centrality und Community Clusters |
| 🔍 | **Filter-Sidebar** | Dynamisches Filtern nach Beziehungstyp, Schutzbedarf, Erfassungsart, Organisation, Häufigkeit u. v. m. |
| 🧪 | **5 Beispieldatensätze** | Wirtschaft, Zivilgesellschaft, Verwaltung, Wissenschaft, Medien – jeweils mit Analyse-Infopanel |
| 📥 | **Flexibler CSV-Import** | Einfügen per Paste, Laden per URL oder lokaler Dateiupload – plus CSV-Vorlage zum Download |
| 📤 | **Mehrfach-Export** | CSV-Export, PNG/SVG-Netzwerkbild, PDF-Bericht (mit Stats, Graph und Tabelle) |
| 🔗 | **Sharable Link** | Datensatz als komprimierten URL-Hash teilen – kein Backend nötig |
| 🛡️ | **Datenschutz-Dimensionen** | Schutzbedarf (DSGVO-relevant / Intern / Öffentlich) und Erfassungsart (Manuell / Automatisiert) |
| 🔒 | **Local-First / No-Database** | Alle Daten bleiben im Browser (LocalStorage) – kein Backend, kein Account erforderlich |

---

## Quick Start

### Option A – direkt im Browser

```
https://datengraf.nozilla.net
```

Klicken Sie auf **Beispieldaten laden**, wählen Sie einen der 5 Sektordatensätze, oder nutzen Sie **Datenfluss erfassen** für manuelle Einträge. Die Filter-Sidebar ist über das Menü-Symbol oben links erreichbar.

### Option B – lokal ausführen

```bash
git clone https://github.com/daimpad/DatenGraf.git
cd DatenGraf
python3 -m http.server 8080
# → http://localhost:8080
```

> **Hinweis:** `index.html` muss über HTTP(S) geöffnet werden, damit `fetch()` die CSV-Beispieldaten laden kann. Ein direktes Öffnen als `file://` startet die App leer – CSV-Import per Paste funktioniert jedoch immer.

### Option C – eigene CSV-Daten verwenden

```
Quelle,QuelleAbteilung,QuelleBereich,QuelleOrganisation,QuelleRolle,
Beziehung,Ziel,Datentyp,Häufigkeit,Format,Schutzbedarf,Erfassungsart,Anmerkungen
```

Importieren Sie Ihre Datei über den **CSV-Import-Bereich** (Einfügen / URL / Datei), oder nutzen Sie den **Wizard** für die manuelle Einzelerfassung. Eine Vorlage zum kollaborativen Befüllen (Google Sheets / Excel) steht direkt in der App zum Download bereit.

---

## Technischer Stack

| Technologie | Zweck |
|---|---|
| **[Cytoscape.js](https://cytoscape.org/)** v3.23 | Graphvisualisierung, Netzwerkrendering, A*-Pfadsuche |
| **[LZ-String](https://pieroxy.net/blog/pages/lz-string/index.html)** v1.5 | URL-sichere Komprimierung für Sharable Links |
| **Vanilla JS** (ES2020+) | Gesamte Anwendungslogik ohne Framework |
| **CSS Custom Properties** | Design-System mit Glasmorphismus-Effekten |
| **Inter Font** | Moderne Schriftart (Google Fonts) |
| **Font Awesome 6.4** | Icon-Library |
| **FileReader API** | Lokaler Dateiimport ohne Upload |
| **LocalStorage API** | Persistenz ohne Backend |
| **Fetch API** | CSV-Import per URL und Beispieldaten |
| **Clipboard API** | Link-Teilen mit Fallback auf `prompt()` |

> Keine Build-Tools, kein npm-Workflow zur Laufzeit, keine Transpiler — nur HTML, CSS und JS.

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
<summary><strong>Kürzester Pfad (A*, Cytoscape.js)</strong></summary>

Der Pfadfinder nutzt den A*-Algorithmus von Cytoscape.js (`cy.elements().aStar()`) auf dem gerichteten Graphen. Gefundene Pfade werden grün hervorgehoben; alle anderen Knoten werden ausgeblendet.

</details>

---

## Dateistruktur

```
DatenGraf/
├── index.html                      # Einstiegspunkt – HTML-Struktur
├── css/
│   └── styles.css                  # Styles & Design-Tokens
├── js/
│   └── app.js                      # Gesamte Anwendungslogik
├── data/
│   ├── template.csv                # Leere Vorlage für eigene Erfassung
│   ├── sample-wirtschaft.csv       # Beispiel: Globex Handels GmbH
│   ├── sample-zivilgesellschaft.csv# Beispiel: Nachbarschaftshilfe e.V.
│   ├── sample-verwaltung.csv       # Beispiel: Stadtverwaltung Musterstadt
│   ├── sample-wissenschaft.csv     # Beispiel: Institut für Klimaforschung
│   └── sample-medien.csv           # Beispiel: Tagesblatt Regional GmbH
├── .github/
│   ├── workflows/
│   │   └── static.yml              # GitHub Pages Deployment
│   └── CONTRIBUTING.md             # Beitragsrichtlinien
├── SECURITY.md                     # Sicherheitsrichtlinie
├── LICENSE                         # GPL-3.0
└── README.md                       # Diese Datei
```

---

## Lizenz

Dieses Projekt steht unter der [GNU General Public License v3.0](LICENSE).

---

<div align="center">

Ein Projekt von **[nozilla](https://nozilla.de)** — bits & bytes mit ❤

</div>
