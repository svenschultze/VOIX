import React, { useState, useCallback, useMemo } from 'react';
import './App.css';
import TaskList from './components/TaskList';
import TaskDetailsModal from './components/TaskDetailsModal';

function App() {
  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      text: 'Learn React', 
      completed: true,
      priority: 'high',
      dueDate: '2025-06-12',
      notes: 'Focus on hooks and component patterns'
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

  const [newTask, setNewTask] = useState('');
  const [nextId, setNextId] = useState(4);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter options
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed'
  const [sortBy, setSortBy] = useState('id'); // 'id', 'priority', 'dueDate'

  // Computed filtered tasks
  const filteredTasks = useMemo(() => {
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
  }, [tasks, filterStatus, sortBy]);

  // Task operations
  const addTask = useCallback((text) => {
    console.log(`Adding task: ${text}`);
    if (text && text.trim()) {
      const newTaskObj = { 
        id: nextId, 
        text: text.trim(), 
        completed: false,
        priority: 'medium',
        dueDate: '',
        notes: ''
      };
      setTasks(prev => [...prev, newTaskObj]);
      setNextId(prev => prev + 1);
      console.log('Task added, new tasks array:', [...tasks, newTaskObj]);
    }
  }, [nextId, tasks]);

  const removeTask = useCallback((id) => {
    console.log(`Removing task with id: ${id}`);
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const setTaskComplete = useCallback((id, completed) => {
    console.log(`Setting task ${id} to ${completed}`);
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed } : task
    ));
  }, []);

  const updateTaskDetails = useCallback((updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  }, []);

  const handleAddTask = useCallback((event) => {
    event.preventDefault();
    addTask(newTask);
    setNewTask('');
  }, [addTask, newTask]);

  const viewTaskDetails = useCallback((task) => {
    setSelectedTask({ ...task });
    setShowDetailsModal(true);
  }, []);

  // VOIX Tool handlers
  const handleAddTaskTool = useCallback((event) => {
    const { text } = event.detail || {};
    if (text) {
      addTask(text);
      event.detail.success = true;
      event.detail.result = { task_added: text };
      event.detail.message = `Task "${text}" added successfully`;
    } else {
      event.detail.success = false;
      event.detail.error = "Task text is required";
    }
  }, [addTask]);

  // Dynamic context for VOIX
  const taskContext = useMemo(() => JSON.stringify({
    totalTasks: tasks.length,
    filteredTasks: filteredTasks.length,
    completedTasks: tasks.filter(t => t.completed).length,
    activeTasks: tasks.filter(t => !t.completed).length,
    currentFilter: filterStatus,
    sortBy: sortBy,
    lastUpdated: new Date().toISOString()
  }), [tasks, filteredTasks, filterStatus, sortBy]);

  return (
    <div className="task-manager-app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <p className="subtitle">Organize your day with AI assistance</p>
      </header>
      
      <main className="app-content">
        {/* Task Input */}
        <div className="task-input-container">
          <form onSubmit={handleAddTask} className="add-task-form">
            <label htmlFor="new-task-input" className="visually-hidden">New task</label>
            <input 
              id="new-task-input"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?" 
              className="task-input"
            />
            <button type="submit" className="add-button">Add Task</button>
          </form>
        </div>
        
        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="filter-status">Show:</label>
            <select 
              id="filter-status" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="sort-by">Sort by:</label>
            <select 
              id="sort-by" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="id">Created date</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due date</option>
            </select>
          </div>
        </div>
        
        {/* Task List */}
        <TaskList
          tasks={filteredTasks}
          onSetComplete={setTaskComplete}
          onRemove={removeTask}
          onViewDetails={viewTaskDetails}
        />
      </main>
      
      {/* Task Details Modal */}
      {showDetailsModal && (
        <TaskDetailsModal 
          task={selectedTask}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={updateTaskDetails}
        />
      )}
      
      {/* VOIX Tools and Context */}
      <tool
        name="add_task"
        description="Add a new task to the list"
        ref={(el) => {
          if (el) {
            el.addEventListener('call', handleAddTaskTool);
            return () => el.removeEventListener('call', handleAddTaskTool);
          }
        }}
      >
        <prop name="text" type="string" description="Text of the task to add" required>
          New task
        </prop>
      </tool>
      
      {/* Context with filtered tasks */}
      <context name="task_list">{taskContext}</context>

      <context name="current_date">
        {new Date().toLocaleDateString()}
      </context>
    </div>
  );
}

export default App;
