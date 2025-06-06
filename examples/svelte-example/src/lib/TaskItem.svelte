<script>
  let { task, onSetComplete, onRemove, onViewDetails } = $props();

  function handleSetComplete(event) {
    const { completed } = event.detail || {};
    onSetComplete(completed);
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id, completed },
        message: `Task "${task.text}" marked as ${completed ? 'completed' : 'incomplete'}`
      }
    }));
  }

  function handleRemove(event) {
    onRemove();
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id },
        message: `Task "${task.text}" removed successfully`
      }
    }));
  }

  function handleViewDetails(event) {
    onViewDetails();
    
    // Send success response
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: { task_id: task.id },
        message: `Opened details for task "${task.text}"`
      }
    }));
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
</script>

<div class="task-item" class:completed={task.completed}>
  <div class="task-content">
    <div class="task-main">
      <input
        type="checkbox"
        bind:checked={task.completed}
        class="task-checkbox"
      />
      <span class="task-text" class:completed={task.completed}>
        {task.text}
      </span>
      <div class="task-badges">
        <span class="priority-badge {getPriorityClass(task.priority)}">
          {task.priority}
        </span>
        {#if task.dueDate}
          <span class="due-date-badge">
            📅 {formatDate(task.dueDate)}
          </span>
        {/if}
      </div>
    </div>
    
    {#if task.notes}
      <div class="task-notes">
        {task.notes}
      </div>
    {/if}
  </div>
  
  <div class="task-actions">
    <button
      onclick={() => onViewDetails(task)}
      class="action-button details-button"
      title="View Details"
    >
      📝
    </button>
    <button
      onclick={() => onRemove(task.id)}
      class="action-button remove-button"
      title="Remove Task"
    >
      🗑️
    </button>
  </div>

  <!-- VOIX Tools for this specific task -->
  <tool
    name="set_complete"
    description="Mark this task as completed or incomplete"
    oncall={handleSetComplete}
  >
    <prop name="completed" type="boolean" description="Whether the task is completed" required>
      {!task.completed}
    </prop>
  </tool>

  <tool
    name="remove_task"
    description="Remove this task from the list"
    oncall={handleRemove}
  >
  </tool>

  <tool
    name="view_details"
    description="Open the details modal for this task"
    oncall={handleViewDetails}
  >
  </tool>

  <!-- Context for this specific task -->
  <context name="task_info">
    Task: {task.text}
    Status: {task.completed ? 'completed' : 'incomplete'}
    Priority: {task.priority}
    Due Date: {task.dueDate || 'none'}
    Notes: {task.notes || 'none'}
  </context>
</div>

<style>
  .task-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .task-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
  }

  .task-item.completed {
    opacity: 0.7;
    background-color: #f9fafb;
  }

  .task-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .task-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .task-checkbox {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .task-text {
    font-size: 1rem;
    font-weight: 500;
    flex: 1;
    min-width: 200px;
  }

  .task-text.completed {
    text-decoration: line-through;
    color: #6b7280;
  }

  .task-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .priority-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .priority-high {
    background-color: #fee2e2;
    color: #dc2626;
  }

  .priority-medium {
    background-color: #fef3c7;
    color: #d97706;
  }

  .priority-low {
    background-color: #ecfdf5;
    color: #059669;
  }

  .due-date-badge {
    padding: 0.25rem 0.5rem;
    background-color: #ede9fe;
    color: var(--primary-color);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .task-notes {
    padding-left: 2rem;
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
  }

  .task-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .details-button {
    background-color: #ede9fe;
    color: var(--primary-color);
  }

  .details-button:hover {
    background-color: var(--primary-color);
    color: white;
  }

  .remove-button {
    background-color: #fee2e2;
    color: var(--danger-color);
  }

  .remove-button:hover {
    background-color: var(--danger-color);
    color: white;
  }

  @media (max-width: 640px) {
    .task-item {
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-main {
      flex-wrap: wrap;
    }

    .task-actions {
      align-self: flex-end;
    }
  }
</style>