"""Add venue geofence fields and timetable-ready session metadata

Revision ID: 8c1b6d7e4f2a
Revises: 0a2cfde07ed1
Create Date: 2026-03-18 23:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8c1b6d7e4f2a"
down_revision: Union[str, None] = "0a2cfde07ed1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("venue", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("venue", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("venue", sa.Column("radius_meters", sa.Float(), nullable=True))

    op.add_column(
        "attendancesession",
        sa.Column("session_type", sa.String(length=30), server_default="Lecture", nullable=False),
    )
    op.add_column("attendancesession", sa.Column("timetable_slot", sa.String(length=100), nullable=True))
    op.alter_column("attendancesession", "session_type", server_default=None)


def downgrade() -> None:
    op.drop_column("attendancesession", "timetable_slot")
    op.drop_column("attendancesession", "session_type")

    op.drop_column("venue", "radius_meters")
    op.drop_column("venue", "longitude")
    op.drop_column("venue", "latitude")
