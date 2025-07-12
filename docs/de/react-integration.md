# React-Integrationshandbuch

> [!CAUTION]
> Dieses Handbuch ist ungetestet und kann Fehler enthalten. Bitte überprüfen Sie die Codebeispiele in Ihrer eigenen Implementierung und melden Sie alle Probleme.

Dieses Handbuch behandelt Muster und bewährte Verfahren für die Integration von VOIX in React-Anwendungen, einschließlich Werkzeugen auf Komponentenebene, Kontextmanagement und React-spezifischen Optimierungen.

## Konfiguration

### TypeScript-Konfiguration

Wenn Sie TypeScript verwenden, deklarieren Sie die benutzerdefinierten Elemente in Ihren Typdefinitionen:

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

### Globale Stile

Fügen Sie diese Stile hinzu, um VOIX-Elemente in der Benutzeroberfläche auszublenden:

```css
/* index.css oder globale Stile */
tool, prop, context, array, dict {
  display: none;
}
```

## Werkzeuge auf Komponentenebene

Definieren Sie Werkzeuge auf Komponentenebene für eine bessere Kapselung:

```jsx
import React, { useRef, useEffect, useState } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Softwareentwickler',
    notifications: true
  })

  const updateToolRef = useRef(null)
  const notificationToolRef = useRef(null)

  // Werkzeug-Handler
  const handleUpdateProfile = (event) => {
    const { field, value } = event.detail
    
    if (field in user) {
      setUser(prev => ({ ...prev, [field]: value }))
      event.detail.success = true
      event.detail.message = `${field} auf ${value} aktualisiert`
    } else {
      event.detail.success = false
      event.detail.error = `Ungültiges Feld: ${field}`
    }
  }

  const handleToggleNotifications = (event) => {
    setUser(prev => ({ ...prev, notifications: !prev.notifications }))
    event.detail.success = true
    event.detail.message = `Benachrichtigungen ${!user.notifications ? 'aktiviert' : 'deaktiviert'}`
  }

  // Lebenszyklus-Management
  useEffect(() => {
    const updateTool = updateToolRef.current
    const notificationTool = notificationToolRef.current

    if (updateTool) {
      updateTool.addEventListener('call', handleUpdateProfile)
    }
    if (notificationTool) {
      notificationTool.addEventListener('call', handleToggleNotifications)
    }

    // Aufräumen
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
      <h2>Profil von {user.name}</h2>
      
      {/* Komponentenspezifische Werkzeuge */}
      <tool 
        ref={updateToolRef}
        name={`update_${userId}_profile`}
        description="Profil dieses Benutzers aktualisieren"
      >
        <prop name="field" type="string" required description="name, email oder bio"/>
        <prop name="value" type="string" required/>
      </tool>
      
      <tool 
        ref={notificationToolRef}
        name={`toggle_${userId}_notifications`}
        description="E-Mail-Benachrichtigungen umschalten"
      >
      </tool>
      
      {/* Komponentenkontext mit mehreren Werten */}
      <context name={`user_${userId}_state`}>
        {`Name: ${user.name}
E-Mail: ${user.email}
Bio: ${user.bio}
Benachrichtigungen: ${user.notifications ? 'Aktiviert' : 'Deaktiviert'}`}
      </context>
      
      {/* Reguläre Benutzeroberfläche */}
      <div className="profile-details">
        <p>E-Mail: {user.email}</p>
        <p>Bio: {user.bio}</p>
        <p>Benachrichtigungen: {user.notifications ? 'An' : 'Aus'}</p>
      </div>
    </div>
  )
}
```

## Fortgeschrittene Muster

### Eindeutige Werkzeugnamen

Werkzeuge müssen in Ihrer gesamten Anwendung eindeutige Namen haben. Wenn Sie mehrere Instanzen derselben Komponente verwenden, fügen Sie einen Bezeichner hinzu:

```jsx
function ProductCard({ product }) {
  const addToCartRef = useRef(null)
  const toggleFavoriteRef = useRef(null)

  useEffect(() => {
    const handleAddToCart = (event) => {
      const { quantity } = event.detail
      addProductToCart(product.id, quantity)
      event.detail.success = true
      event.detail.message = `${quantity} zum Warenkorb hinzugefügt`
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
      {/* Produkt-ID in den Werkzeugnamen aufnehmen, um Eindeutigkeit zu gewährleisten */}
      <tool 
        ref={addToCartRef}
        name={`add_to_cart_${product.id}`}
        description="Dieses Produkt zum Warenkorb hinzufügen"
      >
        <prop name="quantity" type="number" required/>
      </tool>
      
      <tool 
        ref={toggleFavoriteRef}
        name={`toggle_favorite_${product.id}`}
        description="Favoritenstatus umschalten"
      >
      </tool>
      
      <h3>{product.name}</h3>
      <button onClick={() => addProductToCart(product.id, 1)}>
        Zum Warenkorb hinzufügen
      </button>
    </div>
  )
}
```

### Bedingte Werkzeugverfügbarkeit

Zeigen Sie Werkzeuge basierend auf Benutzerberechtigungen an:

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
      event.detail.message = `${userIds.length} Benutzer gelöscht`
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
      {/* Admin-Werkzeuge nur für Admins sichtbar */}
      {user.isAdmin && (
        <tool 
          ref={deleteUsersRef}
          name="delete_users" 
          description="Ausgewählte Benutzer löschen"
        >
          <prop name="userIds" type="array" required/>
        </tool>
      )}
      
      {/* Für alle Benutzer verfügbar */}
      <tool 
        ref={exportDataRef}
        name="export_data" 
        description="Ihre Daten exportieren"
      >
        <prop name="format" type="string" description="csv oder json"/>
      </tool>
      
      <context name="permissions">
        {`Rolle: ${user.role}
Admin: ${user.isAdmin ? 'Ja' : 'Nein'}`}
      </context>
    </div>
  )
}
```

### Echtzeit-Updates

Aktualisieren Sie den Kontext automatisch, wenn sich Daten ändern:

```jsx
function Dashboard() {
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString())
  const refreshDataRef = useRef(null)

  useEffect(() => {
    // Aktualisierungswerkzeug behandeln
    const handleRefresh = (event) => {
      setOnlineUsers(Math.floor(Math.random() * 100))
      setLastUpdate(new Date().toLocaleTimeString())
      event.detail.success = true
      event.detail.message = 'Daten aktualisiert'
    }

    const refreshTool = refreshDataRef.current
    if (refreshTool) {
      refreshTool.addEventListener('call', handleRefresh)
    }

    // Echtzeit-Updates simulieren
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
      {/* Kontext wird automatisch mit Zustandsänderungen aktualisiert */}
      <context name="metrics">
        {`Benutzer online: ${onlineUsers}
Letztes Update: ${lastUpdate}`}
      </context>
      
      <tool 
        ref={refreshDataRef}
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
  )
}
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

// Dashboard.test.jsx
import { render, screen } from '@testing-library/react'
import { triggerTool } from './test-utils/voix'
import Dashboard from './Dashboard'

test('behandelt das Aktualisierungswerkzeug', () => {
  render(<Dashboard />)
  
  // Warten, bis die Komponente gemountet ist
  setTimeout(() => {
    const result = triggerTool('refresh_data', {})
    
    expect(result.success).toBe(true)
    expect(result.message).toBe('Daten aktualisiert')
    
    // Überprüfen, ob der Kontext aktualisiert wurde
    const context = document.querySelector('[name="metrics"]')
    expect(context.textContent).toContain('Benutzer online:')
  }, 100)
})
```

Dieses Handbuch behandelt die wesentlichen Muster für die Integration von VOIX in React-Anwendungen, wobei der Schwerpunkt auf praktischen Beispielen und sauberen Codierungspraktiken liegt.