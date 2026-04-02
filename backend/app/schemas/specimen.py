from datetime import date, datetime

from pydantic import BaseModel, Field


class PhotoEntry(BaseModel):
    url: str
    filename: str
    taken_at: date
    note: str | None = None


class Milestone(BaseModel):
    stage_name: str
    expected_day: int
    actual_day: int | None = None
    notes: str | None = None


class SpecimenUpdate(BaseModel):
    notes: str | None = None
    stage_override: str | None = None
    photo_log: list[PhotoEntry] | None = None
    milestones: list[Milestone] | None = None


class SpecimenResponse(BaseModel):
    id: str
    plot_slot_id: str
    notes: str | None
    stage_override: str | None
    photo_log: list[PhotoEntry]
    milestones: list[Milestone]
    current_stage: str
    progress_pct: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
