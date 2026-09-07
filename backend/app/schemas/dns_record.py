from typing import Optional

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
