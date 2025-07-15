# Vue.js Integration Guide

This guide covers advanced patterns and best practices for integrating VOIX with Vue.js applications, including component-level tools, dynamic context management, and Vue-specific optimizations. This guide uses the idiomatic `@call` syntax for handling tool events.

## Configuration

### Vite Configuration

First, configure Vite to recognize VOIX custom elements. This step is crucial for Vue to correctly interpret the custom tags in your templates.

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
````

### Global Styles

To ensure that VOIX elements do not interfere with your application's layout, add the following CSS to your global stylesheet.

```css
/* App.vue or global styles */
tool, prop, context, array, dict {
  display: none;
}
```

## Component-Level Tools

Defining tools within your components encapsulates functionality and keeps your code organized. By using the `@call` event binding, you can directly link a tool to its handler method in your script.

```vue
<template>
  <div class="user-profile">
    <h2>{{ user.name }}'s Profile</h2>

    <!-- Component-specific tools with @call event handlers -->
    <tool
      :name="`update_${userId}_profile`"
      description="Update this user's profile"
      @call="handleUpdateProfile"
    >
      <prop name="field" type="string" required description="name, email, or bio"/>
      <prop name="value" type="string" required/>
    </tool>

    <tool
      :name="`toggle_${userId}_notifications`"
      description="Toggle email notifications"
      @call="handleToggleNotifications"
    >
    </tool>

    <!-- Context automatically reflects reactive state -->
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
import { ref } from 'vue'

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

// Tool handlers
function handleUpdateProfile(event) {
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

function handleToggleNotifications(event) {
  user.value.notifications = !user.value.notifications
  event.detail.success = true
  event.detail.message = `Notifications ${user.value.notifications ? 'enabled' : 'disabled'}`
}
</script>
```

## Advanced Patterns

### Unique Tool Names

All tools in your application must have a unique `name`. When creating reusable components that contain tools, incorporate a unique identifier (like a prop) into the tool's name to prevent conflicts.

```vue
<template>
  <div class="product-card">
    <!-- Bind the product ID to the tool name for uniqueness -->
    <tool
      :name="`add_to_cart_${product.id}`"
      description="Add this product to the cart"
      @call="handleAddToCart"
    >
      <prop name="quantity" type="number" required/>
    </tool>

    <tool
      :name="`toggle_favorite_${product.id}`"
      description="Toggle the favorite status of this product"
      @call="handleToggleFavorite"
    >
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

function handleAddToCart(event) {
  const { quantity } = event.detail;
  // Your logic to add the product to the cart
  console.log(`Adding ${quantity} of product ${props.product.id} to cart.`);
  event.detail.success = true;
  event.detail.message = `Added ${quantity} of ${props.product.name} to your cart.`;
}

function handleToggleFavorite(event) {
  // Your logic to toggle favorite status
  console.log(`Toggling favorite for product ${props.product.id}.`);
  event.detail.success = true;
}

function addToCart() {
  // Your logic for the regular button click
  console.log(`Button clicked to add product ${props.product.id} to cart.`);
}
</script>
```

### Conditional Tool Availability

You can use `v-if` to conditionally render tools based on application state, such as user roles or permissions. This ensures that tools are only available to the AI when they are relevant and authorized.

```vue
<template>
  <div>
    <!-- Admin tools are only rendered if the user is an admin -->
    <tool
      v-if="user.isAdmin"
      name="delete_users"
      description="Delete selected users"
      @call="handleDeleteUsers"
    >
      <prop name="userIds" type="array" required/>
    </tool>

    <!-- This tool is available to all users -->
    <tool
      name="export_data"
      description="Export your data"
      @call="handleExportData"
    >
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

function handleDeleteUsers(event) {
  const { userIds } = event.detail;
  // Logic to delete users
  console.log('Deleting users:', userIds);
  event.detail.success = true;
  event.detail.message = `Successfully deleted ${userIds.length} users.`;
}

function handleExportData(event) {
  const { format } = event.detail;
  // Logic to export data
  console.log('Exporting data as:', format);
  event.detail.success = true;
}
</script>
```

### Real-Time Updates

Vue's reactivity system makes it easy to keep `<context>` elements up-to-date. Simply bind your reactive data within the context tag, and it will automatically update whenever the data changes.

```vue
<template>
  <div class="dashboard">
    <!-- This context automatically updates when its content changes -->
    <context name="metrics">
      Users online: {{ onlineUsers }}
      Last update: {{ lastUpdate }}
    </context>

    <tool
      name="refresh_data"
      description="Manually refresh dashboard data"
      @call="refreshData"
    >
    </tool>

    <h3>Dashboard</h3>
    <p>Users Online: {{ onlineUsers }}</p>
    <p>Last Update: {{ lastUpdate }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const onlineUsers = ref(0)
const lastUpdate = ref(new Date().toLocaleTimeString())

function refreshData(event) {
  onlineUsers.value = Math.floor(Math.random() * 100)
  lastUpdate.value = new Date().toLocaleTimeString()
  if (event) {
    event.detail.success = true;
    event.detail.message = "Dashboard data has been refreshed.";
  }
}

// Simulate real-time updates from a server
onMounted(() => {
  setInterval(refreshData, 5000)
})
</script>
```
<!--@include: @/voix_context.md -->