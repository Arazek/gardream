import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Text, Integer, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CropCategory(str, PyEnum):
    vegetable = "vegetable"
    herb = "herb"
    fruit = "fruit"
    flower = "flower"


class SunRequirement(str, PyEnum):
    full_sun = "full_sun"
    partial_shade = "partial_shade"
    shade = "shade"


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    latin_name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[CropCategory] = mapped_column(
        Enum(CropCategory, name="crop_category"), nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    days_to_germination: Mapped[int] = mapped_column(Integer, nullable=False)
    days_to_harvest: Mapped[int] = mapped_column(Integer, nullable=False)
    watering_frequency_days: Mapped[int] = mapped_column(Integer, nullable=False)
    fertilise_frequency_days: Mapped[int] = mapped_column(Integer, nullable=False)
    prune_frequency_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prune_start_day: Mapped[int | None] = mapped_column(Integer, nullable=True)

    sun_requirement: Mapped[SunRequirement] = mapped_column(
        Enum(SunRequirement, name="sun_requirement"), nullable=False
    )
    spacing_cm: Mapped[int] = mapped_column(Integer, nullable=False)

    # { name, topsoil_pct, compost_pct, perlite_pct, description }
    soil_mix: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    companion_crops: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )
    avoid_crops: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    plot_slots: Mapped[list["PlotSlot"]] = relationship(  # noqa: F821
        "PlotSlot", back_populates="crop"
    )
