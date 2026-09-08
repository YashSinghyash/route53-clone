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


def export_zone(db: Session, zone_id: str) -> dict:
    """Build a portable JSON document of a zone plus all its DNS records."""
    zone = _get_or_404(db, zone_id)
    records = db.execute(
        select(DnsRecord)
        .where(DnsRecord.zone_id == zone_id)
        .order_by(DnsRecord.name.asc(), DnsRecord.type.asc())
    ).scalars().all()
    return {
        "name": zone.name,
        "comment": zone.comment or "",
        "private_zone": bool(zone.private_zone),
        "hosted_zone_id": zone.id,
        "records": [
            {"name": r.name, "type": r.type, "ttl": r.ttl, "value": r.value}
            for r in records
        ],
    }


def _short_name(record_name: str, origin: str) -> str:
    """Render a record name relative to the zone origin (apex -> '@')."""
    name = (record_name or "").rstrip(".")
    origin = origin.rstrip(".")
    if name == origin or name == "":
        return "@"
    if name.endswith("." + origin):
        return name[: -(len(origin) + 1)]
    return name


def _quote_txt(value: str) -> str:
    v = value.strip()
    if v.startswith('"') and v.endswith('"'):
        return v
    return '"' + v.replace('"', '\\"') + '"'


def export_zone_bind(db: Session, zone_id: str) -> str:
    """Render the zone and its records as a BIND-format zone file."""
    zone = _get_or_404(db, zone_id)
    records = db.execute(
        select(DnsRecord)
        .where(DnsRecord.zone_id == zone_id)
        .order_by(DnsRecord.name.asc(), DnsRecord.type.asc())
    ).scalars().all()

    origin = zone.name.rstrip(".") + "."

    # Default $TTL: the most common TTL among records, else 300.
    if records:
        counts: dict = {}
        for r in records:
            counts[r.ttl] = counts.get(r.ttl, 0) + 1
        default_ttl = max(counts, key=lambda t: (counts[t], -t))
    else:
        default_ttl = 300

    lines = [f"$ORIGIN {origin}", f"$TTL {default_ttl}", ""]
    for r in records:
        name = _short_name(r.name, origin)
        value = _quote_txt(r.value) if r.type == "TXT" else r.value
        ttl_col = "" if r.ttl == default_ttl else f"{r.ttl} "
        lines.append(f"{name:<15} {ttl_col}IN  {r.type:<6} {value}")

    return "\n".join(lines) + "\n"


def import_zone_bind(db: Session, zone_id: str, text: str) -> dict:
    """Parse a BIND zone file and create each record via ``create_record`` so
    all normal validation and CNAME-conflict rules apply.

    Returns ``{"imported_count": N, "skipped": [{"line", "reason"}, ...]}``.
    Malformed or rejected lines are collected, never fatal.
    """
    from app.services import dns_record_service  # local import avoids a cycle
    from app.services.bind_parser import parse_bind_zone
    from app.schemas.dns_record import DnsRecordCreate

    zone = _get_or_404(db, zone_id)
    parsed, skipped = parse_bind_zone(text, zone.name)
    skipped_out = [{"line": s.line, "reason": s.reason} for s in skipped]

    imported = 0
    for rec in parsed:
        try:
            payload = DnsRecordCreate(
                name=rec.name, type=rec.type, value=rec.value, ttl=rec.ttl
            )
            dns_record_service.create_record(db, zone_id, payload)
            imported += 1
        except HTTPException as exc:
            db.rollback()
            skipped_out.append(
                {
                    "line": f"{rec.name} {rec.ttl} IN {rec.type} {rec.value}",
                    "reason": str(exc.detail),
                }
            )
        except Exception as exc:  # pragma: no cover - defensive
            db.rollback()
            skipped_out.append(
                {
                    "line": f"{rec.name} {rec.ttl} IN {rec.type} {rec.value}",
                    "reason": f"unexpected error: {exc}",
                }
            )

    return {"imported_count": imported, "skipped": skipped_out}


def recount_records(db: Session, zone: HostedZone) -> None:
    total = db.execute(
        select(func.count()).select_from(DnsRecord).where(DnsRecord.zone_id == zone.id)
    ).scalar_one()
    zone.record_count = total
    zone.updated_at = time.time()
