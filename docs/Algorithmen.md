# Netzwerk-Algorithmen

← [Zurück zur Übersicht](Home.md)

---

DatenGraf modelliert Organisationen als **gerichtete Graphen** *G = (V, E)*:
- Knoten *V* = Akteure (Systeme, Abteilungen, Personen)
- Kanten *E* = Datenflüsse zwischen Akteuren

---

## Gradzentralität (Degree Centrality)

### Out-Degree
Gibt an, wie viele Datenflüsse von einem Knoten *v* ausgehen – Maß für die Rolle als **Datenproduzent**.

### In-Degree
Misst die eingehenden Datenflüsse – identifiziert **Datensammler**.

### Normalisierte Gradzentralität

```
C_D(v) = deg(v) / (|V| - 1)
```

Wert zwischen 0 und 1: 1 = verbunden mit allen anderen Knoten.

---

## Betweenness Centrality

> Brandes, U. (2001). *A faster algorithm for betweenness centrality.* Journal of Mathematical Sociology, 25(2), 163–177.

### Definition

Misst, wie häufig ein Knoten *v* auf dem **kürzesten Pfad** zwischen zwei anderen Knoten *s* und *t* liegt:

```
C_B(v) = Σ (σ_st(v) / σ_st)   für alle s ≠ v ≠ t
```

- `σ_st` = Anzahl kürzester Pfade zwischen *s* und *t*
- `σ_st(v)` = davon jene, die über *v* führen

### Interpretation

Knoten mit hoher Betweenness sind **Flaschenhälse** oder **Gatekeeper** – kritische Schaltstellen im Datenfluss. Ihr Ausfall oder ihre Überlastung kann das gesamte Ökosystem beeinträchtigen.

### Implementierung

Brandes-Algorithmus mit Laufzeit **O(V · E)** – geeignet für Graphen bis ~500 Knoten. Implementiert in `betweennessCentrality(nodes, adj)` in `js/app.js`.

---

## Community Detection (Label Propagation)

> Raghavan, U. N., Albert, R., & Kumara, S. (2007). *Near linear time algorithm to detect community structures in large-scale networks.* Physical Review E, 76(3).

### Ablauf

1. Jeder Knoten erhält ein eindeutiges initiales Label
2. In zufälliger Reihenfolge übernimmt jeder Knoten das **häufigste Label** seiner Nachbarn
3. Iteration bis Konvergenz oder max. **10 Runden**
4. Knoten mit gleichem Label bilden einen **Cluster** (= Datensilo)

### Hinweis

Der Algorithmus arbeitet auf dem **ungerichteten** Graphen (beide Kantenrichtungen werden berücksichtigt).

### Interpretation

Cluster repräsentieren Gruppen von Akteuren, die **überwiegend untereinander** Daten austauschen – ein Hinweis auf Silos oder isolierte Teilsysteme.

---

## Referenzen

- Brandes, U. (2001). *A faster algorithm for betweenness centrality.* Journal of Mathematical Sociology, 25(2), 163–177.
- Raghavan, U. N., Albert, R., & Kumara, S. (2007). *Near linear time algorithm to detect community structures in large-scale networks.* Physical Review E, 76(3).
- Newman, M. E. J. (2010). *Networks: An Introduction.* Oxford University Press.
