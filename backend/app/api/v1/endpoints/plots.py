import uuid
import logging
import os
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_db, get_current_user
from app.models.crop import Crop
from app.models.plot import Plot
from app.models.plot_slot import PlotSlot
from app.models.specimen import Specimen
from app.models.task import Task
from app.schemas.plot import PlotCreate, PlotResponse, PlotUpdate
from app.schemas.plot_slot import PlotSlotCreate, PlotSlotDetailResponse, PlotSlotResponse, PlotSlotUpdate, TransplantRequest
from app.schemas.specimen import SpecimenResponse, SpecimenUpdate
from app.services.task_generator import generate_tasks_for_slot
from app.api.v1.endpoints.specimens import compute_specimen_stage, populate_specimen_response

router = APIRouter()
logger = logging.getLogger(__name__)


async def regenerate_future_tasks(
    db: AsyncSession,
    slot,
    plot,
    crop,
    task_types: list[str],
) -> None:
    from datetime import date as date_type
    today = date_type.today()
    await db.execute(
        delete(Task).where(
            Task.plot_slot_id == slot.id,
            Task.type.in_(task_types),
            Task.completed == False,
            Task.due_date >= today,
        )
    )
    await db.flush()
    await generate_tasks_for_slot(db, slot, crop, plot, user_id=plot.user_id, start_date=today, task_types=task_types)
    await db.commit()


# ── Plots ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[PlotResponse])
async def list_plots(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(Plot, func.count(PlotSlot.id).label("crop_count"))
        .outerjoin(PlotSlot, PlotSlot.plot_id == Plot.id)
        .where(Plot.user_id == user["sub"])
        .group_by(Plot.id)
        .order_by(Plot.created_at)
    )
    rows = result.all()
    return [
        PlotResponse.model_validate(plot).model_copy(update={"crop_count": count})
        for plot, count in rows
    ]


@router.post("", response_model=PlotResponse, status_code=status.HTTP_201_CREATED)
async def create_plot(
    payload: PlotCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = Plot(**payload.model_dump(), user_id=user["sub"])
    db.add(plot)
    await db.commit()
    await db.refresh(plot)
    return plot


@router.get("/{plot_id}", response_model=PlotResponse)
async def get_plot(
    plot_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")
    return plot


@router.patch("/{plot_id}", response_model=PlotResponse)
async def update_plot(
    plot_id: str,
    payload: PlotUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plot, field, value)
    await db.commit()
    await db.refresh(plot)
    return plot


@router.delete("/{plot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plot(
    plot_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")
    await db.delete(plot)
    await db.commit()


@router.post("/{plot_id}/photo", response_model=PlotResponse)
async def upload_plot_photo(
    plot_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    uploads_dir = f"/app/uploads/plots/{plot_id}"
    os.makedirs(uploads_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
    filename = f"photo_{uuid.uuid4()}{ext}"
    file_path = os.path.join(uploads_dir, filename)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    plot.photo_url = f"/uploads/plots/{plot_id}/{filename}"
    await db.commit()
    await db.refresh(plot)
    return plot


# ── Plot slots (nested under /plots/{plot_id}/slots) ──────────────────────────

@router.get("/{plot_id}/slots", response_model=list[PlotSlotDetailResponse])
async def list_slots(
    plot_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")
    result = await db.execute(
        select(PlotSlot)
        .where(PlotSlot.plot_id == plot_id)
        .options(selectinload(PlotSlot.crop))
        .order_by(PlotSlot.row, PlotSlot.col)
    )
    return result.scalars().all()


@router.post("/{plot_id}/slots", response_model=PlotSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_slot(
    plot_id: str,
    payload: PlotSlotCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    # Enforce grid bounds and uniqueness only for grid slots (photo slots use pct coords)
    if payload.row is not None:
        if payload.row >= plot.rows or payload.col >= plot.cols:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Row/col out of plot bounds")
        existing = await db.execute(
            select(PlotSlot).where(
                PlotSlot.plot_id == plot_id,
                PlotSlot.row == payload.row,
                PlotSlot.col == payload.col,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slot already occupied")

    # Load crop for task generation
    crop = await db.get(Crop, payload.crop_id)
    if not crop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crop not found")

    slot = PlotSlot(**payload.model_dump(), plot_id=plot_id)
    db.add(slot)
    await db.flush()  # get slot.id before task generation

    await generate_tasks_for_slot(db, slot, crop, plot, user_id=user["sub"])

    # Auto-create specimen for this slot
    try:
        specimen = Specimen(id=str(uuid.uuid4()), plot_slot_id=slot.id)
        db.add(specimen)
        await db.flush()  # Flush to catch any errors before commit
        logger.error(f"✓ Specimen created: {specimen.id} for slot {slot.id}")
    except Exception as e:
        logger.error(f"✗ Specimen creation error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create specimen: {str(e)}"
        )

    await db.commit()
    await db.refresh(slot)
    return slot


@router.patch("/{plot_id}/slots/{slot_id}", response_model=PlotSlotResponse)
async def update_slot(
    plot_id: str,
    slot_id: str,
    payload: PlotSlotUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")
    slot = await db.get(PlotSlot, slot_id)
    if not slot or slot.plot_id != plot_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    SCHEDULE_FIELDS = {'watering_days_override', 'watering_interval_weeks', 'fertilise_days_override', 'fertilise_interval_weeks'}
    update_data = payload.model_dump(exclude_unset=True)
    schedule_changed = bool(update_data.keys() & SCHEDULE_FIELDS)

    for field, value in update_data.items():
        setattr(slot, field, value)
    await db.commit()
    await db.refresh(slot)

    if schedule_changed:
        crop = await db.get(Crop, slot.crop_id)
        await regenerate_future_tasks(db, slot, plot, crop, task_types=['water', 'fertilise'])
        await db.refresh(slot)

    return slot


@router.delete("/{plot_id}/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slot(
    plot_id: str,
    slot_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")
    slot = await db.get(PlotSlot, slot_id)
    if not slot or slot.plot_id != plot_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    await db.delete(slot)
    await db.commit()


# ── Specimen (nested under /plots/{plot_id}/slots/{slot_id}/specimen) ─────────

@router.get("/{plot_id}/slots/{slot_id}/specimen", response_model=SpecimenResponse)
async def get_specimen(
    plot_id: str,
    slot_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get specimen details for a plot slot."""
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    slot = await db.get(PlotSlot, slot_id)
    if not slot or slot.plot_id != plot_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    from sqlalchemy import select
    result = await db.execute(
        select(Specimen).where(Specimen.plot_slot_id == slot_id)
    )
    specimen = result.scalar_one_or_none()
    if not specimen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specimen not found")

    crop = await db.get(Crop, slot.crop_id)
    if not crop:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Crop data missing")

    return populate_specimen_response(specimen, slot, crop)


@router.patch("/{plot_id}/slots/{slot_id}/specimen", response_model=SpecimenResponse)
async def update_specimen(
    plot_id: str,
    slot_id: str,
    payload: SpecimenUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Update specimen data (notes, stage_override, photo_log, milestones)."""
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    slot = await db.get(PlotSlot, slot_id)
    if not slot or slot.plot_id != plot_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    from sqlalchemy import select
    result = await db.execute(
        select(Specimen).where(Specimen.plot_slot_id == slot_id)
    )
    specimen = result.scalar_one_or_none()
    if not specimen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specimen not found")

    # Partial update with exclude_unset
    payload_data = payload.model_dump(exclude_unset=True)
    for field, value in payload_data.items():
        if field == "photo_log" and value is not None:
            # photo_log is fully replaced; serialize Pydantic models to JSON-safe dicts
            specimen.photo_log = [p.model_dump(mode="json") for p in (payload.photo_log or [])]
        elif field == "note_entries" and value is not None:
            # note_entries fully replaced; serialize dates to ISO strings for JSONB
            specimen.note_entries = [n.model_dump(mode="json") for n in (payload.note_entries or [])]
        elif field == "milestones" and value is not None:
            # milestones is fully replaced
            specimen.milestones = value
        else:
            setattr(specimen, field, value)

    await db.commit()
    await db.refresh(specimen)

    crop = await db.get(Crop, slot.crop_id)
    if not crop:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Crop data missing")

    return populate_specimen_response(specimen, slot, crop)


@router.post("/{plot_id}/slots/{slot_id}/transplant", response_model=PlotSlotResponse, status_code=status.HTTP_201_CREATED)
async def transplant_slot(
    plot_id: str,
    slot_id: str,
    payload: TransplantRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Transplant a germinated seedling to a cell in another plot."""
    source_plot = await db.get(Plot, plot_id)
    if not source_plot or source_plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    source_slot = await db.get(PlotSlot, slot_id)
    if not source_slot or source_slot.plot_id != plot_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    target_plot = await db.get(Plot, payload.target_plot_id)
    if not target_plot or target_plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target plot not found")

    if payload.target_row >= target_plot.rows or payload.target_col >= target_plot.cols:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Target row/col out of bounds")

    existing = await db.execute(
        select(PlotSlot).where(
            PlotSlot.plot_id == payload.target_plot_id,
            PlotSlot.row == payload.target_row,
            PlotSlot.col == payload.target_col,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Target cell already occupied")

    crop = await db.get(Crop, source_slot.crop_id)

    # Detach specimen from source slot before deletion
    result = await db.execute(select(Specimen).where(Specimen.plot_slot_id == slot_id))
    specimen = result.scalar_one_or_none()

    new_slot = PlotSlot(
        plot_id=payload.target_plot_id,
        crop_id=source_slot.crop_id,
        row=payload.target_row,
        col=payload.target_col,
        sow_date=source_slot.sow_date,
    )
    db.add(new_slot)
    await db.flush()

    if specimen:
        specimen.plot_slot_id = new_slot.id
        await db.flush()

    await db.delete(source_slot)
    await db.flush()

    await generate_tasks_for_slot(db, new_slot, crop, target_plot, user_id=user["sub"])
    await db.commit()
    await db.refresh(new_slot)
    return new_slot


@router.post("/{plot_id}/slots/{slot_id}/specimen/photos", response_model=SpecimenResponse)
async def upload_photo(
    plot_id: str,
    slot_id: str,
    file: UploadFile = File(...),
    taken_at: str | None = None,  # ISO date string
    note: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Upload a photo and add it to the specimen's photo log."""
    plot = await db.get(Plot, plot_id)
    if not plot or plot.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    slot = await db.get(PlotSlot, slot_id)
    if not slot or slot.plot_id != plot_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    result = await db.execute(
        select(Specimen).where(Specimen.plot_slot_id == slot_id)
    )
    specimen = result.scalar_one_or_none()
    if not specimen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specimen not found")

    # Create uploads directory if it doesn't exist
    uploads_dir = f"/app/uploads/specimens/{specimen.id}"
    os.makedirs(uploads_dir, exist_ok=True)

    # Save file
    filename = file.filename or "photo.jpg"
    file_path = os.path.join(uploads_dir, filename)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Add to photo_log
    photo_url = f"/uploads/specimens/{specimen.id}/{filename}"
    photo_date = date.fromisoformat(taken_at) if taken_at else date.today()
    new_photo = {
        "url": photo_url,
        "filename": filename,
        "taken_at": photo_date.isoformat(),
        "note": note,
    }
    specimen.photo_log.append(new_photo)

    await db.commit()
    await db.refresh(specimen)

    crop = await db.get(Crop, slot.crop_id)
    if not crop:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Crop data missing")

    return populate_specimen_response(specimen, slot, crop)
