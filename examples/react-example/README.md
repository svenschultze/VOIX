# React Task Manager with VOIX Integration

This is a React.js implementation of a task management application that demonstrates integration with the VOIX Chrome extension using the Model Context Protocol (MCP).

## Features

### Task Management
- ✅ Add new tasks with text input
- ✅ Mark tasks as completed/incomplete
- ✅ Set task priorities (low, medium, high)
- ✅ Add due dates to tasks
- ✅ Add notes to tasks
- ✅ Edit task details in a modal
- ✅ Remove tasks
- ✅ Filter tasks by status and priority
- ✅ Visual indicators for overdue tasks

### VOIX Integration
- 🤖 **AI-Powered Task Creation**: Ask the AI to create tasks with specific details
- 🎯 **Smart Task Management**: Use natural language to update, complete, or remove tasks
- 📝 **Context-Aware Assistance**: AI understands current task state and filters
- 🔧 **Individual Field Editing**: Edit specific task properties through AI commands
- 📊 **Dynamic Context**: Real-time updates of task statistics and current state

## VOIX Tools Available

### Global Task Management Tools

#### `add_task`
Create a new task with specified details.
- **text** (required): Task description
- **priority**: Task priority (low, medium, high)
- **dueDate**: Due date in YYYY-MM-DD format
- **notes**: Additional notes

#### `mark_task_completed`
Mark a task as completed or incomplete.
- **taskId** (required): ID of the task to update
- **completed** (required): true to complete, false to mark incomplete

#### `remove_task`
Remove a task from the list.
- **taskId** (required): ID of the task to remove

#### `set_filter`
Change the current task filter settings.
- **status**: Filter by status (all, active, completed)
- **priority**: Filter by priority (all, low, medium, high)

#### `clear_completed_tasks`
Remove all completed tasks from the list.

### Task Detail Modal Tools

When editing a task, additional tools become available:

#### `set_text`
Update the task text.
- **text** (required): New task text

#### `set_due_date`
Set or update the task due date.
- **dueDate**: Due date in YYYY-MM-DD format (empty to remove)

#### `set_priority`
Change the task priority.
- **priority** (required): New priority (low, medium, high)

#### `set_notes`
Update task notes.
- **notes**: Task notes or additional information

## Example AI Interactions

### Creating Tasks
- "Add a new high priority task to review the quarterly report with a due date of June 15th"
- "Create a task called 'Buy groceries' with medium priority and add a note about getting milk and bread"

### Managing Tasks
- "Mark the task about reviewing the report as completed"
- "Remove all completed tasks"
- "Show only high priority tasks"
- "Change the priority of task 3 to low"

### Filtering and Organization
- "Filter to show only active tasks"
- "Show me all overdue tasks"
- "Display only high priority items"

## Context Information

The app provides the following context to the AI:

### `task_summary`
- Total number of tasks
- Completed vs active tasks
- Tasks by priority level
- Number of overdue tasks
- Current filter settings

### `current_task` (when editing)
- Details of the task being edited
- Current field values
- Available actions

## Installation and Setup

1. Navigate to the react-example directory:
   ```bash
   cd examples/react-example
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

5. Install the VOIX Chrome extension and open the AI chat to interact with the tasks

## Development

### Project Structure
```
src/
├── App.js                    # Main application component
├── App.css                   # Application styles
├── components/
│   ├── TaskList.js          # Task list container with filters
│   ├── TaskItem.js          # Individual task component
│   └── TaskDetailsModal.js  # Task editing modal
└── index.js                 # Application entry point
```

### Key React Patterns Used

#### VOIX Tool Integration
The app uses custom React hooks and event listeners to handle VOIX tool calls:

```javascript
// Set up tool event listeners
useEffect(() => {
  const toolElement = toolRef.current;
  if (toolElement) {
    toolElement.addEventListener('call', handleToolCall);
    return () => {
      toolElement.removeEventListener('call', handleToolCall);
    };
  }
}, [handleToolCall]);
```

#### State Management
Uses React's built-in state management with useState and useCallback for optimal performance:

```javascript
const [tasks, setTasks] = useState([]);
const [filter, setFilter] = useState({ status: 'all', priority: 'all' });

const handleAddTask = useCallback((taskData) => {
  const newTask = { id: Date.now(), ...taskData };
  setTasks(prev => [...prev, newTask]);
}, []);
```

#### Dynamic Context Updates
Context elements are updated automatically when state changes:

```javascript
const contextText = useMemo(() => `
  Total tasks: ${tasks.length}
  Completed: ${completedTasks.length}
  Active: ${activeTasks.length}
  // ... more context
`.trim(), [tasks, completedTasks, activeTasks]);
```

### Customization

You can extend this example by:

1. **Adding More Fields**: Extend the task object with additional properties
2. **Advanced Filtering**: Implement date ranges, tags, or custom filters
3. **Persistence**: Add localStorage or API integration
4. **Collaboration**: Add user assignment and sharing features
5. **Notifications**: Implement reminders for due dates

### VOIX Integration Best Practices

1. **Tool Naming**: Use clear, descriptive names for tools
2. **Parameter Validation**: Always validate tool parameters
3. **Error Handling**: Provide meaningful error messages
4. **Context Updates**: Keep context current with application state
5. **User Feedback**: Provide visual feedback for AI actions

## Testing with VOIX

To test the VOIX integration:

1. Start the React app
2. Open Chrome DevTools and check the Console for tool discovery logs
3. Use the VOIX Chrome extension to interact with tasks
4. Try various AI commands to create, update, and manage tasks

Example test commands:
- "Add a task to prepare presentation"
- "Mark the first task as completed"
- "Show only high priority tasks"
- "Remove all completed tasks"

## Browser Compatibility

- Chrome 88+ (for Manifest V3 support)
- Modern browsers with ES6+ support
- Requires VOIX Chrome extension for AI functionality
