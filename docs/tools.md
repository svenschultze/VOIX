<!-- #region context -->
# Tools

Tools declare actions that the AI can perform on your website. They define what the AI can do and what parameters it needs to provide.

## Basic Structure

```html
<tool name="toolName" description="What this tool does">
  <prop name="paramName" type="string" required></prop>
</tool>
```

## Tool Attributes

### `name` (required)
- Unique identifier for the tool
- Used in JavaScript event handlers
- Examples: `create_task`, `search_products`, `update_status`

### `description` (required)
- Clear explanation of what the tool does
- Helps AI understand when to use the tool
- Examples: "Create a new task", "Search for products", "Update user status"

### `return` (optional)
- Indicates that the tool will return data to the AI
- If present, VOIX waits for a `return` event before proceeding

## Defining Parameters

Tools use `<prop>` elements to define parameters:

```html
<tool name="create_meeting" description="Schedule a new meeting">
  <prop name="title" type="string" required></prop>
  <prop name="date" type="string" description="Date in YYYY-MM-DD format" required></prop>
  <prop name="duration" type="number" description="Duration in minutes"></prop>
</tool>
```

### Parameter Attributes

- `name` - Parameter identifier
- `type` - Data type (`string`, `number`, `boolean`)
- `description` - Explains the parameter, especially format requirements
- `required` - Makes the parameter mandatory

### Parameter Descriptions

Use descriptions to clarify format requirements or constraints:

```html
<prop name="email" type="string" description="Valid email address" required></prop>
<prop name="phone" type="string" description="Phone number in E.164 format"></prop>
<prop name="startTime" type="string" description="Time in HH:MM format (24-hour)"></prop>
<prop name="amount" type="number" description="Amount in USD (up to 2 decimal places)"></prop>
```

### Arrays and Objects

For complex data structures:

```html
<tool name="invite_users" description="Invite users to project">
  <array name="users" required>
    <dict>
      <prop name="email" type="string" description="Valid email address" required></prop>
      <prop name="role" type="string" description="Either 'viewer', 'editor', or 'admin'"></prop>
    </dict>
  </array>
</tool>
```

## Handling Tool Calls

When the AI calls a tool, VOIX triggers a `call` event on the tool element:

```javascript
document.querySelector('[name=search_products]').addEventListener('call', async (e) => {
  const { query } = e.detail;
  const results = await searchAPI(query);
  updateUI(results);
});
```

## Tools That Return Data

Sometimes a tool’s primary purpose is to *send information back* to the AI rather than (or in addition to) updating the UI.
To enable this, add the `return` flag to the `<tool>` element and dispatch a **`return`** custom event.

```html
<tool name="get_weather" description="Retrieve current weather data" return>
  <prop name="location" type="string" required></prop>
</tool>
```

Adding the `return` attribute (no value needed) tells VOIX that the tool **will** emit data for the AI to consume. This means VOIX will wait for a `return` event before proceeding to respond.

### Dispatching a `return` Event

Inside your event handler, package the data you want the AI to see in the event’s `detail`, then dispatch a `return` event on the same element:

```javascript
document
  .querySelector('[name=get_weather]')
  .addEventListener('call', async (e) => {
    const { location } = e.detail;
    const weather = await fetchWeather(location);   // your data-fetching logic

    // Send the weather data back to the AI
    e.target.dispatchEvent(
      new CustomEvent('return', { detail: weather })
    );

    // (Optional) update the UI for the user as usual
    updateWeatherWidget(weather);
  });
```

This can also be used to return success or error messages:

```javascript
document.querySelector('[name=submit_form]').addEventListener('call', async (e) => {
  try {
    const response = await submitForm(e.detail);
    
    // Notify AI of success
    e.target.dispatchEvent(new CustomEvent('return', {
      detail: { success: true, message: 'Form submitted successfully.' }
    }));
  } catch (error) {
    // Notify AI of failure
    e.target.dispatchEvent(new CustomEvent('return', {
      detail: { success: false, error: error.message }
    }));
  }
});
```

---

With the `return` flag and the `return` event, you can build tools that *query APIs, perform calculations, or gather context* and pass those results straight back to the AI—enabling richer, data-driven conversations.


## Common Examples

### Simple Action

```html
<tool name="toggle_theme" description="Switch between light and dark theme">
</tool>

<script>
document.querySelector('[name=toggle_theme]').addEventListener('call', (e) => {
  document.body.classList.toggle('dark-theme');
});
</script>
```

### Form Submission

```html
<tool name="submit_contact" description="Submit contact form">
  <prop name="name" type="string" required></prop>
  <prop name="email" type="string" description="Valid email address" required></prop>
  <prop name="message" type="string" description="Message content (max 500 characters)" required></prop>
</tool>

<script>
document.querySelector('[name=submit_contact]').addEventListener('call', async (e) => {
  const { name, email, message } = e.detail;
  
  await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message })
  });
  
  // Show success message to user
  showNotification('Contact form submitted!');
});
</script>
```

### Search Function

```html
<tool name="search_items" description="Search for items">
  <prop name="query" type="string" required></prop>
  <prop name="category" type="string"></prop>
</tool>

<script>
document.querySelector('[name=search_items]').addEventListener('call', async (e) => {
  const { query, category } = e.detail;
  const results = await performSearch(query, category);
  
  updateUI(results);
});
</script>
```

## Best Practices

### Use Clear Names

Choose descriptive, action-oriented names:

```html
<!-- Good -->
<tool name="create_task" description="Create a new task">
<tool name="delete_item" description="Delete an item">

<!-- Avoid -->
<tool name="do_thing" description="Do something">
<tool name="action1" description="Action">
```

### Provide Helpful Descriptions

Write descriptions that clearly explain what the tool does:

```html
<!-- Good -->
<tool name="filter_products" description="Filter products by category and price">

<!-- Avoid -->
<tool name="filter_products" description="Filter">
```

### Handle Errors Gracefully

Always include error handling:

```javascript
tool.addEventListener('call', async (e) => {
  try {
    // Your logic here
    await performAction(e.detail);
  } catch (err) {
    console.error('Tool execution failed:', err);
    showErrorMessage('Action failed. Please try again.');
  }
});
```

### Keep Tools Focused

Each tool should do one thing well:

```html
<!-- Good: Separate tools for different actions -->
<tool name="add_to_cart" description="Add item to shopping cart">
<tool name="remove_from_cart" description="Remove item from cart">

<!-- Avoid: One tool doing multiple things -->
<tool name="manage_cart" description="Add, remove, or update cart">
```

## Framework Examples

### React

```jsx
function TaskManager() {
  const toolRef = useRef();
  
  useEffect(() => {
    const handleCall = async (e) => {
      const { title } = e.detail;
      await createTask(title);
      refreshTaskList();
    };
    
    toolRef.current?.addEventListener('call', handleCall);
    return () => toolRef.current?.removeEventListener('call', handleCall);
  }, []);
  
  return (
    <tool ref={toolRef} name="create_task" description="Create a new task">
      <prop name="title" type="string" required></prop>
    </tool>
  );
}
```

### Vue

```vue
<template>
  <tool name="update_status" @call="handleUpdate" description="Update status">
    <prop name="status" type="string" required></prop>
  </tool>
</template>

<script setup>
async function handleUpdate(e) {
  const { status } = e.detail;
  await updateStatus(status);
  refreshUI();
}
</script>
```

### Svelte

```svelte
<script>
  async function handleAdd(e) {
    const { item } = e.detail;
    await addItem(item);
    showMessage(`${item} added`);
  }
</script>

<tool name="add_item" on:call={handleAdd} description="Add an item">
  <prop name="item" type="string" required></prop>
</tool>
```

## Testing Tools

Create a simple test page:

```html
<!DOCTYPE html>
<html>
<body>
  <tool name="test_tool" description="Test tool for debugging">
    <prop name="message" type="string" required></prop>
  </tool>
  
  <script>
  document.querySelector('[name=test_tool]').addEventListener('call', (e) => {
    console.log('Tool called with:', e.detail);
    alert(`Tool received: ${e.detail.message}`);
  });
  </script>
</body>
</html>
```

Then:
1. Open the page with VOIX installed
2. Ask the AI to "use the test tool with message 'Hello'"
3. Check the console for output

## Summary

Tools in VOIX are simple HTML elements that declare what actions the AI can perform. They use `<prop>` elements to define parameters and JavaScript event listeners to handle execution. Keep tools focused, provide clear descriptions, and always handle errors gracefully.

## Next Steps

- Learn about [Context](./contexts.md) for providing state information
- Review [Getting Started](./getting-started.md) for setup instructions

<!-- #endregion context -->


<!--@include: @/voix_context.md -->