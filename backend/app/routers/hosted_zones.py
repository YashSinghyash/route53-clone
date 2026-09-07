from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.dns_record import DnsRecordCreate, DnsRecordOut
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneOut, HostedZoneUpdate
from app.services import dns_record_service, hosted_zone_service

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


@router.get("", response_model=PaginatedResponse[HostedZoneOut])
def list_hosted_zones(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    items, count = hosted_zone_service.list_zones(db, search, page, limit)
    return {"items": items, "count": count, "page": page, "limit": limit}


@router.post("", response_model=HostedZoneOut, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return hosted_zone_service.create_zone(db, payload)


@router.get("/{zone_id}", response_model=HostedZoneOut)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return hosted_zone_service.get_zone(db, zone_id)


@router.put("/{zone_id}", response_model=HostedZoneOut)
def update_hosted_zone(
    zone_id: str,
    payload: HostedZoneUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return hosted_zone_service.update_zone(db, zone_id, payload)


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    hosted_zone_service.delete_zone(db, zone_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Records scoped under a zone --------------------------------------------
@router.get("/{zone_id}/records", response_model=PaginatedResponse[DnsRecordOut])
def list_zone_records(
    zone_id: str,
    search: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    items, count = dns_record_service.list_records(db, zone_id, search, type, page, limit)
    return {"items": items, "count": count, "page": page, "limit": limit}


@router.post(
    "/{zone_id}/records",
    response_model=DnsRecordOut,
    status_code=status.HTTP_201_CREATED,
)
def create_zone_record(
    zone_id: str,
    payload: DnsRecordCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return dns_record_service.create_record(db, zone_id, payload)
