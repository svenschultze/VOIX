<template>
  <div class="demo-container">
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
    <context name="tasks" id="demo-task-context">
      {{ contextText }}
    </context>

    <!-- Task list UI -->
    <div id="demo-task-list">
      <h3>My Tasks</h3>
      <ul id="demo-tasks">
        <li v-for="task in tasks" :key="task.id" 
            :class="{ completed: task.completed }" 
            :data-priority="task.priority">
          <span>{{ task.title }}</span>
          <small>[{{ task.id }}]</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const tasks = ref([])
const nextId = ref(1)

const contextText = computed(() => {
  const active = tasks.value.filter(t => !t.completed)
  const completed = tasks.value.filter(t => t.completed)
  
  return `Total tasks: ${tasks.value.length}
Active: ${active.length}
Completed: ${completed.length}

Task IDs: ${tasks.value.map(t => t.id).join(', ')}`
})

const handlers = {
  add_task: ({ title, priority = 'medium' }) => {
    const task = {
      id: `task-${nextId.value++}`,
      title,
      priority,
      completed: false
    }
    tasks.value.push(task)
  },
  
  complete_task: ({ taskId }) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.completed = true
    }
  },
  
  delete_task: ({ taskId }) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  },
  
  clear_completed: () => {
    tasks.value = tasks.value.filter(t => !t.completed)
  }
}

const handleToolCall = (e) => {
  const toolName = e.target.getAttribute('name')
  if (handlers[toolName]) {
    handlers[toolName](e.detail)
  }
}

onMounted(() => {
  // Only access document when component is mounted on client
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

#demo-task-list {
  margin-top: 1rem;
}

#demo-tasks {
  list-style: none;
  padding: 0;
}

#demo-tasks li {
  padding: 0.5rem;
  margin: 0.5rem 0;
  background: var(--vp-c-bg);
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
}

#demo-tasks li.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

#demo-tasks li[data-priority="high"] {
  border-left: 4px solid #ff4444;
}

#demo-tasks li[data-priority="medium"] {
  border-left: 4px solid #ff8800;
}

#demo-tasks li[data-priority="low"] {
  border-left: 4px solid #00aa00;
}

#demo-tasks small {
  color: var(--vp-c-text-2);
  margin-left: 0.5rem;
}
</style>