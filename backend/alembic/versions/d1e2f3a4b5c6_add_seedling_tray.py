"""add_seedling_tray

Revision ID: d1e2f3a4b5c6
Revises: 89cd97ad7a08
Create Date: 2026-04-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = '89cd97ad7a08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ADD VALUE cannot run inside a transaction in Postgres.
    # We COMMIT the open transaction, run the DDL, then BEGIN a new one
    # so Alembic's version stamp INSERT has a transaction to work with.
    op.execute(sa.text("COMMIT"))
    op.execute(sa.text("ALTER TYPE plot_type ADD VALUE IF NOT EXISTS 'seedling_tray'"))
    op.execute(sa.text("BEGIN"))

    op.add_column('plot_slots', sa.Column('germination_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('plot_slots', 'germination_date')
    # Postgres does not support removing enum values; downgrade leaves 'seedling_tray' in the type
