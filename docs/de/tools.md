# Werkzeuge

Werkzeuge deklarieren Aktionen, die die KI auf Ihrer Website ausführen kann. Sie definieren, was die KI tun kann und welche Parameter sie bereitstellen muss.

## Grundstruktur

```html
<tool name="werkzeugName" description="Was dieses Werkzeug tut">
  <prop name="paramName" type="string" required/>
</tool>
```

## Werkzeug-Attribute

### `name` (erforderlich)
- Eindeutiger Bezeichner für das Werkzeug
- Wird in JavaScript-Event-Handlern verwendet
- Beispiele: `create_task`, `search_products`, `update_status`

### `description` (erforderlich)
- Klare Erklärung, was das Werkzeug tut
- Hilft der KI zu verstehen, wann das Werkzeug zu verwenden ist
- Beispiele: "Eine neue Aufgabe erstellen", "Nach Produkten suchen", "Benutzerstatus aktualisieren"
- 
### `return` (optional)
- Gibt an, dass das Werkzeug Daten an die KI zurückgibt
- Falls vorhanden, wartet VOIX auf ein `return`-Event, bevor es fortfährt

## Parameter definieren

Werkzeuge verwenden `<prop>`-Elemente, um Parameter zu definieren:

```html
<tool name="create_meeting" description="Ein neues Meeting planen">
  <prop name="title" type="string" required/>
  <prop name="date" type="string" description="Datum im YYYY-MM-DD-Format" required/>
  <prop name="duration" type="number" description="Dauer in Minuten"/>
</tool>
```

### Parameter-Attribute

- `name` - Parameter-Bezeichner
- `type` - Datentyp (`string`, `number`, `boolean`)
- `description` - Erklärt den Parameter, insbesondere Formatanforderungen
- `required` - Macht den Parameter obligatorisch

### Parameter-Beschreibungen

Verwenden Sie Beschreibungen, um Formatanforderungen oder Einschränkungen zu verdeutlichen:

```html
<prop name="email" type="string" description="Gültige E-Mail-Adresse" required/>
<prop name="phone" type="string" description="Telefonnummer im E.164-Format"/>
<prop name="startTime" type="string" description="Zeit im HH:MM-Format (24-Stunden)"/>
<prop name="amount" type="number" description="Betrag in USD (bis zu 2 Dezimalstellen)"/>
```

### Arrays und Objekte

Für komplexe Datenstrukturen:

```html
<tool name="invite_users" description="Benutzer zum Projekt einladen">
  <array name="users" required>
    <dict>
      <prop name="email" type="string" description="Gültige E-Mail-Adresse" required/>
      <prop name="role" type="string" description="Entweder 'viewer', 'editor' oder 'admin'"/>
    </dict>
  </array>
</tool>
```

## Werkzeugaufrufe behandeln

Wenn die KI ein Werkzeug aufruft, löst VOIX ein `call`-Ereignis auf dem Werkzeugelement aus:

```javascript
document.querySelector('[name=search_products]').addEventListener('call', async (e) => {
  const { query } = e.detail;
  const results = await searchAPI(query);
  updateUI(results);
});
```
## Werkzeuge, die Daten zurückgeben

Manchmal besteht der Hauptzweck eines Werkzeugs darin, *Informationen an die KI zurückzusenden* – entweder zusätzlich oder anstelle einer UI-Aktualisierung.
Fügen Sie dazu das `return`-Attribut zum `<tool>`-Element hinzu und lösen Sie ein **`return`**-Custom-Event aus.

```html
<tool name="get_weather" description="Aktuelle Wetterdaten abrufen" return>
  <prop name="location" type="string" required/>
</tool>
```

Das `return`-Attribut (ohne Wert) signalisiert VOIX, dass das Werkzeug Daten zurückgeben **wird**. VOIX wartet dann auf ein `return`-Event, bevor es der KI antwortet.

### Ein `return`-Event auslösen

Verpacken Sie die gewünschten Daten im `detail` des Events und lösen Sie das `return`-Event auf demselben Element aus:

```javascript
document
  .querySelector('[name=get_weather]')
  .addEventListener('call', async (e) => {
    const { location } = e.detail;
    const weather = await fetchWeather(location);   // Ihre Logik zum Abrufen der Daten

    // Wetterdaten an die KI zurückgeben
    e.target.dispatchEvent(
      new CustomEvent('return', { detail: weather })
    );

    // (Optional) UI für den Nutzer wie gewohnt aktualisieren
    updateWeatherWidget(weather);
  });
```

Sie können so auch Erfolgs- oder Fehlermeldungen zurückgeben:

```javascript
document.querySelector('[name=submit_form]').addEventListener('call', async (e) => {
  try {
    const response = await submitForm(e.detail);
    
    // KI über Erfolg informieren
    e.target.dispatchEvent(new CustomEvent('return', {
      detail: { success: true, message: 'Formular erfolgreich gesendet.' }
    }));
  } catch (error) {
    // KI über Fehler informieren
    e.target.dispatchEvent(new CustomEvent('return', {
      detail: { success: false, error: error.message }
    }));
  }
});
```

---

Mit dem `return`-Attribut und dem `return`-Event können Sie Werkzeuge bauen, die *APIs abfragen, Berechnungen durchführen oder Kontext sammeln* und die Ergebnisse direkt an die KI zurückgeben – für reichhaltigere, datengetriebene Interaktionen.


## Allgemeine Beispiele

### Einfache Aktion

```html
<tool name="toggle_theme" description="Zwischen hellem und dunklem Thema wechseln">
</tool>

<script>
document.querySelector('[name=toggle_theme]').addEventListener('call', (e) => {
  document.body.classList.toggle('dark-theme');
});
</script>
```

### Formularübermittlung

```html
<tool name="submit_contact" description="Kontaktformular senden">
  <prop name="name" type="string" required/>
  <prop name="email" type="string" description="Gültige E-Mail-Adresse" required/>
  <prop name="message" type="string" description="Nachrichteninhalt (max. 500 Zeichen)" required/>
</tool>

<script>
document.querySelector('[name=submit_contact]').addEventListener('call', async (e) => {
  const { name, email, message } = e.detail;
  
  await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message })
  });
  
  // Erfolgsmeldung für den Benutzer anzeigen
  showNotification('Kontaktformular gesendet!');
});
</script>
```

### Suchfunktion

```html
<tool name="search_items" description="Nach Artikeln suchen">
  <prop name="query" type="string" required/>
  <prop name="category" type="string"/>
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

### Verwenden Sie klare Namen

Wählen Sie beschreibende, aktionsorientierte Namen:

```html
<!-- Gut -->
<tool name="create_task" description="Eine neue Aufgabe erstellen">
<tool name="delete_item" description="Einen Artikel löschen">

<!-- Vermeiden -->
<tool name="do_thing" description="Etwas tun">
<tool name="action1" description="Aktion">
```

### Geben Sie hilfreiche Beschreibungen

Schreiben Sie Beschreibungen, die klar erklären, was das Werkzeug tut:

```html
<!-- Gut -->
<tool name="filter_products" description="Produkte nach Kategorie und Preis filtern">

<!-- Vermeiden -->
<tool name="filter_products" description="Filtern">
```

### Fehler elegant behandeln

Fügen Sie immer eine Fehlerbehandlung hinzu:

```javascript
tool.addEventListener('call', async (e) => {
  try {
    // Ihre Logik hier
    await performAction(e.detail);
  } catch (err) {
    console.error('Werkzeugausführung fehlgeschlagen:', err);
    showErrorMessage('Aktion fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
});
```

### Werkzeuge fokussiert halten

Jedes Werkzeug sollte eine Sache gut machen:

```html
<!-- Gut: Separate Werkzeuge für verschiedene Aktionen -->
<tool name="add_to_cart" description="Artikel zum Warenkorb hinzufügen">
<tool name="remove_from_cart" description="Artikel aus dem Warenkorb entfernen">

<!-- Vermeiden: Ein Werkzeug, das mehrere Dinge tut -->
<tool name="manage_cart" description="Warenkorb hinzufügen, entfernen oder aktualisieren">
```

## Framework-Beispiele

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
    <tool ref={toolRef} name="create_task" description="Eine neue Aufgabe erstellen">
      <prop name="title" type="string" required/>
    </tool>
  );
}
```

### Vue

```vue
<template>
  <tool name="update_status" @call="handleUpdate" description="Status aktualisieren">
    <prop name="status" type="string" required/>
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
    showMessage(`${item} hinzugefügt`);
  }
</script>

<tool name="add_item" on:call={handleAdd} description="Einen Artikel hinzufügen">
  <prop name="item" type="string" required/>
</tool>
```

## Werkzeuge testen

Erstellen Sie eine einfache Testseite:

```html
<!DOCTYPE html>
<html>
<body>
  <tool name="test_tool" description="Testwerkzeug zum Debuggen">
    <prop name="message" type="string" required/>
  </tool>
  
  <script>
  document.querySelector('[name=test_tool]').addEventListener('call', (e) => {
    console.log('Werkzeug aufgerufen mit:', e.detail);
    alert(`Werkzeug empfangen: ${e.detail.message}`);
  });
  </script>
</body>
</html>
```

Dann:
1. Öffnen Sie die Seite mit installiertem VOIX
2. Bitten Sie die KI, "das Testwerkzeug mit der Nachricht 'Hallo' zu verwenden"
3. Überprüfen Sie die Konsole auf Ausgaben

## Zusammenfassung

Werkzeuge in VOIX sind einfache HTML-Elemente, die deklarieren, welche Aktionen die KI ausführen kann. Sie verwenden `<prop>`-Elemente, um Parameter zu definieren, und JavaScript-Event-Listener, um die Ausführung zu behandeln. Halten Sie Werkzeuge fokussiert, geben Sie klare Beschreibungen und behandeln Sie Fehler immer elegant.

## Nächste Schritte

- Erfahren Sie mehr über [Kontext](./context.md) zur Bereitstellung von Zustandsinformationen
- Lesen Sie die [Ersten Schritte](./getting-started.md) für Einrichtungsanweisungen

<!--@include: @/de/voix_context.md -->