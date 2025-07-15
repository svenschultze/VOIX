---
outline: deep
---

# Weather Demo (Vue.js)

This demo showcases a weather tool that uses the Open-Meteo API to fetch and display weather information. You can interact with the tool using natural language to get weather forecasts for different locations.

<br/>
<br/>

<WeatherDemo />

<style>
.vp-doc table {
    display: table;
    width: 100%;
}
</style>

<script setup>
import WeatherDemo from "./components/WeatherDemo.vue";
</script>

## Code

<<< @/components/WeatherDemo.vue
