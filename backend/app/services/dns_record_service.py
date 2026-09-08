import time
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from typing import List

from app.models import DnsRecord, HostedZone
from app.schemas.dns_record import DnsRecordCreate, DnsRecordUpdate
from app.services.hosted_zone_service import _get_or_404, recount_records
from app.services.validation import VALID_TYPES, validate_record_value


def _normalize_name(name: str, zone: HostedZone) -> str:
    name = (name or "").strip().rstrip(".")
    if not name or name == "@":
        return zone.name
    if name == zone.name or name.endswith("." + zone.name):
        return name
    return f"{name}.{zone.name}"


def _record_or_404(db: Session, record_id: str) -> DnsRecord:
    rec = db.get(DnsRecord, record_id)
    if rec is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return rec


def list_records(
    db: Session,
    zone_id: str,
    search: Optional[str],
    type_filter: Optional[str],
    page: int,
    limit: int,
) -> Tuple[list, int]:
    _get_or_404(db, zone_id)
    stmt = select(DnsRecord).where(DnsRecord.zone_id == zone_id)
    count_stmt = (
        select(func.count()).select_from(DnsRecord).where(DnsRecord.zone_id == zone_id)
    )
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(DnsRecord.name.ilike(like) | DnsRecord.value.ilike(like))
        count_stmt = count_stmt.where(
            DnsRecord.name.ilike(like) | DnsRecord.value.ilike(like)
        )
    if type_filter:
        t = type_filter.strip().upper()
        stmt = stmt.where(DnsRecord.type == t)
        count_stmt = count_stmt.where(DnsRecord.type == t)

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.order_by(DnsRecord.created_at.desc()).offset((page - 1) * limit).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def create_record(db: Session, zone_id: str, payload: DnsRecordCreate) -> DnsRecord:
    zone = _get_or_404(db, zone_id)
    rtype = (payload.type or "").upper()
    if rtype not in VALID_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"type must be one of: {', '.join(sorted(VALID_TYPES))}",
        )

    try:
        validate_record_value(rtype, payload.value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    ttl = payload.ttl if payload.ttl is not None else 300
    if ttl < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ttl must be >= 0")

    fqdn = _normalize_name(payload.name, zone)

    siblings = db.execute(
        select(DnsRecord).where(DnsRecord.zone_id == zone_id, DnsRecord.name == fqdn)
    ).scalars().all()

    # CNAME cannot coexist with any other record at the same name.
    if rtype == "CNAME" and siblings:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A record already exists at '{fqdn}'; CNAME must be the only record at a name",
        )
    if any(s.type == "CNAME" for s in siblings):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A CNAME already exists at '{fqdn}'; no other records allowed at that name",
        )

    now = time.time()
    rec = DnsRecord(
        zone_id=zone_id,
        name=fqdn,
        type=rtype,
        ttl=ttl,
        value=payload.value.strip(),
        created_at=now,
        updated_at=now,
    )
    db.add(rec)
    db.flush()
    recount_records(db, zone)
    db.commit()
    db.refresh(rec)
    return rec


def update_record(db: Session, record_id: str, payload: DnsRecordUpdate) -> DnsRecord:
    rec = _record_or_404(db, record_id)
    data = payload.model_dump(exclude_unset=True)

    new_value = data.get("value")
    if new_value is not None:
        try:
            validate_record_value(rec.type, new_value)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        rec.value = new_value.strip()

    if "ttl" in data and data["ttl"] is not None:
        if data["ttl"] < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="ttl must be >= 0"
            )
        rec.ttl = data["ttl"]

    rec.updated_at = time.time()
    db.commit()
    db.refresh(rec)
    return rec


def delete_record(db: Session, record_id: str) -> None:
    rec = _record_or_404(db, record_id)
    zone = db.get(HostedZone, rec.zone_id)
    db.delete(rec)
    db.flush()
    if zone is not None:
        recount_records(db, zone)
    db.commit()


def bulk_delete_records(db: Session, record_ids: List[str]) -> int:
    """Delete every existing record in ``record_ids`` in one transaction.

    Unknown IDs are skipped silently. Each affected zone's ``record_count`` is
    recomputed from the surviving rows.
    """
    unique_ids = list(dict.fromkeys(record_ids or []))
    if not unique_ids:
        return 0

    records = db.execute(
        select(DnsRecord).where(DnsRecord.id.in_(unique_ids))
    ).scalars().all()
    if not records:
        return 0

    affected_zone_ids = {r.zone_id for r in records}
    for rec in records:
        db.delete(rec)
    db.flush()

    for zone_id in affected_zone_ids:
        zone = db.get(HostedZone, zone_id)
        if zone is not None:
            recount_records(db, zone)

    db.commit()
    return len(records)
