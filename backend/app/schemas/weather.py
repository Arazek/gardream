from pydantic import BaseModel


class CurrentWeather(BaseModel):
    temperature: float
    weather_code: int
    condition: str
    icon: str
    humidity: int
    wind_speed: float


class DayForecast(BaseModel):
    date: str                       # YYYY-MM-DD
    weather_code: int
    condition: str
    icon: str
    temp_max: float
    temp_min: float
    precipitation_mm: float
    precipitation_probability: int
    rain_expected: bool             # precipitation_mm > 5


class WeatherResponse(BaseModel):
    current: CurrentWeather
    forecast: list[DayForecast]     # 7 days
    latitude: float
    longitude: float
