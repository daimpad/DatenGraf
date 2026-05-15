# Features

← [Zurück zur Übersicht](Home.md)

---

## Schritt-für-Schritt-Wizard

Der Wizard führt in **4 Schritten** durch die Erfassung eines neuen Datenflusses:

1. **Quelle** – Name, Abteilung, Bereich, Organisation und Rolle des sendenden Akteurs
2. **Ziel & Beziehung** – Zielakteur und Art des Datenflusses
3. **Metadaten** – Datentyp, Häufigkeit, Format und Anmerkungen
4. **Datenschutz** – Schutzbedarf und Erfassungsart

---

## Netzwerkkarte

Interaktive Graphvisualisierung mit **Cytoscape.js**:

| Aktion | Beschreibung |
|---|---|
| Mausrad / Touchpad | Zoom |
| Drag auf Canvas | Verschieben (Pan) |
| Klick auf Knoten | Knoten und Verbindungen hervorheben |
| **Layout neu** | COSE-Layout neu berechnen |
| **⛶ Vollbild** | Vollbildmodus |

Knotenfarben basieren auf der Grad-Zentralität; Kantenfarben zeigen den Beziehungstyp.

---

## Netzwerk-Insights

Sechs automatisch berechnete Analyse-Karten:

| Karte | Beschreibung |
|---|---|
| **Top Datenproduzenten** | Knoten mit höchstem Out-Degree |
| **Top Datensammler** | Knoten mit höchstem In-Degree |
| **Flaschenhälse / Gatekeeper** | Betweenness Centrality nach Brandes (2001) |
| **Datensilos / Cluster** | Community Detection per Label Propagation |
| **Schutzbedarf-Verteilung** | Anteil DSGVO / Intern / Öffentlich |
| **Erfassungsart-Verteilung** | Anteil Manuell / Automatisiert |

---

## Filter-Sidebar

Die einklappbare Sidebar filtert alle drei Ansichten in Echtzeit:

| Filter | Typ |
|---|---|
| Beziehungstyp | Chips (Mehrfachauswahl) |
| Schutzbedarf | Chips (Mehrfachauswahl) |
| Erfassungsart | Chips (Mehrfachauswahl) |
| Organisation | Dropdown |
| Abteilung | Dropdown |
| Häufigkeit | Dropdown |
| Format | Dropdown |
| Suche | Textfeld (Akteur-Namen) |

---

## CSV-Import

| Methode | Beschreibung |
|---|---|
| **Einfügen** | CSV-Text direkt ins Textfeld kopieren |
| **URL** | Externe CSV-URL laden (z. B. GitHub Raw) |
| **Datei** | Lokale `.csv`-Datei per Drag & Drop |
| **Append-Modus** | Zu vorhandenen Daten hinzufügen ohne Überschreiben |

---

## Datenpersistenz

| Aktion | Beschreibung |
|---|---|
| **Im Browser speichern** | Daten im LocalStorage ablegen |
| **Aus Browser laden** | Gespeicherten Zustand wiederherstellen |
| **CSV exportieren** | Alle Daten als `.csv` herunterladen |
