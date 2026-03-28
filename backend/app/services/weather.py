from datetime import datetime, timedelta, timezone

import httpx

from app.schemas.weather import CurrentWeather, DayForecast, WeatherResponse

# WMO weather code → (condition label, Material Symbol icon)
WMO_CODES: dict[int, tuple[str, str]] = {
    0:  ("Clear sky",           "clear_day"),
    1:  ("Mainly clear",        "partly_cloudy_day"),
    2:  ("Partly cloudy",       "partly_cloudy_day"),
    3:  ("Overcast",            "cloud"),
    45: ("Fog",                 "foggy"),
    48: ("Icy fog",             "foggy"),
    51: ("Light drizzle",       "rainy_light"),
    53: ("Drizzle",             "rainy_light"),
    55: ("Heavy drizzle",       "rainy"),
    56: ("Freezing drizzle",    "rainy"),
    57: ("Heavy freezing drizzle", "rainy"),
    61: ("Slight rain",         "rainy"),
    63: ("Moderate rain",       "rainy"),
    65: ("Heavy rain",          "rainy_heavy"),
    66: ("Freezing rain",       "rainy"),
    67: ("Heavy freezing rain", "rainy_heavy"),
    71: ("Slight snow",         "weather_snowy"),
    73: ("Moderate snow",       "weather_snowy"),
    75: ("Heavy snow",          "weather_snowy"),
    77: ("Snow grains",         "weather_snowy"),
    80: ("Rain showers",        "rainy"),
    81: ("Heavy rain showers",  "rainy_heavy"),
    82: ("Violent rain showers","rainy_heavy"),
    85: ("Snow showers",        "weather_snowy"),
    86: ("Heavy snow showers",  "weather_snowy"),
    95: ("Thunderstorm",        "thunderstorm"),
    96: ("Thunderstorm w/ hail","thunderstorm"),
    99: ("Thunderstorm w/ heavy hail", "thunderstorm"),
}

_OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
_CACHE_TTL = timedelta(hours=1)


def _wmo(code: int) -> tuple[str, str]:
    return WMO_CODES.get(code, ("Unknown", "question_mark"))


class WeatherService:
    _cache: dict[str, tuple[datetime, WeatherResponse]] = {}

    async def get_forecast(self, lat: float, lon: float) -> WeatherResponse:
        key = f"{round(lat, 2)},{round(lon, 2)}"
        if key in self._cache:
            cached_at, data = self._cache[key]
            if datetime.now(timezone.utc) - cached_at < _CACHE_TTL:
                return data
        data = await self._fetch(lat, lon)
        self._cache[key] = (datetime.now(timezone.utc), data)
        return data

    async def _fetch(self, lat: float, lon: float) -> WeatherResponse:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
            "forecast_days": 7,
            "timezone": "auto",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(_OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            raw = resp.json()

        cur = raw["current"]
        cond, icon = _wmo(cur["weather_code"])
        current = CurrentWeather(
            temperature=round(cur["temperature_2m"], 1),
            weather_code=cur["weather_code"],
            condition=cond,
            icon=icon,
            humidity=int(cur["relative_humidity_2m"]),
            wind_speed=round(cur["wind_speed_10m"], 1),
        )

        daily = raw["daily"]
        forecast: list[DayForecast] = []
        for i, date in enumerate(daily["time"]):
            code = daily["weather_code"][i]
            fc_cond, fc_icon = _wmo(code)
            precip = float(daily["precipitation_sum"][i] or 0)
            forecast.append(DayForecast(
                date=date,
                weather_code=code,
                condition=fc_cond,
                icon=fc_icon,
                temp_max=round(float(daily["temperature_2m_max"][i]), 1),
                temp_min=round(float(daily["temperature_2m_min"][i]), 1),
                precipitation_mm=round(precip, 1),
                precipitation_probability=int(daily["precipitation_probability_max"][i] or 0),
                rain_expected=precip > 5.0,
            ))

        return WeatherResponse(
            current=current,
            forecast=forecast,
            latitude=lat,
            longitude=lon,
        )


weather_service = WeatherService()
