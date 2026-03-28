from fastapi import APIRouter, HTTPException, Query

from app.schemas.weather import WeatherResponse
from app.services.weather import weather_service

router = APIRouter()

DEFAULT_LAT = 48.8566   # Paris fallback
DEFAULT_LON = 2.3522


@router.get("", response_model=WeatherResponse)
async def get_weather(
    lat: float = Query(DEFAULT_LAT, description="Latitude"),
    lon: float = Query(DEFAULT_LON, description="Longitude"),
) -> WeatherResponse:
    """Fetch 7-day weather forecast from Open-Meteo (cached 1hr)."""
    try:
        return await weather_service.get_forecast(lat, lon)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {exc}") from exc
