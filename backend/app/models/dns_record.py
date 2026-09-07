import time
import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _now() -> float:
    return time.time()


def _record_id() -> str:
    return "R" + uuid.uuid4().hex[:20].upper()


class DnsRecord(Base):
    __tablename__ = "dns_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_record_id)
    zone_id: Mapped[str] = mapped_column(
        String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    ttl: Mapped[int] = mapped_column(Integer, default=300, server_default="300")
    value: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[float] = mapped_column(Float, default=_now)
    updated_at: Mapped[float] = mapped_column(Float, default=_now, onupdate=_now)

    zone = relationship("HostedZone", back_populates="records")
