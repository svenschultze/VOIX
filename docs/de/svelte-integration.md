# Svelte-Integrationsleitfaden

Dieser Leitfaden behandelt Muster und bewährte Praktiken zur Integration von VOIX in Svelte-Anwendungen.

## Konfiguration

### Globale Styles

Füge diese Styles hinzu, um VOIX-Elemente aus der Benutzeroberfläche auszublenden:

```css
/* app.css oder globale Styles */
tool, prop, context, array, dict {
  display: none;
}
```

## Tools und Kontext

Deklariere Tools und Kontexte in deinen Svelte-Komponenten mit den Elementen `<tool>` und `<context>`. Verwende den `oncall`-Handler, um Tools auszuführen.

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
  Zähler ist {count}
</button>

<tool name="increment_counter" description="Erhöht den Zähler um n" oncall={(event: CustomEvent) => increment(event.detail.n)}>
  <prop name="n" type="number" required></prop>
</tool>

<context name="counter">
  Der aktuelle Zählerstand ist {count}.
</context>
```

## Bedingte Tools und Kontexte

Du kannst Tools und Kontexte bedingt basierend auf dem Anwendungszustand rendern. Nutze die Reaktivität von Svelte, um Sichtbarkeit zu steuern, z. B. um Admin-Tools nur autorisierten Nutzern anzuzeigen:

```svelte
<script lang="ts">
  let isAdmin = false;

  const secretAdminAction = () => {
    console.log('Admin-Aktion ausgeführt');
  };
</script>

{#if isAdmin}
  <tool name="secret_admin_action" description="Führe eine Admin-Aktion aus" oncall={secretAdminAction}>
    <prop name="secret_prop" type="string" required></prop>
  </tool>

  <context name="admin_info">
    Admin-Tools sind verfügbar.
  </context>
{/if}

<div>
  <button onclick={() => isAdmin = !isAdmin}>
    Admin-Modus umschalten: {isAdmin ? 'An' : 'Aus'}
  </button>
</div>
```

## Tools zum Abrufen von Daten

Du kannst auch Tools erstellen, die Daten von APIs abrufen oder asynchrone Operationen durchführen.

```svelte
<script lang="ts">
  const getWeather = async (location: string) => {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}`);
      const geoData = await geoRes.json();

      if (!geoData.results?.length) {
        throw new Error('Ort nicht gefunden');
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
  description="Wetterdaten nach Städtenamen abrufen. Zum Beispiel: 'Berlin' oder 'New York'."
  return
  oncall={async (event: CustomEvent) => {
    const { location } = event.detail;
    const data = await getWeather(location);
    event.target?.dispatchEvent(new CustomEvent('return', { detail: data }));
  }}
>
  <prop name="location" type="string" description="Name der Stadt, für die das Wetter abgerufen werden soll"></prop>
</tool>
```

<!--@include: @/de/voix_context.md -->