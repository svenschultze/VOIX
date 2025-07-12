---
layout: doc
---

<script setup>
import TodoDemo from './components/TodoDemo.vue'
</script>

# Todo List Demo

This demo shows how to create a simple task management system with VOIX. Users can add, complete, and delete tasks using natural language.

## How It Works

The todo list provides tools for common task operations and maintains context about the current tasks.

## Code

```html
<!-- Tools for task management -->
<tool name="add_task" description="Add a new task to the list">
  <prop name="title" type="string" required/>
  <prop name="priority" type="string" description="high, medium, or low"/>
</tool>

<tool name="complete_task" description="Mark a task as completed">
  <prop name="taskId" type="string" description="ID of the task to complete" required/>
</tool>

<tool name="delete_task" description="Delete a task from the list">
  <prop name="taskId" type="string" description="ID of the task to delete" required/>
</tool>

<tool name="clear_completed" description="Remove all completed tasks">
</tool>

<!-- Context showing current state -->
<context name="tasks" id="task-context">
  Total tasks: 0
  Active: 0
  Completed: 0
</context>

<!-- Task list UI -->
<div id="task-list">
  <h3>My Tasks</h3>
  <ul id="tasks"></ul>
</div>

<script>
// Task storage
let tasks = [];
let nextId = 1;

// Tool handlers
const handlers = {
  add_task: ({ title, priority = 'medium' }) => {
    const task = {
      id: `task-${nextId++}`,
      title,
      priority,
      completed: false
    };
    tasks.push(task);
    updateUI();
  },
  
  complete_task: ({ taskId }) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = true;
      updateUI();
    }
  },
  
  delete_task: ({ taskId }) => {
    tasks = tasks.filter(t => t.id !== taskId);
    updateUI();
  },
  
  clear_completed: () => {
    tasks = tasks.filter(t => !t.completed);
    updateUI();
  }
};

// Attach event listeners
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Update UI and context
function updateUI() {
  const taskList = document.getElementById('tasks');
  taskList.innerHTML = tasks.map(task => `
    <li class="${task.completed ? 'completed' : ''}" data-priority="${task.priority}">
      <span>${task.title}</span>
      <small>[${task.id}]</small>
    </li>
  `).join('');
  
  // Update context
  const active = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  
  document.getElementById('task-context').textContent = `
Total tasks: ${tasks.length}
Active: ${active.length}
Completed: ${completed.length}

Task IDs: ${tasks.map(t => t.id).join(', ')}
  `;
}

// Initial update
updateUI();
</script>

<style>
#task-list {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

#tasks {
  list-style: none;
  padding: 0;
}

#tasks li {
  padding: 0.5rem;
  margin: 0.5rem 0;
  background: #f5f5f5;
  border-radius: 4px;
}

#tasks li.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

#tasks li[data-priority="high"] {
  border-left: 4px solid #ff4444;
}

#tasks li[data-priority="medium"] {
  border-left: 4px solid #ff8800;
}

#tasks li[data-priority="low"] {
  border-left: 4px solid #00aa00;
}

#tasks small {
  color: #666;
  margin-left: 0.5rem;
}
</style>
```

## Try It

<TodoDemo />

## Example Interactions

Try these with VOIX:

- "Add a task called 'Review documentation' with high priority"
- "Complete task-1"
- "Delete the second task"
- "Add 'Write tests' as a low priority task"
- "Clear all completed tasks"

The AI will read the context to understand which tasks exist and execute the appropriate tools.