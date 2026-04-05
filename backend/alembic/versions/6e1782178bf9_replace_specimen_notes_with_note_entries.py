"""replace specimen notes with note_entries

Revision ID: 6e1782178bf9
Revises: ba1e0e4bcc11
Create Date: 2026-04-05 17:55:47.431871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '6e1782178bf9'
down_revision: Union[str, None] = 'ba1e0e4bcc11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('specimens', 'notes')
    op.add_column('specimens', sa.Column(
        'note_entries',
        postgresql.JSONB(astext_type=sa.Text()),
        nullable=False,
        server_default='[]',
    ))


def downgrade() -> None:
    op.drop_column('specimens', 'note_entries')
    op.add_column('specimens', sa.Column('notes', sa.Text(), nullable=True))
