from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.notification_settings import NotificationSettings
from app.schemas.notification_settings import NotificationSettingsResponse, NotificationSettingsUpdate

router = APIRouter()


async def _get_or_create(user_id: str, db: AsyncSession) -> NotificationSettings:
    result = await db.execute(
        select(NotificationSettings).where(NotificationSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = NotificationSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await _get_or_create(user["sub"], db)


@router.patch("", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    payload: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    ns = await _get_or_create(user["sub"], db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ns, field, value)
    await db.commit()
    await db.refresh(ns)
    return ns
