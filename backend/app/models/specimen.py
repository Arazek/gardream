import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Specimen(Base):
    __tablename__ = "specimens"
    __table_args__ = (
        UniqueConstraint("plot_slot_id", name="uq_specimen_plot_slot"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    plot_slot_id: Mapped[str] = mapped_column(
        String, ForeignKey("plot_slots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    stage_override: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # JSONB arrays for structured data
    # photo_log: [{url, filename, taken_at, note?}]
    photo_log: Mapped[list[dict]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )
    # milestones: [{stage_name, expected_day, actual_day?, notes?}]
    milestones: Mapped[list[dict]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    plot_slot: Mapped["PlotSlot"] = relationship(  # noqa: F821
        "PlotSlot", back_populates="specimen"
    )
