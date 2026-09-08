from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.dns_record import (
    DnsRecordCreate,
    DnsRecordOut,
    ZoneExport,
    ZoneImportResponse,
)
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


@router.get("/{zone_id}/export", response_model=ZoneExport)
def export_hosted_zone(
    zone_id: str,
    format: str = Query("json"),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    fmt = format.lower()
    if fmt not in ("json", "bind"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported formats: json, bind",
        )

    if fmt == "bind":
        text = hosted_zone_service.export_zone_bind(db, zone_id)
        zone = hosted_zone_service.get_zone(db, zone_id)
        filename = f"{zone.name}.zone"
        return PlainTextResponse(
            content=text,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    doc = hosted_zone_service.export_zone(db, zone_id)
    filename = f"{doc['name']}.json"
    return JSONResponse(
        content=doc,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{zone_id}/import", response_model=ZoneImportResponse)
async def import_hosted_zone(
    zone_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("utf-8", errors="replace")
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty"
        )
    return hosted_zone_service.import_zone_bind(db, zone_id, text)


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
