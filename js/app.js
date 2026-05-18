'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const REL_COLORS_HEX = {
  'übergibt':    '#6c8ebf',
  'nutzt':       '#5fa878',
  'erstellt':    '#c4a23a',
  'empfängt':    '#bf6c6c',
  'verarbeitet': '#9b72b8'
};

const SCHUTZ_OPTS    = ['DSGVO-relevant', 'Intern', 'Öffentlich'];
const ERFASSUNG_OPTS = ['Manuell', 'Automatisiert'];
const ROLLEN_OPTS    = ['Datenproduzent', 'Datenkonsument', 'Gatekeeper', 'Datenverwalter', 'Datenverarbeiter', 'Datenersteller', 'Datennutzer'];
const BEZIEHUNG_OPTS = ['übergibt', 'nutzt', 'erstellt', 'empfängt', 'verarbeitet'];
const LS_KEY         = 'datengraf_data';

const COSE_OPTS = {
  name: 'cose',
  idealEdgeLength: 120, nodeOverlap: 20, refresh: 20,
  fit: true, padding: 30, randomize: false,
  componentSpacing: 120, nodeRepulsion: 450000,
  edgeElasticity: 100, nestingFactor: 5, gravity: 80,
  numIter: 1000, initialTemp: 200, coolingFactor: 0.95, minTemp: 1.0
};

// ── State ────────────────────────────────────────────────────────────────────
let allData      = [];
let filteredData = [];
let networkChart = null;
let pendingFileText = null;
let activeFilters = {
  relation: new Set(), schutz: new Set(), erfassung: new Set(),
  organization: 'all', department: 'all', frequency: 'all', format: 'all',
  search: ''
};

// ── CSV ───────────────────────────────────────────────────────────────────────
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, j) => { obj[h] = (values[j] ?? '').trim(); });
    result.push(obj);
  }
  return result;
}

function splitCSVLine(line) {
  const values = [];
  let inQuotes = false, temp = '';
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { values.push(unquote(temp)); temp = ''; }
    else { temp += ch; }
  }
  values.push(unquote(temp));
  return values;
}

function unquote(s) {
  s = s.trim();
  return (s.startsWith('"') && s.endsWith('"')) ? s.slice(1, -1) : s;
}

function toCSV(data) {
  const headers = ['Quelle','QuelleAbteilung','QuelleBereich','QuelleOrganisation','QuelleRolle',
    'Beziehung','Ziel','Datentyp','Häufigkeit','Format','Schutzbedarf','Erfassungsart','Anmerkungen'];
  const escape = v => {
    if (!v) return '';
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  return [headers.join(','), ...data.map(r => headers.map(h => escape(r[h] || '')).join(','))].join('\n');
}

// ── Filters ──────────────────────────────────────────────────────────────────
function applyFilters() {
  filteredData = allData.filter(row => {
    if (activeFilters.relation.size   > 0 && !activeFilters.relation.has(row.Beziehung))           return false;
    if (activeFilters.schutz.size     > 0 && !activeFilters.schutz.has(row.Schutzbedarf))           return false;
    if (activeFilters.erfassung.size  > 0 && !activeFilters.erfassung.has(row.Erfassungsart))       return false;
    if (activeFilters.organization !== 'all' && row.QuelleOrganisation !== activeFilters.organization) return false;
    if (activeFilters.department   !== 'all' && row.QuelleAbteilung    !== activeFilters.department)    return false;
    if (activeFilters.frequency    !== 'all' && row.Häufigkeit         !== activeFilters.frequency)     return false;
    if (activeFilters.format       !== 'all' && row.Format             !== activeFilters.format)        return false;
    if (activeFilters.search) {
      const q = activeFilters.search.toLowerCase();
      if (!(row.Quelle || '').toLowerCase().includes(q) && !(row.Ziel || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
  renderAll();
}

function clearFilters() {
  activeFilters = { relation: new Set(), schutz: new Set(), erfassung: new Set(),
    organization: 'all', department: 'all', frequency: 'all', format: 'all', search: '' };
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.getElementById('filter-organization').value = 'all';
  document.getElementById('filter-department').value   = 'all';
  document.getElementById('filter-frequency').value    = 'all';
  document.getElementById('filter-format').value       = 'all';
  document.getElementById('filter-search').value       = '';
  applyFilters();
}

// ── Sidebar filter UI ─────────────────────────────────────────────────────────
function buildSidebarFilters() {
  buildChipGroup('filter-chips-relation',  [...new Set(allData.map(r => r.Beziehung).filter(Boolean))],    'relation');
  buildChipGroup('filter-chips-schutz',    [...new Set(allData.map(r => r.Schutzbedarf).filter(Boolean))], 'schutz');
  buildChipGroup('filter-chips-erfassung', [...new Set(allData.map(r => r.Erfassungsart).filter(Boolean))],'erfassung');
  updateSelectFilter('filter-organization', [...new Set(allData.map(r => r.QuelleOrganisation).filter(Boolean))]);
  updateSelectFilter('filter-department',   [...new Set(allData.map(r => r.QuelleAbteilung).filter(Boolean))]);
  updateSelectFilter('filter-frequency',    [...new Set(allData.map(r => r.Häufigkeit).filter(Boolean))]);
  updateSelectFilter('filter-format',       [...new Set(allData.map(r => r.Format).filter(Boolean))]);
}

function buildChipGroup(containerId, values, filterKey) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  values.forEach(val => {
    const chip = document.createElement('button');
    chip.className   = 'chip';
    chip.textContent = val;
    chip.addEventListener('click', () => {
      if (activeFilters[filterKey].has(val)) { activeFilters[filterKey].delete(val); chip.classList.remove('active'); }
      else                                   { activeFilters[filterKey].add(val);    chip.classList.add('active'); }
      applyFilters();
    });
    container.appendChild(chip);
  });
}

function updateSelectFilter(id, options) {
  const sel = document.getElementById(id);
  const cur = sel.value;
  while (sel.options.length > 1) sel.options.remove(1);
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt; o.textContent = opt;
    sel.appendChild(o);
  });
  if ([...options, 'all'].includes(cur)) sel.value = cur;
}

// ── Render dispatcher ─────────────────────────────────────────────────────────
function updateHeroVisibility() {
  // Hero is always visible
}

function renderAll() {
  updateHeroVisibility();
  renderList(filteredData);
  renderNetwork(filteredData);
  renderInsights(filteredData);
}

// ── List view ─────────────────────────────────────────────────────────────────
function renderList(data) {
  const statsEl   = document.getElementById('list-stats');
  const contentEl = document.getElementById('list-content');

  if (!data.length) {
    statsEl.innerHTML   = '';
    contentEl.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox fa-2x"></i></div><p>Keine Daten vorhanden. CSV importieren oder Datenfluss erfassen.</p></div>';
    return;
  }

  const nodes = new Set([...data.map(r => r.Quelle), ...data.map(r => r.Ziel)].filter(Boolean));
  statsEl.innerHTML = `
    <span class="stat-pill"><i class="fas fa-circle-nodes"></i> ${nodes.size} Akteure</span>
    <span class="stat-pill"><i class="fas fa-link"></i> ${data.length} Datenflüsse</span>
    <span class="stat-pill"><i class="fas fa-shield-halved"></i> ${data.filter(r => r.Schutzbedarf === 'DSGVO-relevant').length} DSGVO</span>
    <span class="stat-pill"><i class="fas fa-robot"></i> ${data.filter(r => r.Erfassungsart === 'Automatisiert').length} automatisiert</span>
  `;

  contentEl.innerHTML = '';
  data.forEach((row, idx) => {
    if (!row.Quelle || !row.Ziel) return;

    const schutzClass = row.Schutzbedarf === 'DSGVO-relevant' ? 'badge-dsgvo'
                      : row.Schutzbedarf === 'Intern'         ? 'badge-intern'
                      : row.Schutzbedarf === 'Öffentlich'     ? 'badge-oeffentlich' : '';
    const erfClass    = row.Erfassungsart === 'Manuell'       ? 'badge-manuell'
                      : row.Erfassungsart === 'Automatisiert' ? 'badge-automatisiert' : '';

    const card = document.createElement('div');
    card.className = 'rel-card';
    card.style.borderLeftColor = REL_COLORS_HEX[row.Beziehung] || '#ccc';
    card.innerHTML = `
      <div class="rel-node">${esc(row.Quelle)}</div>
      <div class="rel-type">${esc(row.Beziehung)}</div>
      <div class="rel-arrow">→</div>
      <div class="rel-node">${esc(row.Ziel)}</div>
      ${row.Datentyp   ? `<span class="badge badge-data">${esc(row.Datentyp)}</span>`           : ''}
      ${row.Häufigkeit ? `<span class="badge badge-freq">${esc(row.Häufigkeit)}</span>`          : ''}
      ${row.Format     ? `<span class="badge badge-format">${esc(row.Format)}</span>`            : ''}
      ${schutzClass    ? `<span class="badge ${schutzClass}">${esc(row.Schutzbedarf)}</span>`   : ''}
      ${erfClass       ? `<span class="badge ${erfClass}">${esc(row.Erfassungsart)}</span>`     : ''}
      <div class="rel-card-actions" style="margin-left:auto">
        <button class="btn btn-secondary btn-sm" data-del="${idx}" title="Löschen">✕</button>
      </div>
    `;
    contentEl.appendChild(card);
  });

  contentEl.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      allData.splice(allData.indexOf(filteredData[parseInt(btn.dataset.del)]), 1);
      applyFilters();
      buildSidebarFilters();
    });
  });
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Network view ─────────────────────────────────────────────────────────────
const CY_STYLE = [
  {
    selector: 'node',
    style: {
      label: 'data(id)', 'text-valign': 'center', 'text-halign': 'center',
      'background-color': '#7a6fa8', color: '#fff',
      'font-size': '11px', 'font-family': 'Inter, sans-serif',
      'text-outline-width': 1.5, 'text-outline-color': '#5c5080',
      width: 'data(size)', height: 'data(size)',
      'text-wrap': 'wrap', 'text-max-width': '80px',
      'border-width': 2, 'border-color': 'rgba(255,255,255,0.4)',
    }
  },
  {
    selector: 'edge',
    style: {
      width: 2, 'line-color': 'data(color)',
      'target-arrow-color': 'data(color)', 'target-arrow-shape': 'triangle',
      'curve-style': 'bezier', opacity: 0.7,
      label: 'data(type)', 'font-size': '9px', 'font-family': 'Inter, sans-serif',
      'text-rotation': 'autorotate',
      'text-background-color': '#f5f3fb', 'text-background-opacity': 0.9, 'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle'
    }
  },
  { selector: '.highlighted', style: { 'background-color': '#420093', 'line-color': '#420093', 'target-arrow-color': '#420093', opacity: 1, 'z-index': 999, 'border-color': '#fff', 'border-width': 2 } },
  { selector: '.faded',       style: { opacity: 0.12, 'z-index': 0 } },
];

function prepareElements(data) {
  const nodes = new Map();
  const edges = [];

  data.forEach(row => {
    if (!row.Quelle || !row.Ziel || !row.Beziehung) return;
    if (!nodes.has(row.Quelle)) nodes.set(row.Quelle, { dept: row.QuelleAbteilung || '', org: row.QuelleOrganisation || '', out: 0, inn: 0 });
    nodes.get(row.Quelle).out++;
    if (!nodes.has(row.Ziel)) nodes.set(row.Ziel, { dept: '', org: '', out: 0, inn: 0 });
    nodes.get(row.Ziel).inn++;
    edges.push(row);
  });

  const elements = [];
  nodes.forEach((n, id) => {
    elements.push({ data: { id, dept: n.dept, org: n.org, size: 22 + Math.min(28, (n.out + n.inn) * 3) } });
  });
  edges.forEach((row, i) => {
    elements.push({ data: { id: `e${i}`, source: row.Quelle, target: row.Ziel, type: row.Beziehung, color: REL_COLORS_HEX[row.Beziehung] || '#999' } });
  });
  return elements;
}

function renderNetwork(data) {
  const container = document.getElementById('network-container');
  container.innerHTML = '';
  if (!data.length) return;

  networkChart = cytoscape({ container, elements: prepareElements(data), style: CY_STYLE, layout: COSE_OPTS });

  networkChart.on('tap', 'node', evt => {
    const node  = evt.target;
    const edges = node.connectedEdges();
    const nbrs  = edges.connectedNodes();
    networkChart.elements().removeClass('highlighted faded');
    networkChart.elements().difference(node.union(edges).union(nbrs)).addClass('faded');
    node.union(edges).union(nbrs).addClass('highlighted');
  });
  networkChart.on('tap', evt => {
    if (evt.target === networkChart) networkChart.elements().removeClass('highlighted faded');
  });
}

// ── Insights ──────────────────────────────────────────────────────────────────
function renderInsights(data) {
  const grid = document.getElementById('insights-grid');
  if (!data.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><i class="fas fa-chart-bar fa-2x"></i></div><p>Keine Daten für Analyse vorhanden.</p></div>';
    return;
  }

  const outDeg = {}, inDeg = {}, nodes = new Set(), adj = {};
  data.forEach(row => {
    if (!row.Quelle || !row.Ziel) return;
    nodes.add(row.Quelle); nodes.add(row.Ziel);
    outDeg[row.Quelle] = (outDeg[row.Quelle] || 0) + 1;
    inDeg[row.Ziel]    = (inDeg[row.Ziel]    || 0) + 1;
    if (!adj[row.Quelle]) adj[row.Quelle] = {};
    adj[row.Quelle][row.Ziel] = 1;
  });

  const nodeArr     = [...nodes];
  const bc          = betweennessCentrality(nodeArr, adj);
  const clusters    = labelPropagation(nodeArr, adj);
  const producers   = nodeArr.map(n => ({ name: n, val: outDeg[n] || 0 })).sort((a,b) => b.val - a.val).slice(0, 7);
  const consumers   = nodeArr.map(n => ({ name: n, val: inDeg[n]  || 0 })).sort((a,b) => b.val - a.val).slice(0, 7);
  const bottlenecks = nodeArr.map(n => ({ name: n, val: Math.round(bc[n] || 0) })).sort((a,b) => b.val - a.val).slice(0, 7);

  grid.innerHTML = `
    ${insightCard('<i class="fas fa-upload"></i>', 'Top Datenproduzenten',     'Höchster Ausgangsgrad (Out-Degree)',          rankListHTML(producers,   producers[0]?.val   || 1))}
    ${insightCard('<i class="fas fa-download"></i>', 'Top Datensammler',          'Höchster Eingangsgrad (In-Degree)',           rankListHTML(consumers,   consumers[0]?.val   || 1))}
    ${insightCard('<i class="fas fa-code-branch"></i>', 'Flaschenhälse / Gatekeeper','Betweenness Centrality',                      rankListHTML(bottlenecks, bottlenecks[0]?.val || 1))}
    ${insightCard('<i class="fas fa-layer-group"></i>', 'Datensilos / Cluster',      'Label-Propagation Community Detection',       clustersHTML(clusters))}
    ${insightCard('<i class="fas fa-shield-halved"></i>', 'Schutzbedarf-Verteilung',   'Anzahl Datenflüsse je Schutzstufe',           pieHTML(data, 'Schutzbedarf',  SCHUTZ_OPTS))}
    ${insightCard('<i class="fas fa-gear"></i>', 'Erfassungsart-Verteilung',  'Manuelle vs. automatisierte Flüsse',          pieHTML(data, 'Erfassungsart', ERFASSUNG_OPTS))}
  `;
}

function insightCard(icon, title, subtitle, body) {
  return `<div class="insight-card">
    <div class="insight-card-header">
      <span class="insight-card-icon">${icon}</span>
      <div>
        <div>${title}</div>
        <div style="font-size:10px;font-weight:400;color:var(--c-muted)">${subtitle}</div>
      </div>
    </div>
    <div class="insight-card-body">${body}</div>
  </div>`;
}

function rankListHTML(items, maxVal) {
  if (!items.length) return '<p class="insight-empty">Keine Daten</p>';
  return `<ul class="rank-list">${items.map((item, i) => `
    <li class="rank-item">
      <span class="rank-pos">${i + 1}</span>
      <span class="rank-name" title="${esc(item.name)}">${esc(item.name)}</span>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${Math.round((item.val / maxVal) * 100)}%"></div></div>
      <span class="rank-value">${item.val}</span>
    </li>`).join('')}</ul>`;
}

function clustersHTML(clusters) {
  if (!clusters.length) return '<p class="insight-empty">Keine Cluster erkannt</p>';
  const COLORS = ['#4285F4','#34A853','#FBBC05','#EA4335','#8F44AD','#00ACC1','#FF7043'];
  return `<div class="cluster-list">${clusters.slice(0, 6).map((c, i) => `
    <div class="cluster-item">
      <div class="cluster-title" style="color:${COLORS[i % COLORS.length]}">Cluster ${i + 1} (${c.length} Akteure)</div>
      <div class="cluster-nodes">${c.slice(0, 5).map(n => esc(n)).join(', ')}${c.length > 5 ? ` +${c.length - 5} weitere` : ''}</div>
    </div>`).join('')}</div>`;
}

function pieHTML(data, field, opts) {
  const counts = Object.fromEntries(opts.map(o => [o, 0]));
  data.forEach(r => { if (r[field] && counts[r[field]] !== undefined) counts[r[field]]++; });
  const total  = data.length || 1;
  const COLORS = { 'DSGVO-relevant': '#EA4335', 'Intern': '#e67e22', 'Öffentlich': '#34A853', 'Manuell': '#8F44AD', 'Automatisiert': '#4285F4' };
  return `<ul class="rank-list">${opts.map(opt => `
    <li class="rank-item">
      <span class="rank-pos" style="background:${COLORS[opt]||'#ccc'};color:#fff;font-size:9px">${counts[opt]}</span>
      <span class="rank-name">${esc(opt)}</span>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${Math.round((counts[opt]/total)*100)}%;background:${COLORS[opt]||'#999'}"></div></div>
      <span class="rank-value">${Math.round((counts[opt]/total)*100)}%</span>
    </li>`).join('')}</ul>`;
}

// ── Graph algorithms ──────────────────────────────────────────────────────────
function betweennessCentrality(nodes, adj) {
  const bc = Object.fromEntries(nodes.map(n => [n, 0]));
  nodes.forEach(s => {
    const stack = [], pred = {}, sigma = {}, dist = {}, delta = {};
    nodes.forEach(n => { pred[n] = []; sigma[n] = 0; dist[n] = -1; delta[n] = 0; });
    sigma[s] = 1; dist[s] = 0;
    const queue = [s];
    while (queue.length) {
      const v = queue.shift();
      stack.push(v);
      Object.keys(adj[v] || {}).forEach(w => {
        if (dist[w] < 0) { queue.push(w); dist[w] = dist[v] + 1; }
        if (dist[w] === dist[v] + 1) { sigma[w] += sigma[v]; pred[w].push(v); }
      });
    }
    while (stack.length) {
      const w = stack.pop();
      pred[w].forEach(v => { delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]); });
      if (w !== s) bc[w] += delta[w];
    }
  });
  return bc;
}

function labelPropagation(nodes, adj) {
  if (!nodes.length) return [];
  const labels = Object.fromEntries(nodes.map((n, i) => [n, i]));
  const uAdj   = Object.fromEntries(nodes.map(n => [n, new Set()]));
  nodes.forEach(n => Object.keys(adj[n] || {}).forEach(m => { uAdj[n].add(m); if (!uAdj[m]) uAdj[m] = new Set(); uAdj[m].add(n); }));

  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    [...nodes].sort(() => Math.random() - .5).forEach(n => {
      const nbrs = [...uAdj[n]];
      if (!nbrs.length) return;
      const freq = {};
      nbrs.forEach(m => { freq[labels[m]] = (freq[labels[m]] || 0) + 1; });
      const maxFreq    = Math.max(...Object.values(freq));
      const candidates = Object.keys(freq).filter(k => freq[k] === maxFreq);
      const best       = parseInt(candidates[Math.floor(Math.random() * candidates.length)]);
      if (labels[n] !== best) { labels[n] = best; changed = true; }
    });
    if (!changed) break;
  }

  const groups = {};
  nodes.forEach(n => { const l = labels[n]; if (!groups[l]) groups[l] = []; groups[l].push(n); });
  return Object.values(groups).sort((a, b) => b.length - a.length);
}

// ── Wizard ────────────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  {
    label: 'Quelle',
    hint: 'Schritt 1 von 4',
    render: () => `
      <div class="form-row"><label>Name des Akteurs *</label><input type="text" name="Quelle" placeholder="z. B. Fachbereich 432" required></div>
      <div class="form-row-cols">
        <div class="form-row"><label>Abteilung</label><input type="text" name="QuelleAbteilung" placeholder="z. B. Controlling"></div>
        <div class="form-row"><label>Organisation</label><input type="text" name="QuelleOrganisation" placeholder="z. B. Behörde 3"></div>
      </div>
      <div class="form-row"><label>Bereich</label><input type="text" name="QuelleBereich" placeholder="z. B. GB 4 Betrieb"></div>
      <div class="form-row"><label>Rolle</label>
        <select name="QuelleRolle">${ROLLEN_OPTS.map(r => `<option>${r}</option>`).join('')}</select>
      </div>`
  },
  {
    label: 'Ziel',
    hint: 'Schritt 2 von 4',
    render: () => `
      <div class="form-row"><label>Name des Ziel-Akteurs *</label><input type="text" name="Ziel" placeholder="z. B. Dezernat 10" required></div>
      <div class="form-row"><label>Art der Beziehung *</label>
        <select name="Beziehung">${BEZIEHUNG_OPTS.map(b => `<option>${b}</option>`).join('')}</select>
      </div>
      <div class="form-row"><label>Datentyp</label><input type="text" name="Datentyp" placeholder="z. B. Finanzmittel"></div>
      <div class="form-row"><label>Anmerkungen</label><textarea name="Anmerkungen" placeholder="Optionale Anmerkungen…"></textarea></div>`
  },
  {
    label: 'Format & Häufigkeit',
    hint: 'Schritt 3 von 4',
    render: () => `
      <div class="form-row"><label>Format</label><input type="text" name="Format" placeholder="z. B. Excel, PDF, WFS"></div>
      <div class="form-row"><label>Häufigkeit</label>
        <select name="Häufigkeit">
          <option value="">– wählen –</option>
          ${['täglich','wöchentlich','monatlich','quartalsweise','halbjährlich','jährlich','regelmäßig','unregelmäßig','auf Anfrage','bei Bedarf','immer'].map(f => `<option>${f}</option>`).join('')}
        </select>
      </div>`
  },
  {
    label: 'Schutz & Erfassung',
    hint: 'Schritt 4 von 4',
    render: () => `
      <div class="form-row">
        <label>Schutzbedarf</label>
        <div class="radio-group">
          ${[
            { val: 'DSGVO-relevant', icon: 'fa-shield-halved', desc: 'Personenbezogene oder besonders schützenswerte Daten (Art. 9 DSGVO)' },
            { val: 'Intern',         icon: 'fa-lock',          desc: 'Daten für den internen Gebrauch, nicht öffentlich zugänglich' },
            { val: 'Öffentlich',     icon: 'fa-globe',         desc: 'Daten, die ohne Einschränkung veröffentlicht werden können' }
          ].map(o => `
            <label class="radio-option">
              <input type="radio" name="Schutzbedarf" value="${o.val}">
              <div><div class="radio-option-label"><i class="fas ${o.icon}"></i> ${o.val}</div><div class="radio-option-desc">${o.desc}</div></div>
            </label>`).join('')}
        </div>
      </div>
      <div class="form-row" style="margin-top:14px">
        <label>Erfassungsart</label>
        <div class="radio-group">
          ${[
            { val: 'Manuell',       icon: 'fa-hand',  desc: 'Daten werden durch menschliches Eingreifen erfasst oder übertragen' },
            { val: 'Automatisiert', icon: 'fa-robot', desc: 'Daten fließen automatisch über Schnittstellen oder Batch-Prozesse' }
          ].map(o => `
            <label class="radio-option">
              <input type="radio" name="Erfassungsart" value="${o.val}">
              <div><div class="radio-option-label"><i class="fas ${o.icon}"></i> ${o.val}</div><div class="radio-option-desc">${o.desc}</div></div>
            </label>`).join('')}
        </div>
      </div>`
  }
];

let wizardStep = 0;
let wizardData = {};

function openWizard(prefill = {}) {
  wizardStep = 0;
  wizardData = { ...prefill };
  document.getElementById('wizard-backdrop').classList.remove('hidden');
  renderWizardStep();
}

function closeWizard() {
  document.getElementById('wizard-backdrop').classList.add('hidden');
  wizardData = {};
}

function renderWizardStep() {
  const step  = WIZARD_STEPS[wizardStep];
  const indEl = document.getElementById('step-indicators');

  indEl.innerHTML = WIZARD_STEPS.map((s, i) => {
    const cls  = i < wizardStep ? 'done' : i === wizardStep ? 'active' : '';
    const line = i < WIZARD_STEPS.length - 1 ? `<div class="step-line ${i < wizardStep ? 'done' : ''}"></div>` : '';
    return `<div class="step-indicator">
      <div class="step-dot ${cls}">${i < wizardStep ? '✓' : i + 1}</div>
      <span class="step-label ${i === wizardStep ? 'active' : ''}">${s.label}</span>
    </div>${line}`;
  }).join('');

  document.getElementById('wizard-body').innerHTML = `<form id="wizard-form">${step.render()}</form>`;

  const form = document.getElementById('wizard-form');
  Object.entries(wizardData).forEach(([k, v]) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (!el) return;
    if (el.type === 'radio') {
      const radio = form.querySelector(`[name="${k}"][value="${v}"]`);
      if (radio) { radio.checked = true; radio.closest('.radio-option')?.classList.add('selected'); }
    } else { el.value = v; }
  });

  form.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      form.querySelectorAll(`.radio-option input[name="${radio.name}"]`).forEach(r => r.closest('.radio-option').classList.remove('selected'));
      radio.closest('.radio-option').classList.add('selected');
    });
  });

  document.getElementById('wizard-hint').textContent  = step.hint;
  document.getElementById('wizard-back').style.display = wizardStep === 0 ? 'none' : '';
  document.getElementById('wizard-next').innerHTML   = wizardStep === WIZARD_STEPS.length - 1 ? '<i class="fas fa-check"></i> Speichern' : 'Weiter <i class="fas fa-arrow-right"></i>';
}

function collectWizardStep() {
  const form = document.getElementById('wizard-form');
  if (!form.reportValidity()) return false;
  new FormData(form).forEach((v, k) => { wizardData[k] = v; });
  return true;
}

document.getElementById('wizard-next').addEventListener('click', () => {
  if (!collectWizardStep()) return;
  if (wizardStep < WIZARD_STEPS.length - 1) { wizardStep++; renderWizardStep(); }
  else {
    allData.push({ ...wizardData });
    buildSidebarFilters();
    applyFilters();
    closeWizard();
    setStatus(`Datenfluss von „${wizardData.Quelle}" zu „${wizardData.Ziel}" gespeichert.`, 'success');
  }
});

document.getElementById('wizard-back').addEventListener('click', () => { collectWizardStep(); wizardStep--; renderWizardStep(); });
document.getElementById('wizard-cancel').addEventListener('click', closeWizard);
document.getElementById('wizard-backdrop').addEventListener('click', e => { if (e.target === e.currentTarget) closeWizard(); });
document.getElementById('open-wizard-btn').addEventListener('click', () => openWizard());

// ── Import panel ──────────────────────────────────────────────────────────────
const importToggle = document.getElementById('import-toggle');
const importBody   = document.getElementById('import-body');
const importLabel  = document.getElementById('import-toggle-label');

importToggle.addEventListener('click', () => {
  const open = importBody.classList.toggle('open');
  importToggle.classList.toggle('open', open);
  importLabel.textContent = open ? '▲ schließen' : '▼ öffnen';
});

importBody.classList.add('open');
importToggle.classList.add('open');
importLabel.textContent = '▲ schließen';

document.querySelectorAll('.import-method-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.import-method-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.import-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('import-' + btn.dataset.import).classList.add('active');
  });
});

function getCSVText() {
  const active = document.querySelector('.import-method-tab.active')?.dataset.import;
  if (active === 'paste') return Promise.resolve(document.getElementById('csv-input').value.trim());
  if (active === 'url') {
    const url = document.getElementById('csv-url').value.trim();
    if (!url) return Promise.reject(new Error('Bitte eine URL eingeben.'));
    setStatus('Lade…', 'loading');
    return fetch(url).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); });
  }
  if (active === 'file') {
    if (!pendingFileText) return Promise.reject(new Error('Bitte zuerst eine Datei auswählen.'));
    return Promise.resolve(pendingFileText);
  }
  return Promise.reject(new Error('Unbekannter Import-Modus.'));
}

document.getElementById('btn-visualize').addEventListener('click', () => {
  getCSVText().then(text => {
    if (!text) { setStatus('Keine Daten.', 'error'); return; }
    allData = parseCSV(text);
    buildSidebarFilters();
    applyFilters();
    setStatus(`${allData.length} Zeilen geladen.`, 'success');
  }).catch(e => setStatus(e.message, 'error'));
});

document.getElementById('btn-append').addEventListener('click', () => {
  getCSVText().then(text => {
    if (!text) { setStatus('Keine Daten.', 'error'); return; }
    const newRows = parseCSV(text);
    allData = [...allData, ...newRows];
    buildSidebarFilters();
    applyFilters();
    setStatus(`${newRows.length} Zeilen hinzugefügt (gesamt: ${allData.length}).`, 'success');
  }).catch(e => setStatus(e.message, 'error'));
});

document.getElementById('btn-url-load').addEventListener('click', () => document.getElementById('btn-visualize').click());

const fileInput = document.getElementById('csv-file');
const dropZone  = document.getElementById('drop-zone');

fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); loadFile(e.dataTransfer.files[0]); });

function loadFile(file) {
  if (!file) return;
  document.getElementById('file-name-display').textContent = file.name;
  const r = new FileReader();
  r.onload  = e => { pendingFileText = e.target.result; setStatus('Datei bereit.', 'success'); };
  r.onerror = () => setStatus('Fehler beim Lesen.', 'error');
  r.readAsText(file);
}

function setStatus(msg, type = '') {
  const el = document.getElementById('status-message');
  el.textContent = msg;
  el.className   = type;
}

// ── View tabs ─────────────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.topbar-tab, .mobile-nav-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabName)
  );
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tabName).classList.add('active');
  if (tabName === 'network' && networkChart) setTimeout(() => { networkChart.resize(); networkChart.fit(); }, 50);
}

document.querySelectorAll('.topbar-tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// ── Mobile navigation ─────────────────────────────────────────────────────────
const mobileNavBtn = document.getElementById('mobile-nav-btn');
const mobileNav    = document.getElementById('mobile-nav');

mobileNavBtn.addEventListener('click', e => { e.stopPropagation(); mobileNav.classList.toggle('hidden'); });
document.addEventListener('click', () => mobileNav.classList.add('hidden'));
mobileNav.addEventListener('click', e => e.stopPropagation());

document.querySelectorAll('.mobile-nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab);
    mobileNav.classList.add('hidden');
  });
});

document.getElementById('mobile-wizard-btn').addEventListener('click', () => {
  mobileNav.classList.add('hidden');
  openWizard();
});

window.addEventListener('resize', () => {
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.add('collapsed');
    mobileNav.classList.add('hidden');
  }
});

// ── Sidebar ───────────────────────────────────────────────────────────────────
document.getElementById('sidebar-toggle-btn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
document.getElementById('filter-organization').addEventListener('change', e => { activeFilters.organization = e.target.value; applyFilters(); });
document.getElementById('filter-department').addEventListener('change',   e => { activeFilters.department   = e.target.value; applyFilters(); });
document.getElementById('filter-frequency').addEventListener('change',    e => { activeFilters.frequency    = e.target.value; applyFilters(); });
document.getElementById('filter-format').addEventListener('change',       e => { activeFilters.format       = e.target.value; applyFilters(); });
document.getElementById('filter-search').addEventListener('input',        e => { activeFilters.search       = e.target.value.trim(); applyFilters(); });

// ── Network controls ──────────────────────────────────────────────────────────
document.getElementById('btn-reset-layout').addEventListener('click', () => { if (networkChart) networkChart.layout(COSE_OPTS).run(); });
document.getElementById('btn-zoom-in').addEventListener('click',  () => { if (networkChart) networkChart.zoom({ level: networkChart.zoom() * 1.2, renderedPosition: { x: networkChart.width() / 2, y: networkChart.height() / 2 } }); });
document.getElementById('btn-zoom-out').addEventListener('click', () => { if (networkChart) networkChart.zoom({ level: networkChart.zoom() * 0.8, renderedPosition: { x: networkChart.width() / 2, y: networkChart.height() / 2 } }); });
document.getElementById('btn-zoom-fit').addEventListener('click', () => { if (networkChart) { networkChart.fit(); networkChart.center(); } });
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  document.getElementById('panel-network').classList.toggle('fullscreen');
  setTimeout(() => { if (networkChart) { networkChart.resize(); networkChart.fit(); } }, 100);
});

// ── LocalStorage ──────────────────────────────────────────────────────────────
document.getElementById('save-local-btn').addEventListener('click', () => {
  localStorage.setItem(LS_KEY, JSON.stringify(allData));
  setStatus(`${allData.length} Einträge gespeichert.`, 'success');
});

document.getElementById('load-local-btn').addEventListener('click', () => {
  const saved = localStorage.getItem(LS_KEY);
  if (!saved) { setStatus('Keine gespeicherten Daten gefunden.', 'error'); return; }
  try {
    allData = JSON.parse(saved);
    buildSidebarFilters();
    applyFilters();
    setStatus(`${allData.length} Einträge geladen.`, 'success');
  } catch (e) {
    setStatus('Fehler beim Laden der Daten: Speicher beschädigt.', 'error');
  }
});

// ── CSV Export ────────────────────────────────────────────────────────────────
document.getElementById('export-csv-btn').addEventListener('click', () => {
  if (!allData.length) { setStatus('Keine Daten zum Exportieren.', 'error'); return; }
  const blob = new Blob([toCSV(allData)], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `datengraf_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// ── Sample Data ───────────────────────────────────────────────────────────────
document.getElementById('btn-load-sample').addEventListener('click', () => {
  setStatus('Lade Beispieldaten…', 'loading');
  fetch('data/sample.csv')
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(text => {
      if (!text) { setStatus('Beispieldaten leer.', 'error'); return; }
      allData = parseCSV(text);
      buildSidebarFilters();
      applyFilters();
      setStatus(`${allData.length} Beispiel-Zeilen geladen.`, 'success');
    })
    .catch(e => setStatus(`Fehler beim Laden: ${e.message}`, 'error'));
});

// ── Hero Section ───────────────────────────────────────────────────────────────
document.getElementById('hero-wizard-btn').addEventListener('click', () => openWizard());
document.getElementById('hero-sample-btn').addEventListener('click', () => document.getElementById('btn-load-sample').click());

// ── Page Navigation ────────────────────────────────────────────────────────────
document.getElementById('topbar-brand-link').addEventListener('click', () => location.reload());

// ── Init ──────────────────────────────────────────────────────────────────────
renderAll();
