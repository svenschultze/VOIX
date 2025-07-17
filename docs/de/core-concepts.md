# Kernkonzepte

VOIX ermöglicht es KI-Assistenten, mit Websites über eine einfache, aber leistungsstarke Architektur zu interagieren. Dieses Handbuch erklärt, wie die verschiedenen Teile zusammenarbeiten.

## Überblick

VOIX besteht aus drei Hauptkomponenten, die zusammenarbeiten:

1. **Ihre Website** - Deklariert, was die KI tun kann, und stellt den aktuellen Zustand bereit
2. **Chrome-Erweiterung** - Überbrückt die Lücke zwischen Ihrer Website und der KI
3. **Benutzer + KI** - Natürlichsprachliche Schnittstelle zur Interaktion mit Ihrer Website

## Wie es funktioniert

### 1. Website-Deklaration

Ihre Website deklariert Fähigkeiten mithilfe von HTML-Elementen:

- **Werkzeuge** - Aktionen, die die KI ausführen kann
- **Kontext** - Informationen zum aktuellen Zustand

```html
<!-- Eine Aktion deklarieren -->
<tool name="create_task" description="Eine neue Aufgabe erstellen">
  <prop name="title" type="string" required></prop>
</tool>

<!-- Aktuellen Zustand bereitstellen -->
<context name="user">
  Name: John Doe
  Rolle: Admin
</context>
```

### 2. Erkennung durch die Erweiterung

Wenn ein Benutzer VOIX auf Ihrer Seite öffnet:

1. Die Erweiterung sucht nach allen `<tool>`- und `<context>`-Elementen
2. Sie erstellt einen Katalog der verfügbaren Aktionen und des aktuellen Zustands
3. Diese Informationen werden dem KI-Assistenten präsentiert

### 3. Benutzerinteraktion

Der Benutzer tippt oder spricht natürlich:

```
"Erstelle eine Aufgabe namens 'Pull-Requests überprüfen'"
```

### 4. KI-Verständnis

Die KI:
1. Liest die verfügbaren Werkzeuge und deren Beschreibungen
2. Versteht den aktuellen Kontext
3. Bestimmt, welches Werkzeug mit welchen Parametern verwendet werden soll

### 5. Werkzeugausführung

Wenn die KI beschließt, ein Werkzeug zu verwenden:

1. VOIX löst ein `call`-Ereignis auf dem Werkzeugelement aus
2. Ihr JavaScript-Handler empfängt die Parameter
3. Ihr Code führt die Aktion aus

```javascript
document.querySelector('[name=create_task]').addEventListener('call', (e) => {
  const { title } = e.detail;
  // Erstellen Sie die Aufgabe in Ihrer Anwendung
  createTask(title);
});
```

## Vorteile der Architektur

### Für Entwickler

VOIX verwendet HTML-Elemente, um KI-Fähigkeiten zu definieren. Sie fügen `<tool>`- und `<context>`-Tags zu Ihren Seiten hinzu und hängen Ereignis-Listener an, um Werkzeugaufrufe zu behandeln. Es ist keine API-Integration oder SDK erforderlich. Der Ansatz funktioniert mit jedem JavaScript-Framework oder reinem JavaScript, und Sie können diese Elemente zu bestehenden Seiten hinzufügen, ohne anderen Code zu ändern.

Sie kontrollieren, auf welche Daten die KI zugreifen kann, indem Sie auswählen, was Sie in Ihre Werkzeug- und Kontextelemente aufnehmen. Ihre Website empfängt nur die Anfragen zur Werkzeugausführung mit ihren Parametern. Das Gespräch zwischen dem Benutzer und der KI bleibt privat - Sie sehen nie, was der Benutzer getippt oder wie er seine Anfrage formuliert hat.

### Für Benutzer

Sie interagieren mit Websites über natürliche Sprache. Die KI liest die verfügbaren Werkzeuge und den aktuellen Kontext, um zu verstehen, welche Aktionen sie ausführen kann. Sie können Anfragen wie "lösche das dritte Element" oder "zeige nur aktive Aufgaben" stellen, und die KI wird die entsprechenden Werkzeuge mit den richtigen Parametern ausführen.

Sie konfigurieren Ihren eigenen KI-Anbieter in den Erweiterungseinstellungen. Dies kann OpenAI, Anthropic, lokal ausgeführtes Ollama oder jeder OpenAI-kompatible Endpunkt sein. Ihre Konversationsdaten gehen direkt von der Erweiterung zu Ihrem gewählten Anbieter. Die Website empfängt niemals Ihre Nachrichten, nur die resultierenden Werkzeugaufrufe, die ausgeführt werden müssen.

## Die Rolle der einzelnen Teile

### Die Rolle Ihrer Website

1. **Werkzeuge deklarieren** - Definieren, welche Aktionen möglich sind
2. **Kontext bereitstellen** - Informationen zum aktuellen Zustand teilen
3. **Ereignisse behandeln** - Aktionen ausführen, wenn Werkzeuge aufgerufen werden
4. **Benutzeroberfläche aktualisieren** - Änderungen in Ihrer Oberfläche widerspiegeln

### Die Rolle der Erweiterung

1. **Erkennung** - Werkzeuge und Kontext auf der Seite finden
2. **Kommunikation** - Ihre Website mit der KI verbinden
3. **Ereignisverteilung** - Werkzeugaufrufe basierend auf KI-Entscheidungen auslösen
4. **Datenschutz** - Alle Daten lokal im Browser halten

### Die Rolle des Benutzers

1. **Natürliche Eingabe** - Beschreiben, was sie erreichen möchten
2. **Konversation** - Anfragen bei Bedarf klären oder verfeinern
3. **Überprüfung** - Aktionen bei Bedarf bestätigen

## Datenflussbeispiel

Verfolgen wir eine vollständige Interaktion, um zu sehen, wie die Daten durch das System fließen:

```
Benutzereingabe → KI-Verarbeitung → Werkzeugauswahl → Ereignisverteilung → Ihr Handler → UI-Aktualisierung
```

1. **Benutzer besucht Ihre Aufgabenverwaltungs-App**
   ```html
   <tool name="mark_complete" description="Eine Aufgabe als erledigt markieren">
     <prop name="taskId" type="string" required></prop>
   </tool>
   
   <context name="tasks">
     Aktive Aufgaben: 5
     Aufgaben-IDs: task-1, task-2, task-3, task-4, task-5
   </context>
   ```

2. **Benutzer öffnet VOIX und tippt**
   ```
   "Markiere Aufgabe-3 als erledigt"
   ```

3. **KI verarbeitet die Anfrage**
   - Sieht das `mark_complete`-Werkzeug
   - Liest den Kontext, der zeigt, dass Aufgabe-3 existiert
   - Entscheidet, das Werkzeug mit taskId: "task-3" aufzurufen

4. **Ihr Code behandelt das Ereignis**
   ```javascript
   tool.addEventListener('call', (e) => {
     const { taskId } = e.detail;
     markTaskComplete(taskId);
     updateTaskList();
   });
   ```

5. **Benutzer sieht das Ergebnis**
   - Aufgabe in der Benutzeroberfläche als erledigt markiert
   - Kontext wird automatisch aktualisiert
   - Bereit für die nächste Interaktion

Jeder Schritt findet im Browser statt. Die einzige externe Abhängigkeit ist der KI-Anbieter, der vom Benutzer konfiguriert und als vertrauenswürdig eingestuft wird. Die Website fungiert rein als Fähigkeitsanbieter und sieht niemals das Gespräch zwischen dem Benutzer und seinem KI-Assistenten.

## Nächste Schritte

- Erfahren Sie mehr über [Werkzeuge](./tools.md), um interaktive Fähigkeiten zu erstellen
- Verstehen Sie [Kontext](./contexts.md) zum Teilen des Anwendungszustands

<!--@include: @/de/voix_context.md -->