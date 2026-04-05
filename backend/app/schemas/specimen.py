from datetime import date, datetime

from pydantic import BaseModel, Field


class PhotoEntry(BaseModel):
    url: str
    filename: str
    taken_at: date
    note: str | None = None


class NoteEntry(BaseModel):
    text: str
    date: date


class Milestone(BaseModel):
    stage_name: str
    expected_day: int
    actual_day: int | None = None
    notes: str | None = None


class SpecimenUpdate(BaseModel):
    note_entries: list[NoteEntry] | None = None
    stage_override: str | None = None
    photo_log: list[PhotoEntry] | None = None
    milestones: list[Milestone] | None = None


class SpecimenResponse(BaseModel):
    id: str
    plot_slot_id: str
    note_entries: list[NoteEntry]
    stage_override: str | None
    photo_log: list[PhotoEntry]
    milestones: list[Milestone]
    current_stage: str
    progress_pct: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
