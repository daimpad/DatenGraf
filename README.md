# DatenGraf — der Datenökosystem-Mapper

![DatenGraf Logo](logo.svg)

**DatenGraf** ist ein browserbasiertes, datenbankfreies Werkzeug zur interaktiven Kartierung und Analyse von Datenflüssen innerhalb von Organisationen. Es unterstützt Datenschutzbeauftragte, Architekten und Analysten dabei, Datenökosysteme sichtbar zu machen – ohne Server, ohne Login, ohne Cloud. Die moderne Benutzeroberfläche mit Glasmorphismus-Design und eleganten Animationen macht die Analyse intuitiv und angenehm.

[![HTML/JS](https://img.shields.io/badge/stack-HTML%20%2F%20JS-informational?logo=javascript)](https://github.com/daimpad/datengraf)
[![Lizenz](https://img.shields.io/badge/Lizenz-GPL--3.0-blue)](LICENSE)
[![Status](https://img.shields.io/badge/Status-aktiv-brightgreen)]()
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-bereit-blueviolet?logo=github)](https://daimpad.github.io/datengraf)

---

## Features

| Feature | Beschreibung |
|---|---|
| **Moderne UI** | Elegantes Glasmorphismus-Design mit Violett-Accent (#420093), Inter-Schriftart und weichen Schatten für professionelle Ästhetik |
| **Schritt-für-Schritt-Wizard** | Strukturierte Erfassung neuer Datenflüsse in 4 geführten Schritten inkl. DSGVO-Schutzbedarf und Erfassungsart |
| **Netzwerkkarte** | Interaktive Graphvisualisierung mit Cytoscape.js – zoom, pan, Knoten-Highlight, Vollbild mit abgestimmten Farbtönen |
| **Netzwerk-Insights** | Automatische Berechnung von Out-/In-Degree, Betweenness Centrality und Community Clusters mit Echtzeit-Metriken |
| **Filter-Sidebar** | Einklappbar versteckt, dynamisches Filtern nach Beziehungstyp, Schutzbedarf, Erfassungsart, Organisation, Häufigkeit u. v. m. |
| **Flexibler CSV-Import** | Einfügen per Paste, Laden per URL (z. B. `raw.githubusercontent.com`) oder lokaler Dateiupload mit Drag & Drop |
| **Local-First / No-Database** | Alle Daten bleiben im Browser (LocalStorage) – kein Backend, kein Account erforderlich |
| **CSV-Export** | Alle erfassten Datenflüsse jederzeit als CSV herunterladen oder im Browser speichern |
| **Datenschutz-Dimensionen** | Jeder Datenfluss trägt Schutzbedarf (DSGVO-relevant / Intern / Öffentlich) und Erfassungsart (Manuell / Automatisiert) |

---

## Quick Start

### Option A – direkt im Browser (GitHub Pages)

Öffnen Sie einfach die bereitgestellte GitHub-Pages-URL:

```
https://daimpad.github.io/datengraf
```

Beim Start wird eine elegante Hero-Sektion angezeigt. Klicken Sie auf **Beispieldaten laden**, um den enthaltenen Datensatz zu importieren, oder nutzen Sie **Datenfluss erfassen**, um manuelle Einträge zu erfassen. Die Sidebar mit Filtern ist standardmäßig versteckt – öffnen Sie sie über das Menu-Symbol oben links.

### Option B – lokal ausführen

```bash
git clone https://github.com/daimpad/datengraf.git
cd datengraf
python3 -m http.server 8080
# → http://localhost:8080
```

> **Hinweis:** `index.html` muss über HTTP(S) geöffnet werden, damit `fetch()` die CSV-Beispieldaten laden kann. Ein direktes Öffnen als `file://` startet die App leer – CSV-Import per Paste funktioniert jedoch immer.

### Option C – eigene CSV-Daten verwenden

Das CSV-Format ist:

```
Quelle,QuelleAbteilung,QuelleBereich,QuelleOrganisation,QuelleRolle,
Beziehung,Ziel,Datentyp,Häufigkeit,Format,Schutzbedarf,Erfassungsart,Anmerkungen
```

Importieren Sie Ihre Datei über den **CSV-Import-Bereich** (Einfügen / URL / Datei), oder nutzen Sie den **Wizard** für die manuelle Einzelerfassung.

---

## Technischer Stack

| Technologie | Zweck |
|---|---|
| **[Cytoscape.js](https://cytoscape.org/)** v3.23 | Graphvisualisierung und Netzwerkrendering mit abgestimmtem Farbschema |
| **Vanilla JS** (ES2020+) | Gesamte Anwendungslogik ohne Framework |
| **CSS Custom Properties** | Design-System mit Tokens für Farben, Abstände, Radien, Schatten und Glasmorphismus-Effekte |
| **[Inter Font](https://fonts.google.com/specimen/Inter)** (Google Fonts) | Moderne, lesbare Schriftart für professionelle Benutzeroberfläche |
| **Glasmorphismus** (`backdrop-filter: blur()`) | Moderne visuelle Effekte auf Sidebar, Topbar und Panels |
| **FileReader API** | Lokaler Dateiimport ohne Upload |
| **LocalStorage API** | Persistenz ohne Backend |
| **Fetch API** | CSV-Import per URL |
| **Font Awesome 6.4.0** | Professionelle Icon-Library für UI-Icons |

Keine Build-Tools, keine npm-Abhängigkeiten, keine Transpiler – das gesamte Projekt besteht aus einer HTML-Seite plus CSS und JS.

---

## Wissenschaftliche Hintergründe

### Netzwerktopologie

Datengraf modelliert Organisationen als gerichtete Graphen *G = (V, E)*, wobei Knoten *V* Akteure (Systeme, Abteilungen, Personen) und Kanten *E* Datenflüsse repräsentieren. Diese Darstellung ermöglicht es, strukturelle Eigenschaften des Datenökosystems sichtbar zu machen.

### Gradzentralität (Degree Centrality)

Der **Out-Degree** eines Knotens *v* gibt an, wie viele Datenflüsse von ihm ausgehen – ein Maß für seine Rolle als *Datenproduzent*. Der **In-Degree** misst die eingehenden Flüsse und identifiziert *Datensammler*. Formal:

```
C_D(v) = deg(v) / (|V| - 1)
```

### Betweenness Centrality

Die Betweenness Centrality nach **Brandes (2001)** misst, wie häufig ein Knoten *v* auf dem kürzesten Pfad zwischen zwei anderen Knoten liegt:

```
C_B(v) = Σ (σ_st(v) / σ_st)   für alle s ≠ v ≠ t
```

Knoten mit hoher Betweenness sind *Flaschenhälse* oder *Gatekeeper* – kritische Schaltstellen im Datenfluss, deren Ausfall oder Überlastung das gesamte Ökosystem beeinträchtigen kann.

### Community Detection (Label Propagation)

Zur Erkennung von *Datensilos* verwendet Datengraf den **Label-Propagation-Algorithmus** (Raghavan et al., 2007). Jeder Knoten übernimmt iterativ das häufigste Label seiner Nachbarn, bis das Netzwerk in stabile Gemeinschaften konvergiert. Diese Cluster repräsentieren Gruppen von Akteuren, die überwiegend untereinander Daten austauschen.

### Referenzen

- Brandes, U. (2001). *A faster algorithm for betweenness centrality.* Journal of Mathematical Sociology, 25(2), 163–177.
- Raghavan, U. N., Albert, R., & Kumara, S. (2007). *Near linear time algorithm to detect community structures in large-scale networks.* Physical Review E, 76(3).
- Newman, M. E. J. (2010). *Networks: An Introduction.* Oxford University Press.

---

## Dateistruktur

```
datengraf/
├── index.html          # Einstiegspunkt – nur HTML-Struktur
├── css/
│   └── styles.css      # Styles & Design-Tokens
├── js/
│   └── app.js          # Gesamte Anwendungslogik
├── data/
│   └── sample.csv      # Beispiel-Datensatz
├── .github/
│   └── CONTRIBUTING.md # Beitragsrichtlinien
├── DOCS.md             # Technische Dokumentation
├── LICENSE             # GPL-3.0
└── README.md           # Diese Datei
```

---

## Lizenz

Dieses Projekt steht unter der [GNU General Public License v3.0](LICENSE).
