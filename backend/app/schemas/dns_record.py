from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class DnsRecordCreate(BaseModel):
    name: str
    type: str
    value: str
    ttl: Optional[int] = 300


class DnsRecordUpdate(BaseModel):
    value: Optional[str] = None
    ttl: Optional[int] = None


class DnsRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    zone_id: str
    name: str
    type: str
    ttl: int
    value: str
    created_at: Optional[float] = None
    updated_at: Optional[float] = None


class BulkDeleteRequest(BaseModel):
    record_ids: List[str]


class BulkDeleteResponse(BaseModel):
    deleted_count: int


class ExportedRecord(BaseModel):
    name: str
    type: str
    ttl: int
    value: str


class ZoneExport(BaseModel):
    name: str
    comment: str
    private_zone: bool
    hosted_zone_id: str
    records: List[ExportedRecord]


class SkippedImportLine(BaseModel):
    line: str
    reason: str


class ZoneImportResponse(BaseModel):
    imported_count: int
    skipped: List[SkippedImportLine]
