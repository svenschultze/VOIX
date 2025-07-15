# Vue.js Integrationsleitfaden

Dieser Leitfaden behandelt fortgeschrittene Muster und Best Practices für die Integration von VOIX in Vue.js-Anwendungen, einschließlich Tools auf Komponentenebene, dynamisches Kontextmanagement und Vue-spezifische Optimierungen. Dieser Leitfaden verwendet die idiomatische `@call`-Syntax zur Behandlung von Tool-Ereignissen.

## Konfiguration

### Vite-Konfiguration

Konfigurieren Sie zunächst Vite, damit es die benutzerdefinierten Elemente von VOIX erkennt. Dieser Schritt ist entscheidend, damit Vue die benutzerdefinierten Tags in Ihren Vorlagen korrekt interpretieren kann.

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
````

### Globale Stile

Um sicherzustellen, dass VOIX-Elemente das Layout Ihrer Anwendung nicht beeinträchtigen, fügen Sie das folgende CSS zu Ihrem globalen Stylesheet hinzu.

```css
/* App.vue oder globale Stile */
tool, prop, context, array, dict {
  display: none;
}
```

## Tools auf Komponentenebene

Das Definieren von Tools innerhalb Ihrer Komponenten kapselt die Funktionalität und hält Ihren Code organisiert. Durch die Verwendung der `@call`-Ereignisbindung können Sie ein Tool direkt mit seiner Handler-Methode in Ihrem Skript verknüpfen.

```vue
<template>
  <div class="user-profile">
    <h2>{{ user.name }}s Profil</h2>

    <tool
      :name="`update_${userId}_profile`"
      description="Das Profil dieses Benutzers aktualisieren"
      @call="handleUpdateProfile"
    >
      <prop name="field" type="string" required description="Name, E-Mail oder Bio"/>
      <prop name="value" type="string" required/>
    </tool>

    <tool
      :name="`toggle_${userId}_notifications`"
      description="E-Mail-Benachrichtigungen umschalten"
      @call="handleToggleNotifications"
    >
    </tool>

    <context :name="`user_${userId}_state`">
      Name: {{ user.name }}
      E-Mail: {{ user.email }}
      Bio: {{ user.bio }}
      Benachrichtigungen: {{ user.notifications ? 'Aktiviert' : 'Deaktiviert' }}
    </context>

    <div class="profile-details">
      <p>E-Mail: {{ user.email }}</p>
      <p>Bio: {{ user.bio }}</p>
      <p>Benachrichtigungen: {{ user.notifications ? 'An' : 'Aus' }}</p>
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
  bio: 'Softwareentwickler',
  notifications: true
})

// Tool-Handler
function handleUpdateProfile(event) {
  const { field, value } = event.detail

  if (field in user.value) {
    user.value[field] = value
    event.detail.success = true
    event.detail.message = `${field} wurde zu ${value} geändert`
  } else {
    event.detail.success = false
    event.detail.error = `Ungültiges Feld: ${field}`
  }
}

function handleToggleNotifications(event) {
  user.value.notifications = !user.value.notifications
  event.detail.success = true
  event.detail.message = `Benachrichtigungen ${user.value.notifications ? 'aktiviert' : 'deaktiviert'}`
}
</script>
```

## Fortgeschrittene Muster

### Eindeutige Tool-Namen

Alle Tools in Ihrer Anwendung müssen einen eindeutigen `name` haben. Wenn Sie wiederverwendbare Komponenten erstellen, die Tools enthalten, integrieren Sie eine eindeutige Kennung (wie eine Prop) in den Namen des Tools, um Konflikte zu vermeiden.

```vue
<template>
  <div class="product-card">
    <tool
      :name="`add_to_cart_${product.id}`"
      description="Dieses Produkt zum Warenkorb hinzufügen"
      @call="handleAddToCart"
    >
      <prop name="quantity" type="number" required/>
    </tool>

    <tool
      :name="`toggle_favorite_${product.id}`"
      description="Den Favoritenstatus dieses Produkts umschalten"
      @call="handleToggleFavorite"
    >
    </tool>

    <h3>{{ product.name }}</h3>
    <button @click="addToCart">Zum Warenkorb</button>
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
  // Ihre Logik, um das Produkt zum Warenkorb hinzuzufügen
  console.log(`Füge ${quantity} von Produkt ${props.product.id} zum Warenkorb hinzu.`);
  event.detail.success = true;
  event.detail.message = `${quantity} von ${props.product.name} wurde zum Warenkorb hinzugefügt.`;
}

function handleToggleFavorite(event) {
  // Ihre Logik zum Umschalten des Favoritenstatus
  console.log(`Schalte Favorit für Produkt ${props.product.id} um.`);
  event.detail.success = true;
}

function addToCart() {
  // Ihre Logik für den normalen Button-Klick
  console.log(`Button geklickt, um Produkt ${props.product.id} zum Warenkorb hinzuzufügen.`);
}
</script>
```

### Bedingte Verfügbarkeit von Tools

Sie können `v-if` verwenden, um Tools basierend auf dem Anwendungszustand, wie z.B. Benutzerrollen oder Berechtigungen, bedingt zu rendern. Dies stellt sicher, dass Tools für die KI nur dann verfügbar sind, wenn sie relevant und autorisiert sind.

```vue
<template>
  <div>
    <tool
      v-if="user.isAdmin"
      name="delete_users"
      description="Ausgewählte Benutzer löschen"
      @call="handleDeleteUsers"
    >
      <prop name="userIds" type="array" required/>
    </tool>

    <tool
      name="export_data"
      description="Ihre Daten exportieren"
      @call="handleExportData"
    >
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

function handleDeleteUsers(event) {
  const { userIds } = event.detail;
  // Logik zum Löschen von Benutzern
  console.log('Lösche Benutzer:', userIds);
  event.detail.success = true;
  event.detail.message = `${userIds.length} Benutzer erfolgreich gelöscht.`;
}

function handleExportData(event) {
  const { format } = event.detail;
  // Logik zum Exportieren von Daten
  console.log('Exportiere Daten als:', format);
  event.detail.success = true;
}
</script>
```

### Echtzeit-Aktualisierungen

Das Reaktivitätssystem von Vue macht es einfach, `<context>`-Elemente auf dem neuesten Stand zu halten. Binden Sie einfach Ihre reaktiven Daten innerhalb des Kontext-Tags, und es wird automatisch aktualisiert, wann immer sich die Daten ändern.

```vue
<template>
  <div class="dashboard">
    <context name="metrics">
      Benutzer online: {{ onlineUsers }}
      Letzte Aktualisierung: {{ lastUpdate }}
    </context>

    <tool
      name="refresh_data"
      description="Dashboard-Daten manuell aktualisieren"
      @call="refreshData"
    >
    </tool>

    <h3>Dashboard</h3>
    <p>Benutzer online: {{ onlineUsers }}</p>
    <p>Letzte Aktualisierung: {{ lastUpdate }}</p>
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
    event.detail.message = "Dashboard-Daten wurden aktualisiert.";
  }
}

// Simulieren Sie Echtzeit-Updates von einem Server
onMounted(() => {
  setInterval(refreshData, 5000)
})
</script>
```

## Testen

Sie können Ihre VOIX-Integration testen, indem Sie `call`-Ereignisse auf Ihren Tool-Elementen programmgesteuert erstellen und auslösen.

```javascript
// test-utils/voix.js
export function triggerTool(toolName, params) {
  const tool = document.querySelector(`tool[name="${toolName}"]`)
  if (!tool) {
    throw new Error(`Tool mit dem Namen "${toolName}" nicht gefunden.`);
  }

  const event = new CustomEvent('call', {
    detail: { ...params }
  })

  tool.dispatchEvent(event)

  return event.detail
}

// component.test.js
import { mount } from '@vue/test-utils'
import { triggerTool } from '@/test-utils/voix'
import UserProfile from '@/components/UserProfile.vue'

it('behandelt den update_profile-Tool-Aufruf', async () => {
  const wrapper = mount(UserProfile, {
    props: { userId: 'test-user-123' }
  })
  await wrapper.vm.$nextTick() // Sicherstellen, dass die Komponente gerendert ist

  const result = triggerTool('update_test-user-123_profile', {
    field: 'name',
    value: 'Jane Doe'
  })

  expect(result.success).toBe(true)
  expect(result.message).toBe('Name wurde zu Jane Doe geändert')
  expect(wrapper.text()).toContain("Jane Does Profil")
})
```

<!--@include: @/de/voix_context.md -->