<script setup>
import { defineProps, defineEmits } from 'vue';
import TaskItem from './TaskItem.vue';

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['set-complete', 'remove', 'view-details']);
</script>

<template>
  <div class="task-list-container">
    <ul v-if="tasks.length > 0" class="task-list">
      <TaskItem 
        v-for="task in tasks" 
        :key="task.id"
        :task="task"
        @set-complete="(completed) => emit('set-complete', task.id, completed)"
        @remove="() => emit('remove', task.id)"
        @view-details="() => emit('view-details', task)"
      />
    </ul>
    <p v-else class="no-tasks">No tasks yet. Add a task to get started!</p>
  </div>
</template>

<style scoped>
.task-list-container {
  width: 100%;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.no-tasks {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem 0;
}
</style>