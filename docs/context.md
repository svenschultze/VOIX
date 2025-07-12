# Context

Context elements provide the AI with information about your application's current state. They contain plain text that helps the AI understand what's happening on the page.

## Basic Structure

```html
<context name="contextName">
  Plain text content here
</context>
```

## Context Attributes

### `name` (required)
- Unique identifier for the context
- Used to reference specific context blocks
- Examples: `user`, `page_info`, `current_state`

## Simple Examples

### User Information

```html
<context name="current_user">
  Name: John Doe
  Role: Administrator
  Last login: 2025-01-30 10:00
</context>
```

### Page State

```html
<context name="page_info">
  Page: Dashboard
  User role: Admin
  Total items: 42
  Filter: Active only
</context>
```

### Application Status

```html
<context name="app_state">
  Mode: Edit
  Unsaved changes: Yes
  Auto-save: Enabled
  Last saved: 5 minutes ago
</context>
```

## Dynamic Context

Context can be updated with JavaScript to reflect real-time changes:

```html
<context name="session_state" id="session-context">
  Loading...
</context>

<script>
setInterval(() => {
  document.getElementById('session-context').textContent = 
    `Time: ${new Date().toLocaleTimeString()}`;
}, 10000);
</script>
```

## Best Practices

### Keep It Simple

Context should be plain text, easy to read. Avoid raw JSON or HTML:

```html
<!-- Good: Clear and simple -->
<context name="order_status">
  Order ID: ORD-12345
  Status: Processing
  Items: 3
  Total: $99.99
</context>

<!-- Avoid: Don't use HTML or JSON -->
<context name="order_status">
  {"orderId": "ORD-12345", "status": "processing", "items": 3}
</context>
```

### Be Concise

Only give context that is relevant to help the AI understand the current state:

```html
<!-- Good: Relevant information only -->
<context name="search_filters">
  Category: Electronics
  Price range: $100-$500
  In stock only: Yes
</context>

<!-- Avoid: Unnecessary internal details -->
<context name="search_filters">
  Category: Electronics
  Category ID: 123
  Category parent: Technology
  Category created: 2020-01-01
  Price range: $100-$500
  Price currency: USD
  Price includes tax: No
  ...
</context>
```

### Update Frequently

Keep context current by updating it whenever your application state changes:

```javascript
// Simple context update
function updateUserContext(user) {
  document.querySelector('context[name="user"]').textContent = 
    `Name: ${user.name}\nRole: ${user.role}`;
}
```

## Common Patterns

Context can be a simple description or any text that helps the AI understand the situation:

```html
<context name="page_description">
  This is the user dashboard showing their recent activity and pending tasks. The user has been inactive for the past week but has several overdue items that need attention.
</context>
```

### Lists and Collections

```html
<context name="recent_actions">
  Recent actions:
  - Created document "Q4 Report"
  - Shared with team@example.com
  - Updated project timeline
  - Completed task #42
</context>
```

### Status Information

```html
<context name="system_status">
  Server: Connected
  Sync: Up to date
  Version: 2.1.0
  Environment: Production
</context>
```

## Framework Examples

### React

```jsx
function UserContext({ user }) {
  return (
    <context name="user">
      {`Name: ${user.name}
Role: ${user.role}`}
    </context>
  );
}
```

### Vue

```vue
<template>
  <context name="user">
    Name: {{ user.name }}
    Role: {{ user.role }}
  </context>
</template>

<script setup>
defineProps(['user'])
</script>
```

### Svelte

```svelte
<script>
  export let user;
</script>

<context name="user">
  Name: {user.name}
  Role: {user.role}
</context>
```

## Summary

Context elements are simple containers for plain text that help the AI understand your application's current state. Keep context concise, relevant, and up-to-date. Avoid including HTML, JSON, or sensitive information - just use clear, readable text that describes what's happening on the page.

## Next Steps

- Learn about [Tools](./tools.md) for creating interactive tools
- Explore [Examples](./examples.md) for complete implementations
- Review [Getting Started](./getting-started.md) for setup instructions