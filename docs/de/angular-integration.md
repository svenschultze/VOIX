# Angular-Integrationsleitfaden

Dieser Leitfaden beschreibt, wie **VOIX** in Angular-Anwendungen integriert wird, unter Verwendung deklarativer `<tool>`- und `<context>`-Elemente.

## Konfiguration

### Globale Styles

Um VOIX-bezogene Elemente im UI auszublenden, füge Folgendes zu deinen globalen Styles hinzu (typischerweise `app.css` oder `styles.css`):

```css
/* styles.css oder app.css */
tool, prop, context, array, dict {
  display: none;
}
```

## Tools und Kontexte

Definiere Tools und Kontexte in den Templates deiner Angular-Komponenten mit den Tags `<tool>` und `<context>`. Reagiere auf Tool-Aufrufe mit einem Event-Binding.

### Beispiel

```html
<!-- app.html -->
<context name="secret_number">
  die geheime Zahl ist {{ secretNumber() }}
</context>

<tool name="change_number" description="Ändere die geheime Zahl" (call)="changeNumber($event)">
  <prop name="number" type="number" />
</tool>

<div>
  <p>Die geheime Zahl ist: {{ secretNumber() }}</p>
  <p>Benutze das Tool, um sie zu ändern!</p>
</div>
```

```ts
// app.ts
import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  schemas: [NO_ERRORS_SCHEMA],
})
export class App {
  protected readonly secretNumber = signal(42);

  protected changeNumber = (event: Event) => {
    const number = (event as CustomEvent<{ number: number }>).detail.number;
    console.log('changeNumber wurde aufgerufen mit Wert:', number);
    this.secretNumber.set(number);
  }
}
```

## Bedingte Tools und Kontexte

Verwende Angulars strukturelle Direktiven (z. B. `*ngIf`), um Tools oder Kontexte bedingt darzustellen.

```html
<div *ngIf="isAdmin">
  <tool name="admin_action" description="Führe eine Admin-Aktion aus" (call)="performAdminAction($event)">
    <prop name="actionName" type="string" />
  </tool>

  <context name="admin_info">
    Admin-Panel ist sichtbar.
  </context>
</div>

<button (click)="isAdmin = !isAdmin">
  Admin-Modus umschalten: {{ isAdmin ? 'Ein' : 'Aus' }}
</button>
```

```ts
isAdmin = false;

performAdminAction(event: Event) {
  const actionName = (event as CustomEvent<{ actionName: string }>).detail.actionName;
  console.log('Admin-Aktion:', actionName);
}
```

## Tools, die Daten abrufen

Verwende `async`-Funktionen im `(call)`-Handler für Tools, die Daten abrufen oder berechnen:

```html
<tool name="get_weather" description="Hole Wetterdaten für eine Stadt" (call)="getWeather($event)">
  <prop name="location" type="string" description="Stadtname" />
</tool>
```

```ts
async getWeather(event: Event) {
  try {
    const location = (event as CustomEvent<{ location: string }>).detail.location;
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}`);
    const geoData = await geoRes.json();

    if (!geoData.results?.length) {
      return console.error('Location not found');
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
    const wxData = await wxRes.json();

    const weather = { ...wxData, city: name, country };

    event.target?.dispatchEvent(new CustomEvent('return', { detail: weather }));
  } catch (error) {
    console.error('Error fetching weather:', error);
    event.target?.dispatchEvent(new CustomEvent('return', { detail: { error: error.message } }));
  }
}
```

<!--@include: @/de/voix_context.md -->