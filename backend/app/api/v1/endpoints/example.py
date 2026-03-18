from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.example import ExampleItem
from app.schemas.example import ExampleItemCreate, ExampleItemResponse, ExampleItemUpdate

router = APIRouter()


@router.get("", response_model=list[ExampleItemResponse])
async def list_items(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(ExampleItem).where(ExampleItem.owner_id == user["sub"])
    )
    return result.scalars().all()


@router.post("", response_model=ExampleItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ExampleItemCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    item = ExampleItem(**payload.model_dump(), owner_id=user["sub"])
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/{item_id}", response_model=ExampleItemResponse)
async def get_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    item = await db.get(ExampleItem, item_id)
    if not item or item.owner_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.put("/{item_id}", response_model=ExampleItemResponse)
async def update_item(
    item_id: str,
    payload: ExampleItemUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    item = await db.get(ExampleItem, item_id)
    if not item or item.owner_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    item = await db.get(ExampleItem, item_id)
    if not item or item.owner_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    await db.delete(item)
    await db.commit()
