# 10 — Weather Integration

**Provider:** Open-Meteo (open-meteo.com)
**Why:** No API key, no account, 10,000 calls/day free forever, global coverage, 16-day forecast, precipitation data.

---

## Open-Meteo API

### Request
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max
  &forecast_days=7
  &timezone=auto
```

No API key header required.

### Response fields used

**Current:**
- `temperature_2m` — °C
- `weather_code` — WMO code (mapped to icon + label, see below)
- `relative_humidity_2m` — %

**Daily (7 days):**
- `weather_code` — WMO code
- `temperature_2m_max` / `temperature_2m_min`
- `precipitation_sum` — mm
- `precipitation_probability_max` — %

---

## WMO weather code mapping

```python
WMO_CODES = {
    0:  ("Clear sky",        "clear_day"),
    1:  ("Mainly clear",     "partly_cloudy_day"),
    2:  ("Partly cloudy",    "partly_cloudy_day"),
    3:  ("Overcast",         "cloud"),
    45: ("Foggy",            "foggy"),
    51: ("Light drizzle",    "rainy_light"),
    61: ("Slight rain",      "rainy"),
    63: ("Moderate rain",    "rainy"),
    65: ("Heavy rain",       "rainy_heavy"),
    71: ("Slight snow",      "weather_snowy"),
    80: ("Rain showers",     "rainy"),
    95: ("Thunderstorm",     "thunderstorm"),
    # ... (full table in WeatherService)
}
```

Icon names are Material Symbols.

---

## Backend: `WeatherService`

`backend/app/services/weather.py`

```python
class WeatherService:
    _cache: dict[str, tuple[datetime, WeatherResponse]] = {}
    CACHE_TTL = timedelta(hours=1)

    async def get_forecast(self, lat: float, lon: float) -> WeatherResponse:
        cache_key = f"{round(lat, 2)},{round(lon, 2)}"
        if cache_key in self._cache:
            cached_at, data = self._cache[cache_key]
            if datetime.utcnow() - cached_at < self.CACHE_TTL:
                return data
        data = await self._fetch(lat, lon)
        self._cache[cache_key] = (datetime.utcnow(), data)
        return data

    async def _fetch(self, lat: float, lon: float) -> WeatherResponse:
        # httpx async GET to Open-Meteo
        # Map response to WeatherResponse schema
        ...
```

Coordinates are rounded to 2 decimal places for cache key (~1km precision).

---

## Backend schema

```python
class CurrentWeather(BaseModel):
    temperature: float
    weather_code: int
    condition: str          # mapped from WMO
    icon: str               # Material Symbol name
    humidity: int

class DayForecast(BaseModel):
    date: str               # YYYY-MM-DD
    weather_code: int
    condition: str
    icon: str
    temp_max: float
    temp_min: float
    precipitation_mm: float
    precipitation_probability: int
    rain_expected: bool     # precipitation_mm > 5

class WeatherResponse(BaseModel):
    current: CurrentWeather
    forecast: list[DayForecast]  # 7 days
```

---

## Frontend: weather store

```
store/weather/
  weather.actions.ts   — loadWeather, loadWeatherSuccess, loadWeatherFailure
  weather.effects.ts   — calls GET /api/v1/weather?lat=&lon= on app init + Home load
  weather.reducer.ts
  weather.selectors.ts — selectCurrentWeather, selectForecast, selectRainDays
  weather.state.ts     — { current, forecast, status, lastUpdated }
```

### Geolocation
On `loadWeather` effect:
1. Try `navigator.geolocation.getCurrentPosition`
2. If denied → use stored lat/lon from user profile (future)
3. If no stored location → default to `48.8566, 2.3522` (Paris) with a toast: "Using default location. Update in Settings."

---

## Watering skip logic (client-side)

```typescript
// In WeatherService (Angular)
selectRainDays = createSelector(
  selectForecast,
  (forecast) => forecast
    .filter(day => day.rain_expected)
    .map(day => day.date)
);
```

Home dashboard effect checks if today's date is in `rainDays` → sets `showWateringSkipAlert: true`.

---

## Rate limit safety

10,000 calls/day free. With caching (1hr TTL) and ~1km resolution:
- 1 call per user per hour per unique ~1km location
- For 100 active users in different locations: ~2,400 calls/day → well within limits
- Future: Redis cache shared across instances (replaces in-memory dict)
