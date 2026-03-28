from fastapi import APIRouter

from app.api.v1.endpoints import health, example, ws, crops, plots, tasks, notification_settings, weather

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(crops.router, prefix="/crops", tags=["crops"])
api_router.include_router(plots.router, prefix="/plots", tags=["plots"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(notification_settings.router, prefix="/notifications/settings", tags=["notifications"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(example.router, prefix="/example", tags=["example"])
api_router.include_router(ws.router, prefix="/ws", tags=["websocket"])
