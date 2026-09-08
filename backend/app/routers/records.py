from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.schemas.dns_record import (
    BulkDeleteRequest,
    BulkDeleteResponse,
    DnsRecordOut,
    DnsRecordUpdate,
)
from app.services import dns_record_service

router = APIRouter(prefix="/api/records", tags=["records"])


@router.post("/bulk-delete", response_model=BulkDeleteResponse)
def bulk_delete_records(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    deleted = dns_record_service.bulk_delete_records(db, payload.record_ids)
    return BulkDeleteResponse(deleted_count=deleted)


@router.put("/{record_id}", response_model=DnsRecordOut)
def update_record(
    record_id: str,
    payload: DnsRecordUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return dns_record_service.update_record(db, record_id, payload)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    dns_record_service.delete_record(db, record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
