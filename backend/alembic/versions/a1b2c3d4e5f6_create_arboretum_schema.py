"""create arboretum schema

Revision ID: a1b2c3d4e5f6
Revises: 4e41eb458c37
Create Date: 2026-03-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, ENUM as PgEnum


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "4e41eb458c37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Each PgEnum is used in exactly one table, so there is no double-creation risk.
# create_type=True (default) — SQLAlchemy emits CREATE TYPE before the table.
_crop_category = PgEnum("vegetable", "herb", "fruit", "flower", name="crop_category")
_sun_requirement = PgEnum("full_sun", "partial_shade", "shade", name="sun_requirement")
_plot_type = PgEnum("ground_bed", "raised_bed", "container", "vertical", name="plot_type")
_task_type = PgEnum("water", "fertilise", "prune", "harvest", "check", "custom", name="task_type")


def upgrade() -> None:
    # ── crops ─────────────────────────────────────────────────────────────────
    op.create_table(
        "crops",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("latin_name", sa.String(150), nullable=False),
        sa.Column("category", _crop_category, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("days_to_germination", sa.Integer(), nullable=False),
        sa.Column("days_to_harvest", sa.Integer(), nullable=False),
        sa.Column("watering_frequency_days", sa.Integer(), nullable=False),
        sa.Column("fertilise_frequency_days", sa.Integer(), nullable=False),
        sa.Column("prune_frequency_days", sa.Integer(), nullable=True),
        sa.Column("prune_start_day", sa.Integer(), nullable=True),
        sa.Column("sun_requirement", _sun_requirement, nullable=False),
        sa.Column("spacing_cm", sa.Integer(), nullable=False),
        sa.Column("soil_mix", JSONB(), nullable=True),
        sa.Column("companion_crops", ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("avoid_crops", ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_crops_name", "crops", ["name"])
    op.create_index("ix_crops_category", "crops", ["category"])

    # ── plots ─────────────────────────────────────────────────────────────────
    op.create_table(
        "plots",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("plot_type", _plot_type, nullable=False),
        sa.Column("rows", sa.Integer(), nullable=False),
        sa.Column("cols", sa.Integer(), nullable=False),
        sa.Column("substrate", sa.String(100), nullable=True),
        sa.Column("watering_days", ARRAY(sa.Integer()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_plots_user_id", "plots", ["user_id"])

    # ── plot_slots ────────────────────────────────────────────────────────────
    op.create_table(
        "plot_slots",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("plot_id", sa.String(), sa.ForeignKey("plots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("crop_id", sa.String(), sa.ForeignKey("crops.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("row", sa.Integer(), nullable=False),
        sa.Column("col", sa.Integer(), nullable=False),
        sa.Column("sow_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("plot_id", "row", "col", name="uq_plot_slot_position"),
    )
    op.create_index("ix_plot_slots_plot_id", "plot_slots", ["plot_id"])

    # ── tasks ─────────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("plot_slot_id", sa.String(), sa.ForeignKey("plot_slots.id", ondelete="CASCADE"), nullable=True),
        sa.Column("type", _task_type, nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"])
    op.create_index("ix_tasks_due_date", "tasks", ["due_date"])
    op.create_index("ix_tasks_plot_slot_id", "tasks", ["plot_slot_id"])
    op.create_index("ix_tasks_user_due", "tasks", ["user_id", "due_date"])

    # ── notification_settings ─────────────────────────────────────────────────
    op.create_table(
        "notification_settings",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("morning_reminder", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("evening_reminder", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("in_app_alerts", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("push_token", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notification_settings_user_id", "notification_settings", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_table("notification_settings")
    op.drop_table("tasks")
    op.drop_table("plot_slots")
    op.drop_table("plots")
    op.drop_table("crops")

    _task_type.drop(op.get_bind(), checkfirst=True)
    _plot_type.drop(op.get_bind(), checkfirst=True)
    _sun_requirement.drop(op.get_bind(), checkfirst=True)
    _crop_category.drop(op.get_bind(), checkfirst=True)
