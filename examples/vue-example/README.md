# Vue.js Task Manager - VOIX Chrome Extension Example

This is a comprehensive example of how to integrate the VOIX Chrome Extension with a Vue.js application using the Model Context Protocol (MCP) for AI-powered task management.

## Overview

This Vue.js application demonstrates how to create AI-interactive web applications that work seamlessly with the VOIX Chrome extension. The app provides:

- **Task Management**: Create, edit, and manage tasks with priority levels and due dates
- **AI Integration**: Tools that allow AI assistants to interact with your task data
- **Context Awareness**: Dynamic context that keeps AI informed about app state
- **Modal Interactions**: Detailed task editing with AI-accessible tools

## Vue.js-Specific Implementation

### 1. Vite Configuration for Custom Elements

The key to Vue.js integration is configuring Vite to recognize VOIX custom elements as valid HTML:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Tell Vue to treat these as custom elements, not components
          isCustomElement: (tag) => ['tool', 'array', 'dict', 'prop', 'context', 'resource'].includes(tag),
        },
      },
    }),
  ],
})
```

**Important**: Without this configuration, Vue will treat `<tool>`, `<context>`, etc. as Vue components and throw compilation errors.

### 2. Tool Definition with Vue Event Handling

Vue components can define tools using the `@call` directive for clean event handling:

```vue
<template>
  <!-- Tool that AI can call to add tasks -->
  <tool 
    name="add_task" 
    description="Add a new task to the list"
    @call="handleAddTaskTool"
  >
    <prop name="text" type="string" description="Text of the task to add" required>
      Buy groceries
    </prop>
  </tool>

  <!-- Tool with dynamic context from Vue data -->
  <tool 
    name="update_task_status" 
    description="Update the status of a specific task"
    @call="handleUpdateStatus"
  >
    <prop name="task_id" type="string" description="ID of task to update" required>
      {{ tasks[0]?.id || 'task-123' }}
    </prop>
    <prop name="completed" type="boolean" description="Mark as completed" required>
      false
    </prop>
  </tool>
</template>

<script setup>
// Tool event handlers
function handleAddTaskTool(event) {
  const { text } = event.detail || {};
  if (text) {
    addTask(text);
    
    // Set success response directly on event detail
    event.detail.success = true;
    event.detail.result = { task_added: text };
    event.detail.message = `Task "${text}" added successfully`;
  } else {
    event.detail.success = false;
    event.detail.error = "Task text is required";
  }
}

function handleUpdateStatus(event) {
  const { task_id, completed } = event.detail;
  
  try {
    setTaskComplete(parseInt(task_id), completed);
    
    event.detail.success = true;
    event.detail.result = { task_id, completed };
    event.detail.message = `Task ${task_id} marked as ${completed ? 'completed' : 'incomplete'}`;
  } catch (error) {
    event.detail.success = false;
    event.detail.error = error.message;
  }
}
</script>
```

### 3. Dynamic Context with Vue Reactivity

Vue's reactivity system works perfectly with dynamic context updates:

```vue
<template>
  <!-- Context that automatically updates when Vue data changes -->
  <context name="task_list">{{ taskListContext }}</context>
  
  <context name="current_date">
    {{ new Date().toLocaleDateString() }}
  </context>
</template>

<script setup>
import { computed } from 'vue';

const tasks = reactive([/* your tasks */]);
const filterStatus = ref('all');

// Computed context that updates automatically
const taskListContext = computed(() => {
  const filtered = filteredTasks.value;
  return `
    Total tasks: ${tasks.length}
    Filtered tasks: ${filtered.length}
    Completed: ${tasks.filter(t => t.completed).length}
    Active filter: ${filterStatus.value}
    Last updated: ${new Date().toISOString()}
  `.trim();
});
</script>
```

### 4. Component-Level Tools

Tools can be defined at the component level for more granular control:

```vue
<!-- TaskItem.vue -->
<template>
  <div class="task-item">
    <!-- Regular Vue UI -->
    <span>{{ task.text }}</span>
    <button @click="toggleComplete">Toggle</button>
    
    <!-- Component-specific tools -->
    <tool 
      :name="'complete_task_' + task.id" 
      :description="`Mark '${task.text}' as complete`"
      @call="handleCompleteTask"
    >
      <prop name="completed" type="boolean" description="Mark as completed" required>
        {{ !task.completed }}
      </prop>
    </tool>
    
    <tool 
      :name="'remove_task_' + task.id" 
      :description="`Remove '${task.text}' from the list`"
      @call="handleRemoveTask"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  task: { type: Object, required: true }
});

const emit = defineEmits(['update', 'remove']);

function handleCompleteTask(event) {
  const { completed } = event.detail;
  emit('update', { ...props.task, completed });
  
  event.detail.success = true;
  event.detail.message = `Task marked as ${completed ? 'completed' : 'incomplete'}`;
}

function handleRemoveTask(event) {
  emit('remove', props.task.id);
  
  event.detail.success = true;
  event.detail.message = `Task "${props.task.text}" removed`;
}
</script>
```

### 5. Hiding VOIX Elements from UI

Add CSS to hide VOIX elements from the visual interface:

```css
/* In your main CSS file or base.css */
tool, prop, array, dict, context, resource {
  display: none;
}
```

This ensures that the VOIX elements are available to the extension but don't appear in your app's UI.

### 6. Modal and Form Integration

The example shows how to integrate tools within Vue modals:

```vue
<!-- TaskDetailsModal.vue -->
<template>
  <div v-if="show" class="modal">
    <!-- Regular Vue form -->
    <form @submit.prevent="handleSave">
      <input v-model="editedTask.text" />
      <input v-model="editedTask.dueDate" type="date" />
      <!-- ... other form fields ... -->
    </form>
    
    <!-- Context for current editing state -->
    <context name="current_task">
      You are currently editing task {{ task.id }}:
      - Text: {{ task.text }}
      - Due date: {{ task.dueDate || 'none' }}
      - Priority: {{ task.priority }}
    </context>
    
    <!-- Tools for AI to edit individual fields -->
    <tool name="set_text" description="Set the task text" @call="setText">
      <prop name="text" type="string" :description="`New text (currently: ${editedTask.text})`">
        {{ editedTask.text }}
      </prop>
    </tool>
    
    <tool name="set_due_date" description="Set the due date" @call="setDueDate">
      <prop name="dueDate" type="string" description="Due date in YYYY-MM-DD format">
        {{ editedTask.dueDate || '' }}
      </prop>
    </tool>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  task: Object,
  show: Boolean
});

const emit = defineEmits(['close', 'update']);

const editedTask = ref({ ...props.task });

// Watch for task changes and reset form
watch(() => props.task, (newTask) => {
  if (newTask) {
    editedTask.value = { ...newTask };
  }
}, { deep: true });

function setText(event) {
  const { text } = event.detail;
  if (text && text.trim()) {
    editedTask.value.text = text;
    handleSave();
    event.detail.success = true;
    event.detail.message = `Task text updated to "${text}"`;
  } else {
    event.detail.success = false;
    event.detail.error = "Text cannot be empty";
  }
}

function setDueDate(event) {
  const { dueDate } = event.detail;
  if (!dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    editedTask.value.dueDate = dueDate;
    handleSave();
    event.detail.success = true;
    event.detail.message = `Due date set to ${dueDate || 'none'}`;
  } else {
    event.detail.success = false;
    event.detail.error = "Invalid date format. Use YYYY-MM-DD";
  }
}

function handleSave() {
  emit('update', { ...editedTask.value });
  emit('close');
}
</script>
```

## Project Setup

### Prerequisites
- Node.js 16+ 
- Vue 3
- Vite

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Key Dependencies

```json
{
  "vue": "^3.4.0",
  "@vitejs/plugin-vue": "^5.0.0",
  "vite": "^5.0.0"
}
```

## Best Practices for Vue + VOIX

### 1. Use Composition API
The Composition API provides better TypeScript support and makes tool handlers easier to organize:

```javascript
// Use composables for tool logic
const { handleTaskTools } = useTaskTools(tasks);
```

### 2. Leverage Vue's Reactivity
Make full use of Vue's reactive system for dynamic context and tool parameters:

```javascript
// Dynamic tool parameters based on app state
const toolParams = computed(() => ({
  currentTaskId: selectedTask.value?.id,
  availableStatuses: taskStatuses.value
}));
```

### 3. Component Organization
- Keep tools close to the data they operate on
- Use component-specific tools for isolated functionality
- Emit events to parent components for state changes

### 4. Error Handling
Always provide proper error handling in tool event handlers:

```javascript
function handleToolCall(event) {
  try {
    // Tool logic here
    const result = performAction(event.detail);
    
    // Set success response on event detail
    event.detail.success = true;
    event.detail.result = result;
    event.detail.message = 'Action completed successfully';
  } catch (error) {
    // Set error response on event detail
    event.detail.success = false;
    event.detail.error = error.message;
  }
}
```

### 5. TypeScript Support
For TypeScript projects, create type definitions for tool events:

```typescript
interface ToolCallEvent extends CustomEvent {
  detail: {
    [key: string]: any;
  };
}

interface ToolResponseDetail {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
}
```

## Testing with VOIX

1. **Install the VOIX Chrome Extension**
2. **Load this Vue app** in your browser
3. **Open the AI chat** (click extension icon or Ctrl+Shift+A)
4. **Try AI commands** like:
   - "Add a task called 'Learn Vue.js'"
   - "Mark the first task as completed"
   - "Show me all active tasks"
   - "Set the due date for task 2 to next Friday"

## Debugging Tips

### Check Tool Discovery
Open browser console and look for VOIX tool discovery logs:

```javascript
// In browser console
console.log('Available tools:', window.mcpServer?.tools);
```

### Validate Tool Responses
Ensure your tool handlers set proper responses:

```javascript
function debugToolHandler(event) {
  console.log('Tool called:', event.target.getAttribute('name'));
  console.log('Arguments:', event.detail);
  
  // Your tool logic...
  
  // Set response on event detail instead of dispatching new event
  event.detail.success = true;
  event.detail.result = result;
  event.detail.message = 'Tool executed successfully';
  
  console.log('Response set:', {
    success: event.detail.success,
    result: event.detail.result,
    message: event.detail.message
  });
}
```

### Common Issues
1. **Tools not discovered**: Check Vite configuration for custom elements
2. **Vue compilation errors**: Ensure `isCustomElement` includes all VOIX tags
3. **Tools not responding**: Verify event handlers are properly attached
4. **Context not updating**: Check that Vue reactivity is working correctly

## Framework Integration Notes

This Vue.js example demonstrates several important patterns:

- **Custom Element Configuration**: Critical Vite setup for VOIX elements
- **Event-Driven Architecture**: Vue's `@call` directive for clean tool handling  
- **Reactive Context**: Automatic context updates using Vue's reactivity
- **Component Integration**: Tools at both app and component levels
- **Modal Interactions**: Complex tool interactions within Vue modals
- **State Management**: Proper Vue state management with reactive data

The integration feels natural and leverages Vue's strengths while providing powerful AI interaction capabilities through the VOIX Chrome extension.
