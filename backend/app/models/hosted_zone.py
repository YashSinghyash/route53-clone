import time
import uuid

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _now() -> float:
    return time.time()


def _zone_id() -> str:
    return "Z" + uuid.uuid4().hex[:20].upper()


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_zone_id)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    comment: Mapped[str] = mapped_column(Text, default="", server_default="")
    private_zone: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    record_count: Mapped[int] = mapped_column(Integer, default=2, server_default="2")
    caller_reference: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[float] = mapped_column(Float, default=_now)
    updated_at: Mapped[float] = mapped_column(Float, default=_now, onupdate=_now)

    records = relationship(
        "DnsRecord",
        back_populates="zone",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
