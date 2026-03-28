from datetime import datetime

from pydantic import BaseModel, Field


class NotificationSettingsUpdate(BaseModel):
    morning_reminder: bool | None = None
    evening_reminder: bool | None = None
    in_app_alerts: bool | None = None
    push_token: str | None = Field(None, max_length=500)


class NotificationSettingsResponse(BaseModel):
    id: str
    user_id: str
    morning_reminder: bool
    evening_reminder: bool
    in_app_alerts: bool
    push_token: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
