# Svelte Task Manager - VOIX Chrome Extension Example

This is a comprehensive example of how to integrate the VOIX Chrome Extension with a Svelte application using the Model Context Protocol (MCP) for AI-powered task management.

## Overview

This Svelte application demonstrates how to create AI-interactive web applications that work seamlessly with the VOIX Chrome extension. The app provides:

- **Task Management**: Create, edit, and manage tasks with priority levels and due dates
- **AI Integration**: Tools that allow AI assistants to interact with your task data
- **Context Awareness**: Dynamic context that keeps AI informed about app state
- **Reactive State**: Svelte 5 runes for modern reactive programming

## Svelte-Specific Implementation

### 1. Custom Elements Configuration

Unlike Vue, Svelte works with custom elements out of the box without special configuration. The VOIX elements (`<tool>`, `<context>`, etc.) are treated as regular HTML elements:

```svelte
<!-- No special configuration needed in Svelte! -->
<tool name="add_task" description="Add a new task">
  <prop name="text" type="string" description="Task text" required>
    New task
  </prop>
</tool>
```

### 2. Tool Definition with Svelte Event Handling

Svelte uses the `oncall` attribute for tool event handling:

```svelte
<script>
  let tasks = $state([]);
  
  // Tool event handlers
  function handleAddTask(event) {
    const { text } = event.detail || {};
    if (text && text.trim()) {
      const newTask = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        priority: 'medium',
        dueDate: '',
        notes: ''
      };
      
      tasks.push(newTask);
      
      // Set success response directly on event detail
      event.detail.success = true;
      event.detail.result = { task_id: newTask.id, text: newTask.text };
      event.detail.message = `Task "${text}" added successfully`;
    } else {
      event.detail.success = false;
      event.detail.error = "Task text is required";
    }
  }
  
  function handleUpdateStatus(event) {
    const { task_id, completed } = event.detail;
    
    try {
      const task = tasks.find(t => t.id.toString() === task_id);
      if (task) {
        task.completed = completed;
        
        event.detail.success = true;
        event.detail.result = { task_id, completed };
        event.detail.message = `Task ${task_id} marked as ${completed ? 'completed' : 'incomplete'}`;
      } else {
        throw new Error('Task not found');
      }
    } catch (error) {
      event.detail.success = false;
      event.detail.error = error.message;
    }
  }
</script>

<!-- Tool definitions -->
<tool 
  name="add_task" 
  description="Add a new task to the list"
  oncall={handleAddTask}
>
  <prop name="text" type="string" description="Text of the task to add" required>
    Buy groceries
  </prop>
</tool>

<tool 
  name="update_task_status" 
  description="Update the status of a specific task"
  oncall={handleUpdateStatus}
>
  <prop name="task_id" type="string" description="ID of task to update" required>
    {tasks[0]?.id.toString() || '1'}
  </prop>
  <prop name="completed" type="boolean" description="Mark as completed" required>
    false
  </prop>
</tool>
```

### 3. Dynamic Context with Svelte Runes

Svelte 5's new runes system provides excellent reactivity for dynamic context:

```svelte
<script>
  let tasks = $state([]);
  let filterStatus = $state('all');
  
  // Derived state for filtered tasks
  let filteredTasks = $derived(() => {
    if (filterStatus === 'active') {
      return tasks.filter(task => !task.completed);
    } else if (filterStatus === 'completed') {
      return tasks.filter(task => task.completed);
    }
    return tasks;
  });
  
  // Dynamic context that updates automatically
  let taskContext = $derived(`
    Total tasks: ${tasks.length}
    Filtered tasks: ${filteredTasks.length}
    Completed: ${tasks.filter(t => t.completed).length}
    Active filter: ${filterStatus}
    Last updated: ${new Date().toISOString()}
  `.trim());
</script>

<!-- Context that automatically updates when data changes -->
<context name="task_list">{taskContext}</context>

<context name="current_date">
  {new Date().toLocaleDateString()}
</context>
```

### 4. Component-Level Tools

Svelte components can define their own tools for granular control:

```svelte
<!-- TaskItem.svelte -->
<script>
  let { task, onSetComplete, onRemove, onViewDetails } = $props();
  
  function handleCompleteTask(event) {
    const { completed } = event.detail;
    onSetComplete(task.id, completed);
    
    event.detail.success = true;
    event.detail.message = `Task "${task.text}" marked as ${completed ? 'completed' : 'incomplete'}`;
  }
  
  function handleRemoveTask(event) {
    onRemove(task.id);
    
    event.detail.success = true;
    event.detail.message = `Task "${task.text}" removed successfully`;
  }
  
  function handleViewDetails(event) {
    onViewDetails(task);
    
    event.detail.success = true;
    event.detail.message = `Opened details for task "${task.text}"`;
  }
</script>

<div class="task-item" class:completed={task.completed}>
  <!-- Regular Svelte UI -->
  <input 
    type="checkbox" 
    checked={task.completed} 
    onchange={(e) => onSetComplete(task.id, e.target.checked)}
  />
  <span class="task-text">{task.text}</span>
  <button onclick={() => onViewDetails(task)}>Details</button>
  <button onclick={() => onRemove(task.id)}>Remove</button>
  
  <!-- Component-specific tools -->
  <tool 
    name="complete_task_{task.id}" 
    description="Mark '{task.text}' as complete"
    oncall={handleCompleteTask}
  >
    <prop name="completed" type="boolean" description="Mark as completed" required>
      {!task.completed}
    </prop>
  </tool>
  
  <tool 
    name="remove_task_{task.id}" 
    description="Remove '{task.text}' from the list"
    oncall={handleRemoveTask}
  />
  
  <tool 
    name="view_details_{task.id}" 
    description="View details for '{task.text}'"
    oncall={handleViewDetails}
  />
</div>

<style>
  .task-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  
  .task-item.completed {
    opacity: 0.7;
    background-color: #f5f5f5;
  }
  
  .task-text {
    flex-grow: 1;
  }
  
  .completed .task-text {
    text-decoration: line-through;
  }
</style>
```

### 5. Hiding VOIX Elements from UI

Add CSS to hide VOIX elements from the visual interface:

```css
/* In your app.css or global styles */
tool, prop, array, dict, context, resource {
  display: none;
}
```

This ensures that VOIX elements don't interfere with your app's visual layout.

### 6. Modal and Complex Interactions

Svelte handles complex tool interactions smoothly with its reactive system:

```svelte
<!-- TaskDetailsModal.svelte -->
<script>
  let { task, onClose, onUpdate } = $props();
  
  let editedTask = $state({ ...task });
  
  // Watch for task changes (Svelte 5 effect)
  $effect(() => {
    if (task) {
      editedTask = { ...task };
    }
  });
  
  function handleSave() {
    onUpdate({ ...editedTask });
    onClose();
  }
  
  function setText(event) {
    const { text } = event.detail;
    if (text && text.trim()) {
      editedTask.text = text;
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
      editedTask.dueDate = dueDate;
      handleSave();
      
      event.detail.success = true;
      event.detail.message = `Due date set to ${dueDate || 'none'}`;
    } else {
      event.detail.success = false;
      event.detail.error = "Invalid date format. Use YYYY-MM-DD";
    }
  }
  
  function setPriority(event) {
    const { priority } = event.detail;
    if (['low', 'medium', 'high'].includes(priority)) {
      editedTask.priority = priority;
      handleSave();
      
      event.detail.success = true;
      event.detail.message = `Priority changed to ${priority}`;
    } else {
      event.detail.success = false;
      event.detail.error = "Priority must be low, medium, or high";
    }
  }
</script>

{#if task}
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2>Task Details</h2>
      <button onclick={onClose}>&times;</button>
    </div>
    
    <form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <div class="form-group">
        <label for="task-text">Task</label>
        <input 
          id="task-text" 
          bind:value={editedTask.text} 
          type="text" 
          required 
        />
      </div>
      
      <div class="form-group">
        <label for="due-date">Due Date</label>
        <input 
          id="due-date" 
          bind:value={editedTask.dueDate} 
          type="date" 
        />
      </div>
      
      <div class="form-group">
        <label for="priority">Priority</label>
        <select id="priority" bind:value={editedTask.priority}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="notes">Notes</label>
        <textarea 
          id="notes" 
          bind:value={editedTask.notes} 
          rows="3"
        ></textarea>
      </div>
      
      <div class="button-group">
        <button type="button" onclick={onClose}>Cancel</button>
        <button type="submit">Save Changes</button>
      </div>
    </form>
    
    <!-- Context for current editing state -->
    <context name="current_task">
      You are currently editing task {task.id}:
      - Text: {task.text}
      - Due date: {task.dueDate || 'none'}
      - Priority: {task.priority || 'medium'}
      - Notes: {task.notes || 'none'}
    </context>
    
    <!-- Tools for AI to edit individual fields -->
    <tool name="set_text" description="Set the task text" oncall={setText}>
      <prop name="text" type="string" description="New text for the task">
        {editedTask.text}
      </prop>
    </tool>
    
    <tool name="set_due_date" description="Set the due date" oncall={setDueDate}>
      <prop name="dueDate" type="string" description="Due date in YYYY-MM-DD format">
        {editedTask.dueDate || ''}
      </prop>
    </tool>
    
    <tool name="set_priority" description="Set the priority" oncall={setPriority}>
      <prop name="priority" type="string" description="Priority: low, medium, or high">
        {editedTask.priority || 'medium'}
      </prop>
    </tool>
  </div>
</div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    padding: 1.5rem;
  }
  
  /* ... other modal styles ... */
</style>
```

### 7. Advanced Patterns with Svelte 5

#### Using Derived State for Complex Context

```svelte
<script>
  let tasks = $state([]);
  let users = $state([]);
  let currentFilter = $state('all');
  
  // Complex derived context
  let appContext = $derived(() => {
    const completedTasks = tasks.filter(t => t.completed);
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
    );
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      activeUsers: users.filter(u => u.isActive).length,
      currentFilter,
      lastUpdate: new Date().toISOString()
    };
  });
</script>

<context name="app_state">
  {JSON.stringify(appContext, null, 2)}
</context>
```

#### Reactive Tool Parameters

```svelte
<script>
  let selectedProject = $state(null);
  let availableStatuses = $state(['todo', 'in-progress', 'done']);
  
  // Dynamic tool based on current state
  let currentTaskId = $derived(selectedProject?.tasks?.[0]?.id || null);
</script>

{#if currentTaskId}
<tool 
  name="update_current_task" 
  description="Update the currently selected task"
  oncall={handleUpdateTask}
>
  <prop name="task_id" type="string" description="Task ID" required>
    {currentTaskId}
  </prop>
  <prop name="status" type="string" description="New status" required>
    {availableStatuses[0]}
  </prop>
</tool>
{/if}
```

## Project Setup

### Prerequisites
- Node.js 16+
- Svelte 5
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
  "svelte": "^5.0.0",
  "@sveltejs/vite-plugin-svelte": "^4.0.0",
  "vite": "^5.0.0"
}
```

## Best Practices for Svelte + VOIX

### 1. Use Svelte 5 Runes
Take advantage of the new runes system for reactive state management:

```javascript
// State runes for reactive data
let tasks = $state([]);
let filter = $state('all');

// Derived runes for computed values
let filteredTasks = $derived(tasks.filter(/* filter logic */));

// Effect runes for side effects
$effect(() => {
  console.log('Tasks updated:', tasks.length);
});
```

### 2. Leverage Svelte's Reactivity
Svelte's reactivity works seamlessly with VOIX context updates:

```svelte
<script>
  let appData = $state({ users: [], tasks: [] });
  
  // Context automatically updates when appData changes
  let contextString = $derived(`
    Users: ${appData.users.length}
    Tasks: ${appData.tasks.length}
    Updated: ${new Date().toISOString()}
  `);
</script>

<context name="app_state">{contextString}</context>
```

### 3. Component Organization
- Keep tools close to the data they operate on
- Use component-specific tools for isolated functionality
- Pass data up through props and callbacks

### 4. Error Handling
Always provide proper error handling in tool event handlers:

```javascript
function handleToolCall(event) {
  try {
    // Tool logic here
    const result = performAction(event.detail);
    
    event.detail.success = true;
    event.detail.result = result;
    event.detail.message = 'Action completed successfully';
  } catch (error) {
    event.detail.success = false;
    event.detail.error = error.message;
  }
}
```

### 5. TypeScript Support
For TypeScript projects, create type definitions:

```typescript
interface ToolEvent extends CustomEvent {
  detail: Record<string, any>;
}

interface ToolResponse {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
}
```

## Testing with VOIX

1. **Install the VOIX Chrome Extension**
2. **Load this Svelte app** in your browser
3. **Open the AI chat** (click extension icon or Ctrl+Shift+A)
4. **Try AI commands** like:
   - "Add a task called 'Learn Svelte 5'"
   - "Mark the first task as completed"
   - "Show me all active tasks"
   - "Set the priority of task 2 to high"

## Debugging Tips

### Check Tool Discovery
Open browser console and inspect available tools:

```javascript
// In browser console
console.log('Available tools:', document.querySelectorAll('tool'));
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
1. **Tools not responding**: Check that `oncall` handlers are properly defined
2. **Context not updating**: Verify Svelte reactivity is working with runes
3. **State not syncing**: Ensure you're using `$state` for reactive data
4. **Events not firing**: Check that event handlers are attached correctly

## Framework Integration Notes

This Svelte example demonstrates several important patterns:

- **Natural Custom Elements**: Svelte works with VOIX elements without configuration
- **Runes-Based Reactivity**: Modern Svelte 5 reactive programming with runes
- **Event-Driven Architecture**: Clean `oncall` handlers for tool interactions
- **Automatic Context Updates**: Reactive context using derived state
- **Component Integration**: Tools at both app and component levels
- **State Management**: Proper reactive state management with Svelte 5

The integration feels very natural in Svelte, leveraging the framework's simplicity and powerful reactivity system while providing seamless AI interaction capabilities through the VOIX Chrome extension.
