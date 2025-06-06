# Writing Websites That Support VOIX Chrome Extension

This tutorial explains how to create websites that work seamlessly with the VOIX Chrome extension, enabling AI assistants to interact with your web applications through structured tools and context.

## Table of Contents

1. [Overview](#overview)
2. [Basic Concepts](#basic-concepts)
3. [Defining Tools](#defining-tools)
4. [Providing Context](#providing-context)
5. [Handling Tool Execution](#handling-tool-execution)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Testing Your Implementation](#testing-your-implementation)
9. [Examples](#examples)
10. [Framework Integration](#framework-integration)

## Overview

The VOIX Chrome extension implements the Model Context Protocol (MCP) to enable AI assistants to discover and interact with tools on web pages. When a user opens the AI chat, the extension:

1. Scans the page for `<tool>` and `<context>` elements
2. Provides these to the AI as available functions and context
3. Executes tool calls by dispatching DOM events
4. Returns results to the AI for further processing

## Basic Concepts

### Tools
Tools are functions that the AI can call to perform actions on your website. They are defined using HTML `<tool>` elements with structured parameters.

### Context
Context provides the AI with information about the current page state, user, or application data. This helps the AI make better decisions about which tools to use and how to use them.

### MCP Compliance
The extension follows the Model Context Protocol standard, ensuring compatibility with various AI systems and future extensibility.

## Defining Tools

### Basic Tool Structure

```html
<tool name="tool_name" description="What this tool does">
    <prop name="parameter_name" type="string" description="Parameter description" required>
        Example value
    </prop>
</tool>
```

### Tool Attributes

- `name`: Unique identifier for the tool (required)
- `description`: Human-readable explanation of what the tool does

### Parameter Types

#### String Parameters
```html
<prop name="username" type="string" description="User's login name" required>
    john_doe
</prop>
```

#### Number Parameters
```html
<prop name="quantity" type="number" description="Number of items">
    5
</prop>
```

#### Boolean Parameters
```html
<prop name="send_notification" type="boolean" description="Whether to send email notification">
    true
</prop>
```

#### Array Parameters
```html
<array name="schedule" description="Array of schedule items" required>
    <dict>
        <prop name="starttime" type="string" description="Start time in HH:MM format" required>09:00</prop>
        <prop name="endtime" type="string" description="End time in HH:MM format" required>17:00</prop>
        <prop name="type" type="string" description="Type of activity" required>work</prop>
    </dict>
</array>
```

### Complete Tool Examples

#### Simple Tool
```html
<tool name="switch_date" description="Switch to a specific date">
    <prop name="date" type="string" description="Date in YYYY-MM-DD format" required>
        2025-06-10
    </prop>
</tool>
```

#### Complex Tool with Array
```html
<tool name="create_meeting" description="Create a new meeting with attendees">
    <prop name="title" type="string" description="Meeting title" required>
        Weekly Standup
    </prop>
    <prop name="date" type="string" description="Meeting date in YYYY-MM-DD format" required>
        2025-06-15
    </prop>
    <prop name="duration" type="number" description="Duration in minutes">
        60
    </prop>
    <array name="attendees" description="List of meeting attendees" required>
        <dict>
            <prop name="email" type="string" description="Attendee email address" required>
                user@example.com
            </prop>
            <prop name="role" type="string" description="Attendee role">
                participant
            </prop>
        </dict>
    </array>
</tool>
```

## Providing Context

### Basic Context
```html
<context name="current_user">
    Current user: John Doe
    User ID: 12345
    Role: Administrator
    Last login: 2025-06-06 09:30:00
</context>
```

### Page-Specific Context
```html
<context name="page_info">
    Current page: Project Dashboard
    Active project: Website Redesign
    Project status: In Progress
    Team members: 5
    Deadline: 2025-07-01
</context>
```

### Dynamic Context (Updated via JavaScript)
```html
<context name="app_state" id="dynamic-context">
    Loading...
</context>

<script>
function updateContext() {
    const contextEl = document.getElementById('dynamic-context');
    contextEl.textContent = `
        Current time: ${new Date().toISOString()}
        Active sessions: ${getActiveSessions()}
        Pending notifications: ${getPendingNotifications()}
    `;
}

// Update context every 30 seconds
setInterval(updateContext, 30000);
updateContext(); // Initial update
</script>
```

### Resource Elements (MCP Standard)
```html
<resource name="user_preferences" description="Current user preferences">
    {
        "theme": "dark",
        "language": "en",
        "timezone": "UTC",
        "notifications": {
            "email": true,
            "push": false
        }
    }
</resource>
```

## Handling Tool Execution

### Setting Up Event Listeners

```javascript
// Listen for tool calls on all tool elements
document.querySelectorAll('tool').forEach(tool => {
    tool.addEventListener('call', async (event) => {
        const toolName = tool.getAttribute('name');
        const args = event.detail;
        
        console.log(`Tool "${toolName}" called with:`, args);
        
        try {
            const result = await executeToolLogic(toolName, args);
            
            // Send success response
            tool.dispatchEvent(new CustomEvent('response', {
                detail: {
                    success: true,
                    result: result,
                    message: `Successfully executed ${toolName}`
                }
            }));
        } catch (error) {
            // Send error response
            tool.dispatchEvent(new CustomEvent('response', {
                detail: {
                    success: false,
                    error: error.message
                }
            }));
        }
    });
});
```

### Tool-Specific Handlers

```javascript
async function executeToolLogic(toolName, args) {
    switch (toolName) {
        case 'switch_date':
            return await switchToDate(args.date);
            
        case 'create_meeting':
            return await createMeeting({
                title: args.title,
                date: args.date,
                duration: args.duration,
                attendees: args.attendees
            });
            
        case 'update_status':
            return await updateProjectStatus(args.project_id, args.status);
            
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}

async function switchToDate(date) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Update the UI
    const dateInput = document.getElementById('date-picker');
    if (dateInput) {
        dateInput.value = date;
        dateInput.dispatchEvent(new Event('change'));
    }
    
    // Update application state
    await loadDataForDate(date);
    
    return {
        date: date,
        message: `Switched to ${date}`,
        events_count: getEventsForDate(date).length
    };
}

async function createMeeting(meetingData) {
    // Validate required fields
    if (!meetingData.title || !meetingData.date) {
        throw new Error('Title and date are required');
    }
    
    // Create meeting in your system
    const meeting = await apiCreateMeeting(meetingData);
    
    // Update UI
    refreshMeetingsList();
    
    return {
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        attendees_count: meeting.attendees.length,
        message: `Meeting "${meeting.title}" created successfully`
    };
}
```

## Advanced Features

### Conditional Tools

Show different tools based on application state:

```javascript
function updateAvailableTools() {
    const userRole = getCurrentUserRole();
    
    // Hide admin tools for non-admin users
    document.querySelectorAll('tool[data-role="admin"]').forEach(tool => {
        tool.style.display = userRole === 'admin' ? 'block' : 'none';
    });
    
    // Show context-specific tools
    const currentPage = getCurrentPage();
    document.querySelectorAll('tool[data-page]').forEach(tool => {
        const requiredPage = tool.getAttribute('data-page');
        tool.style.display = currentPage === requiredPage ? 'block' : 'none';
    });
}
```

### Tool Validation

```javascript
function validateToolParameters(toolName, args) {
    const validations = {
        'switch_date': (args) => {
            if (!args.date) throw new Error('Date is required');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
                throw new Error('Date must be in YYYY-MM-DD format');
            }
            const date = new Date(args.date);
            if (date < new Date()) {
                throw new Error('Cannot switch to a past date');
            }
        },
        
        'create_meeting': (args) => {
            if (!args.title?.trim()) throw new Error('Meeting title is required');
            if (!args.attendees?.length) throw new Error('At least one attendee is required');
            
            args.attendees.forEach((attendee, index) => {
                if (!attendee.email || !/\S+@\S+\.\S+/.test(attendee.email)) {
                    throw new Error(`Invalid email for attendee ${index + 1}`);
                }
            });
        }
    };
    
    if (validations[toolName]) {
        validations[toolName](args);
    }
}
```

### Real-time Context Updates

```javascript
class ContextManager {
    constructor() {
        this.contextElements = new Map();
        this.setupContextElements();
        this.startRealTimeUpdates();
    }
    
    setupContextElements() {
        document.querySelectorAll('context[name]').forEach(el => {
            this.contextElements.set(el.getAttribute('name'), el);
        });
    }
    
    updateContext(name, content) {
        const element = this.contextElements.get(name);
        if (element) {
            element.textContent = content;
        }
    }
    
    startRealTimeUpdates() {
        // Update user activity context
        setInterval(() => {
            this.updateContext('user_activity', `
                Last action: ${this.getLastUserAction()}
                Current focus: ${document.activeElement?.tagName || 'none'}
                Page visibility: ${document.visibilityState}
                Time on page: ${this.getTimeOnPage()} seconds
            `);
        }, 10000);
        
        // Update system status
        setInterval(() => {
            this.updateContext('system_status', `
                Connection status: ${navigator.onLine ? 'online' : 'offline'}
                Memory usage: ${this.getMemoryUsage()}
                Performance: ${this.getPerformanceMetrics()}
            `);
        }, 30000);
    }
}

// Initialize context manager
const contextManager = new ContextManager();
```

## Best Practices

### 1. Clear Tool Naming and Descriptions
```html
<!-- Good -->
<tool name="mark_task_complete" description="Mark a specific task as completed and update project progress">

<!-- Avoid -->
<tool name="do_stuff" description="Does something">
```

### 2. Comprehensive Parameter Documentation
```html
<tool name="schedule_meeting" description="Schedule a new meeting with specified attendees">
    <prop name="title" type="string" description="Meeting title (max 100 characters)" required>
        Weekly Team Sync
    </prop>
    <prop name="date" type="string" description="Meeting date in ISO format YYYY-MM-DD" required>
        2025-06-15
    </prop>
    <prop name="time" type="string" description="Meeting time in 24-hour format HH:MM" required>
        14:30
    </prop>
    <prop name="duration" type="number" description="Meeting duration in minutes (15-480)">
        60
    </prop>
</tool>
```

### 3. Proper Error Handling
```javascript
tool.addEventListener('call', async (event) => {
    try {
        // Validate input
        validateToolParameters(toolName, event.detail);
        
        // Execute tool logic
        const result = await executeToolLogic(toolName, event.detail);
        
        // Send detailed success response
        tool.dispatchEvent(new CustomEvent('response', {
            detail: {
                success: true,
                result: result,
                timestamp: new Date().toISOString(),
                execution_time: Date.now() - startTime
            }
        }));
        
    } catch (error) {
        // Log error for debugging
        console.error(`Tool ${toolName} execution failed:`, error);
        
        // Send user-friendly error response
        tool.dispatchEvent(new CustomEvent('response', {
            detail: {
                success: false,
                error: error.message,
                error_code: error.code || 'EXECUTION_ERROR',
                timestamp: new Date().toISOString()
            }
        }));
    }
});
```

### 4. Context Relevance
```html
<!-- Provide contextual information that helps the AI make decisions -->
<context name="current_workflow">
    Active workflow: Invoice Processing
    Current step: Approval Pending
    Next possible actions: approve, reject, request_changes
    Assigned reviewer: manager@company.com
    Due date: 2025-06-08
    Priority: high
</context>
```

### 5. Tool Organization
```html
<!-- Group related tools -->
<div data-tool-group="calendar">
    <tool name="create_event" description="Create a new calendar event">
        <!-- parameters -->
    </tool>
    
    <tool name="update_event" description="Update an existing calendar event">
        <!-- parameters -->
    </tool>
    
    <tool name="delete_event" description="Delete a calendar event">
        <!-- parameters -->
    </tool>
</div>

<div data-tool-group="tasks">
    <tool name="create_task" description="Create a new task">
        <!-- parameters -->
    </tool>
    
    <tool name="complete_task" description="Mark a task as completed">
        <!-- parameters -->
    </tool>
</div>
```

## Testing Your Implementation

### 1. Basic Testing Page
Create a simple test page to verify your tools work:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Tool Testing Page</title>
</head>
<body>
    <h1>Testing VOIX Integration</h1>
    
    <!-- Your tools here -->
    <tool name="test_tool" description="Simple test tool">
        <prop name="message" type="string" description="Test message" required>
            Hello World
        </prop>
    </tool>
    
    <context name="test_context">
        This is a test page for validating VOIX integration.
        Current time: 2025-06-06 10:00:00
    </context>
    
    <div id="output"></div>
    
    <script>
        // Test event listeners
        document.querySelector('tool[name="test_tool"]').addEventListener('call', (event) => {
            console.log('Test tool called:', event.detail);
            document.getElementById('output').innerHTML = 
                `<p>Tool called with message: ${event.detail.message}</p>`;
            
            event.target.dispatchEvent(new CustomEvent('response', {
                detail: { success: true, message: 'Test successful!' }
            }));
        });
    </script>
</body>
</html>
```

### 2. Debug Console Logging
```javascript
// Enhanced logging for development
function setupDebugLogging() {
    console.log('🔧 Setting up VOIX debug logging');
    
    // Log all tool discoveries
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'TOOL') {
                    console.log('🆕 New tool discovered:', node.getAttribute('name'));
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Log all tool executions
    document.addEventListener('call', (event) => {
        if (event.target.tagName === 'TOOL') {
            console.log('🎯 Tool executed:', {
                name: event.target.getAttribute('name'),
                args: event.detail,
                timestamp: new Date().toISOString()
            });
        }
    }, true);
}

// Call during development
if (process.env.NODE_ENV === 'development') {
    setupDebugLogging();
}
```

### 3. Tool Validation Script
```javascript
function validatePageTools() {
    const tools = document.querySelectorAll('tool[name]');
    const issues = [];
    
    tools.forEach((tool, index) => {
        const name = tool.getAttribute('name');
        const description = tool.getAttribute('description');
        
        // Check required attributes
        if (!name) {
            issues.push(`Tool ${index + 1}: Missing name attribute`);
        }
        if (!description) {
            issues.push(`Tool "${name}": Missing description attribute`);
        }
        
        // Check parameters
        const props = tool.querySelectorAll('prop[name]');
        props.forEach((prop) => {
            const propName = prop.getAttribute('name');
            const propType = prop.getAttribute('type') || 'string';
            const propDesc = prop.getAttribute('description');
            
            if (!propName) {
                issues.push(`Tool "${name}": Parameter missing name attribute`);
            }
            if (!propDesc) {
                issues.push(`Tool "${name}", parameter "${propName}": Missing description`);
            }
            if (!['string', 'number', 'boolean'].includes(propType)) {
                issues.push(`Tool "${name}", parameter "${propName}": Invalid type "${propType}"`);
            }
        });
        
        // Check for event listeners
        const hasListener = tool.onclick || 
                           tool.addEventListener || 
                           tool.getAttribute('onclick');
        if (!hasListener) {
            console.warn(`Tool "${name}": No event listener detected`);
        }
    });
    
    if (issues.length > 0) {
        console.error('❌ Tool validation issues found:', issues);
        return false;
    } else {
        console.log('✅ All tools validated successfully');
        return true;
    }
}

// Run validation
document.addEventListener('DOMContentLoaded', validatePageTools);
```

## Examples

### E-commerce Site
```html
<!-- Product management tools -->
<tool name="add_to_cart" description="Add a product to the shopping cart">
    <prop name="product_id" type="string" description="Unique product identifier" required>
        PROD-12345
    </prop>
    <prop name="quantity" type="number" description="Number of items to add">
        1
    </prop>
    <prop name="variant" type="string" description="Product variant (size, color, etc.)">
        Large/Red
    </prop>
</tool>

<tool name="update_quantity" description="Update the quantity of an item in cart">
    <prop name="item_id" type="string" description="Cart item identifier" required>
        CART-ITEM-789
    </prop>
    <prop name="new_quantity" type="number" description="New quantity (0 to remove)" required>
        2
    </prop>
</tool>

<tool name="apply_coupon" description="Apply a discount coupon to the cart">
    <prop name="coupon_code" type="string" description="Coupon code" required>
        SAVE20
    </prop>
</tool>

<!-- Shopping context -->
<context name="cart_status">
    Items in cart: 3
    Total value: $89.97
    Applied coupons: FREESHIP
    Estimated shipping: $0.00
    Tax: $7.20
    Final total: $97.17
</context>

<context name="user_profile">
    Customer tier: Premium
    Saved addresses: 2
    Payment methods: 1 card
    Order history: 15 orders
    Last order: 2025-05-28
</context>
```

### Project Management Tool
```html
<!-- Task management tools -->
<tool name="create_task" description="Create a new task in the current project">
    <prop name="title" type="string" description="Task title" required>
        Implement user authentication
    </prop>
    <prop name="description" type="string" description="Detailed task description">
        Add login/logout functionality with JWT tokens
    </prop>
    <prop name="assignee" type="string" description="Email of person to assign task to">
        developer@company.com
    </prop>
    <prop name="priority" type="string" description="Task priority: low, medium, high, urgent">
        high
    </prop>
    <prop name="due_date" type="string" description="Due date in YYYY-MM-DD format">
        2025-06-20
    </prop>
    <array name="tags" description="Task tags for categorization">
        <dict>
            <prop name="name" type="string" description="Tag name" required>
                backend
            </prop>
        </dict>
    </array>
</tool>

<tool name="update_task_status" description="Update the status of an existing task">
    <prop name="task_id" type="string" description="Unique task identifier" required>
        TASK-456
    </prop>
    <prop name="status" type="string" description="New status: todo, in_progress, review, done" required>
        in_progress
    </prop>
    <prop name="comment" type="string" description="Optional status change comment">
        Started working on this task
    </prop>
</tool>

<!-- Project context -->
<context name="project_info">
    Project: Website Redesign v2.0
    Status: Active
    Team size: 8 members
    Sprint: Sprint 12 (June 1-14, 2025)
    Progress: 65% complete
    Tasks: 23 total, 8 completed, 12 in progress, 3 pending
    Next milestone: Beta release (June 30, 2025)
</context>
```

### Customer Support Dashboard
```html
<!-- Support tools -->
<tool name="create_ticket" description="Create a new support ticket">
    <prop name="customer_email" type="string" description="Customer's email address" required>
        customer@example.com
    </prop>
    <prop name="subject" type="string" description="Ticket subject" required>
        Login issues after password reset
    </prop>
    <prop name="category" type="string" description="Ticket category" required>
        technical_support
    </prop>
    <prop name="priority" type="string" description="Ticket priority: low, medium, high, urgent">
        medium
    </prop>
    <prop name="description" type="string" description="Detailed description of the issue" required>
        Customer cannot log in after resetting password. Error message: "Invalid credentials"
    </prop>
</tool>

<tool name="update_ticket" description="Update an existing support ticket">
    <prop name="ticket_id" type="string" description="Ticket ID" required>
        TKT-2025-001234
    </prop>
    <prop name="status" type="string" description="New ticket status">
        in_progress
    </prop>
    <prop name="internal_note" type="string" description="Internal note (not visible to customer)">
        Escalated to technical team for investigation
    </prop>
    <prop name="customer_response" type="string" description="Response to send to customer">
        We're investigating this issue and will update you within 24 hours.
    </prop>
</tool>

<!-- Support context -->
<context name="queue_status">
    Open tickets: 47
    Urgent tickets: 3
    My assigned tickets: 12
    Average response time: 2.3 hours
    Customer satisfaction: 4.2/5.0
    Queue: Technical Support
</context>

<context name="customer_history">
    Customer: John Smith (john@example.com)
    Account since: 2023-03-15
    Previous tickets: 2
    Last contact: 2025-05-20
    Account status: Active Premium
    Subscription: Enterprise Plan
</context>
```

## Framework Integration

### Vue.js Integration

Vue provides elegant ways to handle VOIX tools using event handlers and reactive data.

#### Basic Vue Component with Tools

```vue
<template>
  <div>
    <!-- Tool definitions -->
    <tool 
      name="update_status" 
      description="Update project status"
      @call="handleUpdateStatus"
    >
      <prop name="project_id" type="string" description="Project ID" required>
        {{ currentProject.id }}
      </prop>
      <prop name="status" type="string" description="New status" required>
        in_progress
      </prop>
    </tool>

    <tool 
      name="add_task" 
      description="Add a new task to the project"
      @call="handleAddTask"
    >
      <prop name="title" type="string" description="Task title" required>
        New Task
      </prop>
      <prop name="assignee" type="string" description="Task assignee">
        {{ currentUser.email }}
      </prop>
    </tool>

    <!-- Dynamic context -->
    <context name="project_state">
      {{ projectContextText }}
    </context>

    <!-- Your regular Vue UI -->
    <div class="project-dashboard">
      <h1>{{ currentProject.name }}</h1>
      <p>Status: {{ currentProject.status }}</p>
      <ul>
        <li v-for="task in tasks" :key="task.id">
          {{ task.title }} - {{ task.assignee }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectDashboard',
  data() {
    return {
      currentProject: {
        id: 'proj-123',
        name: 'Website Redesign',
        status: 'planning'
      },
      currentUser: {
        email: 'user@example.com'
      },
      tasks: []
    }
  },
  computed: {
    projectContextText() {
      return `
        Project: ${this.currentProject.name}
        Status: ${this.currentProject.status}
        Tasks: ${this.tasks.length}
        Last updated: ${new Date().toISOString()}
        Current user: ${this.currentUser.email}
      `.trim()
    }
  },
  methods: {
    async handleUpdateStatus(event) {
      const { project_id, status } = event.detail
      
      try {
        // Update project status
        await this.updateProjectStatus(project_id, status)
        
        // Update local state
        this.currentProject.status = status
        
        // Send success response
        this.sendToolResponse(event.target, {
          success: true,
          result: { project_id, status },
          message: `Project status updated to ${status}`
        })
      } catch (error) {
        this.sendToolResponse(event.target, {
          success: false,
          error: error.message
        })
      }
    },

    async handleAddTask(event) {
      const { title, assignee } = event.detail
      
      try {
        const newTask = await this.createTask({
          title,
          assignee: assignee || this.currentUser.email,
          project_id: this.currentProject.id
        })
        
        // Add to local tasks array
        this.tasks.push(newTask)
        
        this.sendToolResponse(event.target, {
          success: true,
          result: newTask,
          message: `Task "${title}" created successfully`
        })
      } catch (error) {
        this.sendToolResponse(event.target, {
          success: false,
          error: error.message
        })
      }
    },

    sendToolResponse(toolElement, response) {
      toolElement.dispatchEvent(new CustomEvent('response', {
        detail: response
      }))
    },

    async updateProjectStatus(projectId, status) {
      // Your API call here
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update project status')
      }
      
      return response.json()
    },

    async createTask(taskData) {
      // Your API call here
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create task')
      }
      
      return response.json()
    }
  }
}
</script>
```

#### Vue Composition API Approach

```vue
<template>
  <div>
    <tool 
      name="filter_data" 
      description="Filter dataset by criteria"
      @call="handleFilterData"
    >
      <prop name="category" type="string" description="Filter category">
        all
      </prop>
      <prop name="date_range" type="string" description="Date range filter">
        last_30_days
      </prop>
    </tool>

    <context name="data_state">
      {{ dataContext }}
    </context>

    <!-- Your UI components -->
    <DataTable :items="filteredData" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from './DataTable.vue'

const data = ref([])
const filters = ref({
  category: 'all',
  dateRange: 'last_30_days'
})

const filteredData = computed(() => {
  return data.value.filter(item => {
    // Apply your filtering logic
    return applyFilters(item, filters.value)
  })
})

const dataContext = computed(() => `
  Total items: ${data.value.length}
  Filtered items: ${filteredData.value.length}
  Active filters: ${JSON.stringify(filters.value)}
  Last updated: ${new Date().toLocaleString()}
`)

const handleFilterData = async (event) => {
  const { category, date_range } = event.detail
  
  try {
    // Update filters
    filters.value = {
      category: category || 'all',
      dateRange: date_range || 'last_30_days'
    }
    
    // Optionally refetch data
    await fetchData()
    
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: true,
        result: {
          applied_filters: filters.value,
          result_count: filteredData.value.length
        },
        message: 'Filters applied successfully'
      }
    }))
  } catch (error) {
    event.target.dispatchEvent(new CustomEvent('response', {
      detail: {
        success: false,
        error: error.message
      }
    }))
  }
}

const fetchData = async () => {
  // Your data fetching logic
}

onMounted(() => {
  fetchData()
})
</script>
```

### React Integration

React components can handle VOIX tools using useEffect and event handlers.

#### React Hook for VOIX Tools

```jsx
import { useEffect, useRef, useCallback } from 'react'

// Custom hook for handling VOIX tools
export const useVoixTool = (toolName, handler) => {
  const toolRef = useRef(null)
  
  const wrappedHandler = useCallback(async (event) => {
    try {
      const result = await handler(event.detail)
      
      toolRef.current?.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: true,
          result,
          message: `Successfully executed ${toolName}`
        }
      }))
    } catch (error) {
      toolRef.current?.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: false,
          error: error.message
        }
      }))
    }
  }, [handler, toolName])
  
  useEffect(() => {
    const toolElement = toolRef.current
    if (toolElement) {
      toolElement.addEventListener('call', wrappedHandler)
      return () => {
        toolElement.removeEventListener('call', wrappedHandler)
      }
    }
  }, [wrappedHandler])
  
  return toolRef
}
```

#### React Component Example

```jsx
import React, { useState, useCallback } from 'react'
import { useVoixTool } from './hooks/useVoixTool'

const TaskManager = () => {
  const [tasks, setTasks] = useState([])
  const [project, setProject] = useState({
    id: 'proj-456',
    name: 'Mobile App',
    status: 'active'
  })

  // Tool handlers
  const handleCreateTask = useCallback(async (args) => {
    const { title, assignee, priority = 'medium' } = args
    
    const newTask = {
      id: Date.now().toString(),
      title,
      assignee,
      priority,
      status: 'todo',
      created_at: new Date().toISOString()
    }
    
    setTasks(prev => [...prev, newTask])
    
    return {
      task_id: newTask.id,
      message: `Task "${title}" created successfully`
    }
  }, [])

  const handleUpdateTaskStatus = useCallback(async (args) => {
    const { task_id, status } = args
    
    setTasks(prev => prev.map(task => 
      task.id === task_id ? { ...task, status } : task
    ))
    
    return {
      task_id,
      new_status: status,
      message: `Task status updated to ${status}`
    }
  }, [])

  // Tool refs
  const createTaskToolRef = useVoixTool('create_task', handleCreateTask)
  const updateTaskToolRef = useVoixTool('update_task_status', handleUpdateTaskStatus)

  const contextText = `
    Project: ${project.name}
    Status: ${project.status}
    Total tasks: ${tasks.length}
    Completed: ${tasks.filter(t => t.status === 'done').length}
    In progress: ${tasks.filter(t => t.status === 'in_progress').length}
  `.trim()

  return (
    <div>
      {/* VOIX Tools */}
      <tool 
        ref={createTaskToolRef}
        name="create_task" 
        description="Create a new task in the project"
      >
        <prop name="title" type="string" description="Task title" required>
          New Task
        </prop>
        <prop name="assignee" type="string" description="Task assignee">
          user@example.com
        </prop>
        <prop name="priority" type="string" description="Task priority: low, medium, high">
          medium
        </prop>
      </tool>

      <tool 
        ref={updateTaskToolRef}
        name="update_task_status" 
        description="Update the status of an existing task"
      >
        <prop name="task_id" type="string" description="Task ID" required>
          {tasks[0]?.id || 'TASK-123'}
        </prop>
        <prop name="status" type="string" description="New status: todo, in_progress, done" required>
          in_progress
        </prop>
      </tool>

      <context name="project_status">
        {contextText}
      </context>

      {/* Regular React UI */}
      <div className="task-manager">
        <h1>{project.name}</h1>
        <div className="tasks">
          {tasks.map(task => (
            <div key={task.id} className="task">
              <h3>{task.title}</h3>
              <p>Assignee: {task.assignee}</p>
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TaskManager
```

### Svelte Integration

Svelte's reactivity system works well with VOIX tools and context updates.

#### Svelte Component Example

```svelte
<script>
  import { onMount } from 'svelte'
  
  let items = []
  let currentUser = { name: 'John Doe', role: 'admin' }
  let appState = 'ready'
  
  // Reactive context
  $: contextData = `
    User: ${currentUser.name} (${currentUser.role})
    Items loaded: ${items.length}
    App state: ${appState}
    Last update: ${new Date().toLocaleString()}
  `.trim()

  // Tool event handlers
  function handleAddItem(event) {
    const { name, category, priority = 'normal' } = event.detail
    
    try {
      const newItem = {
        id: Date.now(),
        name,
        category,
        priority,
        created_by: currentUser.name,
        created_at: new Date().toISOString()
      }
      
      items = [...items, newItem]
      
      // Send success response
      event.target.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: true,
          result: newItem,
          message: `Item "${name}" added successfully`
        }
      }))
    } catch (error) {
      event.target.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: false,
          error: error.message
        }
      }))
    }
  }

  function handleDeleteItem(event) {
    const { item_id } = event.detail
    
    try {
      const itemIndex = items.findIndex(item => item.id.toString() === item_id)
      
      if (itemIndex === -1) {
        throw new Error('Item not found')
      }
      
      const deletedItem = items[itemIndex]
      items = items.filter(item => item.id.toString() !== item_id)
      
      event.target.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: true,
          result: { deleted_item: deletedItem },
          message: `Item "${deletedItem.name}" deleted successfully`
        }
      }))
    } catch (error) {
      event.target.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: false,
          error: error.message
        }
      }))
    }
  }

  async function handleBulkAction(event) {
    const { action, item_ids } = event.detail
    
    try {
      appState = 'processing'
      
      let processedCount = 0
      
      if (action === 'delete') {
        items = items.filter(item => {
          const shouldDelete = item_ids.includes(item.id.toString())
          if (shouldDelete) processedCount++
          return !shouldDelete
        })
      } else if (action === 'archive') {
        items = items.map(item => {
          if (item_ids.includes(item.id.toString())) {
            processedCount++
            return { ...item, archived: true }
          }
          return item
        })
      }
      
      appState = 'ready'
      
      event.target.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: true,
          result: {
            action,
            processed_count: processedCount,
            remaining_items: items.length
          },
          message: `Bulk ${action} completed: ${processedCount} items processed`
        }
      }))
      
    } catch (error) {
      appState = 'error'
      
      event.target.dispatchEvent(new CustomEvent('response', {
        detail: {
          success: false,
          error: error.message
        }
      }))
    }
  }

  onMount(() => {
    // Initialize with some sample data
    items = [
      { id: 1, name: 'Sample Item 1', category: 'work', priority: 'high', created_by: 'System' },
      { id: 2, name: 'Sample Item 2', category: 'personal', priority: 'normal', created_by: 'System' }
    ]
  })
</script>

<!-- VOIX Tools -->
<tool name="add_item" description="Add a new item to the list" on:call={handleAddItem}>
  <prop name="name" type="string" description="Item name" required>New Item</prop>
  <prop name="category" type="string" description="Item category" required>general</prop>
  <prop name="priority" type="string" description="Priority: low, normal, high">normal</prop>
</tool>

<tool name="delete_item" description="Delete an item by ID" on:call={handleDeleteItem}>
  <prop name="item_id" type="string" description="ID of item to delete" required>
    {items[0]?.id.toString() || '1'}
  </prop>
</tool>

<tool name="bulk_action" description="Perform bulk actions on multiple items" on:call={handleBulkAction}>
  <prop name="action" type="string" description="Action to perform: delete, archive" required>delete</prop>
  <array name="item_ids" description="Array of item IDs to process" required>
    <dict>
      <prop name="id" type="string" description="Item ID" required>1</prop>
    </dict>
  </array>
</tool>

<!-- Dynamic Context -->
<context name="app_context">{contextData}</context>

<!-- Regular Svelte UI -->
<div class="item-manager">
  <h1>Item Manager</h1>
  <p>Welcome, {currentUser.name}!</p>
  <p>Status: {appState}</p>
  
  <div class="items-grid">
    {#each items as item (item.id)}
      <div class="item-card" class:archived={item.archived}>
        <h3>{item.name}</h3>
        <p>Category: {item.category}</p>
        <p>Priority: {item.priority}</p>
        <p>Created by: {item.created_by}</p>
        {#if item.archived}
          <span class="archived-badge">Archived</span>
        {/if}
      </div>
    {/each}
  </div>
  
  {#if items.length === 0}
    <p>No items found. Use the AI to add some!</p>
  {/if}
</div>

<style>
  .item-manager {
    padding: 1rem;
  }
  
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .item-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    background: white;
  }
  
  .item-card.archived {
    opacity: 0.6;
    background: #f5f5f5;
  }
  
  .archived-badge {
    background: #orange;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }
</style>
```

### Framework-Specific Best Practices

#### Vue.js
- Use `@call` directive for clean event handling
- Leverage computed properties for dynamic context
- Use reactive data for real-time updates
- Consider using Vue 3's Composition API for complex tool logic

#### React
- Create custom hooks for reusable tool logic
- Use useCallback to prevent unnecessary re-renders
- Leverage useEffect for tool setup and cleanup
- Consider using Context API for sharing tool state

#### Svelte
- Use `on:call` for event handling
- Leverage Svelte's reactivity for automatic context updates
- Use stores for complex state management across components
- Take advantage of Svelte's compile-time optimizations

### Framework Integration Tips

1. **State Management**: Keep your framework's state in sync with tool responses
2. **Error Boundaries**: Implement proper error handling in your framework's way
3. **Performance**: Use framework-specific optimization techniques (memoization, etc.)
4. **Routing**: Consider how tools interact with your app's routing system
5. **Testing**: Write framework-specific tests for your tool handlers