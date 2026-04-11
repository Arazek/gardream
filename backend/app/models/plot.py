import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Integer, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PlotType(str, PyEnum):
    ground_bed = "ground_bed"
    raised_bed = "raised_bed"
    container = "container"
    vertical = "vertical"


class Plot(Base):
    __tablename__ = "plots"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    plot_type: Mapped[PlotType] = mapped_column(
        Enum(PlotType, name="plot_type"), nullable=False
    )
    rows: Mapped[int] = mapped_column(Integer, nullable=False)
    cols: Mapped[int] = mapped_column(Integer, nullable=False)
    substrate: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # 0=Mon … 6=Sun
    watering_days: Mapped[list[int]] = mapped_column(
        ARRAY(Integer), nullable=False, server_default="{}"
    )
    fertilise_days: Mapped[list[int]] = mapped_column(
        ARRAY(Integer), nullable=False, default=list, server_default="{}"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    slots: Mapped[list["PlotSlot"]] = relationship(  # noqa: F821
        "PlotSlot", back_populates="plot", cascade="all, delete-orphan"
    )
