from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.crop import Crop, CropCategory
from app.schemas.crop import CropResponse

router = APIRouter()


@router.get("", response_model=list[CropResponse])
async def list_crops(
    category: CropCategory | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    q = select(Crop)
    if category:
        q = q.where(Crop.category == category)
    result = await db.execute(q.order_by(Crop.name))
    return result.scalars().all()


@router.get("/{crop_id}", response_model=CropResponse)
async def get_crop(
    crop_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    crop = await db.get(Crop, crop_id)
    if not crop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crop not found")
    return crop
