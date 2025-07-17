# React Integration Guide

This guide covers patterns and best practices for integrating VOIX with React applications, including component-level tools, context management, and React-specific optimizations.

## Configuration

### TypeScript Configuration

If using TypeScript, declare the custom elements in your type definitions:

```typescript
// e.g. vite-env.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'context': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      // Add any custom props here
      name?: string;
    }, HTMLElement>;
    // You can add more custom elements here if needed
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

### Global Styles

Add these styles to hide VOIX elements from the UI:

```css
/* index.css or global styles */
tool, prop, context, array, dict {
  display: none;
}
```

### Tool component
You can create a reusable Tool component to encapsulate tool definitions so you can use the onCall prop to handle tool calls easier:

```tsx
// src/components/Tool.tsx
import React, { useRef, useEffect } from 'react';

// Define the type for the event handler prop
type ToolCallEventHandler = (event: CustomEvent) => void;

// Define the component's props
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
  // Rename the 'return' prop to avoid conflict with the JS keyword
  return: returnProp, 
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
  }, [onCall]); // Re-attach the listener if the onCall function changes

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

Then, you can use this component in your application like this:

```tsx
import { useState } from 'react'
import './App.css'
import { Tool } from './Tool'

function App() {
  const [count, setCount] = useState(0)

  function handleIncrement(event: Event) {
    const details = (event as CustomEvent).detail;
    console.log('Incrementing counter:', details);
    setCount((prevCount) => prevCount + details.n);
  }

  return (
    <>
      <context name="counter">
        The current count is {count}
      </context>
      <Tool name="increment_counter" description="Increments the counter by n" onCall={(event) => handleIncrement(event)}>
        <prop name="n" type="number" required description="The number to increment the counter by" ></prop>
      </Tool>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </>
  )
}

export default App
```

React will likely warn you about the `tool`, `prop`, `array`, `dict` and `context` elements not being recognized. You can safely ignore these warnings:
```
The tag <tool> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.
```

<!--@include: @/voix_context.md -->