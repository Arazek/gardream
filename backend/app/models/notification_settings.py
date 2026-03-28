import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, nullable=False, unique=True, index=True
    )
    morning_reminder: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    evening_reminder: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    in_app_alerts: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    push_token: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
