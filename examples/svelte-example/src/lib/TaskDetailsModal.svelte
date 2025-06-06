<script>
  let { task, onClose, onUpdate } = $props();
  
  // Create a local copy for editing
  let editedTask = $state({ ...task });
  
  function handleSubmit() {
    onUpdate(editedTask);
    onClose();
  }

  function handleSetText(event) {
    const { text } = event.detail || {};
    editedTask.text = text;
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id, new_text: text },
        message: `Task text updated to "${text}"`
      }
    }));
  }

  function handleSetPriority(event) {
    const { priority } = event.detail || {};
    editedTask.priority = priority;
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id, new_priority: priority },
        message: `Task priority updated to ${priority}`
      }
    }));
  }

  function handleSetDueDate(event) {
    const { due_date } = event.detail || {};
    editedTask.dueDate = due_date;
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id, new_due_date: due_date },
        message: `Task due date updated to ${due_date || 'none'}`
      }
    }));
  }

  function handleSetNotes(event) {
    const { notes } = event.detail || {};
    editedTask.notes = notes;
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id, new_notes: notes },
        message: 'Task notes updated successfully'
      }
    }));
  }

  function handleSaveChanges(event) {
    handleSubmit();
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id, updated_task: editedTask },
        message: `All changes saved for task "${editedTask.text}"`
      }
    }));
  }

  // Close modal when clicking outside
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  // Close modal on Escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e)}>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Task Details</h2>
      <button onclick={onClose} class="close-button" title="Close">✕</button>
    </div>
    
    <form onsubmit={handleSubmit} class="modal-body">
      <div class="form-group">
        <label for="task-text">Task Text</label>
        <input
          id="task-text"
          type="text"
          bind:value={editedTask.text}
          class="form-input"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="task-priority">Priority</label>
        <select
          id="task-priority"
          bind:value={editedTask.priority}
          class="form-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="task-due-date">Due Date</label>
        <input
          id="task-due-date"
          type="date"
          bind:value={editedTask.dueDate}
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="task-notes">Notes</label>
        <textarea
          id="task-notes"
          bind:value={editedTask.notes}
          class="form-textarea"
          rows="3"
          placeholder="Add any additional notes..."
        ></textarea>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={editedTask.completed}
            class="form-checkbox"
          />
          Mark as completed
        </label>
      </div>
      
      <div class="modal-actions">
        <button type="button" onclick={onClose} class="cancel-button">
          Cancel
        </button>
        <button type="submit" class="save-button">
          Save Changes
        </button>
      </div>
    </form>

    <!-- VOIX Tools for task editing -->
    <tool
      name="set_text"
      description="Update the task text"
      oncall={handleSetText}
    >
      <prop name="text" type="string" description="New task text" required>
        {editedTask.text}
      </prop>
    </tool>

    <tool
      name="set_priority"
      description="Update the task priority"
      oncall={handleSetPriority}
    >
      <prop name="priority" type="string" description="New priority: low, medium, high" required>
        {editedTask.priority}
      </prop>
    </tool>

    <tool
      name="set_due_date"
      description="Update the task due date"
      oncall={handleSetDueDate}
    >
      <prop name="due_date" type="string" description="New due date in YYYY-MM-DD format">
        {editedTask.dueDate || '2025-06-15'}
      </prop>
    </tool>

    <tool
      name="set_notes"
      description="Update the task notes"
      oncall={handleSetNotes}
    >
      <prop name="notes" type="string" description="New task notes">
        {editedTask.notes || ''}
      </prop>
    </tool>

    <tool
      name="save_changes"
      description="Save all changes to the task"
      oncall={handleSaveChanges}
    >
    </tool>

    <!-- Context for the modal -->
    <context name="modal_state">
      Editing task: {editedTask.text}
      Current priority: {editedTask.priority}
      Current due date: {editedTask.dueDate || 'none'}
      Current status: {editedTask.completed ? 'completed' : 'incomplete'}
      Notes length: {editedTask.notes?.length || 0} characters
    </context>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .close-button {
    width: 2rem;
    height: 2rem;
    border: none;
    background: #f3f4f6;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #6b7280;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: #e5e7eb;
    color: var(--text-color);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color);
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .checkbox-label {
    display: flex !important;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-bottom: 0 !important;
  }

  .form-checkbox {
    width: auto !important;
    margin: 0;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .cancel-button,
  .save-button {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-button {
    background: #f3f4f6;
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }

  .cancel-button:hover {
    background: #e5e7eb;
  }

  .save-button {
    background: var(--primary-color);
    color: white;
    border: 1px solid var(--primary-color);
  }

  .save-button:hover {
    background: var(--primary-hover);
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0.5rem;
    }
    
    .modal-content {
      max-height: 95vh;
    }
    
    .modal-actions {
      flex-direction: column;
    }
  }
</style>