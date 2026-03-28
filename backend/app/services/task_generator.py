"""
Task generation logic — called when a crop is assigned to a plot slot.

Generates a 90-day window of tasks:
  - water: on plot's watering_days (0=Mon … 6=Sun via Python's weekday())
  - fertilise: every N days from sow_date
  - prune: every N days from (sow_date + prune_start_day), if crop has prune data
  - harvest: single task at sow_date + days_to_harvest
"""
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskType
from app.models.crop import Crop
from app.models.plot import Plot
from app.models.plot_slot import PlotSlot

WINDOW_DAYS = 90


async def generate_tasks_for_slot(
    db: AsyncSession,
    slot: PlotSlot,
    crop: Crop,
    plot: Plot,
    user_id: str,
) -> list[Task]:
    """Generate and persist tasks for a newly assigned slot. Returns created tasks."""
    sow_date = slot.sow_date if isinstance(slot.sow_date, date) else date.fromisoformat(str(slot.sow_date))
    end_date = sow_date + timedelta(days=WINDOW_DAYS)
    tasks: list[Task] = []

    # ── Watering ──────────────────────────────────────────────────────────────
    # plot.watering_days is a list of weekday ints (0=Mon, 6=Sun).
    # Python's date.weekday() also uses 0=Mon convention.
    if plot.watering_days:
        current = sow_date
        while current <= end_date:
            if current.weekday() in plot.watering_days:
                tasks.append(Task(
                    user_id=user_id,
                    plot_slot_id=slot.id,
                    type=TaskType.water,
                    due_date=current,
                ))
            current += timedelta(days=1)

    # ── Fertilise ─────────────────────────────────────────────────────────────
    if crop.fertilise_frequency_days and crop.fertilise_frequency_days > 0:
        offset = crop.fertilise_frequency_days
        while sow_date + timedelta(days=offset) <= end_date:
            tasks.append(Task(
                user_id=user_id,
                plot_slot_id=slot.id,
                type=TaskType.fertilise,
                due_date=sow_date + timedelta(days=offset),
            ))
            offset += crop.fertilise_frequency_days

    # ── Prune ─────────────────────────────────────────────────────────────────
    if crop.prune_frequency_days and crop.prune_start_day:
        start = crop.prune_start_day
        while sow_date + timedelta(days=start) <= end_date:
            tasks.append(Task(
                user_id=user_id,
                plot_slot_id=slot.id,
                type=TaskType.prune,
                due_date=sow_date + timedelta(days=start),
            ))
            start += crop.prune_frequency_days

    # ── Harvest ───────────────────────────────────────────────────────────────
    harvest_date = sow_date + timedelta(days=crop.days_to_harvest)
    tasks.append(Task(
        user_id=user_id,
        plot_slot_id=slot.id,
        type=TaskType.harvest,
        due_date=harvest_date,
        title=f"Harvest {crop.name}",
    ))

    db.add_all(tasks)
    await db.flush()   # assign IDs without committing — caller commits
    return tasks
