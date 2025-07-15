# Angular Integration Guide

This guide outlines how to integrate **VOIX** into Angular applications using declarative `<tool>` and `<context>` elements.

## Configuration

### Global Styles

To hide VOIX-related elements from the UI, add the following to your global styles (typically `app.css` or `styles.css`):

```css
/* styles.css or app.css */
tool, prop, context, array, dict {
  display: none;
}
```

## Tools and Context

Define tools and contexts in your Angular component templates using the `<tool>` and `<context>` tags. Handle tool calls with an event binding.

### Example

```html
<!-- app.html -->
<context name="secret_number">
  the secret number is {{ secretNumber() }}
</context>

<tool name="change_number" description="Change the secret number" (call)="changeNumber($event)">
  <prop name="number" type="number" />
</tool>

<div>
  <p>The secret number is: {{ secretNumber() }}</p>
  <p>Use the tool to change it!</p>
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
    console.log('changeNumber called with value:', number);
    this.secretNumber.set(number);
  }
}

```

## Conditional Tools and Context

Use Angular's structural directives (e.g., `*ngIf`) to conditionally render tools or contexts.

```html
<div *ngIf="isAdmin">
  <tool name="admin_action" description="Do an admin thing" (call)="performAdminAction($event)">
    <prop name="actionName" type="string" />
  </tool>

  <context name="admin_info">
    Admin panel is visible.
  </context>
</div>

<button (click)="isAdmin = !isAdmin">
  Toggle Admin Mode: {{ isAdmin ? 'On' : 'Off' }}
</button>
```

```ts
isAdmin = false;

performAdminAction(event: Event) {
  const actionName = (event as CustomEvent<{ actionName: string }>).detail.actionName;
  console.log('Admin action:', actionName);
}
```

## Tools That Fetch Data

Use `async` functions inside the `(call)` handler for tools that fetch or compute data:

```html
<tool name="get_weather" description="Fetch weather for a city" (call)="getWeather($event)">
  <prop name="location" type="string" description="City name" />
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

<!--@include: @/voix_context.md -->