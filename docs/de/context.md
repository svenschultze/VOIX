# Kontext

Kontextelemente versorgen die KI mit Informationen über den aktuellen Zustand Ihrer Anwendung. Sie enthalten einfachen Text, der der KI hilft zu verstehen, was auf der Seite passiert.

## Grundstruktur

```html
<context name="kontextName">
  Einfacher Textinhalt hier
</context>
```

## Kontext-Attribute

### `name` (erforderlich)

- Eindeutiger Bezeichner für den Kontext
- Wird verwendet, um auf bestimmte Kontextblöcke zu verweisen
- Beispiele: `user`, `page_info`, `current_state`

## Einfache Beispiele

### Benutzerinformationen

```html
<context name="current_user">
  Name: John Doe
  Rolle: Administrator
  Letzte Anmeldung: 2025-01-30 10:00
</context>
```

### Seitenzustand

```html
<context name="page_info">
  Seite: Dashboard
  Benutzerrolle: Admin
  Gesamtanzahl der Elemente: 42
  Filter: Nur aktive
</context>
```

### Anwendungsstatus

```html
<context name="app_state">
  Modus: Bearbeiten
  Ungespeicherte Änderungen: Ja
  Automatisches Speichern: Aktiviert
  Zuletzt gespeichert: vor 5 Minuten
</context>
```

## Dynamischer Kontext

Der Kontext kann mit JavaScript aktualisiert werden, um Echtzeitänderungen widerzuspiegeln:

```html
<context name="session_state" id="session-context">
  Wird geladen...
</context>

<script>
setInterval(() => {
  document.getElementById('session-context').textContent = 
    `Zeit: ${new Date().toLocaleTimeString()}`;
}, 10000);
</script>
```

## Best Practices

### Halten Sie es einfach

Der Kontext sollte einfacher, leicht lesbarer Text sein. Vermeiden Sie rohes JSON oder HTML:

```html
<!-- Gut: Klar und einfach -->
<context name="order_status">
  Bestell-ID: ORD-12345
  Status: In Bearbeitung
  Artikel: 3
  Gesamt: 99,99 €
</context>

<!-- Vermeiden: Verwenden Sie kein HTML oder JSON -->
<context name="order_status">
  {"orderId": "ORD-12345", "status": "processing", "items": 3}
</context>
```

### Seien Sie präzise

Geben Sie nur Kontext an, der relevant ist, um der KI zu helfen, den aktuellen Zustand zu verstehen:

```html
<!-- Gut: Nur relevante Informationen -->
<context name="search_filters">
  Kategorie: Elektronik
  Preisspanne: 100€-500€
  Nur auf Lager: Ja
</context>

<!-- Vermeiden: Unnötige interne Details -->
<context name="search_filters">
  Kategorie: Elektronik
  Kategorie-ID: 123
  Übergeordnete Kategorie: Technologie
  Kategorie erstellt: 2020-01-01
  Preisspanne: 100€-500€
  Preiswährung: EUR
  Preis inkl. MwSt.: Nein
  ...
</context>
```

### Häufig aktualisieren

Halten Sie den Kontext aktuell, indem Sie ihn bei jeder Änderung des Anwendungszustands aktualisieren:

```javascript
// Einfache Kontextaktualisierung
function updateUserContext(user) {
  document.querySelector('context[name="user"]').textContent = 
    `Name: ${user.name}\nRolle: ${user.role}`;
}
```

## Allgemeine Muster

Der Kontext kann eine einfache Beschreibung oder ein beliebiger Text sein, der der KI hilft, die Situation zu verstehen:

```html
<context name="page_description">
  Dies ist das Benutzer-Dashboard, das die letzten Aktivitäten und ausstehenden Aufgaben anzeigt. Der Benutzer war in der letzten Woche inaktiv, hat aber mehrere überfällige Aufgaben, die Aufmerksamkeit erfordern.
</context>
```

### Listen und Sammlungen

```html
<context name="recent_actions">
  Letzte Aktionen:
  - Dokument "Q4-Bericht" erstellt
  - Mit team@example.com geteilt
  - Projektzeitplan aktualisiert
  - Aufgabe #42 abgeschlossen
</context>
```

### Statusinformationen

```html
<context name="system_status">
  Server: Verbunden
  Synchronisierung: Auf dem neuesten Stand
  Version: 2.1.0
  Umgebung: Produktion
</context>
```

## Framework-Beispiele

### React

```jsx
function UserContext({ user }) {
  return (
    <context name="user">
      {`Name: ${user.name}
Role: ${user.role}`}
    </context>
  );
}
```

### Vue

```vue
<template>
  <context name="user">
    Name: {{ user.name }}
    Rolle: {{ user.role }}
  </context>
</template>

<script setup>
defineProps(['user'])
</script>
```

### Svelte

```svelte
<script>
  export let user;
</script>

<context name="user">
  Name: {user.name}
  Rolle: {user.role}
</context>
```

## Zusammenfassung

Kontextelemente sind einfache Container für einfachen Text, der der KI hilft, den aktuellen Zustand Ihrer Anwendung zu verstehen. Halten Sie den Kontext präzise, relevant und aktuell. Vermeiden Sie die Aufnahme von HTML, JSON oder sensiblen Informationen - verwenden Sie einfach klaren, lesbaren Text, der beschreibt, was auf der Seite passiert.

## Nächste Schritte

- Erfahren Sie mehr über [Werkzeuge](./tools.md) zum Erstellen interaktiver Werkzeuge
- Lesen Sie die [Ersten Schritte](./getting-started.md) für Einrichtungsanweisungen
