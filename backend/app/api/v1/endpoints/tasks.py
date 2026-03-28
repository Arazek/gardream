from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    due_date: date | None = Query(None),
    completed: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    q = select(Task).where(Task.user_id == user["sub"])
    if due_date is not None:
        q = q.where(Task.due_date == due_date)
    if completed is not None:
        q = q.where(Task.completed == completed)
    result = await db.execute(q.order_by(Task.due_date, Task.created_at))
    return result.scalars().all()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    task = Task(**payload.model_dump(), user_id=user["sub"])
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task or task.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task or task.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    data = payload.model_dump(exclude_unset=True)

    # Auto-set completed_at when marking complete
    if data.get("completed") is True and not task.completed:
        data["completed_at"] = datetime.now(timezone.utc)
    elif data.get("completed") is False:
        data["completed_at"] = None

    for field, value in data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task or task.user_id != user["sub"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    await db.delete(task)
    await db.commit()
