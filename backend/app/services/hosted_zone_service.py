import time
import uuid
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import DnsRecord, HostedZone
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate


def _get_or_404(db: Session, zone_id: str) -> HostedZone:
    zone = db.get(HostedZone, zone_id)
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")
    return zone


def list_zones(
    db: Session, search: Optional[str], page: int, limit: int
) -> Tuple[list, int]:
    stmt = select(HostedZone)
    count_stmt = select(func.count()).select_from(HostedZone)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(HostedZone.name.ilike(like))
        count_stmt = count_stmt.where(HostedZone.name.ilike(like))

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.order_by(HostedZone.created_at.desc()).offset((page - 1) * limit).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def get_zone(db: Session, zone_id: str) -> HostedZone:
    return _get_or_404(db, zone_id)


def create_zone(db: Session, payload: HostedZoneCreate) -> HostedZone:
    exists = db.execute(
        select(HostedZone).where(HostedZone.name == payload.name)
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Hosted zone '{payload.name}' already exists",
        )

    now = time.time()
    zone = HostedZone(
        name=payload.name,
        comment=payload.comment or "",
        private_zone=bool(payload.private_zone),
        record_count=2,
        caller_reference=uuid.uuid4().hex,
        created_at=now,
        updated_at=now,
    )
    db.add(zone)
    db.flush()

    # AWS creates default NS + SOA records with every hosted zone.
    db.add_all(
        [
            DnsRecord(
                zone_id=zone.id,
                name=zone.name,
                type="NS",
                ttl=172800,
                value="ns-1.route53-clone.local.",
                created_at=now,
                updated_at=now,
            ),
            DnsRecord(
                zone_id=zone.id,
                name=zone.name,
                type="TXT",
                ttl=900,
                value="v=route53-clone-soa",
                created_at=now,
                updated_at=now,
            ),
        ]
    )
    db.commit()
    db.refresh(zone)
    return zone


def update_zone(db: Session, zone_id: str, payload: HostedZoneUpdate) -> HostedZone:
    zone = _get_or_404(db, zone_id)
    data = payload.model_dump(exclude_unset=True)
    if "comment" in data and data["comment"] is not None:
        zone.comment = data["comment"]
    if "private_zone" in data and data["private_zone"] is not None:
        zone.private_zone = bool(data["private_zone"])
    zone.updated_at = time.time()
    db.commit()
    db.refresh(zone)
    return zone


def delete_zone(db: Session, zone_id: str) -> None:
    zone = _get_or_404(db, zone_id)
    db.delete(zone)
    db.commit()


def recount_records(db: Session, zone: HostedZone) -> None:
    total = db.execute(
        select(func.count()).select_from(DnsRecord).where(DnsRecord.zone_id == zone.id)
    ).scalar_one()
    zone.record_count = total
    zone.updated_at = time.time()
