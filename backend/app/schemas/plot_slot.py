from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.crop import CropResponse


class PlotSlotCreate(BaseModel):
    crop_id: str
    row: int | None = None
    col: int | None = None
    x_pct: float | None = None
    y_pct: float | None = None
    w_pct: float | None = None
    h_pct: float | None = None
    sow_date: date
    watering_days_override: list[int] | None = None
    watering_interval_weeks: int = 1
    fertilise_days_override: list[int] | None = None
    fertilise_interval_weeks: int = 1


class PlotSlotUpdate(BaseModel):
    crop_id: str | None = None
    sow_date: date | None = None
    watering_days_override: list[int] | None = None
    watering_interval_weeks: int | None = None
    fertilise_days_override: list[int] | None = None
    fertilise_interval_weeks: int | None = None
    germination_date: date | None = None


class PlotSlotResponse(BaseModel):
    id: str
    plot_id: str
    crop_id: str
    row: int | None = None
    col: int | None = None
    x_pct: float | None = None
    y_pct: float | None = None
    w_pct: float | None = None
    h_pct: float | None = None
    sow_date: date
    watering_days_override: list[int] | None = None
    watering_interval_weeks: int = 1
    fertilise_days_override: list[int] | None = None
    fertilise_interval_weeks: int = 1
    germination_date: date | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlotSlotDetailResponse(PlotSlotResponse):
    crop: CropResponse


class TransplantRequest(BaseModel):
    target_plot_id: str
    target_row: int
    target_col: int
