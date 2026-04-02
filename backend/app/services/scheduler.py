"""APScheduler-based background job scheduler.

Jobs:
  morning_reminder — fires daily at MORNING_REMINDER_HOUR:MORNING_REMINDER_MINUTE UTC
  evening_reminder — fires daily at EVENING_REMINDER_HOUR:EVENING_REMINDER_MINUTE UTC

Each job:
  1. Finds all users with the relevant reminder enabled in notification_settings.
  2. Looks up their profile email in user_profiles.
  3. Fetches their tasks for the target date.
  4. Sends an email via email_service.
"""
import logging
from datetime import date, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import async_session_factory
from app.models.notification_settings import NotificationSettings
from app.models.task import Task
from app.models.user_profile import UserProfile
from app.services.email_service import send_morning_reminder, send_evening_reminder

logger = logging.getLogger(__name__)

_TASK_TYPE_ICONS: dict[str, str] = {
    "water":     "💧",
    "fertilise": "🧪",
    "prune":     "✂️",
    "harvest":   "🌾",
    "check":     "🔍",
    "custom":    "📝",
}


def _task_to_dict(task: Task) -> dict:
    return {
        "title": task.title or task.type.capitalize(),
        "note": task.note,
        "icon": _TASK_TYPE_ICONS.get(task.type, "✅"),
    }


async def _send_reminders(target_date: date, reminder_field: str, send_fn) -> None:
    async with async_session_factory() as db:
        # All users who have this reminder enabled
        ns_rows = await db.execute(
            select(NotificationSettings).where(
                getattr(NotificationSettings, reminder_field).is_(True)
            )
        )
        settings_list = ns_rows.scalars().all()

        for ns in settings_list:
            # Get user profile (email)
            profile_row = await db.execute(
                select(UserProfile).where(UserProfile.user_id == ns.user_id)
            )
            profile: UserProfile | None = profile_row.scalar_one_or_none()
            if not profile or not profile.email:
                continue

            # Get tasks for the target date
            tasks_row = await db.execute(
                select(Task).where(
                    Task.user_id == ns.user_id,
                    Task.due_date == target_date,
                    Task.completed.is_(False),
                )
            )
            tasks = [_task_to_dict(t) for t in tasks_row.scalars().all()]

            name = profile.display_name or profile.email.split("@")[0]
            try:
                await send_fn(profile.email, name, tasks)
            except Exception as exc:
                logger.error("Reminder send failed for user %s: %s", ns.user_id, exc)


async def _morning_job() -> None:
    today = date.today()
    logger.info("Running morning reminder job for %s", today)
    await _send_reminders(today, "morning_reminder", send_morning_reminder)


async def _evening_job() -> None:
    tomorrow = date.today() + timedelta(days=1)
    logger.info("Running evening reminder job for %s", tomorrow)
    await _send_reminders(tomorrow, "evening_reminder", send_evening_reminder)


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone=settings.SCHEDULER_TIMEZONE)
    scheduler.add_job(
        _morning_job,
        trigger="cron",
        hour=settings.MORNING_REMINDER_HOUR,
        minute=settings.MORNING_REMINDER_MINUTE,
        id="morning_reminder",
        replace_existing=True,
    )
    scheduler.add_job(
        _evening_job,
        trigger="cron",
        hour=settings.EVENING_REMINDER_HOUR,
        minute=settings.EVENING_REMINDER_MINUTE,
        id="evening_reminder",
        replace_existing=True,
    )
    return scheduler
