# FAQ – Häufig gestellte Fragen

← [Zurück zur Übersicht](Home.md)

---

## Allgemein

**Werden meine Daten auf einem Server gespeichert?**  
Nein. Alle Daten verbleiben ausschließlich im Browser (LocalStorage). Es gibt keinen Server, keine Datenbank und kein Tracking.

**Brauche ich eine Internetverbindung?**  
Nur beim ersten Laden (Schriften, Icons, Cytoscape.js über CDN). Danach funktioniert die App vollständig offline – außer beim CSV-Import per URL.

**Kann ich DatenGraf auf einem eigenen Server hosten?**  
Ja. Da es eine reine Static-Site ist, genügt jeder einfache Webserver oder GitHub Pages. Einfach alle Dateien in ein öffentlich erreichbares Verzeichnis kopieren.

---

## Daten & Import

**Meine CSV-Datei wird nicht korrekt importiert – was tun?**
- Prüfe ob die Datei UTF-8 kodiert ist
- Trennzeichen muss Komma (`,`) sein, nicht Semikolon
- Felder mit Kommas oder Sonderzeichen in `"..."` einschließen
- Erste Zeile muss die korrekten Spaltennamen enthalten (siehe [CSV-Format](CSV-Format.md))

**Kann ich Daten aus mehreren CSV-Dateien kombinieren?**  
Ja. Importiere die erste Datei normal, dann nutze **Zu vorhandenen Daten hinzufügen** für weitere Dateien.

**Gehen meine Daten verloren, wenn ich den Browser schließe?**  
Nur wenn du vorher nicht auf **Im Browser speichern** geklickt hast. Sicherste Methode: regelmäßig **CSV exportieren**.

---

## Netzwerkkarte

**Die Knoten überlappen sich – was kann ich tun?**  
Klicke auf **Layout neu** in der Netzwerk-Toolbar. Das COSE-Layout berechnet die Positionen neu.

**Wie hebe ich einen bestimmten Akteur hervor?**  
Klicke auf den Knoten. Er wird hervorgehoben, alle anderen abgedunkelt. Erneuter Klick hebt die Auswahl auf.

**Ab wie vielen Knoten wird die Darstellung unübersichtlich?**  
Bei mehr als ~80–100 Knoten empfiehlt es sich, die Filter-Sidebar zu nutzen, um die Ansicht auf relevante Teilbereiche einzugrenzen.

---

## Netzwerk-Insights

**Was bedeutet eine hohe Betweenness Centrality?**  
Der Akteur liegt auf vielen kürzesten Pfaden zwischen anderen Akteuren – er ist ein **Gatekeeper** oder **Flaschenhals**. Fällt er aus oder wird überlastet, kann der Informationsfluss im Netzwerk gestört werden.

**Was ist ein Datensilo?**  
Ein Cluster von Akteuren, die hauptsächlich untereinander Daten austauschen und wenig Verbindungen nach außen haben. Datensilos können Informationsasymmetrien und mangelnde Transparenz verursachen.

---

## Technisch

**Welche Browser werden unterstützt?**  
Alle modernen Browser (Chrome, Firefox, Safari, Edge). Internet Explorer wird nicht unterstützt.

**Kann ich DatenGraf in ein Intranet integrieren?**  
Ja – einfach die Dateien auf einen internen Webserver legen. Keine externen Abhängigkeiten zur Laufzeit nötig (CDN-Ressourcen können optional lokal gehostet werden).

**Wie passe ich das Design an?**  
Alle Designwerte sind als CSS Custom Properties in `css/styles.css` unter `:root` definiert. Passe die Token-Werte dort an (siehe [Konfiguration](Konfiguration.md)).
