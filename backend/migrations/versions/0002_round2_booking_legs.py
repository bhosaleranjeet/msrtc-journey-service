"""Persist a two-leg itinerary without replacing the legacy booking aggregate.

Revision ID: 0002_round2_booking_legs
Revises: 0001_seeded_network
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_round2_booking_legs"
down_revision = "0001_seeded_network"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Revision 0001 creates its schema from the application's current metadata.
    # Consequently a fresh install may already contain a newly-added table,
    # while an existing Round 1 database will not. Support both paths.
    if not sa.inspect(op.get_bind()).has_table("booking_trips"):
        op.create_table(
            "booking_trips",
            sa.Column("booking_id", sa.String(length=80), sa.ForeignKey("bookings.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("trip_id", sa.String(length=160), sa.ForeignKey("trips.id"), primary_key=True),
            sa.Column("sequence", sa.Integer(), nullable=False, server_default="1"),
        )


def downgrade() -> None:
    if sa.inspect(op.get_bind()).has_table("booking_trips"):
        op.drop_table("booking_trips")
