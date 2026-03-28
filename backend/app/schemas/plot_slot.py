from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.crop import CropResponse


class PlotSlotCreate(BaseModel):
    crop_id: str
    row: int
    col: int
    sow_date: date


class PlotSlotUpdate(BaseModel):
    crop_id: str | None = None
    sow_date: date | None = None


class PlotSlotResponse(BaseModel):
    id: str
    plot_id: str
    crop_id: str
    row: int
    col: int
    sow_date: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlotSlotDetailResponse(PlotSlotResponse):
    crop: CropResponse
