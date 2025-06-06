<script>
  import TaskList from './lib/TaskList.svelte';
  import TaskDetailsModal from './lib/TaskDetailsModal.svelte';

  let tasks = $state([
    { 
      id: 1, 
      text: 'Learn Svelte', 
      completed: true,
      priority: 'high',
      dueDate: '2025-06-12',
      notes: 'Focus on reactive statements and stores'
    },
    { 
      id: 2, 
      text: 'Build a task manager', 
      completed: false,
      priority: 'medium',
      dueDate: '2025-06-15',
      notes: 'Include MCP integration'
    },
    { 
      id: 3, 
      text: 'Deploy to production', 
      completed: false,
      priority: 'low',
      dueDate: '2025-06-20',
      notes: ''
    }
  ]);

  let newTask = $state('');
  let nextId = 4;

  let selectedTask = $state(null);
  let showDetailsModal = $state(false);

  // Filter options
  let filterStatus = $state('all'); // 'all', 'active', 'completed'
  let sortBy = $state('id'); // 'id', 'priority', 'dueDate'

  // Computed tasks based on filters
  let filteredTasks = $derived(() => {
    let filtered = [...tasks];
    
    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
      } else if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.id - b.id;
    });
    
    return filtered;
  });

  // Task operations
  function addTask(text) {
    console.log(`Adding task: ${text}`);
    if (text && text.trim()) {
      const newTaskObj = { 
        id: nextId++, 
        text: text.trim(), 
        completed: false,
        priority: 'medium',
        dueDate: '',
        notes: ''
      };
      tasks.push(newTaskObj);
      console.log('Task added, new tasks array:', tasks);
    }
  }

  function removeTask(id) {
    console.log(`Removing task with id: ${id}`);
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks.splice(index, 1);
    }
  }

  function setTaskComplete(id, completed) {
    console.log(`Setting task ${id} to ${completed}`);
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = completed;
    }
  }

  function updateTaskDetails(updatedTask) {
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
    }
  }

  function handleAddTask(event) {
    event.preventDefault();
    addTask(newTask);
    newTask = '';
  }

  function viewTaskDetails(task) {
    selectedTask = { ...task };
    showDetailsModal = true;
  }

  function handleAddTaskTool(event) {
    const { text } = event.detail || {};
    addTask(text);
  }
</script>

<div class="task-manager-app">
  <header class="app-header">
    <h1>Task Manager</h1>
    <p class="subtitle">Organize your day with AI assistance</p>
  </header>
  
  <main class="app-content">
    <!-- Task Input -->
    <div class="task-input-container">
      <form onsubmit={handleAddTask} class="add-task-form">
        <label for="new-task-input" class="visually-hidden">New task</label>
        <input 
          id="new-task-input"
          bind:value={newTask}
          placeholder="What needs to be done?" 
          class="task-input"
        />
        <button type="submit" class="add-button">Add Task</button>
      </form>
    </div>
    
    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label for="filter-status">Show:</label>
        <select id="filter-status" bind:value={filterStatus} class="filter-select">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="sort-by">Sort by:</label>
        <select id="sort-by" bind:value={sortBy} class="filter-select">
          <option value="id">Created date</option>
          <option value="priority">Priority</option>
          <option value="dueDate">Due date</option>
        </select>
      </div>
    </div>
    
    <!-- Task List -->
    <TaskList
      tasks={filteredTasks()}
      onSetComplete={setTaskComplete}
      onRemove={removeTask}
      onViewDetails={viewTaskDetails}
    />
  </main>
  
  <!-- Task Details Modal -->
  {#if showDetailsModal}
    <TaskDetailsModal 
      task={selectedTask}
      onClose={() => showDetailsModal = false}
      onUpdate={updateTaskDetails}
    />
  {/if}
  
  <!-- Scoped tools visible at the app level -->
  <tool
    name="add_task"
    description="Add a new task to the list"
    oncall={handleAddTaskTool}
  >
    <prop name="text" type="string" description="Text of the task to add" required></prop>
  </tool>
  
  <!-- Context with filtered tasks -->
  <context name="task_list">{JSON.stringify(filteredTasks)}</context>

  <context name="current_date">
    {new Date().toLocaleDateString()}
  </context>
</div>

<style>
  /* Global styles */
  :global(:root) {
    --primary-color: #4f46e5;
    --primary-hover: #4338ca;
    --text-color: #374151;
    --bg-color: #f3f4f6;
    --card-bg: #ffffff;
    --border-color: #e5e7eb;
    --success-color: #10b981;
    --danger-color: #ef4444;
    --warning-color: #f59e0b;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: var(--text-color);
    background-color: var(--bg-color);
    line-height: 1.5;
  }

  .task-manager-app {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .app-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  h1 {
    font-size: 2.5rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 1.1rem;
    color: #6b7280;
    margin-top: 0;
  }

  .app-content {
    background-color: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .task-input-container {
    margin-bottom: 1.5rem;
  }

  .add-task-form {
    display: flex;
    gap: 1rem;
  }

  .task-input {
    flex: 1;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1rem;
  }

  .add-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .add-button:hover {
    background-color: var(--primary-hover);
  }

  .filters {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    background-color: #f9fafb;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: white;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 640px) {
    .add-task-form {
      flex-direction: column;
    }
    
    .filters {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
