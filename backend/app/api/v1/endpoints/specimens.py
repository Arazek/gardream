from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.plot import Plot
from app.models.plot_slot import PlotSlot
from app.models.specimen import Specimen
from app.models.crop import Crop
from app.schemas.specimen import SpecimenResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def compute_specimen_stage(
    specimen: Specimen,
    slot: PlotSlot,
    crop: Crop,
) -> tuple[str, int]:
    """
    Compute current growth stage and progress percentage.
    Returns (current_stage_name, progress_pct).
    """
    # If user has overridden the stage, use that
    if specimen.stage_override:
        progress_pct = min(100, round((datetime.now().date() - slot.sow_date).days / crop.days_to_harvest * 100))
        return (specimen.stage_override, progress_pct)

    days_elapsed = (datetime.now().date() - slot.sow_date).days
    days_to_harvest = crop.days_to_harvest
    days_to_germination = crop.days_to_germination

    progress_pct = min(100, round(days_elapsed / days_to_harvest * 100))

    # Determine stage based on elapsed days
    if days_elapsed < days_to_germination:
        stage = "germinating"
    elif days_elapsed < days_to_germination * 2:
        stage = "seedling"
    elif days_elapsed < days_to_harvest * 0.5:
        stage = "vegetative"
    elif days_elapsed < days_to_harvest * 0.8:
        stage = "flowering"
    else:
        stage = "harvest-ready"

    return (stage, progress_pct)


def populate_specimen_response(
    specimen: Specimen,
    slot: PlotSlot,
    crop: Crop,
) -> SpecimenResponse:
    """Build SpecimenResponse with computed fields."""
    stage, progress = compute_specimen_stage(specimen, slot, crop)
    return SpecimenResponse(
        id=specimen.id,
        plot_slot_id=specimen.plot_slot_id,
        notes=specimen.notes,
        stage_override=specimen.stage_override,
        photo_log=[PhotoEntry(**p) for p in specimen.photo_log],
        milestones=specimen.milestones,
        current_stage=stage,
        progress_pct=progress,
        created_at=specimen.created_at,
        updated_at=specimen.updated_at,
    )


# ── Flat route (direct access by ID) ──

@router.get("/{specimen_id}", response_model=SpecimenResponse)
async def get_specimen_by_id(
    specimen_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get specimen by ID (requires ownership check via plot)."""
    result = await db.execute(
        select(Specimen)
        .join(PlotSlot)
        .join(Plot)
        .where(Specimen.id == specimen_id)
    )
    specimen = result.scalar_one_or_none()
    if not specimen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specimen not found")

    # Verify ownership
    slot = await db.get(PlotSlot, specimen.plot_slot_id)
    plot = await db.get(Plot, slot.plot_id)
    if plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    crop = await db.get(Crop, slot.crop_id)
    if not crop:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Crop data missing")

    return populate_specimen_response(specimen, slot, crop)
