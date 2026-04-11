"""add_per_crop_schedule_fields

Revision ID: 89cd97ad7a08
Revises: 6e1782178bf9
Create Date: 2026-04-11 17:55:41.312000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '89cd97ad7a08'
down_revision: Union[str, None] = '6e1782178bf9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('plot_slots', sa.Column('watering_days_override', postgresql.ARRAY(sa.Integer()), nullable=True))
    op.add_column('plot_slots', sa.Column('watering_interval_weeks', sa.Integer(), server_default='1', nullable=False))
    op.add_column('plot_slots', sa.Column('fertilise_days_override', postgresql.ARRAY(sa.Integer()), nullable=True))
    op.add_column('plot_slots', sa.Column('fertilise_interval_weeks', sa.Integer(), server_default='1', nullable=False))
    op.add_column('plots', sa.Column('fertilise_days', postgresql.ARRAY(sa.Integer()), server_default='{}', nullable=False))


def downgrade() -> None:
    op.drop_column('plots', 'fertilise_days')
    op.drop_column('plot_slots', 'fertilise_interval_weeks')
    op.drop_column('plot_slots', 'fertilise_days_override')
    op.drop_column('plot_slots', 'watering_interval_weeks')
    op.drop_column('plot_slots', 'watering_days_override')
