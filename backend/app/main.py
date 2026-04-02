from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.services.scheduler import create_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed exclusively by Alembic migrations (run ./run.sh db:migrate)
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Create uploads directory if it doesn't exist
uploads_dir = "/app/uploads"
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
