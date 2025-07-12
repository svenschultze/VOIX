<template>
  <div class="demo-container">
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
    <context name="table_state" id="demo-table-context">
      {{ contextText }}
    </context>

    <!-- Table UI -->
    <div id="demo-table-container">
      <div id="demo-table-controls">
        <span>{{ selectedRows.size }} rows selected</span>
        <div>{{ filterDisplay }}</div>
      </div>
      
      <table id="demo-data-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" 
                     :checked="selectAllChecked"
                     @change="toggleSelectAll">
            </th>
            <th v-for="col in columns" 
                :key="col"
                @click="handleSort(col)"
                class="sortable">
              {{ col.charAt(0).toUpperCase() + col.slice(1) }} 
              <span class="sort-icon">{{ getSortIcon(col) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayData" :key="row.id">
            <td>
              <input type="checkbox" 
                     :checked="selectedRows.has(row.id)"
                     @change="toggleRowSelection(row.id)">
            </td>
            <td>{{ row.name }}</td>
            <td>{{ row.email }}</td>
            <td>{{ row.role }}</td>
            <td>{{ row.joined }}</td>
            <td>
              <span :class="['status-badge', `status-${row.status.toLowerCase()}`]">
                {{ row.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="exportMessage" class="export-message">{{ exportMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const tableData = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", joined: "2023-01-15", status: "Active" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "User", joined: "2023-02-20", status: "Active" },
  { id: 3, name: "Carol Davis", email: "carol@example.com", role: "Editor", joined: "2023-03-10", status: "Active" },
  { id: 4, name: "David Wilson", email: "david@example.com", role: "User", joined: "2023-04-05", status: "Inactive" },
  { id: 5, name: "Eve Martinez", email: "eve@example.com", role: "Admin", joined: "2023-05-12", status: "Active" },
  { id: 6, name: "Frank Brown", email: "frank@example.com", role: "Editor", joined: "2023-06-08", status: "Active" },
  { id: 7, name: "Grace Lee", email: "grace@example.com", role: "User", joined: "2023-07-22", status: "Pending" },
  { id: 8, name: "Henry Taylor", email: "henry@example.com", role: "User", joined: "2023-08-30", status: "Active" }
]

const columns = ['name', 'email', 'role', 'joined', 'status']
const displayData = ref([...tableData])
const sortColumn = ref(null)
const sortOrder = ref(null)
const filters = ref({})
const selectedRows = ref(new Set())
const exportMessage = ref('')

const selectAllChecked = computed(() => {
  return selectedRows.value.size === displayData.value.length && displayData.value.length > 0
})

const filterDisplay = computed(() => {
  const filterTexts = Object.entries(filters.value).map(([col, val]) => `${col}: "${val}"`)
  return filterTexts.length ? `Filters: ${filterTexts.join(', ')}` : ''
})

const contextText = computed(() => {
  const sortText = sortColumn.value ? `${sortColumn.value} ${sortOrder.value}` : 'none'
  const filterText = Object.keys(filters.value).length ? JSON.stringify(filters.value) : 'none'
  
  return `Total rows: ${tableData.length}
Visible rows: ${displayData.value.length}
Selected rows: ${selectedRows.value.size}
Sort: ${sortText}
Filter: ${filterText}
Available columns: name, email, role, joined, status

Roles: ${[...new Set(tableData.map(r => r.role))].join(', ')}
Statuses: ${[...new Set(tableData.map(r => r.status))].join(', ')}`
})

const getSortIcon = (column) => {
  if (sortColumn.value === column) {
    return sortOrder.value === 'asc' ? '▲' : '▼'
  }
  return ''
}

const handleSort = (column) => {
  const newOrder = sortColumn.value === column && sortOrder.value === 'asc' ? 'desc' : 'asc'
  sortColumn.value = column
  sortOrder.value = newOrder
  applyFiltersAndSort()
}

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    displayData.value.forEach(row => selectedRows.value.add(row.id))
  } else {
    selectedRows.value.clear()
  }
}

const toggleRowSelection = (id) => {
  if (selectedRows.value.has(id)) {
    selectedRows.value.delete(id)
  } else {
    selectedRows.value.add(id)
  }
}

const applyFiltersAndSort = () => {
  // Start with all data
  let filtered = [...tableData]
  
  // Apply filters
  Object.entries(filters.value).forEach(([column, value]) => {
    filtered = filtered.filter(row => 
      row[column].toLowerCase().includes(value)
    )
  })
  
  // Apply sorting
  if (sortColumn.value) {
    filtered.sort((a, b) => {
      const aVal = a[sortColumn.value]
      const bVal = b[sortColumn.value]
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder.value === 'asc' ? comparison : -comparison
    })
  }
  
  displayData.value = filtered
}

const showMessage = (text) => {
  exportMessage.value = text
  setTimeout(() => {
    exportMessage.value = ''
  }, 3000)
}

const handlers = {
  sort_table: ({ column, order = 'asc' }) => {
    sortColumn.value = column
    sortOrder.value = order
    applyFiltersAndSort()
  },
  
  filter_table: ({ column, value }) => {
    if (value) {
      filters.value[column] = value.toLowerCase()
    } else {
      delete filters.value[column]
    }
    applyFiltersAndSort()
  },
  
  select_rows: ({ criteria }) => {
    selectedRows.value.clear()
    
    if (criteria === 'all') {
      displayData.value.forEach(row => selectedRows.value.add(row.id))
    } else if (criteria === 'none') {
      // Already cleared
    } else {
      // Select by status
      displayData.value.forEach(row => {
        if (row.status.toLowerCase() === criteria.toLowerCase()) {
          selectedRows.value.add(row.id)
        }
      })
    }
  },
  
  export_data: ({ format, selected = false }) => {
    const dataToExport = selected 
      ? displayData.value.filter(row => selectedRows.value.has(row.id))
      : displayData.value
    
    switch (format) {
      case 'csv':
        exportCSV(dataToExport)
        break
      case 'json':
        exportJSON(dataToExport)
        break
      case 'clipboard':
        copyToClipboard(dataToExport)
        break
    }
  },
  
  reset_table: () => {
    sortColumn.value = null
    sortOrder.value = null
    filters.value = {}
    selectedRows.value.clear()
    applyFiltersAndSort()
  }
}

const exportCSV = (data) => {
  const headers = ['name', 'email', 'role', 'joined', 'status']
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
  ].join('\n')
  
  showMessage(`CSV exported (${data.length} rows)`)
  console.log('CSV:', csv)
}

const exportJSON = (data) => {
  const json = JSON.stringify(data, null, 2)
  showMessage(`JSON exported (${data.length} rows)`)
  console.log('JSON:', json)
}

const copyToClipboard = (data) => {
  const text = data.map(row => 
    `${row.name}\t${row.email}\t${row.role}\t${row.joined}\t${row.status}`
  ).join('\n')
  
  navigator.clipboard.writeText(text)
  showMessage(`Copied ${data.length} rows to clipboard`)
}

const handleToolCall = (e) => {
  const toolName = e.target.getAttribute('name')
  if (handlers[toolName]) {
    handlers[toolName](e.detail)
  }
}

onMounted(() => {
  const tools = document.querySelectorAll('.demo-container tool[name]')
  tools.forEach(tool => {
    tool.addEventListener('call', handleToolCall)
  })
})

onUnmounted(() => {
  const tools = document.querySelectorAll('.demo-container tool[name]')
  tools.forEach(tool => {
    tool.removeEventListener('call', handleToolCall)
  })
})
</script>

<style scoped>
.demo-container {
  border: 2px solid var(--vp-c-brand);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  background: var(--vp-c-bg-soft);
}

#demo-table-container {
  max-width: 100%;
  overflow-x: auto;
}

#demo-table-controls {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  font-size: 0.875rem;
}

#demo-data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--vp-c-bg);
}

#demo-data-table th,
#demo-data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

#demo-data-table th {
  background: var(--vp-c-bg-soft);
  font-weight: bold;
  user-select: none;
}

#demo-data-table th.sortable {
  cursor: pointer;
}

#demo-data-table th.sortable:hover {
  background: var(--vp-c-bg-soft);
  opacity: 0.8;
}

.sort-icon {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: var(--vp-c-brand);
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

.export-message {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #d1ecf1;
  color: #0c5460;
  border-radius: 4px;
  text-align: center;
}
</style>