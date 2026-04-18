"""
Task generation logic — called when a crop is assigned to a plot slot.

Generates a 90-day window of tasks:
  - water: on effective watering_days (slot override or plot default), with optional weekly cadence
  - fertilise: on effective fertilise_days (slot override or plot default), with optional weekly cadence
  - prune: every N days from (sow_date + prune_start_day), if crop has prune data
  - harvest: single task at sow_date + days_to_harvest
"""
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskType
from app.models.crop import Crop
from app.models.plot import Plot, PlotType
from app.models.plot_slot import PlotSlot

WINDOW_DAYS = 90


async def generate_tasks_for_slot(
    db: AsyncSession,
    slot: PlotSlot,
    crop: Crop,
    plot: Plot,
    user_id: str,
    start_date: date | None = None,
    task_types: list[str] | None = None,
) -> list[Task]:
    """Generate and persist tasks for a slot. Returns created tasks."""
    # Seedling trays only get a single germination check task
    if plot.plot_type == PlotType.seedling_tray:
        sow_date = slot.sow_date if isinstance(slot.sow_date, date) else date.fromisoformat(str(slot.sow_date))
        germination_day = sow_date + timedelta(days=crop.days_to_germination or 14)
        task = Task(
            user_id=user_id,
            plot_slot_id=slot.id,
            type=TaskType.check,
            due_date=germination_day,
            title=f"Check germination – {crop.name}",
        )
        db.add(task)
        await db.flush()
        return [task]

    if task_types is None:
        task_types = ['water', 'fertilise']

    sow_date = slot.sow_date if isinstance(slot.sow_date, date) else date.fromisoformat(str(slot.sow_date))
    window_start = start_date if start_date is not None else sow_date
    end_date = sow_date + timedelta(days=WINDOW_DAYS)
    tasks: list[Task] = []

    # ── Watering ──────────────────────────────────────────────────────────────
    if 'water' in task_types:
        effective_watering_days = slot.watering_days_override if slot.watering_days_override is not None else plot.watering_days
        effective_watering_interval = slot.watering_interval_weeks  # int, default 1

        if effective_watering_days:
            current = max(sow_date, window_start)
            while current <= end_date:
                candidate_weekday = current.weekday()
                weeks_since_sow = (current - sow_date).days // 7
                if candidate_weekday not in effective_watering_days:
                    current += timedelta(days=1)
                    continue
                if effective_watering_interval > 1 and weeks_since_sow % effective_watering_interval != 0:
                    current += timedelta(days=1)
                    continue
                tasks.append(Task(
                    user_id=user_id,
                    plot_slot_id=slot.id,
                    type=TaskType.water,
                    due_date=current,
                ))
                current += timedelta(days=1)

    # ── Fertilise ─────────────────────────────────────────────────────────────
    if 'fertilise' in task_types:
        effective_fertilise_days = slot.fertilise_days_override if slot.fertilise_days_override is not None else plot.fertilise_days
        effective_fertilise_interval = slot.fertilise_interval_weeks  # int, default 1

        if effective_fertilise_days:
            current = max(sow_date, window_start)
            while current <= end_date:
                candidate_weekday = current.weekday()
                weeks_since_sow = (current - sow_date).days // 7
                if candidate_weekday not in effective_fertilise_days:
                    current += timedelta(days=1)
                    continue
                if effective_fertilise_interval > 1 and weeks_since_sow % effective_fertilise_interval != 0:
                    current += timedelta(days=1)
                    continue
                tasks.append(Task(
                    user_id=user_id,
                    plot_slot_id=slot.id,
                    type=TaskType.fertilise,
                    due_date=current,
                ))
                current += timedelta(days=1)

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
