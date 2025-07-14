<!-- #region context -->
# Vue.js Integration Guide

This guide covers advanced patterns and best practices for integrating VOIX with Vue.js applications, including component-level tools, dynamic context management, and Vue-specific optimizations.

## Configuration

### Vite Configuration

First, configure Vite to recognize VOIX custom elements:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Tell Vue to ignore VOIX custom elements
          isCustomElement: (tag) => ['tool', 'prop', 'context', 'array', 'dict'].includes(tag)
        }
      }
    })
  ]
})
```

### Global Styles

Add these styles to hide VOIX elements from the UI:

```css
/* App.vue or global styles */
tool, prop, context, array, dict {
  display: none;
}
```

## Component-Level Tools

Define tools at the component level for better encapsulation:

```vue
<template>
  <div class="user-profile">
    <h2>{{ user.name }}'s Profile</h2>
    
    <!-- Component-specific tools -->
    <tool 
      :name="`update_${userId}_profile`" 
      description="Update this user's profile"
      ref="updateTool"
    >
      <prop name="field" type="string" required description="name, email, or bio"/>
      <prop name="value" type="string" required/>
    </tool>
    
    <tool 
      :name="`toggle_${userId}_notifications`" 
      description="Toggle email notifications"
      ref="notificationTool"
    >
    </tool>
    
    <!-- Component context with multiple interpolations -->
    <context :name="`user_${userId}_state`">
      Name: {{ user.name }}
      Email: {{ user.email }}
      Bio: {{ user.bio }}
      Notifications: {{ user.notifications ? 'Enabled' : 'Disabled' }}
    </context>
    
    <!-- Regular UI -->
    <div class="profile-details">
      <p>Email: {{ user.email }}</p>
      <p>Bio: {{ user.bio }}</p>
      <p>Notifications: {{ user.notifications ? 'On' : 'Off' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

const user = ref({
  name: 'John Doe',
  email: 'john@example.com',
  bio: 'Software developer',
  notifications: true
})

const updateTool = ref(null)
const notificationTool = ref(null)

// Tool handlers
const handleUpdateProfile = (event) => {
  const { field, value } = event.detail
  
  if (field in user.value) {
    user.value[field] = value
    event.detail.success = true
    event.detail.message = `Updated ${field} to ${value}`
  } else {
    event.detail.success = false
    event.detail.error = `Invalid field: ${field}`
  }
}

const handleToggleNotifications = (event) => {
  user.value.notifications = !user.value.notifications
  event.detail.success = true
  event.detail.message = `Notifications ${user.value.notifications ? 'enabled' : 'disabled'}`
}

// Lifecycle management
onMounted(() => {
  updateTool.value?.addEventListener('call', handleUpdateProfile)
  notificationTool.value?.addEventListener('call', handleToggleNotifications)
})

onBeforeUnmount(() => {
  updateTool.value?.removeEventListener('call', handleUpdateProfile)
  notificationTool.value?.removeEventListener('call', handleToggleNotifications)
})
</script>
```

## Advanced Patterns

### Unique Tool Names

Tools must have unique names across your application. When using multiple instances of the same component, include an identifier:

```vue
<template>
  <div class="product-card">
    <!-- Include product ID in tool name to ensure uniqueness -->
    <tool :name="`add_to_cart_${product.id}`" description="Add this product to cart">
      <prop name="quantity" type="number" required/>
    </tool>
    
    <tool :name="`toggle_favorite_${product.id}`" description="Toggle favorite status">
    </tool>
    
    <h3>{{ product.name }}</h3>
    <button @click="addToCart">Add to Cart</button>
  </div>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})
</script>
```

### Conditional Tool Availability

Show tools based on user permissions:

```vue
<template>
  <div>
    <!-- Admin tools only visible to admins -->
    <tool v-if="user.isAdmin" name="delete_users" description="Delete selected users">
      <prop name="userIds" type="array" required/>
    </tool>
    
    <!-- Available to all users -->
    <tool name="export_data" description="Export your data">
      <prop name="format" type="string" description="csv or json"/>
    </tool>
    
    <context name="permissions">
      Role: {{ user.role }}
      Admin: {{ user.isAdmin ? 'Yes' : 'No' }}
    </context>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
const user = useUserStore()
</script>
```

### Real-Time Updates

Update context automatically when data changes:

```vue
<template>
  <div class="dashboard">
    <!-- Context updates automatically with reactive data -->
    <context name="metrics">
      Users online: {{ onlineUsers }}
      Last update: {{ lastUpdate }}
    </context>
    
    <tool name="refresh_data" description="Refresh dashboard data">
    </tool>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const onlineUsers = ref(0)
const lastUpdate = ref(new Date().toLocaleTimeString())

// Simulate real-time updates
onMounted(() => {
  setInterval(() => {
    onlineUsers.value = Math.floor(Math.random() * 100)
    lastUpdate.value = new Date().toLocaleTimeString()
  }, 5000)
})
</script>
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

// component.test.js
import { mount } from '@vue/test-utils'
import { triggerTool } from '@/test-utils/voix'

it('handles tool calls', async () => {
  const wrapper = mount(MyComponent)
  await wrapper.vm.$nextTick()
  
  const result = triggerTool('my_tool', { value: 'test' })
  
  expect(result.success).toBe(true)
  expect(result.message).toBe('Success')
})
```

This guide covers the essential patterns for integrating VOIX with Vue.js applications, focusing on practical examples and clean code practices.
<!-- #endregion context -->


<!--@include: @/voix_context.md -->