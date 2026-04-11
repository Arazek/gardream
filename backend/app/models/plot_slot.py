import uuid
from datetime import date, datetime

from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PlotSlot(Base):
    __tablename__ = "plot_slots"
    __table_args__ = (
        UniqueConstraint("plot_id", "row", "col", name="uq_plot_slot_position"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    plot_id: Mapped[str] = mapped_column(
        String, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    crop_id: Mapped[str] = mapped_column(
        String, ForeignKey("crops.id", ondelete="RESTRICT"), nullable=False
    )
    row: Mapped[int] = mapped_column(Integer, nullable=False)
    col: Mapped[int] = mapped_column(Integer, nullable=False)
    sow_date: Mapped[date] = mapped_column(Date, nullable=False)
    watering_days_override: Mapped[list[int] | None] = mapped_column(
        ARRAY(Integer), nullable=True, default=None
    )
    watering_interval_weeks: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    fertilise_days_override: Mapped[list[int] | None] = mapped_column(
        ARRAY(Integer), nullable=True, default=None
    )
    fertilise_interval_weeks: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    plot: Mapped["Plot"] = relationship("Plot", back_populates="slots")  # noqa: F821
    crop: Mapped["Crop"] = relationship("Crop", back_populates="plot_slots")  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        "Task", back_populates="plot_slot", cascade="all, delete-orphan"
    )
    specimen: Mapped["Specimen"] = relationship(  # noqa: F821
        "Specimen", back_populates="plot_slot", uselist=False, cascade="all, delete-orphan"
    )
