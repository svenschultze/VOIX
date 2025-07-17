<template>
  <div class="code-editor-demo">
    <!-- Tools -->
    <tool name="list_directory" description="Lists files and directories recursively" @call="listDirectory" return><prop name="path" type="string"></prop></tool>
    <tool name="read_file" description="Reads a file's content" @call="readFile" return><prop name="absolute_path" type="string" required></prop></tool>
    <tool name="write_file" description="Writes content to a file" @call="writeFile" return><prop name="file_path" type="string" required/><prop name="content" type="string" required></prop></tool>
    <tool name="replace" description="Replaces text in a file" @call="replaceText" return><prop name="file_path" type="string" required/><prop name="old_string" type="string" required/><prop name="new_string" type="string" required></prop></tool>
    <tool name="create_directory" description="Creates a new directory" @call="createDirectory" return><prop name="path" type="string" required></prop></tool>
    <tool name="rename_item" description="Renames a file or directory" @call="renameItem" return><prop name="old_path" type="string" required/><prop name="new_path" type="string" required></prop></tool>
    <tool name="delete_item" description="Deletes a file or directory" @call="deleteItem" return><prop name="path" type="string" required></prop></tool>

    <context name="editor_context">{{ editorContext }}</context>
    <context name="file_system" id="file-system-ctx">
      {{ JSON.stringify(fileSystem, null, 2) }}
    </context>

    <div class="main-container" :style="{ '--sidebar-width': sidebarWidth + 'px' }">
      <div class="file-explorer">
        <div class="file-explorer-header">
          <h4>File System</h4>
          <div class="file-explorer-buttons">
            <button @click="() => promptNewItem('file')" title="New File">📄</button>
            <button @click="() => promptNewItem('directory')" title="New Folder">📁</button>
          </div>
        </div>
        <div class="file-tree-container">
          <ul class="file-tree-list">
            <template v-for="([name, node]) in Object.entries(fileSystem)" :key="name">
              <TreeItem :name="name" :node="node" :path-prefix="''" @select-file="openFileInTab" @rename-item="renameItem" @delete-item="deleteItem" />
            </template>
          </ul>
        </div>
      </div>
      <div class="resizer" @mousedown="startResize"></div>
      <div class="editor-area">
        <div class="tabs">
          <div v-for="(tab, index) in openTabs" :key="tab.path" class="tab" :class="{ active: activeTab === tab.path }" @click="activeTab = tab.path">
            {{ tab.name }}
            <span class="close-tab" @click.stop="closeTab(index)">&times;</span>
          </div>
        </div>
        <textarea v-if="activeTabContent" v-model="activeTabContent.content" @input="updateFileContent" class="code-editor"></textarea>
        <div v-else class="no-file-open"><p>No file selected.</p></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, h, defineComponent } from 'vue';

// --- State Management ---
const fileSystem = ref({});
const openTabs = ref([]);
const activeTab = ref(null);
const sidebarWidth = ref(250); // Initial sidebar width

// --- File System Initialization ---
onMounted(() => {
  const storedFileSystem = localStorage.getItem('voix-ide-fs-tree');
  if (storedFileSystem) {
    fileSystem.value = JSON.parse(storedFileSystem);
  } else {
    fileSystem.value = {
      'README.md': { type: 'file', content: 'Welcome to your persistent IDE!\n\n- Files are saved in localStorage.\n- Right-click on items in the file explorer for options.' },
      'src': {
        type: 'directory',
        children: {
          'main.js': { type: 'file', content: 'console.log("Hello, World!");' }
        }
      }
    };
  }
});

watch(fileSystem, (newFileSystem) => {
  localStorage.setItem('voix-ide-fs-tree', JSON.stringify(newFileSystem));
}, { deep: true });

// --- Computed Properties ---
const editorContext = computed(() => {
  const activeFile = openTabs.value.find(t => t.path === activeTab.value);
  return `Open Tabs: ${openTabs.value.map(t => t.path).join(', ') || 'None'}\nActive File: ${activeTab.value || 'None'}\n\n${activeFile ? activeFile.content : ''}`;
});

const activeTabContent = computed(() => openTabs.value.find(tab => tab.path === activeTab.value));

// --- File System Traversal Helpers ---
const findNode = (path) => {
  const parts = path.split('/').filter(p => p);
  let current = { type: 'directory', children: fileSystem.value };
  for (const part of parts) {
    if (!current || current.type !== 'directory' || !current.children[part]) return null;
    current = current.children[part];
  }
  return current;
};

const findParentNode = (path) => {
    const parts = path.split('/').filter(p => p);
    if (parts.length === 1) return { type: 'directory', children: fileSystem.value };
    const parentPath = '/' + parts.slice(0, -1).join('/');
    return findNode(parentPath);
};

// --- Tab Management ---
function openFileInTab(path) {
  const node = findNode(path);
  if (node && node.type === 'file') {
    if (!openTabs.value.some(tab => tab.path === path)) {
      openTabs.value.push({ path, name: path.split('/').pop(), content: node.content });
    }
    activeTab.value = path;
  }
}

function closeTab(index) {
  const closedTabPath = openTabs.value[index].path;
  openTabs.value.splice(index, 1);
  if (activeTab.value === closedTabPath) {
    activeTab.value = openTabs.value.length > 0 ? openTabs.value[0].path : null;
  }
}

function updateFileContent(event) {
  const node = findNode(activeTab.value);
  if (node && node.type === 'file') {
    node.content = event.target.value;
  }
}

// --- Tool Implementations ---
const listDirectory = (e) => {
    const { path = '/' } = e.detail;
    const node = findNode(path);
    const result = node && node.type === 'directory' ? Object.keys(node.children) : { error: `Path not found or not a directory: ${path}` };
    e.target.dispatchEvent(new CustomEvent('return', { detail: result }));
};

const readFile = (e) => {
    const { absolute_path } = e.detail;
    const node = findNode(absolute_path);
    const result = node && node.type === 'file' ? { content: node.content } : { error: `File not found: ${absolute_path}` };
    if (result.content) openFileInTab(absolute_path);
    e.target.dispatchEvent(new CustomEvent('return', { detail: result }));
};

const writeFile = (e) => {
    const { file_path, content } = e.detail;
    const parentPath = file_path.substring(0, file_path.lastIndexOf('/')) || '/';
    const parent = findNode(parentPath);
    const name = file_path.split('/').pop();
    if (parent && parent.type === 'directory') {
        parent.children[name] = { type: 'file', content };
        openFileInTab(file_path);
        e.target.dispatchEvent(new CustomEvent('return', { detail: { success: true } }));
    } else {
        e.target.dispatchEvent(new CustomEvent('return', { detail: { error: `Invalid path: ${file_path}` } }));
    }
};

const replaceText = (e) => {
    const { file_path, old_string, new_string } = e.detail;
    const node = findNode(file_path); // Use findNode to get the actual file node

    if (node && node.type === 'file' && node.content.includes(old_string)) {
        node.content = node.content.replace(old_string, new_string);

        // Update the content in the open tab if the file is currently open
        const tab = openTabs.value.find(t => t.path === file_path);
        if (tab) {
            tab.content = node.content;
        }
        e.target.dispatchEvent(new CustomEvent('return', { detail: { success: true } }));
    } else {
        e.target.dispatchEvent(new CustomEvent('return', { detail: { error: 'File not found or old string not present.' } }));
    }
};

const createDirectory = (e) => {
    const { path } = e.detail;
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const parent = findNode(parentPath);
    const name = path.split('/').pop();
    if (parent && parent.type === 'directory') {
        parent.children[name] = { type: 'directory', children: {} };
        e.target.dispatchEvent(new CustomEvent('return', { detail: { success: true } }));
    } else {
        e.target.dispatchEvent(new CustomEvent('return', { detail: { error: `Invalid path: ${path}` } }));
    }
};

const renameItem = (e) => {
    const { old_path, new_path } = e.detail;
    const oldParent = findParentNode(old_path);
    const newParent = findParentNode(new_path);
    const oldName = old_path.split('/').pop();
    const newName = new_path.split('/').pop();

    if (oldParent && newParent && oldParent.children[oldName]) {
        newParent.children[newName] = oldParent.children[oldName];
        delete oldParent.children[oldName];
        // Update open tabs if necessary
        openTabs.value.forEach(tab => {
            if (tab.path.startsWith(old_path)) {
                tab.path = tab.path.replace(old_path, new_path);
            }
        });
        if (activeTab.value && activeTab.value.startsWith(old_path)) {
            activeTab.value = activeTab.value.replace(old_path, new_path);
        }
        e.target.dispatchEvent(new CustomEvent('return', { detail: { success: true } }));
    } else {
        e.target.dispatchEvent(new CustomEvent('return', { detail: { error: 'Could not rename item.' } }));
    }
};

const deleteItem = (e) => {
    const { path } = e.detail;
    const parent = findParentNode(path);
    const name = path.split('/').pop();
    if (parent && parent.children[name]) {
        delete parent.children[name];
        // Close tabs of deleted files
        openTabs.value = openTabs.value.filter(tab => !tab.path.startsWith(path));
        if (activeTab.value && activeTab.value.startsWith(path)) {
            activeTab.value = openTabs.value.length > 0 ? openTabs.value[0].path : null;
        }
        e.target.dispatchEvent(new CustomEvent('return', { detail: { success: true } }));
    } else {
        e.target.dispatchEvent(new CustomEvent('return', { detail: { error: `Item not found: ${path}` } }));
    }
};

// --- UI Functions ---
const promptNewItem = (type, parentPath = '') => {
  const name = prompt(`Enter name for new ${type}:`);
  if (name) {
    const path = `${parentPath}/${name}`.replace('//', '/');
    if (type === 'file') {
      writeFile({ detail: { file_path: path, content: '' } });
    } else {
      createDirectory({ detail: { path } });
    }
  }
};

// --- Resizing Logic ---
let isResizing = false;
let lastDownX = 0;

const startResize = (e) => {
  isResizing = true;
  lastDownX = e.clientX;
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};

const resize = (e) => {
  if (!isResizing) return;
  const deltaX = e.clientX - lastDownX;
  sidebarWidth.value = Math.max(150, sidebarWidth.value + deltaX); // Min width 150px
  lastDownX = e.clientX;
};

const stopResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
};

// --- Inline FileTree Component ---
const TreeItem = defineComponent({
  props: ['name', 'node', 'pathPrefix'],
  emits: ['select-file', 'rename-item', 'delete-item'],
  setup(props, { emit }) {
    const currentPath = computed(() => `${props.pathPrefix}/${props.name}`.replace('//', '/'));
    const isDirectory = computed(() => props.node.type === 'directory');

    const handleContextMenu = (event) => {
      event.preventDefault();
      const action = prompt(`Action for ${currentPath.value}: rename or delete?`);
      if (action === 'rename') {
        const newName = prompt(`Enter new name for ${currentPath.value}:`, props.name);
        if (newName) {
          const newPath = `${props.pathPrefix}/${newName}`.replace('//', '/');
          emit('rename-item', { old_path: currentPath.value, new_path: newPath });
        }
      } else if (action === 'delete') {
        if (confirm(`Are you sure you want to delete ${currentPath.value}?`)) {
          emit('delete-item', { path: currentPath.value });
        }
      }
    };

    return () => h('li', { class: `tree-item ${isDirectory.value ? 'dir' : 'file'}` }, [
      h('span', {
        onClick: () => isDirectory.value ? null : emit('select-file', currentPath.value),
        onContextmenu: handleContextMenu,
      }, `${isDirectory.value ? '📁' : '📄'} ${props.name}`),
      isDirectory.value && props.node.children
        ? h('ul', { class: 'file-tree-list' }, Object.entries(props.node.children).map(([childName, childNode]) =>
            h(TreeItem, {
              name: childName,
              node: childNode,
              pathPrefix: currentPath.value,
              onSelectFile: (path) => emit('select-file', path),
              onRenameItem: (paths) => emit('rename-item', paths),
              onDeleteItem: (path) => emit('delete-item', path),
            })
          ))
        : null
    ]);
  },
});

</script>

<style>
.code-editor-demo { font-family: 'Segoe UI', sans-serif; background-color: #1e1e1e; color: #d4d4d4; border-radius: 8px; overflow: hidden; }
.main-container {
  display: grid;
  grid-template-columns: var(--sidebar-width) 5px 1fr; /* Added 5px for resizer */
  height: 600px;
}
.file-explorer { background-color: #252526; padding: 10px; overflow-y: auto; }
.file-explorer-header { display: flex; justify-content: space-between; align-items: center; padding: 0 10px 10px; border-bottom: 1px solid #333; }
.file-explorer-buttons button { background: none; border: none; color: #ccc; font-size: 18px; cursor: pointer; }
.resizer {
  width: 5px;
  background-color: #333;
  cursor: ew-resize;
  z-index: 1;
}
.editor-area { display: flex; flex-direction: column; background-color: #1e1e1e; }
.tabs { display: flex; background-color: #2d2d2d; flex-shrink: 0; }
.tab { padding: 10px 15px; cursor: default; border-right: 1px solid #1e1e1e; position: relative; }
.tab.active { background-color: #1e1e1e; }
.close-tab { margin-left: 10px; cursor: pointer; }
.code-editor { flex-grow: 1; width: 100%; padding: 15px; border: none; background-color: #1e1e1e; color: #d4d4d4; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.6; resize: none; }
.no-file-open { flex-grow: 1; display: flex; align-items: center; justify-content: center; color: #888; }
.file-tree-list { list-style: none; padding-left: 15px; margin: 0; }
.tree-item.file > span { cursor: pointer; }
.tree-item.dir > span { cursor: default; }
.tree-item span:hover { background-color: #2a2d2e; }
h4 { margin: 0 !important }
</style>