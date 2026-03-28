from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.task import TaskType


class TaskBase(BaseModel):
    type: TaskType
    title: str | None = Field(None, max_length=200)
    note: str | None = None
    due_date: date
    plot_slot_id: str | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    note: str | None = None
    due_date: date | None = None
    completed: bool | None = None


class TaskResponse(TaskBase):
    id: str
    user_id: str
    completed: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
