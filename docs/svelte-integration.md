# Svelte Integration Guide

> [!CAUTION]
> This guide is untested and may contain errors. Please verify the code examples in your own implementation and report any issues.

This guide covers patterns and best practices for integrating VOIX with Svelte 5 applications using Runes, including component-level tools, state management, and Svelte-specific optimizations.

## Configuration

### Global Styles

Add these styles to hide VOIX elements from the UI:

```css
/* app.css or global styles */
tool, prop, context, array, dict {
  display: none;
}
```

## Component-Level Tools

Define tools at the component level for better encapsulation:

```svelte
<script>
  let { userId } = $props()
  
  let user = $state({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer',
    notifications: true
  })

  let updateTool = $state()
  let notificationTool = $state()

  // Tool handlers
  function handleUpdateProfile(event) {
    const { field, value } = event.detail
    
    if (field in user) {
      user[field] = value
      event.detail.success = true
      event.detail.message = `Updated ${field} to ${value}`
    } else {
      event.detail.success = false
      event.detail.error = `Invalid field: ${field}`
    }
  }

  function handleToggleNotifications(event) {
    user.notifications = !user.notifications
    event.detail.success = true
    event.detail.message = `Notifications ${user.notifications ? 'enabled' : 'disabled'}`
  }

  // Lifecycle management
  $effect(() => {
    if (updateTool) {
      updateTool.addEventListener('call', handleUpdateProfile)
    }
    if (notificationTool) {
      notificationTool.addEventListener('call', handleToggleNotifications)
    }

    return () => {
      if (updateTool) {
        updateTool.removeEventListener('call', handleUpdateProfile)
      }
      if (notificationTool) {
        notificationTool.removeEventListener('call', handleToggleNotifications)
      }
    }
  })
</script>

<div class="user-profile">
  <h2>{user.name}'s Profile</h2>
  
  <!-- Component-specific tools -->
  <tool 
    bind:this={updateTool}
    name="update_{userId}_profile"
    description="Update this user's profile"
  >
    <prop name="field" type="string" required description="name, email, or bio"/>
    <prop name="value" type="string" required/>
  </tool>
  
  <tool 
    bind:this={notificationTool}
    name="toggle_{userId}_notifications"
    description="Toggle email notifications"
  >
  </tool>
  
  <!-- Component context with multiple values -->
  <context name="user_{userId}_state">
    Name: {user.name}
    Email: {user.email}
    Bio: {user.bio}
    Notifications: {user.notifications ? 'Enabled' : 'Disabled'}
  </context>
  
  <!-- Regular UI -->
  <div class="profile-details">
    <p>Email: {user.email}</p>
    <p>Bio: {user.bio}</p>
    <p>Notifications: {user.notifications ? 'On' : 'Off'}</p>
  </div>
</div>
```

## Advanced Patterns

### Unique Tool Names

Tools must have unique names across your application. When using multiple instances of the same component, include an identifier:

```svelte
<script>
  let { product } = $props()
  
  let addToCartTool = $state()
  let toggleFavoriteTool = $state()

  function handleAddToCart(event) {
    const { quantity } = event.detail
    addProductToCart(product.id, quantity)
    event.detail.success = true
    event.detail.message = `Added ${quantity} to cart`
  }

  function handleToggleFavorite(event) {
    toggleFavorite(product.id)
    event.detail.success = true
  }

  $effect(() => {
    if (addToCartTool) {
      addToCartTool.addEventListener('call', handleAddToCart)
    }
    if (toggleFavoriteTool) {
      toggleFavoriteTool.addEventListener('call', handleToggleFavorite)
    }

    return () => {
      if (addToCartTool) {
        addToCartTool.removeEventListener('call', handleAddToCart)
      }
      if (toggleFavoriteTool) {
        toggleFavoriteTool.removeEventListener('call', handleToggleFavorite)
      }
    }
  })
</script>

<div class="product-card">
  <!-- Include product ID in tool name to ensure uniqueness -->
  <tool 
    bind:this={addToCartTool}
    name="add_to_cart_{product.id}"
    description="Add this product to cart"
  >
    <prop name="quantity" type="number" required/>
  </tool>
  
  <tool 
    bind:this={toggleFavoriteTool}
    name="toggle_favorite_{product.id}"
    description="Toggle favorite status"
  >
  </tool>
  
  <h3>{product.name}</h3>
  <button onclick={() => addProductToCart(product.id, 1)}>
    Add to Cart
  </button>
</div>
```

### Conditional Tool Availability

Show tools based on user permissions:

```svelte
<script>
  import { userStore } from './stores/userStore.js'
  
  let deleteUsersTool = $state()
  let exportDataTool = $state()

  function handleDeleteUsers(event) {
    const { userIds } = event.detail
    deleteSelectedUsers(userIds)
    event.detail.success = true
    event.detail.message = `Deleted ${userIds.length} users`
  }

  function handleExportData(event) {
    const { format } = event.detail
    exportUserData(format)
    event.detail.success = true
  }

  $effect(() => {
    if (deleteUsersTool && $userStore.isAdmin) {
      deleteUsersTool.addEventListener('call', handleDeleteUsers)
    }
    if (exportDataTool) {
      exportDataTool.addEventListener('call', handleExportData)
    }

    return () => {
      if (deleteUsersTool) {
        deleteUsersTool.removeEventListener('call', handleDeleteUsers)
      }
      if (exportDataTool) {
        exportDataTool.removeEventListener('call', handleExportData)
      }
    }
  })
</script>

<div>
  <!-- Admin tools only visible to admins -->
  {#if $userStore.isAdmin}
    <tool 
      bind:this={deleteUsersTool}
      name="delete_users" 
      description="Delete selected users"
    >
      <prop name="userIds" type="array" required/>
    </tool>
  {/if}
  
  <!-- Available to all users -->
  <tool 
    bind:this={exportDataTool}
    name="export_data" 
    description="Export your data"
  >
    <prop name="format" type="string" description="csv or json"/>
  </tool>
  
  <context name="permissions">
    Role: {$userStore.role}
    Admin: {$userStore.isAdmin ? 'Yes' : 'No'}
  </context>
</div>
```

### Real-Time Updates

Update context automatically when data changes:

```svelte
<script>
  let onlineUsers = $state(0)
  let lastUpdate = $state(new Date().toLocaleTimeString())
  let refreshDataTool = $state()

  function handleRefresh(event) {
    onlineUsers = Math.floor(Math.random() * 100)
    lastUpdate = new Date().toLocaleTimeString()
    event.detail.success = true
    event.detail.message = 'Data refreshed'
  }

  $effect(() => {
    if (refreshDataTool) {
      refreshDataTool.addEventListener('call', handleRefresh)
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      onlineUsers = Math.floor(Math.random() * 100)
      lastUpdate = new Date().toLocaleTimeString()
    }, 5000)

    return () => {
      if (refreshDataTool) {
        refreshDataTool.removeEventListener('call', handleRefresh)
      }
      clearInterval(interval)
    }
  })
</script>

<div class="dashboard">
  <!-- Context updates automatically with state changes -->
  <context name="metrics">
    Users online: {onlineUsers}
    Last update: {lastUpdate}
  </context>
  
  <tool 
    bind:this={refreshDataTool}
    name="refresh_data" 
    description="Refresh dashboard data"
  >
  </tool>
  
  <div>
    <h3>Dashboard</h3>
    <p>Users Online: {onlineUsers}</p>
    <p>Last Update: {lastUpdate}</p>
  </div>
</div>
```

## Testing

Create test utilities for VOIX tools:

```javascript
// test-utils/voix.js
export function triggerTool(toolName, params) {
  const tool = document.querySelector(`[name="${toolName}"]`)
  const event = new CustomEvent('call', {
    detail: { ...params }
  })
  
  tool.dispatchEvent(event)
  
  return event.detail
}

// Dashboard.test.js
import { render } from '@testing-library/svelte'
import { triggerTool } from './test-utils/voix'
import Dashboard from './Dashboard.svelte'

test('handles refresh tool', async () => {
  render(Dashboard)
  
  // Wait for component to mount
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const result = triggerTool('refresh_data', {})
  
  expect(result.success).toBe(true)
  expect(result.message).toBe('Data refreshed')
  
  // Check if context updated
  const context = document.querySelector('[name="metrics"]')
  expect(context.textContent).toContain('Users online:')
})
```

This guide covers the essential patterns for integrating VOIX with Svelte 5 applications using Runes, focusing on practical examples and clean code practices.