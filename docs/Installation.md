# Installation & Quick Start

← [Zurück zur Übersicht](Home.md)

---

## Option A – direkt im Browser (GitHub Pages)

Keine Installation nötig:

```
https://daimpad.github.io/datengraf
```

Beim Start erscheint die Hero-Sektion. Klicke auf:
- **Beispieldaten laden** – Demo-Datensatz mit 32 Datenflüssen laden
- **Datenfluss erfassen** – Eigene Daten manuell im Wizard eingeben

Die Filter-Sidebar ist standardmäßig versteckt und wird über das ☰ Menü-Symbol oben links geöffnet.

---

## Option B – lokal ausführen

### Voraussetzungen
- Git
- Python 3 (oder beliebiger HTTP-Server)

### Schritte

```bash
git clone https://github.com/daimpad/DatenGraf.git
cd DatenGraf
python3 -m http.server 8080
# → http://localhost:8080
```

> **Wichtig:** `index.html` muss über HTTP(S) geöffnet werden. Ein direktes Öffnen als `file://` startet die App leer (die Fetch-API funktioniert nicht ohne Server). CSV-Import per Paste funktioniert jedoch immer.

---

## Option C – eigene CSV-Daten

Siehe [CSV-Format](CSV-Format.md) für das vollständige Schema.

Import-Methoden:
- **Einfügen (Paste)** – CSV-Text direkt in das Textfeld einfügen
- **URL** – z. B. `raw.githubusercontent.com`-Link eingeben
- **Datei** – `.csv`-Datei per Drag & Drop oder Dateiauswahl

---

## Browser-Kompatibilität

| Browser | Unterstützt |
|---|---|
| Chrome / Edge (aktuell) | ✅ |
| Firefox (aktuell) | ✅ |
| Safari (aktuell) | ✅ |
| Internet Explorer 11 | ❌ |
