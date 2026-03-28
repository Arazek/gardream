from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.crop import CropCategory, SunRequirement


class CropResponse(BaseModel):
    id: str
    name: str
    latin_name: str
    category: CropCategory
    description: str | None
    thumbnail_url: str | None
    days_to_germination: int
    days_to_harvest: int
    watering_frequency_days: int
    fertilise_frequency_days: int
    prune_frequency_days: int | None
    prune_start_day: int | None
    sun_requirement: SunRequirement
    spacing_cm: int
    soil_mix: dict[str, Any] | None
    companion_crops: list[str]
    avoid_crops: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
