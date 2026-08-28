"""Create transport, booking, inventory, and ticket persistence.

Revision ID: 0001_seeded_network
Revises:
"""
from alembic import op

from app.persistence.database import Base
from app.persistence import models  # noqa: F401

revision = "0001_seeded_network"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
