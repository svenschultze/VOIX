# Svelte-Integrationshandbuch

> [!CAUTION]
> Dieses Handbuch ist ungetestet und kann Fehler enthalten. Bitte überprüfen Sie die Codebeispiele in Ihrer eigenen Implementierung und melden Sie alle Probleme.

Dieses Handbuch behandelt Muster und bewährte Verfahren für die Integration von VOIX in Svelte 5-Anwendungen unter Verwendung von Runes, einschließlich Werkzeugen auf Komponentenebene, Zustandsmanagement und Svelte-spezifischen Optimierungen.

## Konfiguration

### Globale Stile

Fügen Sie diese Stile hinzu, um VOIX-Elemente in der Benutzeroberfläche auszublenden:

```css
/* app.css oder globale Stile */
tool, prop, context, array, dict {
  display: none;
}
```

## Werkzeuge auf Komponentenebene

Definieren Sie Werkzeuge auf Komponentenebene für eine bessere Kapselung:

```svelte
<script>
  let { userId } = $props()
  
  let user = $state({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Softwareentwickler',
    notifications: true
  })

  let updateTool = $state()
  let notificationTool = $state()

  // Werkzeug-Handler
  function handleUpdateProfile(event) {
    const { field, value } = event.detail
    
    if (field in user) {
      user[field] = value
      event.detail.success = true
      event.detail.message = `${field} auf ${value} aktualisiert`
    } else {
      event.detail.success = false
      event.detail.error = `Ungültiges Feld: ${field}`
    }
  }

  function handleToggleNotifications(event) {
    user.notifications = !user.notifications
    event.detail.success = true
    event.detail.message = `Benachrichtigungen ${user.notifications ? 'aktiviert' : 'deaktiviert'}`
  }

  // Lebenszyklus-Management
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
  <h2>Profil von {user.name}</h2>
  
  <!-- Komponentenspezifische Werkzeuge -->
  <tool 
    bind:this={updateTool}
    name="update_{userId}_profile"
    description="Profil dieses Benutzers aktualisieren"
  >
    <prop name="field" type="string" required description="name, email oder bio"/>
    <prop name="value" type="string" required/>
  </tool>
  
  <tool 
    bind:this={notificationTool}
    name="toggle_{userId}_notifications"
    description="E-Mail-Benachrichtigungen umschalten"
  >
  </tool>
  
  <!-- Komponentenkontext mit mehreren Werten -->
  <context name="user_{userId}_state">
    Name: {user.name}
    E-Mail: {user.email}
    Bio: {user.bio}
    Benachrichtigungen: {user.notifications ? 'Aktiviert' : 'Deaktiviert'}
  </context>
  
  <!-- Reguläre Benutzeroberfläche -->
  <div class="profile-details">
    <p>E-Mail: {user.email}</p>
    <p>Bio: {user.bio}</p>
    <p>Benachrichtigungen: {user.notifications ? 'An' : 'Aus'}</p>
  </div>
</div>
```

## Fortgeschrittene Muster

### Eindeutige Werkzeugnamen

Werkzeuge müssen in Ihrer gesamten Anwendung eindeutige Namen haben. Wenn Sie mehrere Instanzen derselben Komponente verwenden, fügen Sie einen Bezeichner hinzu:

```svelte
<script>
  let { product } = $props()
  
  let addToCartTool = $state()
  let toggleFavoriteTool = $state()

  function handleAddToCart(event) {
    const { quantity } = event.detail
    addProductToCart(product.id, quantity)
    event.detail.success = true
    event.detail.message = `${quantity} zum Warenkorb hinzugefügt`
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
  <!-- Produkt-ID in den Werkzeugnamen aufnehmen, um Eindeutigkeit zu gewährleisten -->
  <tool 
    bind:this={addToCartTool}
    name="add_to_cart_{product.id}"
    description="Dieses Produkt zum Warenkorb hinzufügen"
  >
    <prop name="quantity" type="number" required/>
  </tool>
  
  <tool 
    bind:this={toggleFavoriteTool}
    name="toggle_favorite_{product.id}"
    description="Favoritenstatus umschalten"
  >
  </tool>
  
  <h3>{product.name}</h3>
  <button onclick={() => addProductToCart(product.id, 1)}>
    Zum Warenkorb hinzufügen
  </button>
</div>
```

### Bedingte Werkzeugverfügbarkeit

Zeigen Sie Werkzeuge basierend auf Benutzerberechtigungen an:

```svelte
<script>
  import { userStore } from './stores/userStore.js'
  
  let deleteUsersTool = $state()
  let exportDataTool = $state()

  function handleDeleteUsers(event) {
    const { userIds } = event.detail
    deleteSelectedUsers(userIds)
    event.detail.success = true
    event.detail.message = `${userIds.length} Benutzer gelöscht`
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
  <!-- Admin-Werkzeuge nur für Admins sichtbar -->
  {#if $userStore.isAdmin}
    <tool 
      bind:this={deleteUsersTool}
      name="delete_users" 
      description="Ausgewählte Benutzer löschen"
    >
      <prop name="userIds" type="array" required/>
    </tool>
  {/if}
  
  <!-- Für alle Benutzer verfügbar -->
  <tool 
    bind:this={exportDataTool}
    name="export_data" 
    description="Ihre Daten exportieren"
  >
    <prop name="format" type="string" description="csv oder json"/>
  </tool>
  
  <context name="permissions">
    Rolle: {$userStore.role}
    Admin: {$userStore.isAdmin ? 'Ja' : 'Nein'}
  </context>
</div>
```

### Echtzeit-Updates

Aktualisieren Sie den Kontext automatisch, wenn sich Daten ändern:

```svelte
<script>
  let onlineUsers = $state(0)
  let lastUpdate = $state(new Date().toLocaleTimeString())
  let refreshDataTool = $state()

  function handleRefresh(event) {
    onlineUsers = Math.floor(Math.random() * 100)
    lastUpdate = new Date().toLocaleTimeString()
    event.detail.success = true
    event.detail.message = 'Daten aktualisiert'
  }

  $effect(() => {
    if (refreshDataTool) {
      refreshDataTool.addEventListener('call', handleRefresh)
    }

    // Echtzeit-Updates simulieren
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
  <!-- Kontext wird automatisch mit Zustandsänderungen aktualisiert -->
  <context name="metrics">
    Benutzer online: {onlineUsers}
    Letztes Update: {lastUpdate}
  </context>
  
  <tool 
    bind:this={refreshDataTool}
    name="refresh_data" 
    description="Dashboard-Daten aktualisieren"
  >
  </tool>
  
  <div>
    <h3>Dashboard</h3>
    <p>Benutzer Online: {onlineUsers}</p>
    <p>Letztes Update: {lastUpdate}</p>
  </div>
</div>
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

// Dashboard.test.js
import { render } from '@testing-library/svelte'
import { triggerTool } from './test-utils/voix'
import Dashboard from './Dashboard.svelte'

test('behandelt das Aktualisierungswerkzeug', async () => {
  render(Dashboard)
  
  // Warten, bis die Komponente gemountet ist
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const result = triggerTool('refresh_data', {})
  
  expect(result.success).toBe(true)
  expect(result.message).toBe('Daten aktualisiert')
  
  // Überprüfen, ob der Kontext aktualisiert wurde
  const context = document.querySelector('[name="metrics"]')
  expect(context.textContent).toContain('Benutzer online:')
})
```

Dieses Handbuch behandelt die wesentlichen Muster für die Integration von VOIX in Svelte 5-Anwendungen unter Verwendung von Runes, wobei der Schwerpunkt auf praktischen Beispielen und sauberen Codierungspraktiken liegt.