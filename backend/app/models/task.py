import uuid
from datetime import date, datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Text, Boolean, Date, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TaskType(str, PyEnum):
    water = "water"
    fertilise = "fertilise"
    prune = "prune"
    harvest = "harvest"
    check = "check"
    custom = "custom"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    plot_slot_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("plot_slots.id", ondelete="CASCADE"), nullable=True, index=True
    )
    type: Mapped[TaskType] = mapped_column(
        Enum(TaskType, name="task_type"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    plot_slot: Mapped["PlotSlot | None"] = relationship(  # noqa: F821
        "PlotSlot", back_populates="tasks"
    )
