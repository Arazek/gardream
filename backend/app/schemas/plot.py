from datetime import datetime

from pydantic import BaseModel, Field

from app.models.plot import PlotType


class PlotBase(BaseModel):
    name: str = Field(..., max_length=100)
    plot_type: PlotType
    rows: int = Field(..., ge=1, le=50)
    cols: int = Field(..., ge=1, le=50)
    substrate: str | None = Field(None, max_length=100)
    watering_days: list[int] = Field(default_factory=list)
    fertilise_days: list[int] = []
    photo_url: str | None = None


class PlotCreate(PlotBase):
    pass


class PlotUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    substrate: str | None = Field(None, max_length=100)
    watering_days: list[int] | None = None
    fertilise_days: list[int] | None = None
    photo_url: str | None = None


class PlotResponse(PlotBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    crop_count: int = 0

    model_config = {"from_attributes": True}
