<script>
  import TaskItem from './TaskItem.svelte';

  let { tasks, onSetComplete, onRemove, onViewDetails } = $props();
</script>

<div class="task-list">
  {#if tasks.length === 0}
    <div class="empty-state">
      <p>No tasks found. Add some tasks to get started!</p>
    </div>
  {:else}
    {#each tasks as task (task.id)}
      <TaskItem
        {task}
        onSetComplete={(completed) => onSetComplete(task.id, completed)}
        onRemove={() => onRemove(task.id)}
        onViewDetails={() => onViewDetails(task)}
      />
    {/each}
  {/if}
</div>

<style>
  .task-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .empty-state p {
    font-size: 1.1rem;
    margin: 0;
  }
</style>