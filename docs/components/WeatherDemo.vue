<template>
  <div class="weather-demo">
    <tool name="get_weather" description="Get the current weather for a location" @call="getWeather" return>
      <prop name="location" type="string" description="The location to get the weather for." required />
    </tool>
    <context name="weather_data">
      {{ weatherDataContext }}
    </context>
    <div v-if ="!weather && !loading && !error" class="no-weather">
      <em>
        Ask the AI to get the weather for a specific location (e.g., "What's the weather in New York?").
      </em>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="weather" class="weather-display">
      <h2>Weather in {{ weather.city }}, {{ weather.country }}</h2>
      <div class="current-weather">
        <div class="weather-icon">
          <span class="weather-icon">{{ getWeatherIcon(weather.current.weather_code) }}</span>
        </div>
        <div class="weather-details">
          <p class="temperature">{{ weather.current.temperature_2m }}°C</p>
          <p class="condition">{{ getWeatherDescription(weather.current.weather_code) }}</p>
        </div>
      </div>
      <h3>7-Day Forecast</h3>
      <div class="forecast">
        <div v-for="(day, index) in weather.daily.time" :key="day" class="forecast-day">
          <p class="date">{{ new Date(day).toLocaleDateString('en-US', { weekday: 'short' }) }}</p>
          <span class="forecast-icon">{{ getWeatherIcon(weather.daily.weather_code[index]) }}</span>
          <p class="temp-range">
            {{ weather.daily.temperature_2m_max[index] }}° / {{ weather.daily.temperature_2m_min[index] }}°
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const weather = ref(null);
const loading = ref(false);
const error = ref(null);

const weatherDataContext = computed(() => {
  if (!weather.value) {
    return "No weather data available. Use the get_weather tool to fetch weather information for a location.";
  }
  return `Current weather in ${weather.value.city}, ${weather.value.country}: ${weather.value.current.temperature_2m}°C and ${getWeatherDescription(weather.value.current.weather_code)}.`;
});

async function getWeather(event) {
  const { location } = event.detail;
  loading.value = true;
  error.value = null;

  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}`);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("Location not found.");
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
    const weatherData = await weatherResponse.json();
    
    weather.value = { ...weatherData, city: name, country };

    event.target.dispatchEvent(new CustomEvent('return', { detail: weatherData }));
  } catch (e) {
    error.value = e.message;
    event.target.dispatchEvent(new CustomEvent('return', { detail: { error: e.message } }));
  } finally {
    loading.value = false;
  }
}

function getWeatherIcon(code) {
  const icons = {
    0: '☀️', // Clear sky
    1: '🌤️',      // Mainly clear
    2: '☁️',          // Partly cloudy
    3: '☁️',         // Overcast
    45: '🌫️',      // Fog
    48: '🌫️',      // Depositing rime fog
    51: '🌦️',  // Drizzle, light
    53: '🌦️',  // Drizzle, moderate
    55: '🌦️',  // Drizzle, dense
    61: '🌧️',     // Rain, slight
    63: '🌧️',     // Rain, moderate
    65: '🌧️',// Rain, heavy
    80: '🌧️',     // Showers, slight
    81: '🌧️',     // Showers, moderate
    82: '🌧️',// Showers, violent
    95: '⛈️', // Thunderstorm
  };
  return icons[code] || '❓';
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        80: 'Slight showers',
        81: 'Moderate showers',
        82: 'Violent showers',
        95: 'Thunderstorm',
    };
    return descriptions[code] || 'Unknown';
}
</script>

<style scoped>
.weather-demo {
  font-family: sans-serif;
  max-width: 600px;
  margin: auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
}
.error {
  color: #d9534f;
}
.weather-display {
  text-align: center;
}
.current-weather {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.weather-icon span {
  font-size: 4em;
  margin-right: 20px;
}
.temperature {
  font-size: 2.5em;
  font-weight: bold;
  margin: 0;
}
.condition {
  font-size: 1.2em;
  color: #666;
  margin: 0;
}
.forecast {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.forecast-day {
  text-align: center;
}
.forecast-day .forecast-icon {
  font-size: 2em;
  margin: 10px 0;
}

h2 {
  margin-top: 0;
  border: none;
}
</style>