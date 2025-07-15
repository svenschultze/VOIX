# Svelte Integration Guide

This guide covers patterns and best practices for integrating VOIX with Svelte applications.

## Configuration

### Global Styles

Add these styles to hide VOIX elements from the UI:

```css
/* app.css or global styles */
tool, prop, context, array, dict {
  display: none;
}
```

## Tools and Context

Declare tools and context in your Svelte components using the `<tool>` and `<context>` elements. Use the `oncall` handle to execute tools.

```svelte
<script lang="ts">
  let count: number = $state(0)
  const increment = (n: number) => {
    if (n !== undefined)
      count += n
    else
      count += 1
  }
</script>

<button onclick={() => increment(1)}>
  count is {count}
</button>

<tool name="increment_counter" description="Increments the counter by n" oncall={(event: CustomEvent) => increment(event.detail.n)}>
  <prop name="n" type="number" required></prop>
</tool>

<context name="counter">
  The current count is {count}.
</context>
```

## Conditional Tools and Context
You can conditionally render tools and context based on application state. Use Svelte's reactivity to manage visibility, for example to show admin tools only to authorized users:

```svelte
<script lang="ts">
  let isAdmin = false;

  const secretAdminAction = () => {
    console.log('Admin action performed');
  };
</script>

{#if isAdmin}
  <tool name="secret_admin_action" description="Perform admin action" oncall={secretAdminAction}>
    <prop name="secret_prop" type="string" required></prop>
  </tool>

  <context name="admin_info">
    Admin tools are available.
  </context>
{/if}

<div>
  <button onclick={() => isAdmin = !isAdmin}>
    Toggle Admin Mode: {isAdmin ? 'On' : 'Off'}
  </button>
</div>
```

## Tools that fetch data
You can also create tools that fetch data from APIs or perform asynchronous operations.

```svelte
<script lang="ts">
  const getWeather = async (location: string) => {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}`);
      const geoData = await geoRes.json();

      if (!geoData.results?.length) {
        throw new Error('Location not found');
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
      const wxData = await wxRes.json();

      return { ...wxData, city: name, country };
    } catch (e: any) {
      return { error: e.message };
    }
  };
</script>

<tool
  name="get_weather"
  description="Fetch weather by city name. For example: 'Berlin' or 'New York'."
  return
  oncall={async (event: CustomEvent) => {
    const { location } = event.detail;
    const data = await getWeather(location);
    event.target?.dispatchEvent(new CustomEvent('return', { detail: data }));
  }}
>
  <prop name="location" type="string" description="City name to fetch weather for"></prop>
</tool>
```


<!--@include: @/voix_context.md -->