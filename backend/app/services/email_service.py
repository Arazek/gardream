import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from jinja2 import Environment, PackageLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

# Jinja2 env — templates live in app/email_templates/
_jinja = Environment(
    loader=PackageLoader("app", "email_templates"),
    autoescape=select_autoescape(["html"]),
)


def _render(template_name: str, **ctx) -> tuple[str, str]:
    """Return (plain_text, html) tuple."""
    html_tpl = _jinja.get_template(f"{template_name}.html")
    txt_tpl = _jinja.get_template(f"{template_name}.txt")
    return txt_tpl.render(**ctx), html_tpl.render(**ctx)


async def send_email(to_email: str, subject: str, plain: str, html: str) -> None:
    if not settings.SMTP_ENABLED:
        logger.info("SMTP disabled — would send '%s' to %s", subject, to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("Email sent to %s: %s", to_email, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)


async def send_morning_reminder(to_email: str, display_name: str, tasks: list[dict]) -> None:
    plain, html = _render("morning_reminder", name=display_name, tasks=tasks, app_url=settings.APP_URL)
    await send_email(to_email, "🌱 Your garden tasks for today", plain, html)


async def send_evening_reminder(to_email: str, display_name: str, tasks: list[dict]) -> None:
    plain, html = _render("evening_reminder", name=display_name, tasks=tasks, app_url=settings.APP_URL)
    await send_email(to_email, "🌙 Tomorrow's garden tasks", plain, html)
