# Beitragen zu Datengraf

Vielen Dank für Ihr Interesse! Beiträge sind willkommen – egal ob Bugfix, neue Funktion oder Dokumentationsverbesserung.

## Einstieg

```bash
git clone https://github.com/daimpad/datengraf.git
cd datengraf
python3 -m http.server 8080   # lokaler Entwicklungsserver
```

Es sind keine Build-Tools, keine npm-Pakete und keine Transpiler erforderlich. Änderungen an `css/styles.css` oder `js/app.js` sind nach einem Browser-Reload sofort sichtbar.

## Wie man beiträgt

1. **Fork** des Repositories erstellen.
2. Feature-Branch anlegen: `git checkout -b feature/mein-feature`
3. Änderungen durchführen und committen.
4. Branch pushen: `git push origin feature/mein-feature`
5. **Pull Request** gegen `main` öffnen.

## Richtlinien

### Code-Stil

- **JS:** Kein Framework, kein Transpiler. Vanilla ES2020+ (`const`, `let`, Arrow Functions, `async/await`, optional chaining).
- **CSS:** Neue Werte nach Möglichkeit als Custom Property in `:root` eintragen.
- Keine unnötigen Kommentare – gut gewählte Namen erklären den Code selbst.
- Keine neuen externen Abhängigkeiten ohne Diskussion im Issue.

### CSV-Schema

Das CSV-Schema (Spalten in `data/sample.csv`) ist öffentliche API. Neue Spalten können addiert werden; bestehende Spaltennamen dürfen nicht umbenannt werden.

### Commits

Bitte aussagekräftige Commit-Nachrichten verwenden:

```
feat: neue Funktion beschreiben
fix: Fehler und Ursache beschreiben
docs: Dokumentationsänderung
style: rein formale Änderungen (Einrückung, Leerzeichen)
refactor: Umstrukturierung ohne Verhaltensänderung
```

## Bugs melden

Bitte ein [Issue](https://github.com/daimpad/datengraf/issues) öffnen und folgende Informationen angeben:

- Browser und Version
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
- Falls möglich: minimales CSV-Beispiel

## Fragen

Einfach ein Issue mit dem Label **question** öffnen.

## Lizenz

Mit einem Beitrag stimmen Sie zu, dass Ihr Code unter der [GPL-3.0-Lizenz](../LICENSE) dieses Projekts veröffentlicht wird.
