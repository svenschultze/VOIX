---
layout: doc
---

<script setup>
import DataTableDemo from './.vitepress/components/DataTableDemo.vue'
</script>

# Data Table Demo

This demo shows how VOIX can help users interact with data tables - sorting, filtering, and exporting data using natural language.

## How It Works

The data table provides tools for manipulating and exporting tabular data, with context showing current table state.

## Code

```html
<!-- Data table tools -->
<tool name="sort_table" description="Sort the table by a column">
  <prop name="column" type="string" description="Column name: name, email, role, joined, or status"/>
  <prop name="order" type="string" description="asc or desc"/>
</tool>

<tool name="filter_table" description="Filter table rows">
  <prop name="column" type="string" description="Column to filter"/>
  <prop name="value" type="string" description="Filter value"/>
</tool>

<tool name="select_rows" description="Select rows by criteria">
  <prop name="criteria" type="string" description="all, none, or specific status"/>
</tool>

<tool name="export_data" description="Export table data">
  <prop name="format" type="string" description="csv, json, or clipboard"/>
  <prop name="selected" type="boolean" description="Export only selected rows"/>
</tool>

<tool name="reset_table" description="Reset all filters and sorting">
</tool>

<!-- Table context -->
<context name="table_state" id="table-context">
  Total rows: 8
  Visible rows: 8
  Selected rows: 0
  Sort: none
  Filter: none
  Available columns: name, email, role, joined, status
</context>

<!-- Table UI -->
<div id="table-container">
  <div id="table-controls">
    <span id="selection-info">0 rows selected</span>
    <div id="active-filters"></div>
  </div>
  
  <table id="data-table">
    <thead>
      <tr>
        <th><input type="checkbox" id="select-all"></th>
        <th data-column="name">Name <span class="sort-icon"></span></th>
        <th data-column="email">Email <span class="sort-icon"></span></th>
        <th data-column="role">Role <span class="sort-icon"></span></th>
        <th data-column="joined">Joined <span class="sort-icon"></span></th>
        <th data-column="status">Status <span class="sort-icon"></span></th>
      </tr>
    </thead>
    <tbody id="table-body"></tbody>
  </table>
  
  <div id="export-message"></div>
</div>

<script>
// Sample data
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

// State
let displayData = [...tableData];
let sortColumn = null;
let sortOrder = null;
let filters = {};
let selectedRows = new Set();

// Tool handlers
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
      // Already cleared
    } else {
      // Select by status
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

// Attach event listeners
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Table header clicks
document.querySelectorAll('th[data-column]').forEach(th => {
  th.addEventListener('click', () => {
    const column = th.dataset.column;
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    handlers.sort_table({ column, order: newOrder });
  });
});

// Select all checkbox
document.getElementById('select-all').addEventListener('change', (e) => {
  if (e.target.checked) {
    handlers.select_rows({ criteria: 'all' });
  } else {
    handlers.select_rows({ criteria: 'none' });
  }
});

// Apply filters and sorting
function applyFiltersAndSort() {
  // Start with all data
  displayData = [...tableData];
  
  // Apply filters
  Object.entries(filters).forEach(([column, value]) => {
    displayData = displayData.filter(row => 
      row[column].toLowerCase().includes(value)
    );
  });
  
  // Apply sorting
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

// Update UI
function updateUI() {
  // Render table body
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
  
  // Row selection
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
  
  // Update sort indicators
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.textContent = '';
  });
  if (sortColumn) {
    const icon = document.querySelector(`[data-column="${sortColumn}"] .sort-icon`);
    icon.textContent = sortOrder === 'asc' ? '▲' : '▼';
  }
  
  // Update filters display
  const filterDisplay = document.getElementById('active-filters');
  const filterTexts = Object.entries(filters).map(([col, val]) => `${col}: "${val}"`);
  filterDisplay.textContent = filterTexts.length ? `Filters: ${filterTexts.join(', ')}` : '';
  
  updateSelectionInfo();
  updateContext();
}

// Update selection info
function updateSelectionInfo() {
  document.getElementById('selection-info').textContent = `${selectedRows.size} rows selected`;
  document.getElementById('select-all').checked = selectedRows.size === displayData.length && displayData.length > 0;
}

// Update context
function updateContext() {
  const sortText = sortColumn ? `${sortColumn} ${sortOrder}` : 'none';
  const filterText = Object.keys(filters).length ? JSON.stringify(filters) : 'none';
  
  document.getElementById('table-context').textContent = `
Total rows: ${tableData.length}
Visible rows: ${displayData.length}
Selected rows: ${selectedRows.size}
Sort: ${sortText}
Filter: ${filterText}
Available columns: name, email, role, joined, status

Roles: ${[...new Set(tableData.map(r => r.role))].join(', ')}
Statuses: ${[...new Set(tableData.map(r => r.status))].join(', ')}
  `;
}

// Export functions
function exportCSV(data) {
  const headers = ['name', 'email', 'role', 'joined', 'status'];
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
  ].join('\n');
  
  showMessage(`CSV exported (${data.length} rows)`);
  console.log('CSV:', csv);
}

function exportJSON(data) {
  const json = JSON.stringify(data, null, 2);
  showMessage(`JSON exported (${data.length} rows)`);
  console.log('JSON:', json);
}

function copyToClipboard(data) {
  const text = data.map(row => 
    `${row.name}\t${row.email}\t${row.role}\t${row.joined}\t${row.status}`
  ).join('\n');
  
  navigator.clipboard.writeText(text);
  showMessage(`Copied ${data.length} rows to clipboard`);
}

function showMessage(text) {
  const msg = document.getElementById('export-message');
  msg.textContent = text;
  setTimeout(() => msg.textContent = '', 3000);
}

// Initial render
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

## Try It

<DataTableDemo />

## Example Interactions

Try these with VOIX:

- "Sort by name ascending"
- "Filter role to show only admins"
- "Select all active users"
- "Export selected rows as CSV"
- "Show users who joined after 2023-06-01"
- "Reset the table"

The AI reads the table context to understand available columns, current filters, and data.