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
<<< @/components/TodoDemo.html

## Try It
Try these with VOIX:
- "Add a task called 'Review documentation' with high priority"
- "Complete task-1"
- "Delete the second task"
- "Add 'Write tests' as a low priority task"
- "Clear all completed tasks"

### Grocery List:
<TodoDemo />