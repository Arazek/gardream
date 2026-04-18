"""add_photo_plot_support

Revision ID: e5f6a7b8c9d0
Revises: d1e2f3a4b5c6
Create Date: 2026-04-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('plots', sa.Column('photo_url', sa.String(500), nullable=True))
    op.alter_column('plot_slots', 'row', nullable=True)
    op.alter_column('plot_slots', 'col', nullable=True)
    op.add_column('plot_slots', sa.Column('x_pct', sa.Float(), nullable=True))
    op.add_column('plot_slots', sa.Column('y_pct', sa.Float(), nullable=True))
    op.add_column('plot_slots', sa.Column('w_pct', sa.Float(), nullable=True))
    op.add_column('plot_slots', sa.Column('h_pct', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('plot_slots', 'h_pct')
    op.drop_column('plot_slots', 'w_pct')
    op.drop_column('plot_slots', 'y_pct')
    op.drop_column('plot_slots', 'x_pct')
    op.alter_column('plot_slots', 'col', nullable=False)
    op.alter_column('plot_slots', 'row', nullable=False)
    op.drop_column('plots', 'photo_url')
