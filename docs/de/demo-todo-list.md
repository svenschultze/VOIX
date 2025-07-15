---
layout: doc
---

<script setup>
import TodoDemo from '../components/TodoDemo.vue'
</script>

# To-Do-Listen-Demo

Diese Demo zeigt, wie man mit VOIX ein einfaches Aufgabenverwaltungssystem erstellt. Benutzer können Aufgaben mit natürlicher Sprache hinzufügen, erledigen und löschen.

## Wie es funktioniert

Die To-Do-Liste bietet Werkzeuge für gängige Aufgabenoperationen und hält den Kontext über die aktuellen Aufgaben aufrecht.

## Code

<<< @/components/TodoDemo.html

## Probieren Sie es aus
- "Füge eine Aufgabe namens 'Dokumentation überprüfen' mit hoher Priorität hinzu"
- "Erledige Aufgabe-1"
- "Lösche die zweite Aufgabe"
- "Füge 'Tests schreiben' als Aufgabe mit niedriger Priorität hinzu"
- "Alle erledigten Aufgaben löschen"

### TODO Liste:
<TodoDemo />
