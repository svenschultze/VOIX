# React Integration Guide

> [!CAUTION]
> This guide is untested and may contain errors. Please verify the code examples in your own implementation and report any issues.

This guide covers patterns and best practices for integrating VOIX with React applications, including component-level tools, context management, and React-specific optimizations.

## Configuration

### TypeScript Configuration

If using TypeScript, declare the custom elements in your type definitions:

```typescript
// types/voix.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    tool: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name: string
      description: string
    }, HTMLElement>
    prop: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name: string
      type: string
      required?: boolean
      description?: string
    }, HTMLElement>
    context: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name: string
    }, HTMLElement>
  }
}
```

### Global Styles

Add these styles to hide VOIX elements from the UI:

```css
/* index.css or global styles */
tool, prop, context, array, dict {
  display: none;
}
```

## Component-Level Tools

Define tools at the component level for better encapsulation:

```jsx
import React, { useRef, useEffect, useState } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer',
    notifications: true
  })

  const updateToolRef = useRef(null)
  const notificationToolRef = useRef(null)

  // Tool handlers
  const handleUpdateProfile = (event) => {
    const { field, value } = event.detail
    
    if (field in user) {
      setUser(prev => ({ ...prev, [field]: value }))
      event.detail.success = true
      event.detail.message = `Updated ${field} to ${value}`
    } else {
      event.detail.success = false
      event.detail.error = `Invalid field: ${field}`
    }
  }

  const handleToggleNotifications = (event) => {
    setUser(prev => ({ ...prev, notifications: !prev.notifications }))
    event.detail.success = true
    event.detail.message = `Notifications ${!user.notifications ? 'enabled' : 'disabled'}`
  }

  // Lifecycle management
  useEffect(() => {
    const updateTool = updateToolRef.current
    const notificationTool = notificationToolRef.current

    if (updateTool) {
      updateTool.addEventListener('call', handleUpdateProfile)
    }
    if (notificationTool) {
      notificationTool.addEventListener('call', handleToggleNotifications)
    }

    // Cleanup
    return () => {
      if (updateTool) {
        updateTool.removeEventListener('call', handleUpdateProfile)
      }
      if (notificationTool) {
        notificationTool.removeEventListener('call', handleToggleNotifications)
      }
    }
  }, [user])

  return (
    <div className="user-profile">
      <h2>{user.name}'s Profile</h2>
      
      {/* Component-specific tools */}
      <tool 
        ref={updateToolRef}
        name={`update_${userId}_profile`}
        description="Update this user's profile"
      >
        <prop name="field" type="string" required description="name, email, or bio"/>
        <prop name="value" type="string" required/>
      </tool>
      
      <tool 
        ref={notificationToolRef}
        name={`toggle_${userId}_notifications`}
        description="Toggle email notifications"
      >
      </tool>
      
      {/* Component context with multiple values */}
      <context name={`user_${userId}_state`}>
        {`Name: ${user.name}
Email: ${user.email}
Bio: ${user.bio}
Notifications: ${user.notifications ? 'Enabled' : 'Disabled'}`}
      </context>
      
      {/* Regular UI */}
      <div className="profile-details">
        <p>Email: {user.email}</p>
        <p>Bio: {user.bio}</p>
        <p>Notifications: {user.notifications ? 'On' : 'Off'}</p>
      </div>
    </div>
  )
}
```

## Advanced Patterns

### Unique Tool Names

Tools must have unique names across your application. When using multiple instances of the same component, include an identifier:

```jsx
function ProductCard({ product }) {
  const addToCartRef = useRef(null)
  const toggleFavoriteRef = useRef(null)

  useEffect(() => {
    const handleAddToCart = (event) => {
      const { quantity } = event.detail
      addProductToCart(product.id, quantity)
      event.detail.success = true
      event.detail.message = `Added ${quantity} to cart`
    }

    const handleToggleFavorite = (event) => {
      toggleFavorite(product.id)
      event.detail.success = true
    }

    const addTool = addToCartRef.current
    const favTool = toggleFavoriteRef.current

    if (addTool) addTool.addEventListener('call', handleAddToCart)
    if (favTool) favTool.addEventListener('call', handleToggleFavorite)

    return () => {
      if (addTool) addTool.removeEventListener('call', handleAddToCart)
      if (favTool) favTool.removeEventListener('call', handleToggleFavorite)
    }
  }, [product.id])

  return (
    <div className="product-card">
      {/* Include product ID in tool name to ensure uniqueness */}
      <tool 
        ref={addToCartRef}
        name={`add_to_cart_${product.id}`}
        description="Add this product to cart"
      >
        <prop name="quantity" type="number" required/>
      </tool>
      
      <tool 
        ref={toggleFavoriteRef}
        name={`toggle_favorite_${product.id}`}
        description="Toggle favorite status"
      >
      </tool>
      
      <h3>{product.name}</h3>
      <button onClick={() => addProductToCart(product.id, 1)}>
        Add to Cart
      </button>
    </div>
  )
}
```

### Conditional Tool Availability

Show tools based on user permissions:

```jsx
import { useUserStore } from './stores/userStore'

function AdminPanel() {
  const user = useUserStore()
  const deleteUsersRef = useRef(null)
  const exportDataRef = useRef(null)

  useEffect(() => {
    const handleDeleteUsers = (event) => {
      const { userIds } = event.detail
      deleteSelectedUsers(userIds)
      event.detail.success = true
      event.detail.message = `Deleted ${userIds.length} users`
    }

    const handleExportData = (event) => {
      const { format } = event.detail
      exportUserData(format)
      event.detail.success = true
    }

    const deleteTool = deleteUsersRef.current
    const exportTool = exportDataRef.current

    if (deleteTool && user.isAdmin) {
      deleteTool.addEventListener('call', handleDeleteUsers)
    }
    if (exportTool) {
      exportTool.addEventListener('call', handleExportData)
    }

    return () => {
      if (deleteTool) deleteTool.removeEventListener('call', handleDeleteUsers)
      if (exportTool) exportTool.removeEventListener('call', handleExportData)
    }
  }, [user.isAdmin])

  return (
    <div>
      {/* Admin tools only visible to admins */}
      {user.isAdmin && (
        <tool 
          ref={deleteUsersRef}
          name="delete_users" 
          description="Delete selected users"
        >
          <prop name="userIds" type="array" required/>
        </tool>
      )}
      
      {/* Available to all users */}
      <tool 
        ref={exportDataRef}
        name="export_data" 
        description="Export your data"
      >
        <prop name="format" type="string" description="csv or json"/>
      </tool>
      
      <context name="permissions">
        {`Role: ${user.role}
Admin: ${user.isAdmin ? 'Yes' : 'No'}`}
      </context>
    </div>
  )
}
```

### Real-Time Updates

Update context automatically when data changes:

```jsx
function Dashboard() {
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString())
  const refreshDataRef = useRef(null)

  useEffect(() => {
    // Handle refresh tool
    const handleRefresh = (event) => {
      setOnlineUsers(Math.floor(Math.random() * 100))
      setLastUpdate(new Date().toLocaleTimeString())
      event.detail.success = true
      event.detail.message = 'Data refreshed'
    }

    const refreshTool = refreshDataRef.current
    if (refreshTool) {
      refreshTool.addEventListener('call', handleRefresh)
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      setOnlineUsers(Math.floor(Math.random() * 100))
      setLastUpdate(new Date().toLocaleTimeString())
    }, 5000)

    return () => {
      if (refreshTool) {
        refreshTool.removeEventListener('call', handleRefresh)
      }
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="dashboard">
      {/* Context updates automatically with state changes */}
      <context name="metrics">
        {`Users online: ${onlineUsers}
Last update: ${lastUpdate}`}
      </context>
      
      <tool 
        ref={refreshDataRef}
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
  )
}
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

// Dashboard.test.jsx
import { render, screen } from '@testing-library/react'
import { triggerTool } from './test-utils/voix'
import Dashboard from './Dashboard'

test('handles refresh tool', () => {
  render(<Dashboard />)
  
  // Wait for component to mount
  setTimeout(() => {
    const result = triggerTool('refresh_data', {})
    
    expect(result.success).toBe(true)
    expect(result.message).toBe('Data refreshed')
    
    // Check if context updated
    const context = document.querySelector('[name="metrics"]')
    expect(context.textContent).toContain('Users online:')
  }, 100)
})
```

This guide covers the essential patterns for integrating VOIX with React applications, focusing on practical examples and clean code practices.