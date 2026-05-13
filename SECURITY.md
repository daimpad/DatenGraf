# Security Policy

## Datenschutz-Grundsatz: Local-First

Datengraf ist eine **vollständig browserbasierte Anwendung ohne Backend**. Das hat direkte Sicherheitsimplikationen:

- **Keine Daten verlassen Ihr Gerät.** Alle importierten CSV-Daten, alle über den Wizard erfassten Einträge und alle gespeicherten Zustände verbleiben ausschließlich im Browser (LocalStorage des Nutzers).
- **Kein Server, keine Datenbank, kein Account.** Es existiert keine serverseitige Komponente, die Nutzerdaten empfangen oder speichern könnte.
- **Kein Tracking, keine Telemetrie.** Die Anwendung sendet keinerlei Anfragen an Dritte – mit Ausnahme des CDN-Aufrufs für Cytoscape.js (`cdnjs.cloudflare.com`) beim ersten Laden.
- **CSV per URL-Import.** Wenn der Nutzer aktiv eine externe URL eingibt, wird diese per `fetch()` geladen. Die Anfrage geht vom Browser des Nutzers aus – nicht von einem Server.

---

## Unterstützte Versionen

Sicherheitsupdates werden ausschließlich für die aktuelle Version im `main`-Branch bereitgestellt.

| Version | Support |
|---|---|
| `main` (aktuell) | ✅ Aktiv |
| Ältere Commits | ❌ Kein Support |

---

## Bekannte Angriffsflächen

### XSS via CSV-Parser

Da Datengraf beliebige CSV-Dateien einliest und deren Inhalt als HTML rendert, ist **Cross-Site Scripting (XSS)** die relevanteste Angriffsfläche. Alle Werte werden vor dem Einfügen in den DOM durch die Funktion `esc()` in `js/app.js` escaped:

```js
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
```

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
- Fehlende HTTPS-Erzwingung (liegt beim Hosting-Anbieter / GitHub Pages)
- Fehlende Rate-Limits (kein Server vorhanden)
- Content Security Policy (CSP) des Hosting-Anbieters
