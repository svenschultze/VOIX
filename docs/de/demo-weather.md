---
outline: deep
---

# Wetter-Demo (Vue.js)

Diese Demo zeigt ein Wetter-Tool, das die Open-Meteo-API verwendet, um Wetterinformationen abzurufen und anzuzeigen. Sie können mit dem Tool in natürlicher Sprache interagieren, um Wettervorhersagen für verschiedene Orte zu erhalten.

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
import WeatherDemo from "../components/WeatherDemo.vue";
</script>

## Code

<<< @/components/WeatherDemo.vue

<!--@include: @/voix_context.md -->