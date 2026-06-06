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
  const rows = [];
  let i = 0;
  const n = csv.length;
  while (i < n) {
    const fields = [];
    while (true) {
      let field = '';
      if (i < n && csv[i] === '"') {
        i++;
        while (i < n) {
          if (csv[i] === '"') {
            if (i + 1 < n && csv[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else { field += csv[i++]; }
        }
      } else {
        while (i < n && csv[i] !== ',' && csv[i] !== '\n' && csv[i] !== '\r') field += csv[i++];
        field = field.trim();
      }
      fields.push(field);
      if (i < n && csv[i] === ',') { i++; continue; }
      if (i < n && csv[i] === '\r') i++;
      if (i < n && csv[i] === '\n') i++;
      break;
    }
    if (fields.some(f => f !== '')) rows.push(fields);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(fields => {
    const obj = {};
    headers.forEach((h, j) => { obj[h] = fields[j] ?? ''; });
    return obj;
  });
}

function toCSV(data) {
  const headers = ['Quelle','QuelleAbteilung','QuelleBereich','QuelleOrganisation','QuelleRolle',
    'Beziehung','Ziel','Datentyp','Häufigkeit','Format','Schutzbedarf','Erfassungsart','Anmerkungen','Ansprechpartner'];
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
  updateFilterBanner();
  renderAll();
}

function updateFilterBanner() {
  const banner = document.getElementById('active-filter-banner');
  if (!banner || !allData.length) { if (banner) banner.classList.add('hidden'); return; }
  const count = activeFilters.relation.size + activeFilters.schutz.size + activeFilters.erfassung.size +
    (activeFilters.organization !== 'all' ? 1 : 0) + (activeFilters.department !== 'all' ? 1 : 0) +
    (activeFilters.frequency !== 'all' ? 1 : 0) + (activeFilters.format !== 'all' ? 1 : 0) +
    (activeFilters.search ? 1 : 0);
  if (count === 0) {
    banner.classList.add('hidden');
  } else {
    const hidden = allData.length - filteredData.length;
    document.getElementById('filter-banner-text').textContent =
      `${count} Filter aktiv – ${filteredData.length} von ${allData.length} Einträgen sichtbar${hidden > 0 ? ` (${hidden} ausgeblendet)` : ''}`;
    banner.classList.remove('hidden');
  }
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
    chip.className = 'chip' + (activeFilters[filterKey].has(val) ? ' active' : '');
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
function updateViewSwitcher() {
  document.getElementById('view-switcher').classList.toggle('hidden', allData.length === 0);
}

function renderAll() {
  updateViewSwitcher();
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
      ${row.Ansprechpartner ? `<span class="badge badge-owner"><i class="fas fa-user" style="font-size:9px"></i> ${esc(row.Ansprechpartner)}</span>` : ''}
      <div class="rel-card-actions" style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" data-dupe="${idx}" title="Duplizieren"><i class="fas fa-copy"></i></button>
        <button class="btn btn-secondary btn-sm" data-edit="${idx}" title="Bearbeiten"><i class="fas fa-pen"></i></button>
        <button class="btn btn-secondary btn-sm" data-del="${idx}"  title="Löschen">✕</button>
      </div>
    `;
    contentEl.appendChild(card);
  });

  contentEl.querySelectorAll('[data-dupe]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = filteredData[parseInt(btn.dataset.dupe)];
      openWizard({ ...row });
    });
  });

  contentEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = filteredData[parseInt(btn.dataset.edit)];
      const idx = allData.indexOf(row);
      openWizard({ ...row }, idx);
    });
  });

  contentEl.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = filteredData[parseInt(btn.dataset.del)];
      const idx = allData.indexOf(row);
      if (idx !== -1) allData.splice(idx, 1);
      applyFilters();
      buildSidebarFilters();
    });
  });
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Analyse-Briefing ──────────────────────────────────────────────────────────
function runAnalysis(data) {
  if (!data.length) return [];
  const findings = [];

  const outDeg = {}, inDeg = {}, adj = {};
  data.forEach(r => {
    if (!r.Quelle || !r.Ziel) return;
    outDeg[r.Quelle] = (outDeg[r.Quelle] || 0) + 1;
    inDeg[r.Ziel]    = (inDeg[r.Ziel]    || 0) + 1;
    if (!adj[r.Quelle]) adj[r.Quelle] = {};
    adj[r.Quelle][r.Ziel] = 1;
  });
  const nodes = [...new Set([...Object.keys(outDeg), ...Object.keys(inDeg)])];

  // Hub: out-degree > max(4, 2× Durchschnitt)
  const avgOut = Object.values(outDeg).reduce((a, b) => a + b, 0) / (Object.keys(outDeg).length || 1);
  const hubThreshold = Math.max(4, avgOut * 2);
  const hubs = Object.entries(outDeg).filter(([, d]) => d >= hubThreshold).sort((a, b) => b[1] - a[1]);
  if (hubs.length) {
    const [name, deg] = hubs[0];
    findings.push({
      type: 'hub', severity: 'high', icon: 'fa-arrows-to-dot',
      title: `Zentraler Hub: ${name}`,
      text: `${deg} ausgehende Verbindungen – bei Ausfall sind sofort ${deg} nachgelagerte Systeme betroffen.`,
      action: { label: 'Im Netzwerk zeigen', type: 'highlight', nodeId: name }
    });
  }

  // Gatekeeper: Betweenness deutlich über Durchschnitt
  const bc = betweennessCentrality(nodes, adj);
  const avgBC = Object.values(bc).reduce((a, b) => a + b, 0) / (nodes.length || 1);
  const gatekeepers = Object.entries(bc)
    .filter(([n, v]) => v > avgBC * 3 && v > 0 && !hubs.some(([h]) => h === n))
    .sort((a, b) => b[1] - a[1]);
  if (gatekeepers.length) {
    const [name] = gatekeepers[0];
    findings.push({
      type: 'gatekeeper', severity: 'high', icon: 'fa-code-branch',
      title: `Flaschenhals: ${name}`,
      text: `Liegt auf den meisten Verbindungspfaden – Ausfall oder Überlastung blockiert das gesamte Netzwerk.`,
      action: { label: 'Im Netzwerk zeigen', type: 'highlight', nodeId: name }
    });
  }

  // DSGVO-Flüsse ohne Ansprechpartner
  const dsgvoNoOwner = data.filter(r => r.Schutzbedarf === 'DSGVO-relevant' && !r.Ansprechpartner);
  if (dsgvoNoOwner.length) {
    findings.push({
      type: 'dsgvo_no_owner', severity: 'high', icon: 'fa-user-shield',
      title: `${dsgvoNoOwner.length} DSGVO-Fluss${dsgvoNoOwner.length !== 1 ? 'e' : ''} ohne Ansprechpartner`,
      text: `DSGVO-relevante Datenflüsse benötigen eine verantwortliche Person – Compliance-Lücke.`,
      action: { label: 'Filter: DSGVO-relevant', type: 'filter-schutz', value: 'DSGVO-relevant' }
    });
  }

  // Fehlender Schutzbedarf
  const missingSchutz = data.filter(r => !r.Schutzbedarf);
  if (missingSchutz.length) {
    findings.push({
      type: 'missing_schutz', severity: 'medium', icon: 'fa-shield-halved',
      title: `${missingSchutz.length} Fluss${missingSchutz.length !== 1 ? 'e' : ''} ohne Schutzklasse`,
      text: `Ohne Schutzbedarf-Einstufung sind DSGVO-relevante Flüsse nicht identifizierbar.`,
      action: { label: 'Insights ansehen', type: 'tab', tab: 'insights' }
    });
  }

  // Keine Org-Daten – Hierarchie-Ansicht nicht nutzbar
  const withOrg = data.filter(r => r.QuelleOrganisation).length;
  if (withOrg === 0) {
    findings.push({
      type: 'no_org', severity: 'low', icon: 'fa-building',
      title: 'Keine Organisations-Daten',
      text: `Füge „QuelleOrganisation" und „QuelleBereich" hinzu um Org-Farben und Hierarchie-Ansicht zu nutzen.`,
      action: null
    });
  }

  // Fehlende Datentypen (>30%)
  const missingType = data.filter(r => !r.Datentyp).length;
  if (missingType > data.length * 0.3) {
    findings.push({
      type: 'missing_datentyp', severity: 'low', icon: 'fa-tag',
      title: `${missingType} Fluss${missingType !== 1 ? 'e' : ''} ohne Datentyp`,
      text: `Ohne Datentypangabe lassen sich Datensilos und Redundanzen schwerer erkennen.`,
      action: { label: 'Listenansicht', type: 'tab', tab: 'list' }
    });
  }

  const sevOrder = { high: 0, medium: 1, low: 2 };
  return findings.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]).slice(0, 5);
}

function showAnalyseBriefing() {
  const findings = runAnalysis(allData);
  const panel = document.getElementById('analyse-briefing');
  const container = document.getElementById('briefing-findings');
  if (!findings.length) { panel.classList.add('hidden'); return; }

  const sevIcon = { high: 'fa-circle-exclamation', medium: 'fa-triangle-exclamation', low: 'fa-circle-info' };
  const sevClass = { high: 'finding-high', medium: 'finding-medium', low: 'finding-low' };

  container.innerHTML = findings.map((f, i) => `
    <div class="briefing-finding ${sevClass[f.severity]}" data-finding="${i}">
      <div class="finding-icon-wrap">
        <i class="fas ${f.icon}"></i>
        <i class="fas ${sevIcon[f.severity]} finding-sev-dot"></i>
      </div>
      <div class="finding-body">
        <div class="finding-title">${esc(f.title)}</div>
        <div class="finding-text">${esc(f.text)}</div>
      </div>
      ${f.action ? `<button class="btn btn-secondary btn-sm finding-action" data-finding="${i}">${esc(f.action.label)} <i class="fas fa-arrow-right" style="font-size:9px"></i></button>` : ''}
    </div>`).join('');

  container.querySelectorAll('.finding-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = findings[parseInt(btn.dataset.finding)];
      if (!f?.action) return;
      const { type, tab, nodeId, value } = f.action;
      if (type === 'tab') { switchTab(tab); }
      if (type === 'highlight') {
        switchTab('network');
        setTimeout(() => {
          if (!networkChart) return;
          const node = networkChart.$id(nodeId);
          if (!node.length) return;
          const edges = node.connectedEdges(), nbrs = edges.connectedNodes();
          networkChart.elements().removeClass('highlighted faded');
          networkChart.elements().difference(node.union(edges).union(nbrs)).addClass('faded');
          node.union(edges).union(nbrs).addClass('highlighted');
          networkChart.animate({ fit: { eles: node.union(nbrs), padding: 80 }, duration: 400 });
          showNodeDetail(nodeId, filteredData.length ? filteredData : allData);
        }, 200);
      }
      if (type === 'filter-schutz') {
        activeFilters.schutz.clear();
        activeFilters.schutz.add(value);
        buildSidebarFilters();
        applyFilters();
        if (document.getElementById('sidebar').classList.contains('collapsed')) toggleSidebar();
      }
    });
  });

  panel.classList.remove('hidden');
}

// ── Network view ─────────────────────────────────────────────────────────────
const CY_STYLE = [
  {
    selector: 'node',
    style: {
      label: 'data(id)', 'text-valign': 'center', 'text-halign': 'center',
      'background-color': 'data(orgColor)', color: '#fff',
      'font-size': '11px', 'font-family': 'Inter, sans-serif',
      'text-outline-width': 1.5, 'text-outline-color': 'data(orgOutlineColor)',
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
  { selector: '.path-node',   style: { 'background-color': '#2e9e60', 'border-color': '#fff', 'border-width': 3, opacity: 1, 'z-index': 999, color: '#fff', 'text-outline-color': '#1a6640' } },
  { selector: '.path-edge',   style: { 'line-color': '#2e9e60', 'target-arrow-color': '#2e9e60', width: 4, opacity: 1, 'z-index': 998 } },
  { selector: ':parent',      style: { 'background-color': 'rgba(66,0,147,0.04)', 'background-opacity': 1, 'border-color': 'rgba(66,0,147,0.25)', 'border-width': 1, 'padding': '18px', label: 'data(label)', 'text-valign': 'top', 'text-halign': 'center', color: '#420093', 'font-size': '11px', 'font-weight': 600, 'text-outline-width': 0 } },
];

function prepareElements(data, useHierarchy = false) {
  const nodes = new Map();
  const edges = [];

  data.forEach(row => {
    if (!row.Quelle || !row.Ziel || !row.Beziehung) return;
    if (!nodes.has(row.Quelle)) {
      nodes.set(row.Quelle, { dept: row.QuelleAbteilung || '', org: row.QuelleOrganisation || '', bereich: row.QuelleBereich || '', out: 0, inn: 0 });
    } else {
      // Update org/bereich if previously registered only as Ziel (no org data)
      const n = nodes.get(row.Quelle);
      if (!n.org && row.QuelleOrganisation) n.org = row.QuelleOrganisation;
      if (!n.bereich && row.QuelleBereich)  n.bereich = row.QuelleBereich;
    }
    nodes.get(row.Quelle).out++;
    if (!nodes.has(row.Ziel)) nodes.set(row.Ziel, { dept: '', org: '', bereich: '', out: 0, inn: 0 });
    nodes.get(row.Ziel).inn++;
    edges.push(row);
  });

  const elements = [];

  if (useHierarchy) {
    const bereiche = new Map();
    nodes.forEach(n => { if (n.bereich) bereiche.set(n.bereich, `_p_${n.bereich}`); });
    bereiche.forEach((id, bereich) => {
      elements.push({ data: { id, label: bereich, isParent: true } });
    });
    nodes.forEach((n, id) => {
      const nodeData = { id, dept: n.dept, org: n.org, orgColor: '#7a6fa8', orgOutlineColor: '#5c5080', size: 22 + Math.min(28, (n.out + n.inn) * 3) };
      if (n.bereich && bereiche.has(n.bereich)) nodeData.parent = bereiche.get(n.bereich);
      elements.push({ data: nodeData });
    });
  } else {
    nodes.forEach((n, id) => {
      elements.push({ data: { id, dept: n.dept, org: n.org, orgColor: '#7a6fa8', orgOutlineColor: '#5c5080', size: 22 + Math.min(28, (n.out + n.inn) * 3) } });
    });
  }

  edges.forEach((row, i) => {
    elements.push({ data: { id: `e${i}`, source: row.Quelle, target: row.Ziel, type: row.Beziehung, color: REL_COLORS_HEX[row.Beziehung] || '#999' } });
  });
  return elements;
}

function renderNetwork(data) {
  const container = document.getElementById('network-container');
  container.innerHTML = '';
  document.getElementById('pathfinder-bar').classList.add('hidden');
  document.getElementById('pathfinder-result').textContent = '';
  document.getElementById('pathfinder-result').className = 'pathfinder-result';
  document.getElementById('org-legend').classList.add('hidden');
  if (!data.length) { networkChart = null; return; }

  networkChart = cytoscape({ container, elements: prepareElements(data, orgHierarchyMode), style: CY_STYLE, layout: COSE_OPTS });
  if (colorByOrg) applyOrgColors();

  networkChart.on('tap', 'node', evt => {
    const node  = evt.target;
    const edges = node.connectedEdges();
    const nbrs  = edges.connectedNodes();
    networkChart.elements().removeClass('highlighted faded');
    networkChart.elements().difference(node.union(edges).union(nbrs)).addClass('faded');
    node.union(edges).union(nbrs).addClass('highlighted');
    showNodeDetail(node.id(), data);
  });
  networkChart.on('tap', evt => {
    if (evt.target === networkChart) {
      networkChart.elements().removeClass('highlighted faded');
      document.getElementById('node-detail').classList.add('hidden');
    }
  });
}

function showNodeDetail(nodeId, data) {
  const outFlows = data.filter(r => r.Quelle === nodeId);
  const inFlows  = data.filter(r => r.Ziel   === nodeId);

  document.getElementById('nd-name').textContent = nodeId;
  document.getElementById('nd-metrics').innerHTML =
    `<span class="nd-badge"><i class="fas fa-arrow-up-from-bracket" style="font-size:9px"></i> ${outFlows.length} ausgehend</span>` +
    `<span class="nd-badge"><i class="fas fa-arrow-down-to-bracket" style="font-size:9px"></i> ${inFlows.length} eingehend</span>`;

  const flowHtml = (flows, dir) => flows.map(r => `
    <div class="nd-flow">
      <span class="nd-flow-dir">${dir}</span>
      <span class="nd-flow-node">${esc(dir === '→' ? r.Ziel : r.Quelle)}</span>
      ${r.Beziehung ? `<span class="nd-flow-rel">${esc(r.Beziehung)}</span>` : ''}
      ${r.Datentyp  ? `<span class="nd-flow-type">${esc(r.Datentyp)}</span>`  : ''}
    </div>`).join('');

  document.getElementById('nd-flows').innerHTML =
    (outFlows.length ? `<div class="nd-section-label">Ausgehend</div>${flowHtml(outFlows, '→')}` : '') +
    (inFlows.length  ? `<div class="nd-section-label">Eingehend</div>${flowHtml(inFlows,  '←')}` : '');

  document.getElementById('node-detail').classList.remove('hidden');
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
      pred[w].forEach(v => { if (sigma[w] > 0) delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]); });
      if (w !== s) bc[w] += delta[w];
    }
  });
  return bc;
}

function labelPropagation(nodes, adj) {
  if (!nodes.length) return [];
  const labels = Object.fromEntries(nodes.map((n, i) => [n, i]));
  const uAdj   = Object.fromEntries(nodes.map(n => [n, new Set()]));
  nodes.forEach(n => Object.keys(adj[n] || {}).forEach(m => { uAdj[n].add(m); if (uAdj[m]) uAdj[m].add(n); }));

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
      <div class="form-row"><label>Anmerkungen</label><textarea name="Anmerkungen" placeholder="Optionale Anmerkungen…"></textarea></div>
      <div class="form-row"><label>Ansprechpartner</label><input type="text" name="Ansprechpartner" placeholder="z. B. Max Mustermann"></div>`
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
          ].map((o, idx) => `
            <label class="radio-option">
              <input type="radio" name="Schutzbedarf" value="${o.val}"${idx === 0 ? ' required' : ''}>
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
          ].map((o, idx) => `
            <label class="radio-option">
              <input type="radio" name="Erfassungsart" value="${o.val}"${idx === 0 ? ' required' : ''}>
              <div><div class="radio-option-label"><i class="fas ${o.icon}"></i> ${o.val}</div><div class="radio-option-desc">${o.desc}</div></div>
            </label>`).join('')}
        </div>
      </div>`
  }
];

let wizardStep = 0;
let wizardData  = {};
let editIndex   = -1;
let wizardDuplicateConfirmed = false;
let colorByOrg = false;
let orgHierarchyMode = false;

const ORG_PALETTE = [
  { bg: '#420093', outline: '#2d0066' },
  { bg: '#2e9e60', outline: '#1a6640' },
  { bg: '#d4820a', outline: '#a05f07' },
  { bg: '#2980b9', outline: '#1c5e8c' },
  { bg: '#c0392b', outline: '#8c2920' },
  { bg: '#8e44ad', outline: '#5e2d75' },
  { bg: '#16a085', outline: '#0d6b58' },
  { bg: '#d35400', outline: '#922800' },
  { bg: '#555b6e', outline: '#323740' },
  { bg: '#1a6640', outline: '#0d3d22' },
];

function findDuplicate(data, candidate, skipIndex = -1) {
  return data.findIndex((row, i) =>
    i !== skipIndex &&
    row.Quelle    === candidate.Quelle &&
    row.Ziel      === candidate.Ziel   &&
    row.Datentyp  === candidate.Datentyp
  );
}

function openWizard(prefill = {}, editIdx = -1) {
  editIndex  = editIdx;
  wizardStep = 0;
  wizardData = { ...prefill };
  document.getElementById('wizard-title').textContent = editIdx >= 0 ? 'Datenfluss bearbeiten' : 'Neuen Datenfluss erfassen';
  document.getElementById('wizard-backdrop').classList.remove('hidden');
  renderWizardStep();
}

function closeWizard() {
  document.getElementById('wizard-backdrop').classList.add('hidden');
  document.getElementById('wizard-dup-warning').classList.add('hidden');
  wizardData = {};
  editIndex  = -1;
  wizardDuplicateConfirmed = false;
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
  const isLast = wizardStep === WIZARD_STEPS.length - 1;
  document.getElementById('wizard-next').innerHTML = isLast
    ? `<i class="fas fa-check"></i> ${editIndex >= 0 ? 'Aktualisieren' : 'Speichern'}`
    : 'Weiter <i class="fas fa-arrow-right"></i>';
}

function collectWizardStep() {
  const form = document.getElementById('wizard-form');
  if (!form.reportValidity()) return false;
  new FormData(form).forEach((v, k) => { wizardData[k] = v; });
  return true;
}

document.getElementById('wizard-next').addEventListener('click', () => {
  if (!collectWizardStep()) return;
  if (wizardStep < WIZARD_STEPS.length - 1) {
    // Early dup-check after step 1 (Ziel, Datentyp collected) – warn before user fills steps 2–3
    if (wizardStep === 1 && wizardData.Quelle && wizardData.Ziel && !wizardDuplicateConfirmed) {
      const dupIdx = findDuplicate(allData, wizardData, editIndex);
      if (dupIdx !== -1) {
        const dup = allData[dupIdx];
        document.getElementById('wizard-dup-text').textContent =
          `${dup.Quelle} → ${dup.Ziel} (${dup.Datentyp})`;
        document.getElementById('wizard-dup-warning').classList.remove('hidden');
        wizardDuplicateConfirmed = true;
        return;
      }
    }
    wizardStep++;
    wizardDuplicateConfirmed = false;
    document.getElementById('wizard-dup-warning').classList.add('hidden');
    renderWizardStep();
  } else {
    const dupIdx = findDuplicate(allData, wizardData, editIndex);
    if (dupIdx !== -1 && !wizardDuplicateConfirmed) {
      const dup = allData[dupIdx];
      document.getElementById('wizard-dup-text').textContent =
        `${dup.Quelle} → ${dup.Ziel} (${dup.Datentyp})`;
      document.getElementById('wizard-dup-warning').classList.remove('hidden');
      document.getElementById('wizard-next').innerHTML = '<i class="fas fa-triangle-exclamation"></i> Trotzdem speichern';
      wizardDuplicateConfirmed = true;
      return;
    }
    if (editIndex >= 0) {
      allData[editIndex] = { ...wizardData };
      setStatus(`Datenfluss von „${wizardData.Quelle}" zu „${wizardData.Ziel}" aktualisiert.`, 'success');
      editIndex = -1;
    } else {
      allData.push({ ...wizardData });
      setStatus(`Datenfluss von „${wizardData.Quelle}" zu „${wizardData.Ziel}" gespeichert.`, 'success');
    }
    wizardDuplicateConfirmed = false;
    buildSidebarFilters();
    applyFilters();
    closeWizard();
  }
});

document.getElementById('wizard-back').addEventListener('click', () => {
  collectWizardStep();
  wizardStep--;
  wizardDuplicateConfirmed = false;
  document.getElementById('wizard-dup-warning').classList.add('hidden');
  renderWizardStep();
});
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
    showAnalyseBriefing();
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
    showAnalyseBriefing();
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
  document.querySelectorAll('.view-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabName)
  );
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tabName).classList.add('active');
  if (tabName === 'network' && networkChart) setTimeout(() => { networkChart.resize(); networkChart.fit(); }, 50);
}

document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// ── Mobile navigation ─────────────────────────────────────────────────────────
const mobileNavBtn = document.getElementById('mobile-nav-btn');
const mobileNav    = document.getElementById('mobile-nav');

mobileNavBtn.addEventListener('click', e => { e.stopPropagation(); mobileNav.classList.toggle('hidden'); });
document.addEventListener('click', () => mobileNav.classList.add('hidden'));
mobileNav.addEventListener('click', e => e.stopPropagation());

document.getElementById('mobile-wizard-btn').addEventListener('click', () => {
  mobileNav.classList.add('hidden');
  openWizard();
});

window.addEventListener('resize', () => {
  if (window.innerWidth <= 768) {
    toggleSidebar(true);
    mobileNav.classList.add('hidden');
  }
});

// ── Sidebar ───────────────────────────────────────────────────────────────────
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar(forceClose) {
  const closing = forceClose || !sidebar.classList.contains('collapsed');
  sidebar.classList.toggle('collapsed', closing);
  sidebarOverlay.classList.toggle('active', !closing);
}

document.getElementById('sidebar-toggle-btn').addEventListener('click', () => toggleSidebar());
sidebarOverlay.addEventListener('click', () => toggleSidebar(true));
document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
document.getElementById('filter-banner-reset').addEventListener('click', clearFilters);
document.getElementById('briefing-dismiss').addEventListener('click', () => {
  document.getElementById('analyse-briefing').classList.add('hidden');
});
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
// ── Network Export ────────────────────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('btn-export-png').addEventListener('click', () => {
  if (!networkChart) return;
  networkChart.png({ output: 'blob', full: true, scale: 2, bg: '#f0edf8' }, blob => downloadBlob(blob, 'datengraf-netzwerk.png'));
});

document.getElementById('btn-export-svg').addEventListener('click', () => {
  if (!networkChart) return;
  const svg  = networkChart.svg({ full: true });
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadBlob(blob, 'datengraf-netzwerk.svg');
});

document.getElementById('nd-close').addEventListener('click', () => {
  document.getElementById('node-detail').classList.add('hidden');
  if (networkChart) networkChart.elements().removeClass('highlighted faded');
});

// ── Pathfinder ────────────────────────────────────────────────────────────────
function populatePathfinderSelects() {
  if (!networkChart) return;
  const nodes = networkChart.nodes().map(n => n.id()).sort((a, b) => a.localeCompare(b));
  ['path-from', 'path-to'].forEach(id => {
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = '<option value="">Knoten wählen…</option>';
    nodes.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      sel.appendChild(opt);
    });
    if (nodes.includes(cur)) sel.value = cur;
  });
}

function clearPath() {
  if (networkChart) networkChart.elements().removeClass('path-node path-edge faded highlighted');
  const r = document.getElementById('pathfinder-result');
  r.textContent = '';
  r.className = 'pathfinder-result';
}

document.getElementById('btn-toggle-pathfinder').addEventListener('click', () => {
  const bar = document.getElementById('pathfinder-bar');
  bar.classList.toggle('hidden');
  const isOpen = !bar.classList.contains('hidden');
  if (isOpen) {
    populatePathfinderSelects();
  } else {
    clearPath();
  }
  // Keep org-legend below the pathfinder bar when both are visible
  const legend = document.getElementById('org-legend');
  legend.style.top = isOpen ? (bar.offsetHeight + 58) + 'px' : '';
});

document.getElementById('btn-find-path').addEventListener('click', () => {
  if (!networkChart) return;
  const from = document.getElementById('path-from').value;
  const to   = document.getElementById('path-to').value;
  const resultEl = document.getElementById('pathfinder-result');

  if (!from || !to) {
    resultEl.textContent = 'Bitte Von- und Nach-Knoten wählen.';
    resultEl.className = 'pathfinder-result';
    return;
  }
  if (from === to) {
    resultEl.textContent = 'Von und Nach sind identisch.';
    resultEl.className = 'pathfinder-result';
    return;
  }

  networkChart.elements().removeClass('path-node path-edge faded highlighted');

  const root = networkChart.$id(from);
  const goal = networkChart.$id(to);
  if (!root.length || !goal.length) return;

  const result = networkChart.elements().aStar({ root, goal, directed: true });

  if (result.found) {
    networkChart.elements().difference(result.path).addClass('faded');
    result.path.nodes().addClass('path-node');
    result.path.edges().addClass('path-edge');
    const nodeCount = result.path.nodes().length;
    const edgeCount = result.path.edges().length;
    const stepNames = result.path.nodes().map(n => n.id()).join(' → ');
    resultEl.textContent = `${nodeCount} Knoten · ${edgeCount} Schritt${edgeCount !== 1 ? 'e' : ''}: ${stepNames}`;
    resultEl.className = 'pathfinder-result found';
    networkChart.fit(result.path, 80);
  } else {
    resultEl.textContent = `Kein Pfad von „${from}" nach „${to}" gefunden.`;
    resultEl.className = 'pathfinder-result not-found';
  }
});

document.getElementById('btn-clear-path').addEventListener('click', clearPath);

// ── Org-Farben ────────────────────────────────────────────────────────────────
function buildOrgColorMap() {
  if (!networkChart) return {};
  const orgs = [...new Set(networkChart.nodes().map(n => n.data('org') || '—'))].sort((a, b) => a.localeCompare(b));
  const map = {};
  orgs.forEach((org, i) => { map[org] = ORG_PALETTE[i % ORG_PALETTE.length]; });
  return map;
}

function applyOrgColors() {
  if (!networkChart) return;
  const map = buildOrgColorMap();
  networkChart.nodes().forEach(node => {
    const c = map[node.data('org') || '—'];
    node.data('orgColor',        c.bg);
    node.data('orgOutlineColor', c.outline);
  });
  const legendItems = document.getElementById('org-legend-items');
  legendItems.innerHTML = Object.entries(map).map(([org, c]) =>
    `<div class="org-legend-item"><span class="org-legend-dot" style="background:${c.bg}"></span><span>${esc(org)}</span></div>`
  ).join('');
  document.getElementById('org-legend').classList.remove('hidden');
}

function clearOrgColors() {
  if (!networkChart) return;
  networkChart.nodes().forEach(node => {
    node.data('orgColor',        '#7a6fa8');
    node.data('orgOutlineColor', '#5c5080');
  });
  document.getElementById('org-legend').classList.add('hidden');
}

document.getElementById('btn-color-by-org').addEventListener('click', () => {
  colorByOrg = !colorByOrg;
  document.getElementById('btn-color-by-org').classList.toggle('active', colorByOrg);
  if (colorByOrg) applyOrgColors();
  else clearOrgColors();
});

document.getElementById('btn-toggle-hierarchy').addEventListener('click', () => {
  orgHierarchyMode = !orgHierarchyMode;
  document.getElementById('btn-toggle-hierarchy').classList.toggle('active', orgHierarchyMode);
  renderNetwork(filteredData);
});

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
    showAnalyseBriefing();
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
const EXAMPLES = {
  wirtschaft: {
    sector: 'Wirtschaft',
    sectorClass: 'sample-card-sector--wirtschaft',
    title: 'Globex Handels GmbH',
    subtitle: 'E-Commerce-Händler · ~180 MA · 28 Datenflüsse',
    file: 'data/sample-wirtschaft.csv',
    context: 'Ein mittelständischer Händler mit hybridem Online-/Stationärgeschäft. Alle Systeme sind über eine zentrale Warenwirtschaft verbunden – die aber historisch gewachsen ist und zunehmend zum Engpass wird. Marketing und Logistik haben sich weitgehend entkoppelt, obwohl ihre Planung voneinander abhängt.',
    findings: [
      { icon: 'fa-arrows-to-dot', label: 'Zentraler Hub',   text: 'Warenwirtschaft hat den höchsten Degree-Wert – kritischer Single Point of Failure mit 9 Verbindungen.' },
      { icon: 'fa-scissors',      label: 'Datensilo',        text: 'Marketing und Logistik sind nicht direkt verbunden – Kampagnenplanung und Lieferzeiten werden nie abgeglichen.' },
      { icon: 'fa-route',         label: 'Lange Kette',      text: 'Online-Bestellung → Warenwirtschaft → Logistik → Retouren → Buchhaltung: 4 Hops, zwei davon manuell.' },
    ]
  },
  zivilgesellschaft: {
    sector: 'Zivilgesellschaft',
    sectorClass: 'sample-card-sector--zivi',
    title: 'Nachbarschaftshilfe e.V.',
    subtitle: 'Wohlfahrtsverband · 6 Gliederungen · 30 Datenflüsse',
    file: 'data/sample-zivilgesellschaft.csv',
    context: 'Ein bundesweit aktiver Wohlfahrtsverband mit Bundesverband, zwei Regionalstellen und drei Ortsgruppen. Datenflüsse sind historisch über E-Mails und Excel gewachsen – ohne einheitliche Struktur. Spendenverwaltung und Programmabteilungen arbeiten vollständig aneinander vorbei.',
    findings: [
      { icon: 'fa-spider',        label: 'Spinnennetz',      text: 'Hohe Kantendichte rund um die Koordinierungsstelle – viele Verbindungen, keine klare Eigentümerschaft.' },
      { icon: 'fa-circle-xmark',  label: 'Isolation',        text: 'Spendenverwaltung und Sozialdienst sind kaum verbunden – Förderberichte können nicht mit Wirkungsdaten belegt werden.' },
      { icon: 'fa-route',         label: 'Langer Pfad',      text: 'Ehrenamtsstunden → Regionalstelle → Bundesverband → Fördermittelmanagement: 3 manuelle Hops bis zum Verwendungsnachweis.' },
    ]
  },
  wissenschaft: {
    sector: 'Wissenschaft',
    sectorClass: 'sample-card-sector--wissenschaft',
    title: 'Institut für Klimaforschung',
    subtitle: 'Forschungsinstitut · 3 Gruppen · 27 Datenflüsse',
    file: 'data/sample-wissenschaft.csv',
    context: 'Ein öffentlich gefördertes Forschungsinstitut mit drei Forschungsgruppen, zentralem Datenmanagement und Drittmittelverwaltung. Jede Gruppe arbeitet in eigenen Datensilos – obwohl alle drei auf denselben Messdaten aufbauen. Alle Außenkommunikation läuft zwingend durch die Drittmittelverwaltung.',
    findings: [
      { icon: 'fa-filter',        label: 'Engpass Verwaltung', text: 'Drittmittelverwaltung liegt auf jedem Pfad zum Fördergeber – höchste Betweenness, aber rein administrativ.' },
      { icon: 'fa-scissors',      label: 'Parallelarbeit',     text: 'Alle drei Forschungsgruppen bereiten dieselben Rohdaten separat auf – kein Datenfluss zwischen ihnen.' },
      { icon: 'fa-hand-paper',    label: 'Blocker-Knoten',     text: 'Ethikkommission hat Betweenness-Wert trotz nur 2 Verbindungen: Forschung wartet auf Votum, bevor sie starten kann.' },
    ]
  },
  medien: {
    sector: 'Medien',
    sectorClass: 'sample-card-sector--medien',
    title: 'Tagesblatt Regional GmbH',
    subtitle: 'Regionalredaktion · digital & print · 28 Datenflüsse',
    file: 'data/sample-medien.csv',
    context: 'Eine Regionalzeitung im Transformationsprozess: Print und Digital laufen parallel, das CMS ist der zentrale Hub. Reichweiten- und Leserdaten werden erhoben, aber nie zur Redaktionsplanung genutzt. Zwischen Vertrieb und Redaktion gibt es keine Verbindung auf Inhaltsebene.',
    findings: [
      { icon: 'fa-arrows-to-dot', label: 'Hub CMS',            text: 'Das CMS bündelt alle Inhalte – aber als reiner Durchlaufknoten ohne Rückkopplung an die Redaktion.' },
      { icon: 'fa-circle-xmark',  label: 'Fehlende Schleife',  text: 'Social-Media-Daten und Leserzahlen fließen nicht in die Themenplanung zurück – Redaktion arbeitet ohne Feedback-Loop.' },
      { icon: 'fa-box-archive',   label: 'Archiv als Sackgasse', text: 'Das Archiv empfängt alles, sendet aber nur auf manuelle Anfrage – automatische Kontextualisierung fehlt.' },
    ]
  },
  verwaltung: {
    sector: 'Verwaltung',
    sectorClass: 'sample-card-sector--verwaltung',
    title: 'Stadtverwaltung Musterstadt',
    subtitle: 'Kommunalverwaltung · ~50.000 EW · 28 Datenflüsse',
    file: 'data/sample-verwaltung.csv',
    context: 'Stadtverwaltung einer Mittelstadt mit 12 Ämtern. Fast alle Informationsflüsse laufen hierarchisch zum Bürgermeisterbüro – aber nie zurück. Ämter kommunizieren kaum lateral miteinander, obwohl viele Fälle mehrere Stellen gleichzeitig betreffen.',
    findings: [
      { icon: 'fa-star',          label: 'Sterntopologie',   text: 'Bürgermeisterbüro hat In-Degree 8, Out-Degree 0 – reiner Empfänger, keine Rückkopplung von Entscheidungen.' },
      { icon: 'fa-circle-xmark',  label: 'Fehlende Brücke',  text: 'Sozialamt und Jugendamt tauschen keine Daten aus – obwohl beide mit denselben Familien arbeiten.' },
      { icon: 'fa-user-shield',   label: 'Passive Rolle',    text: 'IT- und Datenschutzbeauftragte erscheinen nur als Empfänger von Meldungen – ohne ausgehende Empfehlungen.' },
    ]
  }
};

function loadExample(key) {
  const ex = EXAMPLES[key];
  if (!ex) return;
  setStatus('Lade Beispieldaten…', 'loading');
  document.querySelectorAll('.sample-card').forEach(c =>
    c.classList.toggle('active', c.dataset.sample === key)
  );
  fetch(ex.file)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(text => {
      if (!text) { setStatus('Beispieldaten leer.', 'error'); return; }
      allData = parseCSV(text);
      buildSidebarFilters();
      applyFilters();
      showAnalyseBriefing();
      setStatus(`${allData.length} Datenflüsse geladen.`, 'success');
      showExampleInfo(ex);
      switchTab('list');
    })
    .catch(e => setStatus(`Fehler beim Laden: ${e.message}`, 'error'));
}

function showExampleInfo(ex) {
  const panel = document.getElementById('example-info');
  document.getElementById('example-info-sector').textContent    = ex.sector;
  document.getElementById('example-info-sector').className      = 'example-info-sector ' + ex.sectorClass;
  document.getElementById('example-info-title').textContent     = ex.title;
  document.getElementById('example-info-subtitle').textContent  = ex.subtitle;
  document.getElementById('example-info-context').textContent   = ex.context;
  document.getElementById('example-info-findings').innerHTML    = ex.findings.map(f => `
    <div class="example-finding">
      <div class="example-finding-icon"><i class="fas ${esc(f.icon)}"></i></div>
      <div class="example-finding-body">
        <strong>${esc(f.label)}</strong>
        <span>${esc(f.text)}</span>
      </div>
    </div>`).join('');
  panel.classList.remove('hidden');
}

document.querySelectorAll('.sample-card').forEach(card => {
  card.addEventListener('click', () => loadExample(card.dataset.sample));
});

// ── Template Download ─────────────────────────────────────────────────────────
document.getElementById('btn-download-template').addEventListener('click', () => {
  fetch('data/template.csv')
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'datengraf-vorlage.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => {
      // Fallback: direkt navigieren
      const a = document.createElement('a');
      a.href = 'data/template.csv';
      a.download = 'datengraf-vorlage.csv';
      a.click();
    });
});

// ── Hero Section ───────────────────────────────────────────────────────────────
document.getElementById('hero-wizard-btn').addEventListener('click', () => openWizard());
document.getElementById('hero-sample-btn').addEventListener('click', () => {
  if (!importBody.classList.contains('open')) {
    importBody.classList.add('open');
    importToggle.classList.add('open');
    importLabel.textContent = '▲ schließen';
  }
  document.querySelector('.sample-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// ── Page Navigation ────────────────────────────────────────────────────────────
document.getElementById('topbar-brand-link').addEventListener('click', () => location.reload());

// ── Theory Modal ──────────────────────────────────────────────────────────────
const theoryBackdrop = document.getElementById('theory-backdrop');
document.getElementById('open-theory-btn').addEventListener('click', () => theoryBackdrop.classList.remove('hidden'));
document.getElementById('theory-close').addEventListener('click',    () => theoryBackdrop.classList.add('hidden'));
theoryBackdrop.addEventListener('click', e => { if (e.target === theoryBackdrop) theoryBackdrop.classList.add('hidden'); });

// ── PDF-Bericht ───────────────────────────────────────────────────────────────
function buildReportHTML(networkImgUri) {
  const data = filteredData.length ? filteredData : allData;
  const isFiltered = filteredData.length !== allData.length && allData.length > 0;
  const e = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const nodes = new Set([...data.map(r => r.Quelle), ...data.map(r => r.Ziel)].filter(Boolean));
  const dsgvoCount = data.filter(r => r.Schutzbedarf === 'DSGVO-relevant').length;
  const orgs = new Set(data.map(r => r.QuelleOrganisation).filter(Boolean));

  const deg = {};
  data.forEach(r => {
    if (r.Quelle) { if (!deg[r.Quelle]) deg[r.Quelle] = { out: 0, inn: 0 }; deg[r.Quelle].out++; }
    if (r.Ziel)   { if (!deg[r.Ziel])   deg[r.Ziel]   = { out: 0, inn: 0 }; deg[r.Ziel].inn++; }
  });
  const topNodes = Object.entries(deg)
    .sort((a, b) => (b[1].out + b[1].inn) - (a[1].out + a[1].inn))
    .slice(0, 10);

  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  const schutzBadge = v => {
    const safe = e(v);
    if (v === 'DSGVO-relevant') return `<span class="badge badge-dsgvo">${safe}</span>`;
    if (v === 'Intern')         return `<span class="badge badge-intern">${safe}</span>`;
    if (v === 'Öffentlich')     return `<span class="badge badge-public">${safe}</span>`;
    return safe;
  };

  return `<!DOCTYPE html><html lang="de"><head>
<meta charset="UTF-8">
<title>DatenGraf – Bericht</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e1b2e; padding: 40px; font-size: 12px; line-height: 1.5; }
h1 { font-size: 22px; color: #420093; font-weight: 800; letter-spacing: -0.5px; }
.meta { color: #7a7591; font-size: 12px; margin: 4px 0 28px; }
.section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #7a7591; font-weight: 700; margin: 28px 0 12px; border-bottom: 2px solid #ede9f8; padding-bottom: 5px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-box { background: #f5f3fb; border-radius: 8px; padding: 14px 12px; text-align: center; }
.stat-value { font-size: 26px; font-weight: 800; color: #420093; }
.stat-label { font-size: 10px; color: #7a7591; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
img.net { max-width: 100%; border-radius: 8px; border: 1px solid #e0dce8; display: block; }
table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
th { background: #420093; color: #fff; padding: 7px 10px; text-align: left; font-weight: 600; white-space: nowrap; }
td { padding: 6px 10px; border-bottom: 1px solid #ede9f8; vertical-align: middle; }
tr:nth-child(even) td { background: #f8f6fc; }
.num { text-align: center; }
.bold { font-weight: 700; }
.badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.badge-dsgvo  { background: #fde8e8; color: #c0392b; }
.badge-intern { background: #fef3e2; color: #d4820a; }
.badge-public { background: #e8f8ee; color: #2e9e60; }
.filter-note { font-size: 11px; color: #7a7591; font-style: italic; margin-top: 8px; }
@media print { @page { margin: 15mm 18mm; size: A4; } body { padding: 0; } }
</style></head><body>
<h1>DatenGraf – Datenfluss-Bericht</h1>
<div class="meta">Erstellt am ${date}${isFiltered ? ' &nbsp;·&nbsp; Gefilterter Datensatz' : ''}</div>

<div class="section-title">Übersicht</div>
<div class="stats-grid">
  <div class="stat-box"><div class="stat-value">${data.length}</div><div class="stat-label">Datenflüsse</div></div>
  <div class="stat-box"><div class="stat-value">${nodes.size}</div><div class="stat-label">Knoten</div></div>
  <div class="stat-box"><div class="stat-value">${dsgvoCount}</div><div class="stat-label">DSGVO-relevant</div></div>
  <div class="stat-box"><div class="stat-value">${orgs.size || '—'}</div><div class="stat-label">Organisationen</div></div>
</div>
${isFiltered ? '<p class="filter-note">* Es sind Filter aktiv – der Bericht zeigt nur den gefilterten Datensatz.</p>' : ''}

${networkImgUri ? `
<div class="section-title">Netzwerkkarte</div>
<img class="net" src="${networkImgUri}" alt="Netzwerkkarte">
` : ''}

<div class="section-title">Top-Knoten nach Vernetzungsgrad</div>
<table>
  <thead><tr><th>#</th><th>Knoten</th><th class="num">Ausgehend</th><th class="num">Eingehend</th><th class="num">Gesamt</th></tr></thead>
  <tbody>${topNodes.map(([name, d], i) => `
    <tr><td>${i + 1}</td><td>${e(name)}</td><td class="num">${d.out}</td><td class="num">${d.inn}</td><td class="num bold">${d.out + d.inn}</td></tr>`).join('')}
  </tbody>
</table>

<div class="section-title">Alle Datenflüsse (${data.length})</div>
<table>
  <thead><tr><th>Quelle</th><th>Ziel</th><th>Beziehung</th><th>Datentyp</th><th>Häufigkeit</th><th>Format</th><th>Schutzbedarf</th><th>Ansprechpartner</th></tr></thead>
  <tbody>${data.map(r => `
    <tr><td>${e(r.Quelle)}</td><td>${e(r.Ziel)}</td><td>${e(r.Beziehung)}</td><td>${e(r.Datentyp)}</td><td>${e(r.Häufigkeit)}</td><td>${e(r.Format)}</td><td>${schutzBadge(r.Schutzbedarf)}</td><td>${e(r.Ansprechpartner)}</td></tr>`).join('')}
  </tbody>
</table>
</body></html>`;
}

document.getElementById('pdf-report-btn').addEventListener('click', () => {
  if (!allData.length) { setStatus('Keine Daten für Bericht.', 'error'); return; }
  const openReport = uri => {
    const win = window.open('', '_blank');
    if (!win) { setStatus('Popup blockiert – bitte Popup-Blocker deaktivieren.', 'error'); return; }
    win.document.write(buildReportHTML(uri));
    win.document.close();
    if (win.document.readyState === 'complete') {
      setTimeout(() => win.print(), 300);
    } else {
      win.addEventListener('load', () => setTimeout(() => win.print(), 300));
    }
  };
  if (networkChart) {
    const uri = networkChart.png({ output: 'base64uri', full: true, scale: 2, bg: '#f0edf8' });
    openReport(typeof uri === 'string' ? uri : null);
  } else {
    openReport(null);
  }
});

// ── Share Link ────────────────────────────────────────────────────────────────
document.getElementById('share-link-btn').addEventListener('click', () => {
  if (!allData.length) { setStatus('Keine Daten zum Teilen.', 'error'); return; }
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(allData));
  const url = `${location.origin}${location.pathname}#share=${compressed}`;
  if (url.length > 15000) {
    setStatus('Datensatz zu groß für einen Link – bitte CSV-Export verwenden.', 'error');
    return;
  }
  navigator.clipboard.writeText(url)
    .then(() => setStatus('Link kopiert! Einfach weiterschicken.', 'success'))
    .catch(() => { prompt('Link kopieren:', url); });
});

function loadFromShareHash() {
  const hash = location.hash;
  if (!hash.startsWith('#share=')) return;
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash.slice(7));
    if (!json) { setStatus('Link-Daten konnten nicht geladen werden.', 'error'); return; }
    const data = JSON.parse(json);
    if (!Array.isArray(data) || !data.length) return;
    allData = data;
    buildSidebarFilters();
    applyFilters();
    showAnalyseBriefing();
    setStatus(`${data.length} Datenflüsse aus geteiltem Link geladen.`, 'success');
    history.replaceState(null, '', location.pathname);
  } catch {
    setStatus('Link-Daten konnten nicht geladen werden.', 'error');
  }
}

// ── Snapshots ─────────────────────────────────────────────────────────────────
const LS_SNAP_PREFIX = 'datengraf_snap_';

function listSnapshots() {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(LS_SNAP_PREFIX))
    .map(k => ({ key: k, name: k.slice(LS_SNAP_PREFIX.length) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderSnapshotList() {
  const listEl = document.getElementById('snapshot-list');
  const snaps  = listSnapshots();
  if (!snaps.length) {
    listEl.innerHTML = '<p class="snapshot-empty">Noch keine Snapshots gespeichert.</p>';
    return;
  }
  listEl.innerHTML = snaps.map(s => `
    <div class="snapshot-item">
      <span class="snapshot-name">${esc(s.name)}</span>
      <div class="snapshot-item-actions">
        <button class="btn btn-primary btn-sm" data-snap-load="${esc(s.key)}" data-snap-name="${esc(s.name)}">Laden</button>
        <button class="btn btn-secondary btn-sm" data-snap-del="${esc(s.key)}">✕</button>
      </div>
    </div>`).join('');

  listEl.querySelectorAll('[data-snap-load]').forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const saved = localStorage.getItem(btn.dataset.snapLoad);
        if (!saved) return;
        allData = JSON.parse(saved);
        buildSidebarFilters();
        applyFilters();
        showAnalyseBriefing();
        setStatus(`Snapshot „${btn.dataset.snapName}" geladen (${allData.length} Einträge).`, 'success');
        closeSnapshotModal();
      } catch { setStatus('Snapshot konnte nicht geladen werden.', 'error'); }
    });
  });

  listEl.querySelectorAll('[data-snap-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem(btn.dataset.snapDel);
      renderSnapshotList();
    });
  });
}

function openSnapshotModal() {
  renderSnapshotList();
  document.getElementById('snapshot-backdrop').classList.remove('hidden');
}

function closeSnapshotModal() {
  document.getElementById('snapshot-backdrop').classList.add('hidden');
  document.getElementById('snapshot-name-input').value = '';
}

document.getElementById('snapshot-save-btn').addEventListener('click', () => {
  const name = document.getElementById('snapshot-name-input').value.trim();
  if (!name) { document.getElementById('snapshot-name-input').focus(); return; }
  if (!allData.length) { setStatus('Keine Daten zum Speichern.', 'error'); return; }
  localStorage.setItem(LS_SNAP_PREFIX + name, JSON.stringify(allData));
  setStatus(`Snapshot „${name}" gespeichert (${allData.length} Einträge).`, 'success');
  document.getElementById('snapshot-name-input').value = '';
  renderSnapshotList();
});

document.getElementById('open-snapshots-btn').addEventListener('click', openSnapshotModal);
document.getElementById('snapshot-close-btn').addEventListener('click', closeSnapshotModal);
document.getElementById('snapshot-backdrop').addEventListener('click', e => { if (e.target === e.currentTarget) closeSnapshotModal(); });

// ── Init ──────────────────────────────────────────────────────────────────────
loadFromShareHash();
renderAll();
