# React-Integrationshandbuch
Dieses Handbuch beschreibt Muster und bewährte Methoden zur Integration von VOIX in React-Anwendungen, einschließlich komponentenbasierter Werkzeuge, Kontextverwaltung und React-spezifischer Optimierungen.

## Konfiguration

### TypeScript-Konfiguration

Wenn du TypeScript verwendest, deklariere die benutzerdefinierten Elemente in deinen Typdefinitionen:

```typescript
// z. B. in vite-env.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'context': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      // Füge hier benutzerdefinierte Eigenschaften hinzu
      name?: string;
    }, HTMLElement>;
    
    // Du kannst hier bei Bedarf weitere benutzerdefinierte Elemente hinzufügen
    'tool': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name: string;
      description?: string;
      return?: boolean;
    }, HTMLElement>;

    'prop': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name: string;
      type: string;
      required?: boolean;
      description?: string;
    }, HTMLElement>;

    'array': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {}, HTMLElement>;
    'dict': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {}, HTMLElement>;
  }
}
```

### Globale Styles

Füge diese Styles hinzu, um VOIX-Elemente im UI auszublenden:

```css
/* index.css oder globale Styles */
tool, prop, context, array, dict {
  display: none;
}
```

### Tool-Komponente

Du kannst eine wiederverwendbare `Tool`-Komponente erstellen, um Tool-Definitionen zu kapseln, sodass du die `onCall`-Prop einfacher nutzen kannst:

```tsx
// src/components/Tool.tsx
import React, { useRef, useEffect } from 'react';

// Typ für den Event-Handler
type ToolCallEventHandler = (event: CustomEvent) => void;

// Props der Komponente
type ToolProps = {
  name: string;
  description: string;
  onCall: ToolCallEventHandler;
  return?: boolean;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'onCall'>;

export function Tool({
  name,
  description,
  onCall,
  children,
  return: returnProp, // Umbenennung zur Vermeidung von Konflikten mit dem JS-Schlüsselwort
  ...rest
}: ToolProps) {
  const toolRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = toolRef.current;
    if (!element || !onCall) return;

    const listener = (event: CustomEvent) => onCall(event);

    element.addEventListener('call', listener);

    return () => {
      element.removeEventListener('call', listener);
    };
  }, [onCall]); // Listener neu anhängen, falls sich onCall ändert

  return (
    <tool
      ref={toolRef}
      name={name}
      description={description}
      return={returnProp}
      {...rest}
    >
      {children}
    </tool>
  );
}
```

Du kannst diese Komponente dann in deiner Anwendung wie folgt verwenden:

```tsx
import { useState } from 'react'
import './App.css'
import { Tool } from './Tool'

function App() {
  const [count, setCount] = useState(0)

  function handleIncrement(event: Event) {
    const details = (event as CustomEvent).detail;
    console.log('Zähler erhöhen um:', details);
    setCount((prevCount) => prevCount + details.n);
  }

  return (
    <>
      <context name="counter">
        Der aktuelle Zählerstand ist {count}
      </context>
      <Tool name="increment_counter" description="Erhöht den Zähler um n" onCall={(event) => handleIncrement(event)}>
        <prop name="n" type="number" required description="Die Zahl, um die der Zähler erhöht werden soll" ></prop>
      </Tool>
      <button onClick={() => setCount((count) => count + 1)}>
        Zähler ist {count}
      </button>
    </>
  )
}

export default App
```

React wird dich wahrscheinlich vor den nicht erkannten `<tool>`, `<prop>`, `<array>`, `<dict>` und `<context>`-Tags warnen. Du kannst diese Warnungen sicher ignorieren:

```
Das Tag <tool> wird in diesem Browser nicht erkannt. Wenn du eine React-Komponente rendern wolltest, beginne ihren Namen mit einem Großbuchstaben.
```

<!--@include: @/de/voix_context.md -->