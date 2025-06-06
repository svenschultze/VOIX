<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    task: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['set-complete', 'remove', 'view-details']);

function setComplete(event) {
    const completed = event.target.completed;
    emit('set-complete', completed);
}

function removeTask() {
    console.log('Removing task:', props.task.id);
    emit('remove');
}

function viewDetails() {
    emit('view-details');
}
</script>

<template>
    <li class="task-item" :class="{ 'completed': task.completed }">
        <div class="task-content">
            <input type="checkbox" :checked="task.completed" @change="emit('set-complete', !task.completed)"
                class="task-checkbox" />
            <span class="task-text">{{ task.text }}</span>
        </div>
        <div class="task-actions">
            <button @click="emit('view-details')" class="btn-details">Details</button>
            <button @click="emit('remove')" class="btn-remove">Remove</button>
        </div>
    </li>
    <tool :name="'set_complete: ' + task.text" @call="setComplete">
        <prop name="completed" type="boolean" description="Mark the task as completed or not" required />
    </tool>
    <tool :name="'remove_task: ' + task.text" @call="removeTask" />
    <tool :name="'view_task_details: ' + task.text" @call="viewDetails" />
</template>

<style scoped>
.task-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
}

.task-item.completed {
    opacity: 0.7;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    background-color: #f8f8f8;
}

.task-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.task-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
}

.task-text {
    flex-grow: 1;
}

.completed .task-text {
    text-decoration: line-through;
    color: #888;
}

.task-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.btn-details {
    background-color: #e0e7ff;
    color: #4338ca;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
}

.btn-remove {
    background-color: #fee2e2;
    color: #b91c1c;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
}

.btn-details:hover {
    background-color: #c7d2fe;
}

.btn-remove:hover {
    background-color: #fecaca;
}
</style>