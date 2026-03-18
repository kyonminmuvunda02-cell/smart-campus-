"""Add timetable entries and attendance review fields

Revision ID: c2b7f3a91a1d
Revises: 8c1b6d7e4f2a
Create Date: 2026-03-18 18:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c2b7f3a91a1d"
down_revision = "8c1b6d7e4f2a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("attendancerecord", sa.Column("reviewed_by", sa.Integer(), nullable=True))
    op.add_column("attendancerecord", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("attendancerecord", sa.Column("review_note", sa.String(length=255), nullable=True))
    op.create_foreign_key(
        "fk_attendancerecord_reviewed_by_appuser",
        "attendancerecord",
        "appuser",
        ["reviewed_by"],
        ["user_id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "timetableentry",
        sa.Column("timetable_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("lecturer_id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=False),
        sa.Column("weekday", sa.String(length=12), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("session_type", sa.String(length=30), nullable=False),
        sa.Column("semester", sa.String(length=20), nullable=False),
        sa.Column("academic_year", sa.String(length=9), nullable=False),
        sa.Column("effective_start_date", sa.Date(), nullable=True),
        sa.Column("effective_end_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["course.course_id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["lecturer_id"], ["lecturer.user_id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["venue_id"], ["venue.venue_id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("timetable_id"),
    )
    op.create_index(op.f("ix_timetableentry_is_deleted"), "timetableentry", ["is_deleted"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_timetableentry_is_deleted"), table_name="timetableentry")
    op.drop_table("timetableentry")

    op.drop_constraint("fk_attendancerecord_reviewed_by_appuser", "attendancerecord", type_="foreignkey")
    op.drop_column("attendancerecord", "review_note")
    op.drop_column("attendancerecord", "reviewed_at")
    op.drop_column("attendancerecord", "reviewed_by")
