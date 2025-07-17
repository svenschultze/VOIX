<!-- #region context -->
# Core Concepts

VOIX enables AI assistants to interact with websites through a simple yet powerful architecture. This guide explains how the different parts work together.

## Overview

VOIX consists of three main components working together:

1. **Your Website** - Declares what the AI can do and provides current state
2. **Chrome Extension** - Bridges the gap between your website and AI
3. **User + AI** - Natural language interface for interacting with your site

## How It Works

### 1. Website Declaration

Your website declares capabilities using HTML elements:

- **Tools** - Actions the AI can perform
- **Context** - Current state information

```html
<!-- Declare an action -->
<tool name="create_task" description="Create a new task">
  <prop name="title" type="string" required></prop>
</tool>

<!-- Provide current state -->
<context name="user">
  Name: John Doe
  Role: Admin
</context>
```

### 2. Extension Discovery

When a user opens VOIX on your page:

1. The extension scans for all `<tool>` and `<context>` elements
2. It builds a catalog of available actions and current state
3. This information is presented to the AI assistant

### 3. User Interaction

The user types or speaks naturally:

```
"Create a task called 'Review pull requests'"
```

### 4. AI Understanding

The AI:
1. Reads the available tools and their descriptions
2. Understands the current context
3. Determines which tool to use and with what parameters

### 5. Tool Execution

When the AI decides to use a tool:

1. VOIX triggers a `call` event on the tool element
2. Your JavaScript handler receives the parameters
3. Your code performs the action

```javascript
document.querySelector('[name=create_task]').addEventListener('call', (e) => {
  const { title } = e.detail;
  // Create the task in your application
  createTask(title);
});
```

## Architecture Benefits

### For Developers

VOIX uses HTML elements to define AI capabilities. You add `<tool>` and `<context>` tags to your pages and attach event listeners to handle tool calls. No API integration or SDK is required. The approach works with any JavaScript framework or vanilla JavaScript, and you can add these elements to existing pages without modifying other code.

You control what data the AI can access by choosing what to include in your tool and context elements. Your website receives only the tool execution requests with their parameters. The conversation between the user and AI remains private - you never see what the user typed or how they phrased their request.

### For Users

You interact with websites through natural language. The AI reads the available tools and current context to understand what actions it can perform. You can make requests like "delete the third item" or "show only active tasks" and the AI will execute the appropriate tools with the correct parameters.

You configure your own AI provider in the extension settings. This can be OpenAI, Anthropic, Ollama running locally, or any OpenAI-compatible endpoint. Your conversation data goes directly from the extension to your chosen provider. The website never receives your messages, only the resulting tool calls that need to be executed.

## The Role of Each Part

### Your Website's Role

1. **Declare Tools** - Define what actions are possible
2. **Provide Context** - Share current state information
3. **Handle Events** - Execute actions when tools are called
4. **Update UI** - Reflect changes in your interface

### Extension's Role

1. **Discovery** - Find tools and context on the page
2. **Communication** - Connect your site with the AI
3. **Event Dispatch** - Trigger tool calls based on AI decisions
4. **Privacy** - Keep all data local in the browser

### User's Role

1. **Natural Input** - Describe what they want to accomplish
2. **Conversation** - Clarify or refine requests as needed
3. **Verification** - Confirm actions when necessary

## Data Flow Example

Let's trace through a complete interaction to see how data flows through the system:

```
User Input → AI Processing → Tool Selection → Event Dispatch → Your Handler → UI Update
```

1. **User visits your task management app**
   ```html
   <tool name="mark_complete" description="Mark a task as complete">
     <prop name="taskId" type="string" required></prop>
   </tool>
   
   <context name="tasks">
     Active tasks: 5
     Task IDs: task-1, task-2, task-3, task-4, task-5
   </context>
   ```

2. **User opens VOIX and types**
   ```
   "Mark task-3 as complete"
   ```

3. **AI processes the request**
   - Sees the `mark_complete` tool
   - Reads the context showing task-3 exists
   - Decides to call the tool with taskId: "task-3"

4. **Your code handles the event**
   ```javascript
   tool.addEventListener('call', (e) => {
     const { taskId } = e.detail;
     markTaskComplete(taskId);
     updateTaskList();
   });
   ```

5. **User sees the result**
   - Task marked as complete in the UI
   - Context automatically updates
   - Ready for the next interaction

Each step happens in the browser. The only external dependency is the AI provider, which is configured and trusted by the user. The website acts purely as a capability provider, never seeing the conversation between the user and their AI assistant.

## Next Steps

- Learn about [Tools](./tools.md) to create interactive capabilities
- Understand [Context](./contexts.md) for sharing application state

<!-- #endregion context -->


<!--@include: @/voix_context.md -->