<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
    task: Object,
    show: Boolean
});

const emit = defineEmits(['close', 'update']);

const editedTask = ref({ ...props.task });

// Reset form when task changes
watch(() => props.task, (newTask) => {
    if (newTask) {
        editedTask.value = { ...newTask };
    }
}, { deep: true });

function handleSave() {
    emit('update', { ...editedTask.value });
    emit('close');
}

function handleToolUpdateDetails(event) {
    const { text, dueDate, priority, notes } = event.detail;
    const updates = { ...editedTask.value };

    if (text !== undefined) updates.text = text;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority !== undefined) updates.priority = priority;
    if (notes !== undefined) updates.notes = notes;

    editedTask.value = updates;
    handleSave();
}

function setText(event) {
    const text = event.detail.text;
    editedTask.value.text = text;
}

function setDueDate(event) {
    const dueDate = event.detail.dueDate;
    editedTask.value.dueDate = dueDate;
}

function setPriority(event) {
    const priority = event.detail.priority;
    editedTask.value.priority = priority;
}

function setNotes(event) {
    const notes = event.detail.notes;
    editedTask.value.notes = notes;
}
</script>

<template>
    <div v-if="show && task" class="modal-overlay" @click="emit('close')">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h2>Task Details</h2>
                <button class="close-button" @click="emit('close')">&times;</button>
            </div>

            <form @submit.prevent="handleSave" class="task-form">
                <div class="form-group">
                    <label for="task-text">Task</label>
                    <input id="task-text" v-model="editedTask.text" type="text" required class="form-control" />
                </div>

                <div class="form-group">
                    <label for="due-date">Due Date (Optional)</label>
                    <input id="due-date" v-model="editedTask.dueDate" type="date" class="form-control" />
                </div>

                <div class="form-group">
                    <label for="priority">Priority</label>
                    <select id="priority" v-model="editedTask.priority" class="form-control">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" v-model="editedTask.notes" rows="3" class="form-control"></textarea>
                </div>

                <div class="button-group">
                    <button type="button" @click="emit('close')" class="btn-cancel">Cancel</button>
                    <button type="submit" class="btn-save">Save Changes</button>
                </div>
            </form>

            <context name="current_task">
                You are currently editing the task with ID {{ task.id }}:
                - text: {{ task.text }}
                - due date: {{ task.dueDate || 'none' }}
                - priority: {{ task.priority || 'medium' }}
                - notes: {{ task.notes || 'none' }}
            </context>

            <tool name="set_text" description="Set the text of the current task" @call="setText">
                <prop name="text" type="string" :description="`New text for task (currently: ${editedTask.text})`">{{
                    editedTask.text }}</prop>
            </tool>

            <tool name="set_due_date" description="Set the due date of the current task" @call="setDueDate">
                <prop name="dueDate" type="string"
                    :description="`Due date in YYYY-MM-DD format (currently: ${editedTask.dueDate || 'none'})`">{{
                        editedTask.dueDate || '' }}</prop>
            </tool>

            <tool name="set_priority" description="Set the priority of the current task" @call="setPriority">
                <prop name="priority" type="string"
                    :description="`Priority: low, medium, or high (currently: ${editedTask.priority || 'medium'})`">{{
                        editedTask.priority || 'medium' }}</prop>
            </tool>

            <tool name="set_notes" description="Set the notes for the current task" @call="setNotes">
                <prop name="notes" type="string"
                    :description="`Additional notes for the task (currently: ${editedTask.notes || 'none'})`">{{
                    editedTask.notes || '' }}</prop>
            </tool>
        </div>
    </div>
</template>

<style scoped>
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
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
}

.close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
}

.task-form {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.25rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
}

.form-control:focus {
    outline: none;
    border-color: #a5b4fc;
    box-shadow: 0 0 0 3px rgba(165, 180, 252, 0.3);
}

textarea.form-control {
    resize: vertical;
}

.button-group {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.btn-cancel {
    padding: 0.75rem 1.25rem;
    background-color: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.btn-save {
    padding: 0.75rem 1.25rem;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.btn-save:hover {
    background-color: #4338ca;
}

.btn-cancel:hover {
    background-color: #e5e7eb;
}
</style>