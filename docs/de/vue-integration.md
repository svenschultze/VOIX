# Vue.js-Integrationshandbuch

Dieses Handbuch behandelt fortgeschrittene Muster und bewährte Verfahren für die Integration von VOIX in Vue.js-Anwendungen, einschließlich Werkzeugen auf Komponentenebene, dynamischem Kontextmanagement und Vue-spezifischen Optimierungen.

## Konfiguration

### Vite-Konfiguration

Konfigurieren Sie zunächst Vite so, dass es benutzerdefinierte VOIX-Elemente erkennt:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Vue anweisen, benutzerdefinierte VOIX-Elemente zu ignorieren
          isCustomElement: (tag) => ['tool', 'prop', 'context', 'array', 'dict'].includes(tag)
        }
      }
    })
  ]
})
```

### Globale Stile

Fügen Sie diese Stile hinzu, um VOIX-Elemente in der Benutzeroberfläche auszublenden:

```css
/* App.vue oder globale Stile */
tool, prop, context, array, dict {
  display: none;
}
```

## Werkzeuge auf Komponentenebene

Definieren Sie Werkzeuge auf Komponentenebene für eine bessere Kapselung:

```vue
<template>
  <div class="user-profile">
    <h2>Profil von {{ user.name }}</h2>
    
    <!-- Komponentenspezifische Werkzeuge -->
    <tool 
      :name="`update_${userId}_profile`" 
      description="Profil dieses Benutzers aktualisieren"
      ref="updateTool"
    >
      <prop name="field" type="string" required description="name, email oder bio"/>
      <prop name="value" type="string" required/>
    </tool>
    
    <tool 
      :name="`toggle_${userId}_notifications`" 
      description="E-Mail-Benachrichtigungen umschalten"
      ref="notificationTool"
    >
    </tool>
    
    <!-- Komponentenkontext mit mehreren Interpolationen -->
    <context :name="`user_${userId}_state`">
      Name: {{ user.name }}
      E-Mail: {{ user.email }}
      Bio: {{ user.bio }}
      Benachrichtigungen: {{ user.notifications ? 'Aktiviert' : 'Deaktiviert' }}
    </context>
    
    <!-- Reguläre Benutzeroberfläche -->
    <div class="profile-details">
      <p>E-Mail: {{ user.email }}</p>
      <p>Bio: {{ user.bio }}</p>
      <p>Benachrichtigungen: {{ user.notifications ? 'An' : 'Aus' }}</p>
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
  bio: 'Softwareentwickler',
  notifications: true
})

const updateTool = ref(null)
const notificationTool = ref(null)

// Werkzeug-Handler
const handleUpdateProfile = (event) => {
  const { field, value } = event.detail
  
  if (field in user.value) {
    user.value[field] = value
    event.detail.success = true
    event.detail.message = `${field} auf ${value} aktualisiert`
  } else {
    event.detail.success = false
    event.detail.error = `Ungültiges Feld: ${field}`
  }
}

const handleToggleNotifications = (event) => {
  user.value.notifications = !user.value.notifications
  event.detail.success = true
  event.detail.message = `Benachrichtigungen ${user.value.notifications ? 'aktiviert' : 'deaktiviert'}`
}

// Lebenszyklus-Management
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

## Fortgeschrittene Muster

### Eindeutige Werkzeugnamen

Werkzeuge müssen in Ihrer gesamten Anwendung eindeutige Namen haben. Wenn Sie mehrere Instanzen derselben Komponente verwenden, fügen Sie einen Bezeichner hinzu:

```vue
<template>
  <div class="product-card">
    <!-- Produkt-ID in den Werkzeugnamen aufnehmen, um Eindeutigkeit zu gewährleisten -->
    <tool :name="`add_to_cart_${product.id}`" description="Dieses Produkt zum Warenkorb hinzufügen">
      <prop name="quantity" type="number" required/>
    </tool>
    
    <tool :name="`toggle_favorite_${product.id}`" description="Favoritenstatus umschalten">
    </tool>
    
    <h3>{{ product.name }}</h3>
    <button @click="addToCart">Zum Warenkorb hinzufügen</button>
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

### Bedingte Werkzeugverfügbarkeit

Zeigen Sie Werkzeuge basierend auf Benutzerberechtigungen an:

```vue
<template>
  <div>
    <!-- Admin-Werkzeuge nur für Admins sichtbar -->
    <tool v-if="user.isAdmin" name="delete_users" description="Ausgewählte Benutzer löschen">
      <prop name="userIds" type="array" required/>
    </tool>
    
    <!-- Für alle Benutzer verfügbar -->
    <tool name="export_data" description="Ihre Daten exportieren">
      <prop name="format" type="string" description="csv oder json"/>
    </tool>
    
    <context name="permissions">
      Rolle: {{ user.role }}
      Admin: {{ user.isAdmin ? 'Ja' : 'Nein' }}
    </context>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
const user = useUserStore()
</script>
```

### Echtzeit-Updates

Aktualisieren Sie den Kontext automatisch, wenn sich Daten ändern:

```vue
<template>
  <div class="dashboard">
    <!-- Kontext wird automatisch mit reaktiven Daten aktualisiert -->
    <context name="metrics">
      Benutzer online: {{ onlineUsers }}
      Letztes Update: {{ lastUpdate }}
    </context>
    
    <tool name="refresh_data" description="Dashboard-Daten aktualisieren">
    </tool>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const onlineUsers = ref(0)
const lastUpdate = ref(new Date().toLocaleTimeString())

// Echtzeit-Updates simulieren
onMounted(() => {
  setInterval(() => {
    onlineUsers.value = Math.floor(Math.random() * 100)
    lastUpdate.value = new Date().toLocaleTimeString()
  }, 5000)
})
</script>
```

## Testen

Erstellen Sie Test-Dienstprogramme für VOIX-Werkzeuge:

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

it('behandelt Werkzeugaufrufe', async () => {
  const wrapper = mount(MyComponent)
  await wrapper.vm.$nextTick()
  
  const result = triggerTool('my_tool', { value: 'test' })
  
  expect(result.success).toBe(true)
  expect(result.message).toBe('Erfolg')
})
```

Dieses Handbuch behandelt die wesentlichen Muster für die Integration von VOIX in Vue.js-Anwendungen, wobei der Schwerpunkt auf praktischen Beispielen und sauberen Codierungspraktiken liegt.

<!--@include: @/voix_context.md -->