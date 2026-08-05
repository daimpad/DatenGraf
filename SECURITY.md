# Security Policy – DatenGraf

## Datenschutz-Grundsatz: Local-First

**DatenGraf** ist eine **vollständig browserbasierte Anwendung ohne Backend**. Das hat direkte Sicherheitsimplikationen:

- **Ihre Daten verlassen das Gerät nicht.** Alle importierten CSV-Daten, alle über den Wizard erfassten Einträge und alle gespeicherten Zustände verbleiben ausschließlich im Browser (LocalStorage). Ausnahmen sind ausschließlich die beiden unten beschriebenen Funktionen, die der Nutzer aktiv auslöst.
- **Kein Server, keine Datenbank, kein Account.** Es existiert keine serverseitige Komponente, die Nutzerdaten empfangen oder speichern könnte.
- **Alle Bibliotheken lokal.** Seit v62 werden Cytoscape.js, cytoscape-svg, LZ-String sowie die Schriften Inter und Font Awesome aus dem Projekt selbst ausgeliefert. Keine CDN-Aufrufe, keine Google Fonts.
- **Reichweitenmessung ohne Cookies.** Die Seite zählt Aufrufe über [GoatCounter](https://www.goatcounter.com/). Gemessen wird der **Seitenaufruf**, nicht Ihr Datensatz — dazu unten mehr.

### Reichweitenmessung (GoatCounter)

Eingebunden ist ein asynchrones Zählskript von `gc.zgo.at`, das einen Aufruf an `datengraf.goatcounter.com` sendet. **Ihre Daten sind davon nicht berührt:** Gezählt wird der Seitenaufruf, nicht der Inhalt der Anwendung. Importierte CSV-Dateien, erfasste Datenflüsse und gespeicherte Zustände verlassen den Browser weiterhin nicht.

Erhoben werden laut [GoatCounter-Datenschutzerklärung](https://www.goatcounter.com/help/privacy): aufgerufene URL, Referrer, Browser und Betriebssystem, ungefähre Bildschirmgröße sowie das aus der IP abgeleitete Land. **Es werden keine Cookies gesetzt und keine IP-Adressen gespeichert.** Zur Unterscheidung wiederkehrender Aufrufe dient ein täglich wechselnder Hash, der nicht zurückgerechnet werden kann.

Das Skript ist `async` eingebunden. Blockiert ein Netz oder ein Browser-Add-on den Aufruf, funktioniert die Anwendung unverändert — die Zählung entfällt dann einfach.

Wer die Messung nicht wünscht, kann `gc.zgo.at` blockieren oder „Do Not Track" aktivieren; GoatCounter respektiert das Signal.

---

### Die beiden Ausnahmen

**1. CSV-Import per URL.** Gibt der Nutzer aktiv eine URL ein, wird diese per `fetch()` geladen. Die Anfrage geht vom Browser des Nutzers aus, nicht von einem Server.

**2. KI-Narrativ (standardmäßig aus).** Hinterlegt der Nutzer in den Einstellungen einen eigenen Anthropic-API-Key, sendet die Anwendung beim Erzeugen des Analyse-Briefings eine Anfrage direkt an `api.anthropic.com`. Übertragen wird bewusst datensparsam **nicht der Datensatz**, sondern nur:

| Feld | Inhalt |
|---|---|
| `nodeCount`, `edgeCount` | Anzahl Akteure und Datenflüsse |
| `dsgvoCount` | Anzahl DSGVO-relevanter Flüsse |
| `topHubs` | **Namen der drei Akteure mit den meisten ausgehenden Flüssen**, je mit Anzahl |
| `findingTypes` | Typen der erkannten Befunde (z. B. `hub`, `gatekeeper`) |
| `completenessScore`, `completenessGaps` | Score und Bezeichnungen der Lücken-Kategorien |

**Der Eintrag `topHubs` enthält Klartext-Namen aus Ihrem Datensatz** (etwa „Bürgermeisterbüro"). Wer das vermeiden will, lässt das Feld für den API-Key leer – dann bleibt das Template-Narrativ aktiv und es wird keine Anfrage gestellt. Der Key selbst wird ausschließlich im LocalStorage abgelegt und an keine andere Stelle als Anthropic gesendet.

---

## Unterstützte Versionen

Sicherheitsupdates werden ausschließlich für die aktuelle Version im `main`-Branch bereitgestellt.

| Version | Support |
|---|---|
| `main` (aktuell) | Aktiv |
| Ältere Commits | Kein Support |

---

## Bekannte Angriffsflächen

### XSS via CSV-Parser

Da Datengraf beliebige CSV-Dateien einliest und deren Inhalt als HTML rendert, ist **Cross-Site Scripting (XSS)** die relevanteste Angriffsfläche. Alle Werte werden vor dem Einfügen in den DOM durch die Funktion `esc()` in `js/app.js` escaped:

```js
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

Das Escapen von `"` deckt auch Attribut-Injection in dynamisch erzeugtem HTML ab. Die Abdeckung wird durch automatisierte Tests geprüft: `test.html` enthält Fälle für `esc()`, und die Regressionsläufe schleusen Nutzdaten mit `<img onerror>`, `<svg onload>` und Tabellen-Ausbruchsversuchen durch Listenansicht, Netzwerk, Insights, Analyse-Briefing, Knotendetail und PDF-Bericht.

Trotzdem könnten Bypässe existieren, etwa durch:
- Nicht gecoverte DOM-Einfüge-Pfade (z. B. `innerHTML` ohne `esc()`)
- Attribut-Injection in dynamisch generiertem HTML
- Prototype-Pollution beim CSV-Parsing

### URL-Import

Eine vom Nutzer eingegebene URL wird per `fetch()` geladen. Da CORS den Abruf beliebiger URLs einschränkt, ist das Angriffspotenzial begrenzt. Dennoch könnten lokal erreichbare Adressen (`localhost`, `192.168.x.x`) angefragt werden, wenn der Nutzer dazu verleitet wird.

---

## Sicherheitslücke melden

Bitte melden Sie Sicherheitsprobleme **nicht** als öffentliches GitHub-Issue.

**Kontakt:** contact@nozilla.de

Bitte senden Sie folgende Informationen:

1. **Beschreibung** der Schwachstelle
2. **Reproduktionsschritte** (minimales CSV-Beispiel, Browser und Version)
3. **Mögliche Auswirkung** (welche Daten könnten betroffen sein?)
4. Optional: einen Vorschlag zur Behebung

Sie erhalten innerhalb von **5 Werktagen** eine Antwort. Öffentliche Bekanntmachung wird nach Abstimmung und Bereitstellung eines Fixes koordiniert (Responsible Disclosure).

---

## Nicht im Scope

Folgende Punkte sind **kein** Sicherheitsproblem im Kontext dieser Anwendung:

- Daten, die ein Nutzer bewusst selbst in das Tool eingibt (keine fremden Daten involviert)
- Fehlende HTTPS-Erzwingung (liegt beim Hosting-Anbieter)
- Fehlende Rate-Limits (kein Server vorhanden)
- Content Security Policy (CSP) des Hosting-Anbieters
