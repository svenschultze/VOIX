---
layout: doc
---

<script setup>
import DataTableDemo from './components/DataTableDemo.vue'
</script>

# Datentabellen-Demo

Diese Demo zeigt, wie VOIX Benutzern bei der Interaktion mit Datentabellen helfen kann - Sortieren, Filtern und Exportieren von Daten mit natürlicher Sprache.

## Wie es funktioniert

Die Datentabelle bietet Werkzeuge zur Bearbeitung und zum Export von tabellarischen Daten, wobei der Kontext den aktuellen Tabellenzustand anzeigt.

## Code

```html
<!-- Datentabellen-Werkzeuge -->
<tool name="sort_table" description="Die Tabelle nach einer Spalte sortieren">
  <prop name="column" type="string" description="Spaltenname: name, email, role, joined oder status"/>
  <prop name="order" type="string" description="asc oder desc"/>
</tool>

<tool name="filter_table" description="Tabellenzeilen filtern">
  <prop name="column" type="string" description="Zu filternde Spalte"/>
  <prop name="value" type="string" description="Filterwert"/>
</tool>

<tool name="select_rows" description="Zeilen nach Kriterien auswählen">
  <prop name="criteria" type="string" description="all, none oder spezifischer Status"/>
</tool>

<tool name="export_data" description="Tabellendaten exportieren">
  <prop name="format" type="string" description="csv, json oder Zwischenablage"/>
  <prop name="selected" type="boolean" description="Nur ausgewählte Zeilen exportieren"/>
</tool>

<tool name="reset_table" description="Alle Filter und Sortierungen zurücksetzen">
</tool>

<!-- Tabellenkontext -->
<context name="table_state" id="table-context">
  Gesamtzeilen: 8
  Sichtbare Zeilen: 8
  Ausgewählte Zeilen: 0
  Sortierung: keine
  Filter: keiner
  Verfügbare Spalten: name, email, role, joined, status
</context>

<!-- Tabellen-UI -->
<div id="table-container">
  <div id="table-controls">
    <span id="selection-info">0 Zeilen ausgewählt</span>
    <div id="active-filters"></div>
  </div>
  
  <table id="data-table">
    <thead>
      <tr>
        <th><input type="checkbox" id="select-all"></th>
        <th data-column="name">Name <span class="sort-icon"></span></th>
        <th data-column="email">E-Mail <span class="sort-icon"></span></th>
        <th data-column="role">Rolle <span class="sort-icon"></span></th>
        <th data-column="joined">Beigetreten <span class="sort-icon"></span></th>
        <th data-column="status">Status <span class="sort-icon"></span></th>
      </tr>
    </thead>
    <tbody id="table-body"></tbody>
  </table>
  
  <div id="export-message"></div>
</div>

<script>
// Beispieldaten
const tableData = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", joined: "2023-01-15", status: "Active" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "User", joined: "2023-02-20", status: "Active" },
  { id: 3, name: "Carol Davis", email: "carol@example.com", role: "Editor", joined: "2023-03-10", status: "Active" },
  { id: 4, name: "David Wilson", email: "david@example.com", role: "User", joined: "2023-04-05", status: "Inactive" },
  { id: 5, name: "Eve Martinez", email: "eve@example.com", role: "Admin", joined: "2023-05-12", status: "Active" },
  { id: 6, name: "Frank Brown", email: "frank@example.com", role: "Editor", joined: "2023-06-08", status: "Active" },
  { id: 7, name: "Grace Lee", email: "grace@example.com", role: "User", joined: "2023-07-22", status: "Pending" },
  { id: 8, name: "Henry Taylor", email: "henry@example.com", role: "User", joined: "2023-08-30", status: "Active" }
];

// Zustand
let displayData = [...tableData];
let sortColumn = null;
let sortOrder = null;
let filters = {};
let selectedRows = new Set();

// Werkzeug-Handler
const handlers = {
  sort_table: ({ column, order = 'asc' }) => {
    sortColumn = column;
    sortOrder = order;
    applyFiltersAndSort();
  },
  
  filter_table: ({ column, value }) => {
    if (value) {
      filters[column] = value.toLowerCase();
    } else {
      delete filters[column];
    }
    applyFiltersAndSort();
  },
  
  select_rows: ({ criteria }) => {
    selectedRows.clear();
    
    if (criteria === 'all') {
      displayData.forEach(row => selectedRows.add(row.id));
    } else if (criteria === 'none') {
      // Bereits geleert
    } else {
      // Nach Status auswählen
      displayData.forEach(row => {
        if (row.status.toLowerCase() === criteria.toLowerCase()) {
          selectedRows.add(row.id);
        }
      });
    }
    
    updateUI();
  },
  
  export_data: ({ format, selected = false }) => {
    const dataToExport = selected 
      ? displayData.filter(row => selectedRows.has(row.id))
      : displayData;
    
    switch (format) {
      case 'csv':
        exportCSV(dataToExport);
        break;
      case 'json':
        exportJSON(dataToExport);
        break;
      case 'clipboard':
        copyToClipboard(dataToExport);
        break;
    }
  },
  
  reset_table: () => {
    sortColumn = null;
    sortOrder = null;
    filters = {};
    selectedRows.clear();
    applyFiltersAndSort();
  }
};

// Event-Listener anhängen
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Klicks auf Tabellenkopf
document.querySelectorAll('th[data-column]').forEach(th => {
  th.addEventListener('click', () => {
    const column = th.dataset.column;
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    handlers.sort_table({ column, order: newOrder });
  });
});

// Alle auswählen Checkbox
document.getElementById('select-all').addEventListener('change', (e) => {
  if (e.target.checked) {
    handlers.select_rows({ criteria: 'all' });
  } else {
    handlers.select_rows({ criteria: 'none' });
  }
});

// Filter und Sortierung anwenden
function applyFiltersAndSort() {
  // Mit allen Daten beginnen
  displayData = [...tableData];
  
  // Filter anwenden
  Object.entries(filters).forEach(([column, value]) => {
    displayData = displayData.filter(row => 
      row[column].toLowerCase().includes(value)
    );
  });
  
  // Sortierung anwenden
  if (sortColumn) {
    displayData.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
  
  updateUI();
}

// UI aktualisieren
function updateUI() {
  // Tabellenkörper rendern
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = displayData.map(row => `
    <tr>
      <td><input type="checkbox" value="${row.id}" ${selectedRows.has(row.id) ? 'checked' : ''}></td>
      <td>${row.name}</td>
      <td>${row.email}</td>
      <td>${row.role}</td>
      <td>${row.joined}</td>
      <td><span class="status-badge status-${row.status.toLowerCase()}">${row.status}</span></td>
    </tr>
  `).join('');
  
  // Zeilenauswahl
  tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = parseInt(e.target.value);
      if (e.target.checked) {
        selectedRows.add(id);
      } else {
        selectedRows.delete(id);
      }
      updateSelectionInfo();
    });
  });
  
  // Sortierungsindikatoren aktualisieren
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.textContent = '';
  });
  if (sortColumn) {
    const icon = document.querySelector(`[data-column="${sortColumn}"] .sort-icon`);
    icon.textContent = sortOrder === 'asc' ? '▲' : '▼';
  }
  
  // Filteranzeige aktualisieren
  const filterDisplay = document.getElementById('active-filters');
  const filterTexts = Object.entries(filters).map(([col, val]) => `${col}: "${val}"`);
  filterDisplay.textContent = filterTexts.length ? `Filter: ${filterTexts.join(', ')}` : '';
  
  updateSelectionInfo();
  updateContext();
}

// Auswahl-Info aktualisieren
function updateSelectionInfo() {
  document.getElementById('selection-info').textContent = `${selectedRows.size} Zeilen ausgewählt`;
  document.getElementById('select-all').checked = selectedRows.size === displayData.length && displayData.length > 0;
}

// Kontext aktualisieren
function updateContext() {
  const sortText = sortColumn ? `${sortColumn} ${sortOrder}` : 'keine';
  const filterText = Object.keys(filters).length ? JSON.stringify(filters) : 'keiner';
  
  document.getElementById('table-context').textContent = `
Gesamtzeilen: ${tableData.length}
Sichtbare Zeilen: ${displayData.length}
Ausgewählte Zeilen: ${selectedRows.size}
Sortierung: ${sortText}
Filter: ${filterText}
Verfügbare Spalten: name, email, role, joined, status

Rollen: ${[...new Set(tableData.map(r => r.role))].join(', ')}
Status: ${[...new Set(tableData.map(r => r.status))].join(', ')}
  `;
}

// Exportfunktionen
function exportCSV(data) {
  const headers = ['name', 'email', 'role', 'joined', 'status'];
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
  ].join('\n');
  
  showMessage(`CSV exportiert (${data.length} Zeilen)`);
  console.log('CSV:', csv);
}

function exportJSON(data) {
  const json = JSON.stringify(data, null, 2);
  showMessage(`JSON exportiert (${data.length} Zeilen)`);
  console.log('JSON:', json);
}

function copyToClipboard(data) {
  const text = data.map(row => 
    `${row.name}\t${row.email}\t${row.role}\t${row.joined}\t${row.status}`
  ).join('\n');
  
  navigator.clipboard.writeText(text);
  showMessage(`${data.length} Zeilen in die Zwischenablage kopiert`);
}

function showMessage(text) {
  const msg = document.getElementById('export-message');
  msg.textContent = text;
  setTimeout(() => msg.textContent = '', 3000);
}

// Erstes Rendern
updateUI();
</script>

<style>
#table-container {
  max-width: 100%;
  overflow-x: auto;
}

#table-controls {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  font-size: 0.875rem;
}

#data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

#data-table th,
#data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

#data-table th {
  background: #f5f5f5;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

#data-table th:hover {
  background: #e9e9e9;
}

.sort-icon {
  margin-left: 0.5rem;
  font-size: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-inactive {
  background: #f8d7da;
  color: #721c24;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

#export-message {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #d1ecf1;
  color: #0c5460;
  border-radius: 4px;
  text-align: center;
  display: none;
}

#export-message:not(:empty) {
  display: block;
}
</style>
```

## Probieren Sie es aus

<DataTableDemo />

## Beispielinteraktionen

Versuchen Sie dies mit VOIX:

- "Nach Name aufsteigend sortieren"
- "Rolle filtern, um nur Admins anzuzeigen"
- "Alle aktiven Benutzer auswählen"
- "Ausgewählte Zeilen als CSV exportieren"
- "Benutzer anzeigen, die nach dem 01.06.2023 beigetreten sind"
- "Tabelle zurücksetzen"

Die KI liest den Tabellenkontext, um verfügbare Spalten, aktuelle Filter und Daten zu verstehen.
