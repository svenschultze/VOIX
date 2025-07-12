---
layout: doc
---

<script setup>
import TodoDemo from './components/TodoDemo.vue'
</script>

# To-Do-Listen-Demo

Diese Demo zeigt, wie man mit VOIX ein einfaches Aufgabenverwaltungssystem erstellt. Benutzer können Aufgaben mit natürlicher Sprache hinzufügen, erledigen und löschen.

## Wie es funktioniert

Die To-Do-Liste bietet Werkzeuge für gängige Aufgabenoperationen und hält den Kontext über die aktuellen Aufgaben aufrecht.

## Code

```html
<!-- Werkzeuge für die Aufgabenverwaltung -->
<tool name="add_task" description="Eine neue Aufgabe zur Liste hinzufügen">
  <prop name="title" type="string" required/>
  <prop name="priority" type="string" description="hoch, mittel oder niedrig"/>
</tool>

<tool name="complete_task" description="Eine Aufgabe als erledigt markieren">
  <prop name="taskId" type="string" description="ID der zu erledigenden Aufgabe" required/>
</tool>

<tool name="delete_task" description="Eine Aufgabe aus der Liste löschen">
  <prop name="taskId" type="string" description="ID der zu löschenden Aufgabe" required/>
</tool>

<tool name="clear_completed" description="Alle erledigten Aufgaben entfernen">
</tool>

<!-- Kontext, der den aktuellen Zustand anzeigt -->
<context name="tasks" id="task-context">
  Gesamtaufgaben: 0
  Aktiv: 0
  Erledigt: 0
</context>

<!-- Aufgabenlisten-UI -->
<div id="task-list">
  <h3>Meine Aufgaben</h3>
  <ul id="tasks"></ul>
</div>

<script>
// Aufgabenspeicher
let tasks = [];
let nextId = 1;

// Werkzeug-Handler
const handlers = {
  add_task: ({ title, priority = 'medium' }) => {
    const task = {
      id: `task-${nextId++}`,
      title,
      priority,
      completed: false
    };
    tasks.push(task);
    updateUI();
  },
  
  complete_task: ({ taskId }) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = true;
      updateUI();
    }
  },
  
  delete_task: ({ taskId }) => {
    tasks = tasks.filter(t => t.id !== taskId);
    updateUI();
  },
  
  clear_completed: () => {
    tasks = tasks.filter(t => !t.completed);
    updateUI();
  }
};

// Event-Listener anhängen
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// UI und Kontext aktualisieren
function updateUI() {
  const taskList = document.getElementById('tasks');
  taskList.innerHTML = tasks.map(task => `
    <li class="${task.completed ? 'completed' : ''}" data-priority="${task.priority}">
      <span>${task.title}</span>
      <small>[${task.id}]</small>
    </li>
  `).join('');
  
  // Kontext aktualisieren
  const active = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  
  document.getElementById('task-context').textContent = `
Gesamtaufgaben: ${tasks.length}
Aktiv: ${active.length}
Erledigt: ${completed.length}

Aufgaben-IDs: ${tasks.map(t => t.id).join(', ')}
  `;
}

// Erstmalige Aktualisierung
updateUI();
</script>

<style>
#task-list {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

#tasks {
  list-style: none;
  padding: 0;
}

#tasks li {
  padding: 0.5rem;
  margin: 0.5rem 0;
  background: #f5f5f5;
  border-radius: 4px;
}

#tasks li.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

#tasks li[data-priority="high"] {
  border-left: 4px solid #ff4444;
}

#tasks li[data-priority="medium"] {
  border-left: 4px solid #ff8800;
}

#tasks li[data-priority="low"] {
  border-left: 4px solid #00aa00;
}

#tasks small {
  color: #666;
  margin-left: 0.5rem;
}
</style>
```

## Probieren Sie es aus

<TodoDemo />

## Beispielinteraktionen

Versuchen Sie dies mit VOIX:

- "Füge eine Aufgabe namens 'Dokumentation überprüfen' mit hoher Priorität hinzu"
- "Erledige Aufgabe-1"
- "Lösche die zweite Aufgabe"
- "Füge 'Tests schreiben' als Aufgabe mit niedriger Priorität hinzu"
- "Alle erledigten Aufgaben löschen"

Die KI liest den Kontext, um zu verstehen, welche Aufgaben vorhanden sind, und führt die entsprechenden Werkzeuge aus.